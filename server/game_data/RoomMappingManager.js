const RoomMappingDAO = require('../database_manager/RoomMappingDAO');
const RoomMappingFormatUtils = require('./RoomMappingFormatUtils');
const GameDataEvents = require('./GameDataEvents');
var events = require('events');

class RoomMappingManager extends events.EventEmitter {
    constructor() {
        super();
        this.roomMappingDAO = new RoomMappingDAO();
        this.rooms = new Map();
        this.objectsById = new Map();
    }

    setUpRoomMappingFromDB(callback) {
        this.roomMappingDAO.selectRoomMapping((err, rows) => {
            if (err) return;
            for (let row of rows) {
                let mapping = JSON.parse(row.mapping);
                this.rooms.set(row.room, mapping);
                if(callback)
                    callback(err, rows);

                for (let obj of mapping) {
                    this.objectsById.set(obj.id, obj);
                    this.emit(GameDataEvents.ID_OCCUPIED, {id:obj.id})
                }
            }
        });
    }

    serialize(callback) {
        let connection = this.roomMappingDAO.createConnection();
        let i = 0;

        for (let [room, mapping] of this.rooms) {

            mapping = this.removeUsers(mapping);

            this.roomMappingDAO.updateRoomMappingByRoom(room, JSON.stringify(mapping), ()=> {
                ++i;
                if (i === this.rooms.size) {
                    connection.destroy();
                    if (callback)
                        callback();
                }
            }, connection);
        }
    }

    getMappingForRoom(room) {
        return this.rooms.has(room) ?
            this.rooms.get(room) : [];
    }

    removeObject(room, id) {
        if (this.objectsById.has(id)) {
            this.objectsById.delete(id);
            let roomObjs = this.rooms.get(room);

            for (let i = 0; i < roomObjs.length; ++i) {
                if (roomObjs[i].id === id) {
                    roomObjs.splice(i, 1);
                    this.emit(GameDataEvents.ID_FREED, {id: id});
                }
            }
        }
    }

    createObject(obj) {
        let newObj = RoomMappingFormatUtils.translateOldToNew(obj);
        this.rooms.get(obj.room).push(newObj);
        this.objectsById.set(newObj.id, newObj);
    }

    setObjectPosition(id, position) {
        if (this.objectsById.has(id)) {
            this.objectsById.get(id).position = Object.assign({}, position);
        }
    }

    removeUsers(mapping) {
        return mapping.filter(obj => !obj.avatar);
    }
}

module.exports = RoomMappingManager;