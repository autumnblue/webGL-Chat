
const propertiesToCopyAsIs = [
    "id"
];

const optionalProperties = [
    "block",
    "isDoor",
    "destinationId",
    "avatar",
    "name",
    "objectId",
];

class RoomMappingFormatUtils {

    static copyAsIsProperties(sourceObj, destObj) {
        for (let property of propertiesToCopyAsIs) {
            destObj[property] = sourceObj[property];
        }
    }

    static copyOptionalParameters(sourceObj, destObj) {
        for (let property of optionalProperties) {
            if (sourceObj[property])
                destObj[property] = sourceObj[property];
        }
    }

    static translateNewToOld(newFormatObj, room) {
        let oldFormatObj = {};

        RoomMappingFormatUtils.copyAsIsProperties(newFormatObj, oldFormatObj);
        RoomMappingFormatUtils.copyOptionalParameters(newFormatObj, oldFormatObj);

        oldFormatObj.point = Object.assign({}, newFormatObj.position);
        oldFormatObj.room = room;

        return oldFormatObj;
    }

    static translateOldToNew(oldFormatObj) {

        let newFormatObj = {};

        RoomMappingFormatUtils.copyAsIsProperties(oldFormatObj, newFormatObj);
        RoomMappingFormatUtils.copyOptionalParameters(oldFormatObj, newFormatObj);

        if (oldFormatObj.point)
            newFormatObj.position = Object.assign({}, oldFormatObj.point);

        return newFormatObj;
    }
}

module.exports = RoomMappingFormatUtils;