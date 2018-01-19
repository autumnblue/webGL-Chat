const SettingsQueries = {
    "select": "SELECT * from user_settings",
    "update": "UPDATE user_settings SET clothing=?",
    "where_user_id": " WHERE user_id= ?",

    get updateClothesById() {
        return this.update + this.where_user_id + ";";
    },

    get selectConditionUserId() {
        return this.select + this.where_user_id + ";";
    }
};

module.exports = SettingsQueries;