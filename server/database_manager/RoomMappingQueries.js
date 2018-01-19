
const RoomMappingQueries = {
    "select": "SELECT * from room_mapping",
    "update": "UPDATE room_mapping " +
    "SET mapping= ?",
    "where_room": " WHERE room= ?",

    get updateRoomMappingByRoom() {
        return this.update + this.where_room + ";";
    }
};

module.exports = RoomMappingQueries;