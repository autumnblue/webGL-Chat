const ClothesDAO = require('../database_manager/ClothesDAO');

class ClothesManager {
    constructor() {
        this.clothesDAO = new ClothesDAO();
        this.clothes = new Map();
        this.clothesByAvatars = new Map();
        this.restrictColors = false;

        this.clothesDAO.selectAllClothes((err, rows) => {
            for (let row of rows) {
                let item = new ClothItem(JSON.parse(row.json), row.name, this);

                if (!this.clothesByAvatars.has(row.avatar)) {
                    this.clothesByAvatars.set(row.avatar, []);
                }
                this.clothesByAvatars.get(row.avatar).push(item);
                this.clothes.set(row.name, item);
            }
        });
    }

    getAllClothesObj(avatar) {
        let obj = {};

        if (!this.clothesByAvatars.has(avatar))
            return obj;

        for (let item of this.clothesByAvatars.get(avatar)) {
            if (!obj[item.clothingSlot]) {
                obj[item.clothingSlot] = [];
            }
            obj[item.clothingSlot].push(item.name);
        }

        return obj;
    }

    getClothingArray(userClothing) {
        let clothes = [];
        for (let slotKey in userClothing) {
            let clothInfo = userClothing[slotKey];

            if (!this.clothes.has(clothInfo.clothName))
                continue;

            let item = this.clothes.get(clothInfo.clothName);

            clothes.push(item.prepareToSend(clothInfo.color));
        }

        return clothes;
    }
}

class ClothItem {
    constructor(clothObj, name, manager) {
        for (let property in clothObj) {
            if (clothObj.hasOwnProperty(property)) {
                this[property] = clothObj[property];
            }
        }

        this.name = name;
        this.manager = manager;
    }

    prepareToSend(color) {

        if (!color || this.manager.restrictColors &&
            this.colors.indexOf(color) === -1) {
            this.color = "";
        } else {
            this.color = color;
        }

        delete this["colors"];
        return this;
    }
}

module.exports = ClothesManager;