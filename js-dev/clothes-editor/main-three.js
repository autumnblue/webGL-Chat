let scene, skeletonMesh, renderer, camera, assetManager, mesh,
lastFrameTime = Date.now() / 1000;

function init() {
    let canvas = $("canvas"),
        width = window.innerWidth, height = window.innerHeight;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({canvas: canvas[0]});
    camera = new THREE.PerspectiveCamera(75, width / height, 1, 3000);
    assetManager = new spine.threejs.AssetManager();

    canvas.width = width;
    canvas.height = height;
    renderer.setSize(width, height);
    camera.position.y = 100;
    camera.position.z = 400;

    //TODO: request from server
    let avatars = ["Male1", "Female2"];
    let path = "/assets/avatars/";

    for (let i = 0; i < avatars.length; ++i) {
        let avatarPath = path + avatars[i] + "/" + avatars[i];
        assetManager.loadText(avatarPath + ".json");
        assetManager.loadText(avatarPath + ".atlas");
        assetManager.loadTexture(avatarPath + ".png");
    }

    canvas.click(function(event) {
        console.log(event.clientX);

        let vector = new THREE.Vector3();
        vector.x = (event.clientX / width) * 2 - 1;
        vector.y = -(event.clientY / height) * 2 + 1;

        vector.unproject(camera);

        let ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        let intersections = ray.intersectObject(scene, true);
        for (let i = 0; i < intersections.length; i++) {
            console.log(intersections[i]);
        }
    });
    
    requestAnimationFrame(load);

    function load() {
        if (assetManager.isLoadingComplete()) {
            let skeletonData = loadSkeleton("Male1", 0.2);

            skeletonMesh = new spine.threejs.SkeletonMesh(skeletonData);
            //skeletonMesh.state.setAnimation(0, "M1_T_Walk_Loop1", true);

            skeletonMesh.skeleton.setSkinByName("M1_T_SP_Clothes1");
            skeletonMesh.skeleton.setToSetupPose();
            scene.add(skeletonMesh);
            requestAnimationFrame(render);
        } else requestAnimationFrame(load);
    }

    function loadSkeleton (name, scale) {
        let atlas = new spine.TextureAtlas(assetManager.get(path + name + "/" + name + ".atlas"), function(localPath) {
            console.log(localPath);
            console.log(path + name + "/" + localPath);
            return assetManager.get(path + name + "/" + localPath);
        }),

        atlasLoader = new spine.AtlasAttachmentLoader(atlas);

        let skeletonJson = new spine.SkeletonJson(atlasLoader);

        skeletonJson.scale = scale;
        console.log(name);
        return skeletonJson.readSkeletonData(assetManager.get(path + name + "/" + name + ".json"));
    }
}

function render() {
    let now = Date.now() / 1000;
    let delta = now - lastFrameTime;
    lastFrameTime = now;

    skeletonMesh.update(delta);

    renderer.render(scene, camera);

    requestAnimationFrame(render);
}

$(document).ready(init);