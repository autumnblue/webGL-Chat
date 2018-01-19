

function getAA(parameter, scene, camera) {
    "use strict";

    var useDefault = false, shaderPass = [], resize;

    if (parameter === "none") {
        useDefault = false;
    }
    else if (parameter === "default") {
        useDefault = true;
    }
    else if (parameter === "ssaa") {

        useDefault = false;

        var ssaa_param = {
            sampleLevel: 2
        };

        var ssaaRenderPass = new THREE.SSAARenderPass( scene, camera );
        ssaaRenderPass.unbiased = false;
        ssaaRenderPass.sampleLevel = ssaa_param.sampleLevel;

        var copyPass = new THREE.ShaderPass( THREE.CopyShader );
        copyPass.renderToScreen = true;

        shaderPass.push(ssaaRenderPass);
        shaderPass.push(copyPass);

        resize = function(width, height){
            var empty_block = 0;
        };
    }
    else if (parameter === "smaa") {

        useDefault = false;

        var ssmaaPass = new THREE.SMAAPass( 1000, 1000 );
        ssmaaPass.renderToScreen = true;

        shaderPass.push(ssmaaPass);

        resize = function(width, height){
            var empty_block = 0;
        };
    }
    else if (parameter === "fxaa") {

        useDefault = false;

        var fxaaPass = new THREE.ShaderPass( THREE.FXAAShader );
        fxaaPass.uniforms.resolution.value.set(1 / 1000, 1 / 1000);
        fxaaPass.renderToScreen = true;

        shaderPass.push(fxaaPass);

        resize = function(width, height){
            fxaaPass.uniforms.resolution.value.set(1 / width, 1 / height);
        };
    }
    else if (parameter === "bokeh") {

        useDefault = false;

        var bokehPass = new THREE.BokehPass(scene, camera, {
            focus: 1.0,
            aperture: 0.002,
            maxblur: 0.001,

            width: 1000, // these values should be reset in resize call
            height: 1000
        });
        bokehPass.renderToScreen = true;

        shaderPass.push(bokehPass);

        resize = function(width, height){
            bokehPass.uniforms.aspect.value = camera.aspect;
        };

        //var effectController  = {
        //  enableDof:  false,
        //  aperture:   0.002,
        //  maxblur:    0.002
        //};
        //var gui = new dat.GUI();
        //gui.add( effectController, "enableDof" ).onChange( function( ) {
        //    renderPass.renderToScreen = !effectController.enableDof;
        //    composer [effectController.enableDof ? "addPass" : "removePass"] (bokehPass);
        //} ).name( "Enable DOF effect");
        //gui.add( effectController, "aperture", 0.001, 0.02, 0.001 ).onChange( function( ) {
        //    postprocessing.bokeh.uniforms.aperture.value = effectController.aperture;
        //    postprocessing.bokeh.uniforms.maxblur.value = effectController.maxblur;
        //} );
        //gui.add( effectController, "maxblur", 0.0, 0.003, 0.0001 ).onChange( function( ) {
        //    postprocessing.bokeh.uniforms.aperture.value = effectController.aperture;
        //    postprocessing.bokeh.uniforms.maxblur.value = effectController.maxblur;
        //} );
        //gui.close();

        /*if (userAvatar) {
            var tmpAvatarPos = new THREE.Vector4();
            tmpAvatarPos.copy (userAvatar.position);
            camera.worldToLocal (tmpAvatarPos);
            tmpAvatarPos.applyMatrix4 (camera.projectionMatrix);
            var t = tmpAvatarPos.z; /// tmpAvatarPos.w;
            t = Math.min (1, Math.max (0, (t - camera.near) / (camera.far - camera.near)));
            t = t*t*(3 - 2*t); // http://en.wikipedia.org/wiki/Smoothstep
            postprocessing.bokeh.uniforms.focus.value = 1 - t;
        }*/
    }

    return {
        useDefault : useDefault,
        shaderPass : shaderPass,
        resize : resize
    };
}

function Room(socket, canvas, form, config, roomData, doorCallback) {

    "use strict";

    var self = this;

   self.setCurrentUserId = function (id) {
        var object = scene.getObjectByProperty("_id", userId);
        if (object) {
            scene.remove(object);
        }
        userId = id;
    };

    self.getCurrentUserId = function () {
        return userId;
    };

    self.isMap = function () {
        return !!pushCameraBackBy;
    };

    self.createActivePreview = function (event, objectId, block) {
        if (activePreviewObject) {
            self.removeActivePreview();
        }

        var callback = function( id){
            activePreviewObject = {
                id : id,
                object : scene.getObjectByProperty("_id", id),
                tween : null,
                material : {r : 0, g : 0, b: 0}
            };
            if (activePreviewObject.object) {

                activePreviewObject.object.visible = false;

                activePreviewObject.tween = new TWEEN.Tween( activePreviewObject.material )
                        .to( { g: 0.5 }, 450 )
                        .repeat( Infinity )
                        .delay( 0 )
                        .yoyo( true )
                        .easing( TWEEN.Easing.Cubic.InOut )
                        .onUpdate( function() {
                            if (activePreviewObject && activePreviewObject.object.getMaterial){

                                var material = activePreviewObject.object.getMaterial();

                                if (material){
                                    material.emissive.g = activePreviewObject.material.g;
                                    material.needsUpdate = true;
                                }
                            }
                        })
                        .start();

                activePreviewObject.tween.setInitialState = function(){
                    if (activePreviewObject && activePreviewObject.object.getMaterial){

                        var material = activePreviewObject.object.getMaterial();

                        if (material){
                            material.emissive.g = 0.0;
                            material.needsUpdate = true;
                        }
                    }
                };
            }
        };

        self.placeObjectAt(null, objectId, callback, block);
    };

    self.moveActivePreview = function (event) {

        if (activePreviewObject && activePreviewObject.object) {

            var intersections = mouseEventToPoint(event);
            var point = intersections.length > 0 ? intersections[0].point : null;

            if (point) {
                activePreviewObject.object.visible = true;
                activePreviewObject.object.position.set(point.x, point.y, point.z);
                return true;
            }
        }
        return false;
    };

    self.applyActivePreview = function () {

        if (activePreviewObject && activePreviewObject.object) {

            if (activePreviewObject.tween){
                activePreviewObject.tween.stop();
                activePreviewObject.tween.setInitialState();
            }
            activePreviewObject.tween = null;

            socket.emit(Events.MOVE_OBJECT, {
                id: parseInt(activePreviewObject.id),
                instant: true,
                point: activePreviewObject.object.position
            });

            activePreviewObject = null;
        }
    };

    self.removeActivePreview = function () {

        if (activePreviewObject){

            if (activePreviewObject.tween){
                activePreviewObject.tween.stop();
                activePreviewObject.tween.setInitialState();
            }
            activePreviewObject.tween = null;

            self.deleteObject(activePreviewObject.id);
        }

        activePreviewObject = null;
    };

    self.placeObjectAt = function (event, objectId, callback, block) {

        var point;

        if (event){
            var intersections = mouseEventToPoint(event);
            point = intersections.length > 0 ? intersections[0].point : null;
        }
        else 
        {
            if (userAvatar)
                point = userAvatar.position;
        }

        if (point) {

            var ts = Date.now();

            if (callback) 
                createObjectCallbacks[ts] = callback;

            socket.emit(Events.CREATE_OBJECT, { point: point, objectId: objectId, timeStamp: ts, block: block });

        } else {

            alert('Could not create object in the air. Please place it on the floor.');
        }
    };

    self.idOfObjectAt = function (event, f_arr_onhide) { // TODO highlight !!

        var intersections = mouseEventToPoint(event, true);

        for (var i = 0; i < intersections.length; i++) {

            if (intersections[i].object && intersections[i].object.getParentObject)
            {
                var object = intersections[i].object.getParentObject();

                if (object) {

                    var material = object.getMaterial();

                    if (material){
                        var last_r = material.emissive.r;
                        material.emissive.r = 0.8;
                        material.needsUpdate = true;
                        /*jshint ignore : start */
                        f_arr_onhide.push(function(){
                            material.emissive.r = last_r;
                            material.needsUpdate = true;
                        });
                        /*jshint ignore : end */
                    }

                    return parseInt(object._id);
                }
            }
        }
        return 0;
    };

    self.moveObject = function (id) {

        var object = scene.getObjectByProperty("_id", id);

        if (object && (!mover.object || (object.id != mover.object.id))) {
            if (mover.object) {
                mover.detach(mover.object);
                clearTimeout(moverTimeout);
            }

            // proxy object to allow snapping
            var proxy = new THREE.Object3D();
            proxy._id = object._id;
            proxy.position.copy(object.position);

            // TransformControls read .parent.matrixWorld for some reason
            proxy.parent = new THREE.Object3D();
            proxy.parent.matrixWorld.copy(object.parent.matrixWorld);

            mover.attach(proxy);
        }
    };

    self.deleteObject = function (id) {
        socket.emit(Events.REMOVE_OBJECT, { id: id });
    };

    self.showQuip = function (id) {
        quip.show(id);
    };

    self.makeDoor = function (id, destinationId) {
        socket.emit(Events.MAKE_DOOR, { id: id, destinationId: destinationId });
    };

    self.getCanvas = function(){
        return canvas;
    };

    self.click = function (event) {
        click(event);
    };

    self.resize = function(){
        resize();
    };

    // ---------------- internals

    function toScreenPosition(position, camera, canvas){

        var vector = new THREE.Vector3(position.x, position.y, position.z);

        var widthHalf = 0.5 * canvas.width;
        var heightHalf = 0.5 * canvas.height;

        vector.project(camera);

        vector.x = ( vector.x * widthHalf ) + widthHalf;
        vector.y = - ( vector.y * heightHalf ) + heightHalf;

        return { x : vector.x, y : vector.y };
    }

    var jsdetector = new JavaScriptClientDetection(window);

    Room.dayStart = config.dayStart || 0;
    Room.dayLength = config.dayLength || (60 * 60 * 1000);

    var AW = 12.8, AH = 25.6;
    var userId = 0, userAvatar = null;
    var activePreviewObject = null;

    var mouse = {
        x : 0,
        y : 0
    };

    var room_camera = {
        position : {
            x : 0.0,
            y : 5.12,
            z : 0.0
        },
        fov : 60.0,
        aspect : 1.0,
        near : 1.0,
        far : 1000.0
    };
    
    var camera = new THREE.PerspectiveCamera(room_camera.fov, room_camera.aspect, room_camera.near, room_camera.far );
    camera.position.set(room_camera.position.x, room_camera.position.y, room_camera.position.z);

    // ----------------

    var scene = new THREE.Scene();

    var renderer_parameters_aa_options = getAA(window.params.debug_aa, scene, camera);

    var renderer_parameters = {};
    renderer_parameters.canvas = canvas;
    renderer_parameters.alpha = true;
    renderer_parameters.depth = true;
    renderer_parameters.stencil = true;
    renderer_parameters.antialias = renderer_parameters_aa_options.useDefault;
    renderer_parameters.premultipliedAlpha = false;
    renderer_parameters.preserveDrawingBuffer = false;

    var renderer = new THREE.WebGLRenderer(renderer_parameters);

    var renderCall = function(){

        renderer.render(scene, camera);
    };

    var postprocessing = {};

    if (renderer_parameters_aa_options.shaderPass.length){

        var composer = new THREE.EffectComposer(renderer);

        var renderPass = new THREE.RenderPass(scene, camera);

        renderPass.renderToScreen = false;

        composer.addPass(renderPass);

        for ( var sI = 0; sI < renderer_parameters_aa_options.shaderPass.length; sI++) {

            composer.addPass(renderer_parameters_aa_options.shaderPass[sI]);
        }

        postprocessing.composer = composer;

        renderCall = function(){

            postprocessing.composer.render();
        };
    }

    renderer.autoClear = false;

        // push camera back for large room effect
    var decorations = Decorations(roomData, scene, camera, AH, renderer.capabilities.getMaxAnisotropy());
    var pushCameraBackBy = roomData.pushCameraBackBy;
    if (pushCameraBackBy) {
        var direction = new THREE.Vector3(
            0.0,
            camera.position.y - decorations.floor.position.y,
            camera.position.z + roomData.floor.depth * 0.5
            );
        camera.position.add(direction.normalize().multiplyScalar(pushCameraBackBy));
    }

    var rect = {
        bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0
    };

    camera.sectionData = {
        section : 0,
        position : { x : camera.position.x, y : camera.position.y, z : camera.position.z}  
    };


    var resize = function () {

        var parent = canvas.parentNode;

        var maxWidth = 2014;

        if (decorations)
        {
            var focalLength = parent.clientHeight / (2 * Math.tan(camera.fov * (Math.PI / 180) / 2));

            var bounds = new THREE.Box3().setFromObject(decorations.floor);

            var bounds_max_x = bounds.max.x;
            var bounds_min_z = bounds.min.z;

            if (bounds_max_x > 200.0)
                bounds_max_x = 200.0;

            if (bounds_max_x < -100.0)
                bounds_min_z = -100.0;

            decorations.bounds = {
                x : bounds_max_x,
                z : bounds_min_z
            };

            maxWidth = 2 * Math.floor((bounds_max_x - 15 /* sideways camera motion */) * focalLength / (camera.position.z - bounds_min_z));
        }

        var canvasWidth = Math.min(maxWidth, parent.clientWidth);
        canvas.style.marginLeft = Math.floor((parent.clientWidth - canvasWidth) / 2) + 'px';

        var canvasHeight = parent.clientHeight - form.clientHeight;
        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();

        var width = canvasWidth;
        var height = canvasHeight;

        renderer.setSize(width, height);

        if (renderer_parameters_aa_options.shaderPass.length){

            renderer_parameters_aa_options.resize(width, height);

            var pixelRatio = renderer.getPixelRatio();
            var newWidth  = Math.floor( width / pixelRatio ) || 1;
            var newHeight = Math.floor( height / pixelRatio ) || 1;

            postprocessing.composer.setSize( newWidth, newHeight );
        }

        var clientRect = canvas.getBoundingClientRect();
        for (var prop in rect) {
            rect[prop] = clientRect[prop];
        }
    };

    window.addEventListener('resize', resize, false);
    resize();

    var quip = Quip(scene, camera, rect);

    var mover = new THREE.TransformControls(camera, renderer.domElement);
    scene.add(mover);

    var moverTimeout = 0;
    mover.addEventListener('change', function () {
        if (mover.object) {
            socket.emit(Events.MOVE_OBJECT, {
                id: parseInt(mover.object._id),
                instant: true,
                point: mover.object.position
            });

            // hide after 2 seconds of idle time
            clearTimeout(moverTimeout);
            moverTimeout = setTimeout(function () {
                mover.detach(mover.object);
            }, 2014);
        }
    });

    var clouds = Clouds(camera);

    var doors = Doors(scene);

    scene.add(DayNightMaterial2.light);

    var spineAnimations = [];

    var keyboard = Keyboard(), nextPoint = new THREE.Vector3();

    var lastTimeStamp;

    var moveCamera = function(){

        var left_bound = 0.2;
        var right_bound = 0.8;

        if (canvas.height > canvas.width) {
            left_bound = 0.17;
            right_bound = 0.83;
        }

        if (userAvatar && userAvatar.destinationMovePosition &&
            decorations && decorations.bounds){

            var usr_scr = toScreenPosition(userAvatar.position, camera, canvas);

            if ( usr_scr.x / canvas.width < left_bound || usr_scr.x / canvas.width > right_bound) {

                if (!camera.tween ) {

                    var last_x = camera.position.x;

                    var new_position_x = userAvatar.destinationMovePosition.x;

                    camera.position.x = new_position_x;

                    camera.updateMatrix();
                    camera.updateMatrixWorld();

                    var frustum = new THREE.Frustum();
                    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  

                    var node = decorations.floor;

                    var geometry = node.geometry;

                    var bMove = true;

                    if ( geometry.isGeometry ) {

                        var vertices = geometry.vertices;

                        var pos = new THREE.Vector3();

                        for ( var vI = 0; vI < vertices.length; vI++ ) {

                            pos.copy( vertices[ vI ] );
                            pos.applyMatrix4( node.matrixWorld );

                            if (frustum.containsPoint(pos)) {
                                bMove = false;
                                break;
                            }
                        }
                    }
                    else 
                        bMove = false;

                    camera.updateMatrix();
                    camera.updateMatrixWorld();

                    camera.position.x = last_x;

                    if ( bMove ) {

                        camera.tween = new TWEEN.Tween(camera.position)
                        .to({ x : new_position_x }, 1500) 
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .onComplete(function(){
                            camera.sectionData.position.x = camera.position.x;
                            delete camera.tween;
                            if (!jsdetector.mobile)
                                moveCameraParallax(mouse, false);
                        })
                        .start();
                    }
                }
            }
        }
    };

    var moveCameraParallax = function (mouse, bForce){

        var vector = new THREE.Vector3(0, 0, 1);
        vector.x = ((rect.width / 100.0 - rect.left) / rect.width) * 2 - 1;
        vector.y = -((0.0 - rect.top) / rect.height) * 2 + 1;
        vector.unproject(camera);

        var zero_vector = new THREE.Vector3(0, 0, 1);
        zero_vector.x = ((0.0 - rect.left) / rect.width) * 2 - 1;
        zero_vector.y = -((0.0 - rect.top) / rect.height) * 2 + 1;
        zero_vector.unproject(camera);

        var x = vector.x - zero_vector.x;

        var value = camera.sectionData.position.x + x * (mouse.x - rect.left - rect.width / 2) / rect.width;

        if (bForce){

            camera.position.x = value;
        }
        else {

            camera.tween = new TWEEN.Tween(camera.position)
            .to({ x : value }, 200) 
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(function(){
                delete camera.tween;
            })
            .start();
        }
    };

    var render = function (timeStamp) {

        var timeElapsed = lastTimeStamp ? timeStamp - lastTimeStamp : 0;

        lastTimeStamp = timeStamp;

        timeElapsed = timeElapsed / 1000.0;

        moveCamera();

        for (var i = 0; i < spineAnimations.length; i++) {

            spineAnimations[i].update(timeElapsed);
        }

        mover.update();

        quip.update();

        var time_now = ((Room.dayStart + Date.now()) % Room.dayLength) / Room.dayLength; // 0..1

        if (roomData.ceiling) {
            time_now = 0.25;
        }

        DayNightMaterial.setTime(time_now);
        DayNightMaterial2.setTime(time_now);
        decorations.setTime(time_now);

        doors.animate();

        clouds.move(timeElapsed);

        renderCall();

        if (doors.check(userId, doorCallback))
            requestAnimationFrame(render);

        TWEEN.update(timeStamp);
    };
    requestAnimationFrame(render);

    var mouseEventToPoint = function (event, everything) {

        var c = mobile.eventXY(event);

        var vector = new THREE.Vector3(0, 0, 1);
        vector.x = ((c.x - rect.left) / rect.width) * 2 - 1;
        vector.y = -((c.y - rect.top) / rect.height) * 2 + 1;

        vector.unproject(camera);

        var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        return ray.intersectObject(everything ? scene : decorations.floor, everything);
    };

    var click = function (event) {

        if (mover.object || activePreviewObject){
            return;
        }

        var intersections = mouseEventToPoint(event, true);

        for ( var i = 0; i < intersections.length; i++) {

            if (intersections[i].object && intersections[i].object.getParentObject)
            {
                var object = intersections[i].object.getParentObject();

                if (doors.indexOf(object) > -1) { // user clicked the door - walk to it

                    var target = object.position.clone();
                    target.z -= 0.1;

                    socket.emit(Events.MOVE_OBJECT, { id: userId, point: target });
                    return;
                }
            }
        }

        intersections = mouseEventToPoint(event);

        if (intersections.length > 0) {
            socket.emit(Events.MOVE_OBJECT, { id: userId, point: intersections[0].point });
        }
    };

    var mousemove = function (event) {

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        if ( roomData && !camera.tween ){

            moveCameraParallax(mouse, true);
        }
    };
    canvas.addEventListener('mousemove', mousemove, false);

    var mouseover = function (event) {

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        if ( roomData && !camera.tween ){

            moveCameraParallax(mouse, false);
        }
    };
    canvas.addEventListener('mouseover', mouseover, false);

    var createObjectCallbacks = {};

    var removeObject = function (data) {
        //console.log('Removing:', data);
        var object = scene.getObjectByProperty("_id", data.id);

        if (object) {

            scene.remove(object);

            // this might be the door
            var index = doors.indexOf(object);
            if (index > -1) {
                doors.splice(index, 1);
            }

            // this might be the cloud
            index = clouds.indexOf(object);
            if (index > -1) {
                clouds.splice(index, 1);
            }

            // this might be spine animation
            index = spineAnimations.indexOf(object);
            if (index > -1) {
                spineAnimations.splice(index, 1);

                if (object.isAvatarObject3D)
                    playSound('soundLeave');
            }

            object.traverse(function (child) {
                if (child.parent) {
                    child.parent.remove(child);
                    child.parent = undefined;
                }
                if (child.material && child.material.dispose) {
                    child.material.dispose();
                }
                if (child.geometry && child.geometry.dispose) {
                    child.geometry.dispose();
                }
            });
        }
    };

    socket.on(Events.CREATE_OBJECT, 
        function (data) {
            // try to remove object first
            removeObject(data);

            if (data.avatar) 
            {
                var path = data.avatar;
                var name = path.replace(/^.*[\\\/]/, '');
                path = window.params.s3_bucket + path.replace(new RegExp(name + '$'), '');

                var avatar = new AvatarObject3D(path, name);

                if (data.point && data.id !== userId) {

                    avatar.position.copy(data.point);

                } else {

                    avatar.position.set(0, -0.5 * AH , -42);

                    if (userId === data.id) {
                        // change own position
                        socket.emit(Events.MOVE_OBJECT, {
                            id: userId,
                            instant: true,
                            point: avatar.position
                        });
                    }
                }

                avatar._id = data.id;

                avatar.onLoad = function(){
                    avatar.getMaterial = function(){ return null; };
                    avatar.getParentObject = function(){ return null; };
                };

                avatar.load();

                spineAnimations.push(avatar);

                scene.add(avatar);

                if (data.id == userId) {
                    userAvatar = avatar;
                }

                playSound('soundJoin');
            }
            else
            {
                var imageUrl = objectUrl(data.objectId, data.block);

                var object;

                if (config.animations && (config.animations.indexOf(data.objectId) > -1))
                {
                    // object is marked as animated - hack spine animation in
                    var m = /^(.*\/)(\d+)\.png$/.exec(imageUrl);

                    object = new SpineAnimation(m[2], m[1], 0.03);

                    object.playAnimation = true;

                    object.load();

                    object._id = data.id;

                    object.position.copy(data.point);

                    spineAnimations.push(object);

                    scene.add(object);
                } 
                else
                {
                    object = new THREE.Object3D();
                    object._id = data.id;
                    object.position.copy(data.point);
                    scene.add(object);

                    var image = new Image();

                    image.crossOrigin = "anonymous";

                    // crossOrigin = crossOrigin ? crossOrigin : 'anonymous';

                    image.onload = function () {

                        var texture = new THREE.Texture(image);
                        texture.needsUpdate = true;

                        var s = 0.1 * (roomData.objectScale || 1);

                        var w = s * image.width;
                        var h = s * (data.block ? config.blocksize : image.height);

                        // see if the texture is actually horizontal spritesheet
                        var spritesheetInfo = config.spritesheets[data.objectId];
                        if (spritesheetInfo) {
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.repeat.set(1.0 / spritesheetInfo, 1.0);
                            w /= spritesheetInfo;
                        }

                        var mesh = new THREE.Mesh(data.block ? new THREE.BoxGeometry(h, h, h) : new THREE.PlaneGeometry(w, h), new DayNightMaterial2(texture));
                        mesh.position.y = h / 2;

                        if (data.block) 
                        {
                            // snap blocks to the 'grid'
                            object.position.x = h * Math.round(object.position.x / h);
                            object.position.z = h * Math.round(object.position.z / h);

                            // save snapping info for moving the object later
                            object.snapping = { h: h, y: object.position.y };
                        }

                        var bCloud = false;
                        if (config.clouds && (
                            (config.clouds.indexOf(data.objectId) > -1) ||
                            (config.clouds.indexOf('default/' + data.objectId) > -1)
                            )) 
                        {
                            clouds.push(object);
                        }

                        // see if the object has any lights attached to it
                        var lightsInfo = config.lights[data.objectId];
                        if (lightsInfo) {
                            for (var i = 0; i < lightsInfo.length; i++) {
                                var light = null;
                                switch (lightsInfo[i].type) {
                                    case "point":
                                    light = new THREE.PointLight(parseInt(lightsInfo[i].color, 16), lightsInfo[i].intensity, lightsInfo[i].r);
                                    light.position.x = +w * (lightsInfo[i].u - 0.5);
                                    light.position.y = -h * (lightsInfo[i].v - 0.5);
                                    light.position.z = +1e-4;
                                    break;
                                }
                                if (light) {
                                    object.add(light);
                                    console.log("added light:", light);
                                    light.add(new THREE.Mesh(new THREE.SphereGeometry(light.distance || 1), new THREE.MeshBasicMaterial({ wireframe: true, color: 'blue' })));
                                }
                            }
                        }

                        mesh._id = data.id;

                        object.getMaterial = function(){
                            return mesh.material;
                        };

                        object.getParentObject = function(){
                            var r = bCloud ? null : object;
                            return r;
                        };

                        mesh.getMaterial = function(){
                            return mesh.material;
                        };

                        mesh.getParentObject = function(){
                            var r = bCloud ? null : object;
                            return r;
                        };

                        object.add(mesh);
                    };

                    image.src = imageUrl;
                }
            }

            var callback = createObjectCallbacks[data.timeStamp];
            if (callback) 
            {
                callback(data.id);
                delete createObjectCallbacks[data.timeStamp];
            }
        }
    );

    socket.on(Events.CHANGE_CLOTHES, function (data) {

        var avatar = scene.getObjectByProperty("_id", data.id);
        if (!avatar) {
            console.log("avatar " + data.id + " not found");
            return;
        }
        avatar.addClothesToApply(data.clothes);
    });

    socket.on(Events.CHANGE_COLOR, function (data) {
        var avatar = scene.getObjectByProperty("_id", data.id);
        if (!avatar) {
            console.log("avatar " + data.id + " not found");
            return;
        } else if (!avatar.changeColor) {
            console.log("wrong object " + data.id + " found instead of avatar");
            return;
        }

        avatar.changeColor(data.clothingSlot, data.color);
    });

    socket.on(Events.MAKE_DOOR, function (data) {
            //console.log('Making door:', data);
            var object = scene.getObjectByProperty("_id", data.id);
            if (object) {
                object.destinationId = data.destinationId;
                doors.push(object);
            }
        }
    );

    socket.on(Events.MOVE_OBJECT, function (data) {

        var object = scene.getObjectByProperty("_id", data.id);

        if (object) {

            $(object.position).stop();

            if (object.snapping) {
                    // hack: modify data.point in place
                    data.point.x = object.snapping.h * Math.round(data.point.x / object.snapping.h);
                    data.point.z = object.snapping.h * Math.round(data.point.z / object.snapping.h);
                    data.point.y = object.snapping.h * Math.round((data.point.y - object.snapping.y) / object.snapping.h) + object.snapping.y;
                }

                var distance = object.position.clone().sub(data.point).length();
                var options = { duration: 1 };

                if (!data.instant) {

                    options.duration = 21 * distance;

                    if (object.isSpineAnimation) {

                        // if flipX == false - looking left; else right
                        if (object.skeleton)
                            object.skeleton.flipX = (object.position.x - data.point.x) < 0;
                    }

                    options.progress = function (lol, progress) {

                        if (object.isSpineAnimation)
                            object.setAnimation(GlobalAnimationNames.walk);
                    };

                    options.always = function () { // at the end

                        if (object.isSpineAnimation)
                            object.setAnimation(GlobalAnimationNames.idle);
                    };
                }

                object.destinationMovePosition = {
                    x : data.point.x,
                    y : data.point.y,
                    z : data.point.z
                };

                $(object.position).animate(data.point, options);
            }
        }
    );

    socket.on(Events.REMOVE_OBJECT, removeObject);

    socket.on(Events.EXPRESSION, 
        function (data) {
            //console.log('Expression:', data);
            var object = scene.getObjectByProperty("_id", data.id);
            if (object && object.setExpression) {
                object.setExpression(data.expression);
            }
        }
    );
}
