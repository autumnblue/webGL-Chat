function Keyboard() {
    "use strict";
    var keys = { SP: 32, W: 87, A: 65, S: 83, D: 68, UP: 38, LT: 37, DN: 40, RT: 39 };
    for (var prop in keys) Keyboard[prop] = keys[prop];

    var keysPressed = {};
    (function (watchedKeyCodes) {
        var handler = function (down) {
            return function (e) {
                if (e.target && (e.target.nodeName == 'INPUT')) {
                    return;
                }

                var index = watchedKeyCodes.indexOf(e.keyCode);
                if (index >= 0) {
                    keysPressed[watchedKeyCodes[index]] = down; e.preventDefault();
                }
            };
        };
        $(document).keydown(handler(true));
        $(document).keyup(handler(false));
    })([
        keys.SP, keys.W, keys.A, keys.S, keys.D, keys.UP, keys.LT, keys.DN, keys.RT
    ]);

    return keysPressed;
}