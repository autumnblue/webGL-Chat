//
//
//

function Clouds(camera) {
    "use strict";
    var clouds = [];

    clouds.move = function (dt) {
        var hFOV = 2 * Math.atan(Math.tan(camera.fov * (Math.PI / 180) / 2) * camera.aspect);
        for (var i = 0; i < clouds.length; i++) {
            // Cloud (or specified object) moves left to right on the y axis until it
            // is out of the viewport, then it appears again from the left. This is a
            // continuous loop. Speed of 1 cycle can be 360 seconds for testing.
            var width = 2 * Math.tan((hFOV / 2)) * (camera.position.z - clouds[i].position.z);

            // assuming dt in seconds
            clouds[i].position.x += width * dt / 360;

            var bounds = new THREE.Box3().setFromObject(clouds[i]);
            if (!isFinite(bounds.min.x)) {
                // fix for empty object bounding box (infinite)
                bounds.min.x = bounds.max.x = clouds[i].position.x;
            }

            if (bounds.min.x > width / 2 + camera.position.x) {
                clouds[i].position.x = (bounds.min.x - bounds.max.x - width) / 2 + camera.position.x;
            }
        }
    };

    return clouds;
}