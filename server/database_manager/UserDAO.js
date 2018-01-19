const GenericDAO = require('./GenericDAO');
const queries = require('./UserQueries');

class UserDAO extends GenericDAO {

    constructor() {
        super();
    }

    selectUsers(callback) {
        this.genericQueryWithConnection(queries.select + ";", [], callback);
    }

    handleUserByName(name, callback) {
        this.genericQueryWithConnection(queries.selectConditionName, [name], callback);
    }

    handleUserById(id, callback) {
        this.genericQueryWithConnection(queries.selectConditionId, [id], callback);
    }

    insertUsers(quantity, values, callback) {
        this.genericQueryWithConnection(queries.insert(quantity), values, callback);
    }
}

module.exports = UserDAO;