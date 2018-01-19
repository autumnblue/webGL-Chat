const RoomsDAO = require('../database_manager/RoomsDAO');
const RoomOwnersDAO = require('../database_manager/RoomOwnersDAO');

class RoomManager {

    constructor() {
        this.cachedReponses = new Map();
        this.dao = new RoomsDAO();
        this.ownersDao = new RoomOwnersDAO();
        this.cacheOutdated = false;
    }

    handleRoom(name, callback) {
        if (this.tryToGetFromCache(name, callback))
            return;

        this.dao.selectRoom(name, (err, rows) => {
            let response = {};
            if (err) {
                console.log(err);
                callback(response);
                return;
            }

            if (rows.length !== 1) {
                throw new Error(`There are ${rows.length} rooms with name ${name}`);
            }

            response = this.constructResponseJson(rows[0]);
            this.cachedReponses.set(name, response);

            callback(response);
        });
    }

    handleAllRooms(callback) {
        const key = "all";

        if (this.tryToGetFromCache(key, callback))
            return;

        this.dao.selectRooms((err, rows) => {
            let rooms = {};
            if (err) {
                console.log(err);
                callback(rooms);
                return;
            }

            for (let row of rows) {
                let room = this.constructResponseJson(row);
                rooms[room.room_id] = room;
            }
            this.cachedReponses.set(key, rooms);
            callback(rooms);
        });
    }

    tryToGetFromCache(key, processResultCallback) {
        if (!this.cacheOutdated && this.cachedReponses.has(key)) {
            processResultCallback(this.cachedReponses.get(key));
            return true;
        }

        if (this.cacheOutdated) {
            this.cachedReponses = new Map();
            this.cacheOutdated = false;
        }

        return false;
    }

    saveRoom(action, room_name, room_id, room_creator, room_owners, data, callback) {
        let json = JSON.stringify(this.constructDatabaseJson(data));
        if (action === "new") {
            this.createRoom(room_name, room_creator, room_owners, json ,callback)
        } else if (action === "exist") {
            this.updateRoom(room_id, room_owners, json, callback);
        } else {
            callback("fail", "unknown action")
        }
    }

    updateRoom(room_id, room_owners, json, callback) {
        this.dao.updateRoom( room_id, json, (err, rows) => {

            if (err || rows.affectedRows !== 1){
                if (err)
                    console.error(err);
                if (rows && rows.affectedRows !== 1)
                    console.error("updateRoom: rows.affectedRows != 1");
                callback("fail", "Could not update room - internal server error");
                return;
            }
            this.cacheOutdated = true;

            this.updateRoomOwners(room_id, room_owners, callback);
        });
    }

    updateRoomOwners(room_id, room_owners, callback) {
        this.ownersDao.updateRoomOwners(room_id, room_owners, (err, rows) => {

            if (err){
                console.error(err);
                callback("fail", "Internal server error - could not set permissions");
                return;
            }

            callback("ok", room_id);
        });

    }

    createRoom(room_name, room_creator, room_owners, json, callback) {
        this.dao.selectRoom(room_name, (err, rows) => {
            if (err){
                console.error(err);
                callback("fail", "Internal server error");
                return;
            }

            if (rows.length){
                callback("fail", `Room name ${room_name} already exists`);
                return;
            }

            this.dao.createRoom(room_creator, room_name, json, (err, rows) => {

                if (err || rows.affectedRows !== 1) {
                    if (err)
                        console.error(err);
                    if (rows && rows.affectedRows !== 1)
                        console.error("createRoom: rows.affectedRows != 1");
                    callback("fail", "Could not create room - internal server error");
                    return;
                }
                this.cacheOutdated = true;

                this.updateRoomOwners(rows.insertId, room_owners, callback);
            });
        });
    }

    constructDatabaseJson(req_data) {
        let json = {};
        json.pushCameraBackBy = req_data.pushCameraBackBy;
        json.objectScale = req_data.objectScale;

        json.floor = {};
        json.floor.width = req_data.floor.width;
        json.floor.depth = req_data.floor.depth;
        json.floor.tiling = req_data.floor.tiling;
        json.floor.texture = req_data.floor.texture;

        if (req_data.ceiling){
            json.ceiling = {};
            json.ceiling.width = req_data.ceiling.width;
            json.ceiling.depth = req_data.ceiling.depth;
            json.ceiling.tiling = req_data.ceiling.tiling;
            json.ceiling.texture = req_data.ceiling.texture;
            json.ceiling.height = req_data.ceiling.height;
        }

        if (req_data.sky) {
            json.sky = {};
            json.sky.width = req_data.sky.width;
            json.sky.height = req_data.sky.height;
            json.sky.texture = req_data.sky.texture;
            json.sky.z = req_data.sky.z;
            json.sky.x = req_data.sky.x;
        }

        json.decorations = req_data.decorations;
        return json;
    }

    constructResponseJson(row) {
        var json = JSON.parse(row.room_json);

        json.room_id = row.room_id;
        json.room_name = row.room_name;
        json.room_creator = row.room_creator;
        json.room_creator_id = row.room_creator_id;
        json.room_owners = JSON.parse(row.shared_with);

        return json;
    }
}

module.exports = RoomManager;