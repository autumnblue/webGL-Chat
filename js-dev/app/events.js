var Events = {
    ID: 'userId',

    TEXT: 'text',
    EXPRESSION: 'expression',
    CREATE_OBJECT: 'createObject',
    MAKE_DOOR: 'makeDoor',
    MOVE_OBJECT: 'moveObject',
    REMOVE_OBJECT: 'removeObject',
    CHANGE_CLOTHES: 'changeClothes',
    CHANGE_COLOR: 'changeColor'
};

if (typeof module !== "undefined") {
    module.exports = Events;
}