function Decorations(roomData, scene, camera, AH, anisotropy) {
    "use strict";

    // create floor

    var floorTexturePath = window.params.s3_bucket + roomData.floor.texture;

    var floorTexture = new THREE.ImageUtils.loadTexture(floorTexturePath);
    
    floorTexture.anisotropy = anisotropy;
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;

    var floorWidth = roomData.floor.width || 1000;

    floorTexture.repeat.set(roomData.floor.tiling * floorWidth / roomData.floor.depth, roomData.floor.tiling);

    var floor = new THREE.Mesh(new THREE.PlaneGeometry(floorWidth, roomData.floor.depth), new DayNightMaterial2(floorTexture, {}));

    floor.position.y = -0.5 * AH;
    floor.rotation.x = -0.5 * Math.PI;

    scene.add(floor);

    // optional ceiling

    if (roomData.ceiling) {

        var ceilingTexturePath = window.params.s3_bucket + roomData.ceiling.texture;

        var ceilingTexture = new THREE.ImageUtils.loadTexture(ceilingTexturePath);
        ceilingTexture.anisotropy = anisotropy;
        ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
        var ceilingWidth = roomData.ceiling.width || 1000;
        ceilingTexture.repeat.set(roomData.ceiling.tiling * ceilingWidth / roomData.ceiling.depth, roomData.ceiling.tiling);

        var ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ceilingWidth, roomData.ceiling.depth), new DayNightMaterial2(ceilingTexture, {}));
        ceiling.position.y = roomData.ceiling.height;
        ceiling.rotation.x = 0.5 * Math.PI;
        scene.add(ceiling);
    }

    // sun and moon

    var sunAndMoon = new THREE.Object3D();
    sunAndMoon.position.z = -290;
    scene.add(sunAndMoon);

    var sunTexturePath = window.params.s3_bucket + 'assets/sun.png';

    var sun = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({
        map: new THREE.ImageUtils.loadTexture(sunTexturePath),
        transparent: true, blending: THREE.AdditiveBlending
    }));
    sunAndMoon.add(sun);

    sun.position.x = +400;

    var moonTexturePath = window.params.s3_bucket + 'assets/moon.png';

    var moon = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({
        map: new THREE.ImageUtils.loadTexture(moonTexturePath),
        transparent: true
    }));
    sunAndMoon.add(moon);

    moon.position.x = -400;

    // sky

    if ( roomData.sky ){

        var skyTexturePath = window.params.s3_bucket + roomData.sky.texture;

        var sky = new THREE.Mesh(
            new THREE.PlaneGeometry(roomData.sky.width, roomData.sky.height),
            SkyMaterial(skyTexturePath)
        );

        sky.position.x = roomData.sky.x;
        // we now want all of these to things to be lined up to floor edge:
        // cam.z, cam.y
        // -0.5 * floor.depth, floor.y
        // sky.z, sky.y
        sky.position.y =
            camera.position.y +
            (floor.position.y - camera.position.y) *
            (roomData.sky.z - camera.position.z) /
            (roomData.floor.depth * -0.5 - camera.position.z) +
            roomData.sky.height * 0.5;

        sky.position.z = roomData.sky.z;

        var sky_z = roomData.sky.z + 10;
        var sky_scale = sky_z / sunAndMoon.position.z;
        sunAndMoon.position.z = sky_z;
        sunAndMoon.scale.set(sky_scale, sky_scale, sky_scale);

        scene.add(sky);
    }

    // background

    var decorations = roomData.decorations;

    if (!decorations)
        decorations = [];

    for (var b = 0; b < decorations.length; b++) {

        var decoration = new THREE.Mesh(
            new THREE.PlaneGeometry(decorations[b].width, decorations[b].height),
            new DayNightMaterial2(new THREE.ImageUtils.loadTexture(window.params.s3_bucket + decorations[b].texture))
        );

        decoration.position.x = decorations[b].x;

        // we now want all of these to things to be lined up to floor edge:
        // cam.z, cam.y
        // -0.5 * floor.depth, floor.y
        // dec[b].z, dec[b].y
        decoration.position.y =
            camera.position.y +
            (floor.position.y - camera.position.y) *
            (decorations[b].z - camera.position.z) /
            (roomData.floor.depth * -0.5 - camera.position.z) +
            decorations[b].height * 0.5;

        decoration.position.z = decorations[b].z;

        scene.add(decoration);
    }

    return {
        floor: floor,
        setTime: function (t) {
            sunAndMoon.rotation.z = 2 * Math.PI * (0.5 - t);
        }
    };
}