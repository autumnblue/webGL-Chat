//
//
//

const https = require('https');
const multer = require('multer');
const fs = require('fs');
const xml2js = require('xml2js');

const UserDAO = require('./database_manager/UserDAO');

const s3_bucket = 'https://s3.amazonaws.com/webglchat-s3-storage/';

function configureRoutes(app, bodyParser, passport, manager) {

    app.post('/login', 
        bodyParser.urlencoded({extended: true}),
        passport.authenticate(
            'local-login',
            {
                failureRedirect: '/',
                failureFlash: true
            }
        ),
        function (req, res) {

            if (req.body.enter_room_customizer)
                res.redirect('/room');
            else 
                res.redirect('/chat');
        }
    );

    app.get('/', isNotLoggedIn, (req, res) => {
        res.render('index.ejs', { message: req.flash('loginMessage') });
    });

    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/chat',
        failureRedirect : '/signup',
        failureFlash : true
    }));

    app.get('/chat', isLoggedIn, (req, res) => {
        res.render('chat.ejs', {
            name: req.user.name,
            avatar: req.user.avatar,
            room: req.query.room,
            s3_bucket : s3_bucket
        });
    });

    app.get('/clothes', isLoggedIn, (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(
            manager.clothesManager.getAllClothesObj(req.query.avatar)));
    });

    app.get('/room', isLoggedIn, (req, res) => {
        res.render('room-customizer.ejs', {
            user_id: req.user.id,
            name: req.user.name,
            avatar: req.user.avatar
        });
    });

    app.get('/clothes-editor', isLoggedIn, (req, res) => {
        res.render('clothes-editor.ejs');
    });

    app.get('/room/getroom/:room_name', isLoggedIn, (req, res) => {

        manager.roomManager.handleRoom(req.params.room_name, room => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(room));
        });
    });

    app.get('/getusers', isLoggedIn, (req, res) => {

        let output = {};

        let user = new UserDAO();

        user.selectUsers((err, rows) => {

            if (err){
                console.error(err);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(output));
                return;
            }

            for (let row of rows) {
                output[row.user_id] = {
                    id : row.user_id,
                    name : row.username
                };
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(output));
        });
    });

    app.get('/room/getrooms', isLoggedIn, (req, res) => {
        manager.roomManager.handleAllRooms(rooms => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(rooms));
        });
    });

    app.post('/room/saveroom', isLoggedIn, (req, res) => {
        console.log(req.body.room_id);
        let room_owners = req.body.room_owners.map(owner => parseInt(owner));

        manager.roomManager.saveRoom(
            req.body.room_action, req.body.room_name, parseInt(req.body.room_id),
            req.body.room_creator, room_owners, req.body.data,
            (status, data) => {
                let responseData = {
                    result: status
                };
                if (status === "fail") {
                    responseData.error = data;
                } else if (status === "ok") {
                    responseData.error = null;
                    responseData.room_id = data
                }

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(responseData));
            });
    });

    app.get('/getfiles', (req, res) => {

        if (s3_bucket.length)
        {
            let output = {};

            let config_file = JSON.parse(fs.readFileSync("resources/assets/config.json", 'utf8')); // TODO

            https.get(s3_bucket, (resp) => {

                let xml = '';

                resp.on('data', (chunk) => {
                    xml += chunk;
                });

                resp.on('end', () => {

                    xml2js.parseString(xml, { explicitArray : false, ignoreAttrs : true }, function (err, result) {

                        var contentsArray = result.ListBucketResult.Contents;

                        for ( var i = 0; i < contentsArray.length ; i++)
                        {
                            var entry = contentsArray[i];

                            let key = entry.Key;
                            let size = entry.Size;

                            let isDir = key[ key.length - 1 ] === "/" && parseInt(size) === 0;

                            if (!isDir)
                            {
                                if (key.indexOf("assets/objects/") === -1)
                                    continue;

                                var folder_name = '';

                                for (let f in config_file.folders)
                                {

                                    if (key.indexOf("assets/objects/" + f + "/") > -1)
                                    {
                                        folder_name = f;
                                        break;
                                    }
                                }

                                if (!folder_name)
                                    continue;

                                if (!output[folder_name]) {
                                    output[folder_name] = {
                                        isFile: false,
                                        children: {}
                                    };
                                }

                                var node_name = key.replace("assets/objects/", "" );

                                node_name = node_name.replace( folder_name + "/", "" );

                                let filePath = "assets/objects/" + folder_name + "/" + node_name;

                                let objectId = folder_name + "/" + node_name.replace(/\.[^/.]+$/, "");

                                // console.log(objectId);

                                output[folder_name].children[node_name] = {
                                    filePath: filePath,
                                    objectId: objectId,
                                    isFile: true
                                }
                            }
                        }

                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(output));
                    });
                });

                }).on("error", (err) => {
                    console.log("Error - getfiles: " + err.message);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({}));
            });
        }
        else // DEBUG purpose
        {

            let main_path = "resources/assets";

            let config_file = JSON.parse(fs.readFileSync(main_path + "/config.json", 'utf8'));

            let output = {};

            for (let folder_name in config_file.folders) {

                if (!config_file.folders.hasOwnProperty(folder_name))
                    continue;

                let folder_path = main_path + "/objects/" + folder_name + "/";

                if (fs.lstatSync(folder_path).isDirectory()) {

                    let file_names = fs.readdirSync(folder_path);

                    for (let i = 0; i < file_names.length; i++) {
                        let node_name = file_names[i];

                        let node_path = folder_path + "/" + node_name;

                        let isDir = fs.lstatSync(node_path).isDirectory();
                        let isFile = fs.lstatSync(node_path).isFile();

                        if (isFile) {
                            if (!output[folder_name]) {
                                output[folder_name] = {
                                    isFile: false,
                                    children: {}
                                };
                            }

                            let filePath = "assets/objects/" + folder_name + "/" + node_name;

                            let objectId = folder_name + "/" + node_name.replace(/\.[^/.]+$/, "");

                            output[folder_name].children[node_name] = {
                                filePath: filePath,
                                objectId: objectId,
                                isFile: true
                            }
                        }
                    }
                }
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(output));

        }
    });

    app.post('/upload', multer({dest: './uploads/'}).any(), (req, res) => {
        let json = '{}';

        res.header('Content-Type', 'text/plain');

        if (req.files.length) {
            let i;

            // must have at least one png file

            let havePNG;
            for (i = 0; i < req.files.length; i++) {
                if (req.files[i].originalname.toLowerCase().endsWith('png')) {
                    havePNG = true;
                    break;
                }
            }

            if (havePNG && req.body.purpose && req.body.folder) {

                // folder

                let textFilter = /[^a-zA-Z\d\s-_]/g;
                let folder = req.body.folder.replace(textFilter, '');

                let base = __dirname + '/resources/assets/' +
                    ((req.body.purpose == 'block') ? 'blocks' : 'objects') +
                    '/';

                if (fs.existsSync(base + folder) && fs.lstatSync(base + folder).isDirectory()) {
                    // looks ok, let's proceed

                    let n = 0;
                    while (fs.existsSync(base + folder + '/' + n + '.png')) {
                        n++;
                    }

                    console.log(base + folder + '/' + n + '.png does not exist - creating');

                    for (i = 0; i < req.files.length; i++) {
                        let originalname = req.files[i].originalname.toLowerCase(), ext = null;
                        let allowedExtensions = ['png', 'json', 'atlas'];
                        for (var j = 0; j < allowedExtensions.length; j++) {
                            if (originalname.endsWith(allowedExtensions[j])) {
                                ext = allowedExtensions[j];
                                j = allowedExtensions.length;
                            }
                        }

                        if (ext) {
                            console.log('moving: ' +
                                __dirname + '/' + req.files[i].path +
                                ' to ' +
                                base + folder + '/' + n + '.' + ext
                            );

                            // move the file
                            fs.rename(
                                __dirname + '/' + req.files[i].path,
                                base + folder + '/' + n + '.' + ext
                            );

                            req.files[i].path = null;
                        }
                    }

                    // give them back the number
                    json = JSON.stringify({n: n});

                } else {
                    // should not happen unless we're under attack
                }
            } else {
                // no params
            }

            // delete whatever was uploaded and not moved
            for (i = 0; i < req.files.length; i++) {
                if (req.files[i].path) {
                    fs.unlink(__dirname + '/' + req.files[i].path, new Function);
                }
            }
        } else {
            // no files
        }

        res.send(json);
    });
}

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

function isNotLoggedIn(req, res, next) {

    if (!req.isAuthenticated())
        return next();

    res.redirect('/chat');
}

module.exports = configureRoutes;