//
//
//

function Quip(scene, camera, rect) {
    "use strict";
    var quipId, quip = $('<svg id="quip" height="35" width="24">' +
        '<polygon points="0,0 12,35 24,0" />' +
        '</svg>')[0], quipVector = new THREE.Vector3();
    quip.style.position = 'absolute';
    quip.style.display = 'none';
    $('body').append(quip);

    return {
        update: function () {
            var object = scene.getObjectByProperty("_id", quipId);
            if (object) {
                // 3D -> 2D, http://stackoverflow.com/a/11605007/2207790

                quipVector.setFromMatrixPosition(object.matrixWorld);
                quipVector.project(camera);

                quip.style.left = (rect.left + (rect.width * 0.5 * (quipVector.x + 1) - 12)) + 'px';
                quip.style.top = (rect.top - 10 - 1) + 'px';

            } else {
                // user posts message and quits...
                quip.style.display = 'none';
            }
        },

        show: function (id) {
            quipId = id;
            quip.style.display = '';
            quip.style.fill = id2color(id);
        }
    };
}