
const dbManager = require('./database_manager');

class User {

    constructor(id, name, avatar, clothes, permissions) {
        this.id = id;
        this.name = name;
        this.avatar = avatar;
        this.clothes = clothes;
        this.permissions = permissions;
    }

    checkPermissions(room_id) {
        room_id = parseInt(room_id);
        return this.permissions.indexOf(room_id) > -1;
    }

    serialize() {
        let dao = dbManager.getSettingsDAO();
        dao.updateSettingsById(this.id, JSON.stringify(this.clothes));
    }

    setClothItemPreference(itemName, clothingSlot) {
        this.clothes[clothingSlot] =
            {clothName: itemName, color: ""};
    }

    setColorPreference(color, clothingSlot) {
        if (this.clothes[clothingSlot]) {
            this.clothes[clothingSlot].color = color;
        }
    }
}

module.exports = User;