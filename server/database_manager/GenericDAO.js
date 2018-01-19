const mysql = require('mysql');
let database_config = process.argv[2] === 'local' ?
    'database' : 'database_heroku';
const mysql_config = require('../config/' + database_config);

class GenericDAO {

    constructor() {
    }

    createConnection(params) {
        let config = mysql_config;
        if (params) {
            config = Object.assign({}, mysql_config);
            config = Object.assign(config, params);
        }
        let connection = mysql.createConnection(config);
        connection.connect();
        return connection;
    }

    genericQuery(query, params, callback, connection) {
        connection.query(query, params, callback);
    }

    genericQueryWithConnection(query, params, callback) {
        let connection = this.createConnection();
        connection.query(query, params,
            (err, rows) => {
                if (callback) {
                    callback(err, rows);
                }
                connection.destroy();
            });
    }
}

module.exports = GenericDAO;