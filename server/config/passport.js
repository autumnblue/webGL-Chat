const bcrypt = require('bcrypt-nodejs');
const LocalStrategy = require('passport-local').Strategy;
const dbManager = require('../database_manager');
const User = require('../user');
const userDAO = dbManager.getUserDAO();
const permissionsDAO = dbManager.getPermissionsDAO();

function configurePassport(passport, sessionStorage) {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        done(null, sessionStorage.getSessionById(id));
    });

    passport.use(
        'local-signup',
        new LocalStrategy({
                usernameField : 'name',
                passwordField : 'password',
                passReqToCallback : true
            },
            (req, username, password, done) => {

                userDAO.handleUserByName(username, (err, rows) => {
                    if (err)
                        return done(err);
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                    } else {
                        let newUserMysql = {
                            name: username,
                            password: bcrypt.hashSync(password, null, null),
                            avatar: "assets/avatars/Female2/Female2"
                        };

                        userDAO.insertUsers(1, [newUserMysql.name, newUserMysql.password], (err, rows) => {
                            newUserMysql.user_id = rows.insertId;

                            sessionStorage.addSession(newUserMysql);

                            return done(null, newUserMysql);
                        });
                    }
                });
            })
    );

    passport.use(
        'local-login',
        new LocalStrategy({
                usernameField: 'name',
                passwordField: 'password',
                passReqToCallback: true
            },
            (req, username, password, done) => {
                userDAO.handleUserByName(username, (err, rows) => {
                    if (err)
                        return done(err);

                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', 'No such user.'));
                    }

                    let userData = rows[0];

                    if (!bcrypt.compareSync(password, userData.password))
                        return done(null, false, req.flash('loginMessage', 'Wrong password.'));

                    permissionsDAO.handlePermissionById(userData.user_id, (err, rows)=> {

                        if (err){
                            return done(err);
                        }

                        let permissions = [];

                        for (let row of rows) {

                            permissions.push(parseInt(row.room_id))
                        }

                        dbManager.getSettingsDAO().handleSettingsById(userData.user_id, (err, rows) => {

                            let clothing = rows.length ? JSON.parse(rows[0].clothing) : {};
                            let user = new User(userData.user_id, userData.username, userData.avatar, clothing, permissions);

                            sessionStorage.addSession(user);

                            return done(null, user);
                        });
                    });
                });
            })
    );
}

module.exports = configurePassport;