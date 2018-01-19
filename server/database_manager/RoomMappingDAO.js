const GenericDAO = require('./GenericDAO');
const queries = require('./RoomMappingQueries');

class RoomMappingDAO extends GenericDAO {

    constructor() {
        super();
    }

    updateRoomMappingByRoom(room, room_mapping, callback, connection) {
        this.genericQuery(queries.updateRoomMappingByRoom, [room_mapping, room], callback, connection);
    }

    selectRoomMapping(callback) {
        this.genericQueryWithConnection(queries.select, [], callback);
    }
}

module.exports = RoomMappingDAO;