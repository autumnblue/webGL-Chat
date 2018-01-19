//
//
//

const GenericDAO = require('./GenericDAO');
const queries = require('./RoomsQueries');

class RoomsDAO extends GenericDAO {

    constructor() {
        super();
    }

    updateRoom(room_id, json, callback) {
        this.genericQueryWithConnection(
            queries.update + queries.where_room_id + ";", 
            [
                json,
                room_id
            ],
            callback
        );
    }

    createRoom(owner, room_name, json, callback) {
        this.genericQueryWithConnection(queries.insert + ";", [owner, room_name, json], callback);
    }

    selectRoom(room_name, callback) {
        this.genericQueryWithConnection(queries.select + queries.where_room_name + ";", [room_name], callback);
    }

    selectOwners(room_id, callback) {
        this.genericQueryWithConnection(queries.select_owners + ";", [room_id], callback);
    }

    selectRooms(callback) {
        this.genericQueryWithConnection(queries.select + ";", [], callback);
    }
}

module.exports = RoomsDAO;