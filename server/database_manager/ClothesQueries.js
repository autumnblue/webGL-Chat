const RoomMappingQueries = {
    "select": "SELECT * from clothes",
    "update": "UPDATE clothes " +
    "SET json= ?, ",
    "where_name": " WHERE name= ?",

    get updateClothesByName() {
        return this.update + this.where_name + ";";
    }
};

module.exports = RoomMappingQueries;