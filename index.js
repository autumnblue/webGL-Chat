//
//
//

const serverStartedAt = Date.now();

require('./server/config/extensions')();
const express = require('express');
const session  = require('express-session');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const jf = require('jsonfile');
const passport = require('passport');
const flash    = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Events = require('./js-dev/app/events.js');
const GameDataManager = require('./server/game_data/GameDataManager');
const RoomMappingFormatUtils = require('./server/game_data/RoomMappingFormatUtils');
const configureExit = require('./server/config/exit.js');

let manager = new GameDataManager();
require('./server/config/passport')(passport, manager.sessionStorage);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/resources'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'I am a scary gargoyle on the tower that you`ve made with plastic power',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

require('./server/routes')(app, bodyParser, passport, manager);

let sockets = {};

function sendClothes(socket, name, id) {
    let clothes = manager.clothesManager.getClothingArray(
        manager.sessionStorage.getSessionByName(name).clothes);

    if (clothes.length) {
        socket.emit(Events.CHANGE_CLOTHES, {
            id: id,
            clothes: clothes
        });
    }
}

io.on('connection', function (socket) {
    
    let room_name = socket.handshake.query.room;

    console.log('new websocket connection : ' + room_name );

    manager.roomManager.handleRoom(room_name, room_row => {

        let room_id = room_row.room_id;

        console.log('Enter room >> name : ' + room_name + "  id : " + room_id );

        socket.join(room_name);

        let user_name = socket.handshake.query.name;

        console.log('Connected user : ' + user_name);

        if (!sockets[user_name]) 
            sockets[user_name] = [];

        sockets[user_name].push(socket);

        let blockedEvents = [
            Events.CREATE_OBJECT,
            Events.MAKE_DOOR,
            Events.MOVE_OBJECT,
            Events.REMOVE_OBJECT
        ];

        let userSession = manager.sessionStorage.getSessionByName(user_name);

        if ( userSession && userSession.checkPermissions(room_id) ) {

            blockedEvents = [];
            console.log( 'Connected user : ' + user_name + ' can edit the room with id = ' + room_id );
        }

        // user connected - give them id
        let id = manager.getAndOccupyFreeId();

        socket.emit(Events.ID, { id: id, serverStartedAt: serverStartedAt });

        let address = socket.request.connection.remoteAddress;

        console.log('Assigned id ' + id + ' to ' + address + ' ( joined room "' + room_name + '"" )');

        for (let obj of manager.roomMappingManager.getMappingForRoom(room_name)) {

            obj.instant = true;

            let message = RoomMappingFormatUtils.translateNewToOld(obj, room_name);

            socket.emit(Events.CREATE_OBJECT, message);

            if (message.isDoor) {

                socket.emit(Events.MAKE_DOOR, message);
            }

            if (message.avatar) {

                sendClothes(socket, message.name, message.id);
            }
        }

        socket.on('disconnect', function () {
            // user disconnected

            let msg = { id: id, room: room_name.toString() };

            io.emit(Events.REMOVE_OBJECT, msg);

            manager.handleEvent(Events.REMOVE_OBJECT, msg);

            sockets[user_name].splice(sockets[user_name].indexOf(socket), 1);

            console.log('id ' + id + ' has quit...');
        });

        let setupHandler = function (event) {

            socket.on(event, function (msg) {

                if (blockedEvents.indexOf(event) > -1) {
                    // unless it's the user joining and creating his avatar
                    if (((event !== Events.CREATE_OBJECT) && (event !== Events.MOVE_OBJECT)) || (msg.id != id)) {
                        // send error message back
                        socket.emit(Events.TEXT, {
                            id: 0,
                            name: 'Chat',
                            message: 'You are not allowed to edit this room, sorry'
                        });

                        return;
                    }
                }

                // if no id given, create new id
                if (!msg.id) {
                    msg.id = manager.getAndOccupyFreeId();
                }

                if (event === Events.TEXT) {
                    // see if this is PM
                    let pm = /^@([^\s]+)\s(.*)$/.exec(msg.message);
                    if (pm) {
                        msg.pm = true;

                        if (/^\s*$/.test(pm[2])) {
                            return;
                        }

                        msg.message = pm[2];

                        // deliver PM to all user devices
                        let userSockets = sockets[pm[1]], i;
                        if (userSockets) {
                            for (i = 0; i < userSockets.length; i++) {
                                userSockets[i].emit(Events.TEXT, msg);
                            }
                        }

                        // echo back to sender devices
                        if (user_name !== pm[1]) {

                            userSockets = sockets[user_name];

                            for (i = 0; i < userSockets.length; i++) {
                                userSockets[i].emit(Events.TEXT, msg);
                            }
                        }

                        // this message isn't anyone else's business
                        return;
                    }

                    if (/^\s*$/.test(msg.message)) {
                        return;
                    }
                }

                if (event === Events.CHANGE_CLOTHES) {
                    let item = manager.clothesManager.clothes.get(msg.name);
                    if (item) {
                        manager.sessionStorage.getSessionByName(user_name)
                            .setClothItemPreference(msg.name, item.clothingSlot);
                        msg = {
                            id: id,
                            clothes: [item.prepareToSend()]
                        };
                    } else {
                        return;
                    }
                } else if (event === Events.CHANGE_COLOR) {
                    manager.sessionStorage.getSessionByName(user_name)
                        .setColorPreference(msg.color, msg.clothingSlot);
                }

                // echo to everyone in the same room_name
                io.to(room_name).emit(event, msg);

                if (event === Events.CREATE_OBJECT && msg.id == id) {

                    sendClothes(io.to(room_name), user_name, id);
                }

                msg.room = room_name;
                manager.handleEvent(event, msg);
            });
        };

        for (let event in Events) if (event !== 'ID') {
            setupHandler(Events[event]);
        }
    });

});


let port = (process.env.PORT || 5000);

let roomQuantity = 10;
let i = 0;
manager.roomMappingManager.setUpRoomMappingFromDB(() => {
    ++i;
    if (i < roomQuantity) 
        return;
    http.listen(port, function () {
        console.log('listening on http://127.0.0.1:' + port);
    });
});
manager.run();
configureExit(manager);