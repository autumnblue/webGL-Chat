const UserDAO = require('./UserDAO');
const PermissonsDAO = require('./PermissionsDAO');
const SettingsDAO = require('./SettingsDAO');

class DBManager {
    constructor() {

    }

    static getUserDAO() {
        return new UserDAO();
    }

    static getPermissionsDAO() {
        return new PermissonsDAO();
    }

    static getSettingsDAO() {
        return new SettingsDAO();
    }

    destroy() {
    }
}

module.exports = DBManager;