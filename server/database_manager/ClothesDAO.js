const GenericDAO = require('./GenericDAO');
const queries = require('./ClothesQueries');

class UserDAO extends GenericDAO {

    constructor() {
        super();
    }

    selectAllClothes(callback) {
        this.genericQueryWithConnection(queries.select, [], callback);
    }
}

module.exports = UserDAO;