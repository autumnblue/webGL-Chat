//
//

const PermissionsQueries = {

    "select": "SELECT * FROM room_sharing",

    "where_id": " WHERE room_sharing.user_id = ?",

    get selectConditionId() {
        return this.select + this.where_id + ";";
    },
};

module.exports = PermissionsQueries;