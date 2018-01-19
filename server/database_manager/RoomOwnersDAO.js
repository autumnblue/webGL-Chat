//
//
//

const GenericDAO = require('./GenericDAO');
const queries = require('./RoomOwnersQueries');

class RoomOwnersDAO extends GenericDAO {

    constructor() {
        super();
    }

    updateRoomOwners(room_id, room_owners, callback) {

        let connection = this.createConnection({multipleStatements: true});

        let generated_query = "DELETE FROM room_sharing WHERE room_sharing.room_id=" + room_id + "; ";

        for (let i = 0; i < room_owners.length; i++){
            generated_query += "INSERT INTO room_sharing (room_id, user_id) VALUES ( " + room_id + ", " + room_owners[i] + " ); ";
        }

        connection.query(generated_query, [],
            (err, rows) => {
                if (callback) {
                    callback(err, rows);
                }
                connection.destroy();
            });
    }
}

module.exports = RoomOwnersDAO;