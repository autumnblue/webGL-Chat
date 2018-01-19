//
//
//

var mobile = {

    handleCanvasClicks: function (room) {
        "use strict";
        /* globals JavaScriptClientDetection */

       var jsdetector = new JavaScriptClientDetection(window);

        if (jsdetector.mobile) {

            var mouse_down_timeout = 0;

            room.getCanvas().addEventListener('touchstart', function (event) {

                if (!mouse_down_timeout) {

                    mouse_down_timeout = setTimeout(function () {

                        mouse_down_timeout = 0;

                        $('canvas').contextMenu({
                            x: event.changedTouches[0].screenX + 20,
                            y: event.changedTouches[0].screenY + 20
                        });

                    }, 1500);
                }
            }, true);

            room.getCanvas().addEventListener('touchend', function (event) {

                if (mouse_down_timeout) {

                    clearTimeout(mouse_down_timeout);

                    mouse_down_timeout = 0;

                    event.clientX = event.changedTouches[0].pageX;
                    event.clientY = event.changedTouches[0].pageY;

                    room.click(event);
                }
            }, true);

            // hack: prevent automatic hiding
            $.contextMenu.handle.layerClick = function () { };

            return true;
        }

        return false;
    },

    eventXY: function (event) {
        "use strict";
        // if there is no clientX/Y, it is fake iOS context menu event, that should still have pageX/Y
        // it is also offset by +20
        return {
            x: event.clientX || (event.pageX - 20),
            y: event.clientY || (event.pageY - 20)
        };
    }
};