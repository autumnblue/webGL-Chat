const Events = require("../../js-dev/app/events");

const RoomMappingManager = require('./RoomMappingManager');
const ClothesManager = require('./ClothesManager');
const SessionStorage = require('./SessionStorage');
const RoomManager = require('./RoomManager');
const GameDataEvents = require('./GameDataEvents');

const serializeInterval = 5 * 60 * 1000;

class GameDataManager {

    constructor() {
        this.occupiedIds = [];

        this.roomMappingManager = new RoomMappingManager();
        this.clothesManager = new ClothesManager();
        this.sessionStorage = new SessionStorage();
        this.roomManager = new RoomManager();

        this.objectsToSerialize = [
            this.roomMappingManager,
            this.sessionStorage,
        ];

        this.roomMappingManager.on(GameDataEvents.ID_FREED, (obj) => this.freeId(obj.id));
        this.roomMappingManager.on(GameDataEvents.ID_OCCUPIED, (obj) => this.occupyId(obj.id));
    }

    occupyId(id) {
        this.occupiedIds[id] = true;
    }

    freeId(id) {
        this.occupiedIds[id] = false;
    }

    getAndOccupyFreeId() {
        let freeId = this.getFreeId();
        this.occupyId(freeId);
        return freeId;
    }

    getFreeId() {
        const firstId = 1;
        for (let i = firstId; i < this.occupiedIds.length; i++) {
            if (!this.occupiedIds[i]) {
                return i;
            }
        }
        return this.occupiedIds.length ? this.occupiedIds.length : firstId;
    }

    handleEvent(event, obj) {
        switch (event) {
            case Events.CREATE_OBJECT:
                this.roomMappingManager.createObject(obj);
                break;
            case Events.MOVE_OBJECT:
                this.roomMappingManager.setObjectPosition(obj.id, obj.point);
                break;
            case Events.REMOVE_OBJECT:
                this.roomMappingManager.removeObject(obj.room, obj.id);
                break;
        }
    }

    serialize(callback) {
        for (let obj of this.objectsToSerialize) {
            obj.serialize(callback);
        }
    }

    run() {
        this.serializeInterval =
            setInterval(() => this.serialize(), serializeInterval);
    }

    stop() {
        this.serialize();
        clearInterval(this.serializeInterval);
    }
}

module.exports = GameDataManager;