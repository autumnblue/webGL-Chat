//
//
//
const RoomsQueries = {

    'select' :  "SELECT"
    + " rooms.id AS 'room_id',"
    + " user.username AS 'room_creator',"
    + " user.user_id AS 'room_creator_id',"
    + " rooms.name AS 'room_name',"
    + " rooms.json AS 'room_json',"
    + " room_sharing_result.result as 'shared_with'"
    + " FROM  rooms"
    + " INNER JOIN user ON rooms.owner = user.user_id"
    + " LEFT JOIN"
    + " ("
    + "  SELECT room_id, concat( '[', group_concat( user_id SEPARATOR ','), ']' ) as 'result'"
    + "  FROM  room_sharing"
    + "  GROUP BY room_id"
    + " ) room_sharing_result on room_sharing_result.room_id = rooms.id",

    'select_owners' : "SELECT "
    + " user.user_id  AS 'user_id'"
    + " user.username AS 'user_name'"
    + " FROM room_sharing INNER JOIN user ON room_sharing.user_id = user.user_id"
    + " WHERE room_sharing.room_id = ?",

    "update": "UPDATE rooms SET json = ?",

    "insert": "INSERT INTO rooms (owner, name, json) VALUES ( ( SELECT user_id FROM user WHERE username = ? ), ?, ? )",

    "where_room_name": " WHERE name = ?",

    "where_room_id": " WHERE id = ?",    
};

module.exports = RoomsQueries;