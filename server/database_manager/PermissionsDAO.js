//
//

const GenericDAO = require('./GenericDAO');
const queries = require('./PermissionsQueries');

class UserDAO extends GenericDAO {

    constructor() {
        super();
    }

    handlePermissionById(id, callback) {
        this.genericQueryWithConnection(queries.selectConditionId, [id], callback);
    }
}

module.exports = UserDAO;