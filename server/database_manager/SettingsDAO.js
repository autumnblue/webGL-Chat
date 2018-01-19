const GenericDAO = require('./GenericDAO');
const queries = require('./SettingsQueries');

class UserDAO extends GenericDAO {

    constructor() {
        super();
    }

    handleSettingsById(id, callback) {
        this.genericQueryWithConnection(queries.selectConditionUserId, [id], callback);
    }

    updateSettingsById(id, data) {
        this.genericQueryWithConnection(queries.updateClothesById, [data, id]);
    }
}

module.exports = UserDAO;