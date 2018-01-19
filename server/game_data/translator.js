const jf = require('jsonfile');
const Events = require('../../js-dev/app/events');
const GameDataManager = require('.//GameDataManager');
const RoomMappingFormatUtils = require('.//RoomMappingFormatUtils');

let jsonFile = __dirname + '/../data.json',
    lastMessages = jf.readFileSync(jsonFile);

let objMap = new Map();
for (let i = 0; i < 10; ++i) {
    objMap.set('' + i, new Map());
}

let order = [Events.CREATE_OBJECT, Events.EXPRESSION, Events.MAKE_DOOR, Events.MOVE_OBJECT, Events.REMOVE_OBJECT];
for (let objId in lastMessages) {
    for (let i = 0; i < order.length; i++) {
        let data = lastMessages[objId][order[i]];
        if (data) {
            if (order[i] === Events.CREATE_OBJECT) {
                objMap.get(data.room).set(data.id, data);
            } else if (order[i] === Events.MOVE_OBJECT) {
                if (objMap.get(data.room).has(data.id))
                    objMap.get(data.room).get(data.id).point = Object.assign({}, data.point);
            } else if (order[i] === Events.REMOVE_OBJECT) {
                objMap.get(data.room).delete(data.id);
            } else if (order[i] === Events.MAKE_DOOR) {
                if (objMap.get(data.room).has(data.id)) {
                    let obj = objMap.get(data.room).get(data.id);
                    obj.isDoor = true;
                    obj.destinationId = data.destinationId;
                }
            }
        }
    }
}

let manager = new GameDataManager();
for (let [room, roomMap] of objMap) {
    let arr = [];
    for (let [objId, obj] of roomMap) {
        arr.push(RoomMappingFormatUtils.translateOldToNew(obj));
    }

    manager.rooms.set(parseInt(room), arr);
}

manager.serialize();