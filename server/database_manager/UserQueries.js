const UserQueries = {

    "select": "SELECT * from user",

    "where_id": " WHERE `user_id`= ?",

    "where_name": " WHERE `username`= ?",

    "where_password": " WHERE `password`= ?",
    
    "insert_beginning": "INSERT INTO user (username, password) VALUES ",

    "insert_values": " ( ? , ? )",

    get selectConditionName() {
        return this.select + this.where_name + ";";
    },

    get selectConditionId() {
        return this.select + this.where_id + ";";
    },

    "insert": function(numberOfValues) {
        let query = this.insert_beginning;
        for (let i = 0; i < numberOfValues; ++i) {
            if (i) query += ',';
            query += this.insert_values;
        }
        return query + ';';
    }
};

module.exports = UserQueries;