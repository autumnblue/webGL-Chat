//
//
//

function Doors(scene) {
    "use strict";
    var doors = [];

    doors.check = function (userId, doorCallback) {
        var object = scene.getObjectByProperty("_id", userId);
        if (object) {
            for (var i = 0; i < doors.length; i++) {
                var door = doors[i];
                // see if it is just behind the door
                var dx = door.position.x - object.position.x;
                var dz = door.position.z - object.position.z;
                if ((Math.abs(dx) < 10) && (dz > 0) && (dz < 6)) {
                    console.log("passing through door to " + door.destinationId);

                    doorCallback(door.destinationId); return false;
                }
            }
        }
        return true;
    };

    function doors_animate_loop(door) {

        // is door texture loaded?
        if (!door.children[0])
            return;

        var doorTexture = door.children[0].material.map;

        // is door texture animated?
        if (doorTexture.wrapS != THREE.RepeatWrapping)
            return;

        var frames = Math.round(1.0 / doorTexture.repeat.x);

        // really animated?
        if (frames < 2)
            return;

        door.t = door.t || 0;

        var avatarsNearby = false;

        scene.traverse(function (object) {
            if (object.avatarAnimator && !avatarsNearby) {

                var dx = door.position.x - object.position.x;
                var dz = door.position.z - object.position.z;

                if ((Math.abs(dx) < 25) && (Math.abs(dz) < 25)) {
                    avatarsNearby = true;
                }
            }
        });

        if (avatarsNearby) {
            if (door.t < 1e-4) {
                // avatar approached the door - open it
                (function (door, doorTexture, frames) {
                    $(door).animate({ t: 0.999 }, {
                        duration: 500,
                        step: function (t) {
                            doorTexture.offset.x = Math.floor(t * frames) / frames;
                        }
                    });
                })(door, doorTexture, frames);
            }
        } else {
            if (door.t > 0.9989) {
                // no avatars are near the door - close it
                (function (door, doorTexture, frames) {
                    $(door).animate({ t: 0 }, {
                        duration: 500,
                        step: function (t) {
                            doorTexture.offset.x = Math.floor(t * frames) / frames;
                        }
                    });
                })(door, doorTexture, frames);
            }
        }
    }

    doors.animate = function () {
        for (var i = 0; i < doors.length; i++) {
            var door = doors[i];
            doors_animate_loop(door);
        }
    };

    return doors;
}