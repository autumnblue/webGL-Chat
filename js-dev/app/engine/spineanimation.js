//
//
//

var SpineAnimation = function (in_name, in_path, scale) {

    "use strict";

    THREE.Object3D.call (this);

    var self = this;

    self.name = in_name;
    self.path = in_path;

    self.state = null;

    self.playAnimation = true;

    self.getMaterial = function (){
        return null; // will be updated in the loadCheck
    };

    self.getParentObject = function(){
        return self;
    };

    self.atlas = null;

    self.customData = null; // .data json file

    self.load = function(){

        if (assetManager)
            return;

        assetManager = new spine.threejs.AssetManager();

        var numToLoad = 0;

        var canvas = document.createElement("canvas");
        var context = canvas.getContext('2d');
        canvas.id = "atlas";
        self.canvas = canvas;

        var  xmlhttp = new XMLHttpRequest();

        xmlhttp.open("GET", self.path + self.name + ".spine", true);

        xmlhttp.responseType = "blob";

        function xmlhttp_reader(zipped_spine_file) {

            var zipReader = zip.createReader( 

                new zip.BlobReader(zipped_spine_file),

                function(reader) {

                    reader.getEntries( function(entries) {

                        numToLoad = entries.length;

                        entries.forEach(function(currentValue, index, array) {

                            var path = self.path;

                            var filename = currentValue.filename;

                            if (/\.json$/.test(filename))
                                currentValue.getData(
                                    new zip.TextWriter(),
                                    function(data){
                                        assetManager.assets[path + filename] = JSON.parse(data);
                                        numToLoad--;
                                        if (numToLoad === 0)
                                            loadCheck(true);
                                    },
                                    null // onprogress callback
                                );
                            else if ( /\.atlas$/.test(filename) )
                                currentValue.getData(
                                    new zip.TextWriter(),
                                    function(data){
                                        assetManager.assets[path + filename] = data;
                                        numToLoad--;
                                        if (numToLoad === 0)
                                            loadCheck(true);
                                    },
                                    null // onprogress callback
                                );
                            else if (/\.data$/.test(filename))
                                currentValue.getData(
                                    new zip.TextWriter(),
                                    function(data){
                                        assetManager.assets[path + filename] = JSON.parse(data);
                                        self.customData = JSON.parse(data);
                                        numToLoad--;
                                        if (numToLoad === 0)
                                            loadCheck(true);
                                    },
                                    null // onprogress callback
                                );
                            else if (/\.png$/.test(filename))
                                currentValue.getData(
                                    new zip.BlobWriter(),
                                    function(data){
                                        var url = window.URL || window.webkitURL;
                                        var img = document.createElement("IMG");
                                        img.onload = function(){
                                            canvas.height = img.height;
                                            canvas.width = img.width;
                                            context.drawImage(img, 0, 0);
                                            var img_dataURL = canvas.toDataURL();
                                            assetManager.loadTexture(img_dataURL, function(){
                                                numToLoad--;
                                                if (numToLoad === 0)
                                                    loadCheck(true);
                                            });
                                        };
                                        img.src = url.createObjectURL(data);
                                    },
                                    null // onprogress callback
                                );
                        });
                    });
                },
                function(error) {
                    // onerror callback
                }
            );
        }

        xmlhttp.onreadystatechange=function(){
            try {
                if (xmlhttp.readyState==4 && xmlhttp.status==200)
                    xmlhttp_reader(xmlhttp.response);
            }
            catch(expt) {
                console.log(expt);
            }
        };

        xmlhttp.send();
    };

    self.update = function (delta) {

        if (!self.state && self.playAnimation)
            return;

        skeletonMesh.update(delta);
    };

    self.setAnimation = function(){};

    var assetManager, loadCheckInterval = 0;
    var skeletonMesh;
    var zipReader;

    function loadCheck (bForce) {

        if (bForce || assetManager.isLoadingComplete()) {

            var a = zipReader;

            var atlas = self.atlas = new spine.TextureAtlas(assetManager.get(self.path + self.name + ".atlas"), function(texture_atlas_name) {
                return assetManager.get("ugly hack");
            });

            var skeletonData = loadSkeleton(self.name);

            // Create a SkeletonMesh from the data and attach it to the scene
            skeletonMesh = new spine.threejs.SkeletonMesh(skeletonData);

            // support lights
            var material = skeletonMesh.material = new DayNightMaterial2();
            material.side = THREE.DoubleSide;
            material.transparent = true;
            material.alphaTest = 0.5;
            material.needUpdate = true;

            self.getMaterial = function (){
                return material;
            };

            skeletonMesh.getParentObject = function(){
                return self;
            };

            if (skeletonData.animations && skeletonData.animations.length){

                skeletonMesh.state.setAnimation(0, skeletonData.animations[0].name, true);
            }

            self.state = skeletonMesh.state;

            self.scale.set(scale, scale, scale);

            self.add(skeletonMesh);

            clearInterval(loadCheckInterval);
            loadCheckInterval = 0;
        }
    }
    function loadSkeleton (name) {

        var atlas = self.atlas;

        var atlasLoader = new spine.AtlasAttachmentLoader(atlas);

        var skeletonJson = new spine.SkeletonJson(atlasLoader);

        skeletonJson.scale = 1.0;

        var skeletonData = skeletonJson.readSkeletonData(assetManager.get(self.path + self.name + ".json"));

        return skeletonData;
    }
};

SpineAnimation.prototype = Object.create (THREE.Object3D.prototype);
SpineAnimation.prototype.constructor = SpineAnimation;

SpineAnimation.prototype.isSpineAnimation = true;


// Utility to create avatar 3D object out of spritesheet
// path - path to Spine
var AvatarObject3D = function (path, name, scale) {
    "use strict";

    SpineAnimation.call (this);

    var self = this;

    self.name = name;
    self.path = path;

    self.customData = null; // .data json file

    self.state = null;
    self.skeleton = null;

    self.playAnimation = true;

    self.clothesToApply = [];
    self.colorsToApply = [];

    self.grayscales = {};

    self.getMaterial = function (){
        return null; // will be updated in the loadCheck
    };

    self.getParentObject = function(){
        return self;
    };

    self.onLoad = function(){};

        self.load = function(){

        if (assetManager)
            return;

        assetManager = new spine.threejs.AssetManager();

        var numToLoad = 0;

        var canvas = document.createElement("canvas");
        var context = canvas.getContext('2d');
        canvas.id = "atlas";
        self.canvas = canvas;

        var  xmlhttp = new XMLHttpRequest();

        xmlhttp.open("GET", self.path + self.name + ".spine", true);

        xmlhttp.responseType = "blob";

        function xmlhttp_reader(zipped_spine_file) {

            var zipReader = zip.createReader( 

                new zip.BlobReader(zipped_spine_file),

                function(reader) {

                    reader.getEntries( function(entries) {

                        numToLoad = entries.length;

                        entries.forEach(function(currentValue, index, array) {

                            var path = self.path;

                            var filename = currentValue.filename;

                            if (/\.json$/.test(filename))
                                currentValue.getData(
                                    new zip.TextWriter(),
                                    function(data){
                                        assetManager.assets[path + filename] = JSON.parse(data);
                                        numToLoad--;
                                        if (numToLoad === 0)
                                            loadCheck(true);
                                    },
                                    null // onprogress callback
                                );
                            else if ( /\.atlas$/.test(filename) )
                                currentValue.getData(
                                    new zip.TextWriter(),
                                    function(data){
                                        assetManager.assets[path + filename] = data;
                                        numToLoad--;
                                        if (numToLoad === 0)
                                            loadCheck(true);
                                    },
                                    null // onprogress callback
                                );
                            else if (/\.data$/.test(filename))
                                currentValue.getData(
                                    new zip.TextWriter(),
                                    function(data){
                                        assetManager.assets[path + filename] = JSON.parse(data);
                                        self.customData = JSON.parse(data);
                                        numToLoad--;
                                        if (numToLoad === 0)
                                            loadCheck(true);
                                    },
                                    null // onprogress callback
                                );
                            else if (/\.png$/.test(filename))
                                currentValue.getData(
                                    new zip.BlobWriter(),
                                    function(data){
                                        var url = window.URL || window.webkitURL;
                                        var img = document.createElement("IMG");
                                        img.onload = function(){
                                            canvas.height = img.height;
                                            canvas.width = img.width;
                                            context.drawImage(img, 0, 0);
                                            var img_dataURL = canvas.toDataURL();
                                            assetManager.loadTexture(img_dataURL, function(){
                                                numToLoad--;
                                                if (numToLoad === 0)
                                                    loadCheck(true);
                                            });
                                        };
                                        img.src = url.createObjectURL(data);
                                    },
                                    null // onprogress callback
                                );
                        });
                    });
                },
                function(error) {
                    // onerror callback
                }
            );
        }

        xmlhttp.onreadystatechange=function(){
            try {
                if (xmlhttp.readyState==4 && xmlhttp.status==200)
                    xmlhttp_reader(xmlhttp.response);
            }
            catch(expt) {
                console.log(expt);
            }
        };

        xmlhttp.send();
    };

    self.update = function (delta) {
        self.updateClothes();
        self.updateColors();

        if (!self.state || !self.playAnimation || !skeletonMesh)
            return;

        skeletonMesh.update(delta);
    };

    self.setExpression = function (expression) {
        // in case setExpression is called before texture is loaded...
        //object.expression = expression;
        //if (faceTextureImages[expression]) {
        //  faceTexture.image = faceTextureImages[expression];
        //  faceTexture.needsUpdate = true;
        //}
        console.log("object.setExpression TODO ... ");
    };

    self.setAnimation = function (globalAnimationName) {

        if (!self.state || !self.playAnimation || !skeletonMesh || !self.customData)
            return;

        if (!self.customData.animations)
            return;

        if (currentGlobalAnimation === globalAnimationName)
            return;

        currentGlobalAnimation = globalAnimationName;

        skeletonMesh.state.setAnimation(0, self.customData.animations[globalAnimationName], true);
    };

    self.applyClothingItem = function (item) {
        var sourceSkin = self.skeletonMesh.skeleton.data.skins[item.skinNumber];
        var attachments = self.skeletonMesh.skeleton.data.findSkin(self.defaultSkin).attachments;

        if (this.clothes[item.clothingSlot]) {
            var previousAttachmentIndexes = this.clothes[item.clothingSlot].attachmentIndexes;
            outer:
            for (let i = 0; i < previousAttachmentIndexes.length; ++i) {
                for (let j = 0; j < item.parts.length; ++j) {
                    if (item.parts[j].attachmentIndex === previousAttachmentIndexes[i])
                        continue outer;
                }
                delete attachments[previousAttachmentIndexes[i]];
            }
        } else {
            this.clothes[item.clothingSlot] = {};
        }
        this.clothes[item.clothingSlot].attachmentIndexes = [];
        this.clothes[item.clothingSlot].atlasPaths = [];
        
        for (let i = 0; i < item.parts.length; ++i) {
            let part = item.parts[i];
            let index = part.attachmentIndex;

            if (!attachments[index]) {
                attachments[index] = {};
            }
            attachments[index][part.name] =
                sourceSkin.getAttachment(index, part.name);

            if (item.color.length) {
                self.colorsToApply.push({atlasPath: part.atlasPath, color: item.color});
            }

            this.clothes[item.clothingSlot].attachmentIndexes.push(part.attachmentIndex);
            this.clothes[item.clothingSlot].atlasPaths.push(part.atlasPath);
        }

        self.skeletonMesh.skeleton.setSkinByName(self.defaultSkin);
        self.skeletonMesh.skeleton.setSlotsToSetupPose();
    };

    self.changeColor = function (slot, color) {
        if (!this.clothes) return;

        var atlasPaths = this.clothes[slot].atlasPaths;

        if (!atlasPaths) return;

        for (var i = 0; i < atlasPaths.length; ++i) {
            self.colorsToApply.push({atlasPath: atlasPaths[i], color: color});
        }
    };

    self.applyClothes = function (clothesArray) {
        for (var i = 0; i < clothesArray.length; ++i) {
            self.applyClothingItem(clothesArray[i]);
        }
    };

    self.updateClothes = function () {
        if (self.clothes && self.skeletonMesh  && self.clothesToApply.length) {
            self.applyClothes(self.clothesToApply);
            self.clothesToApply = [];
        }
    };

    var assetManager;

    self.updateColors = function () {
        if (assetManager && assetManager.isLoadingComplete() && self.clothes && self.colorsToApply.length) {
            for (var i = 0; i < self.colorsToApply.length; ++i) {
                self.applyGradientMapToRegion(self.colorsToApply[i].color, self.colorsToApply[i].atlasPath);
            }
            self.colorsToApply = [];
        }
    };

    self.addClothesToApply = function(clothesToApply) {
        self.clothesToApply = self.clothesToApply.concat(clothesToApply);
    };

    self.applyGradientMapToRegion = function (gradientMap, regionName) {
        var regionCanvas = document.createElement("canvas");
        var ctx = self.canvas.getContext("2d");

        var regionGrayScaleData, width, height, x, y;

        if (self.grayscales[regionName]) {
            var grayscaleData = self.grayscales[regionName];
            regionGrayScaleData = grayscaleData.data;
            width = grayscaleData.width;
            height = grayscaleData.height;
            x = grayscaleData.x;
            y = grayscaleData.y;
        } else {
            var region = self.atlas.findRegion(regionName);

            width = region.rotate ? region.height : region.width;
            height = region.rotate ? region.width : region.height;
            x = region.x;
            y = region.y;

            regionGrayScaleData = ctx.getImageData(x, y, width, height);

            self.grayscales[regionName] = {
                data: regionGrayScaleData,
                width: width,
                height: height,
                x: x,
                y: y
            };
        }

        regionCanvas.width = width;
        regionCanvas.height = height;

        var regionCtx = regionCanvas.getContext("2d");
        regionCtx.putImageData(regionGrayScaleData, 0, 0);

        var img = $('<img style="display: none">');

        img.appendTo('body');
        img.one("load", function() {
            img.duotone({
                gradientMap: gradientMap
            });

            var interval = setInterval(function () {
                if (img.hasClass('processed')) {

                    regionCtx.drawImage(img[0], 0, 0);

                    regionCanvas.getContext('2d');

                    ctx.putImageData(regionCtx.getImageData(0, 0, width, height), x, y);
                    assetManager.get("ugly hack")._image.src = self.canvas.toDataURL();

                    img.remove();
                    assetManager.get("ugly hack")._image.onload = function () {
                        assetManager.get("ugly hack").texture.needsUpdate = true;
                    };

                    clearInterval(interval);
                }
            }, 100);
        }).attr('src', regionCanvas.toDataURL());
    };

    var loadCheckInterval = 0;
    var skeletonMesh, currentGlobalAnimation;

    function loadCheck (bForce) {

        if (bForce || assetManager.isLoadingComplete()) {

            var scale = self.customData.scale;

            self.defaultSkin = self.customData.defaultSkin;
            self.clothes = self.customData.defaultClothing;

            self.atlas = new spine.TextureAtlas(assetManager.get(path + name + ".atlas"), function(texture_atlas_name) {
                return assetManager.get("ugly hack");
            });
            var skeletonData = loadSkeleton(name);

            skeletonMesh = new spine.threejs.SkeletonMesh(skeletonData);

            var material = skeletonMesh.material = new DayNightMaterial2();
            material.side = THREE.DoubleSide;
            material.transparent = true;
            material.alphaTest = 0.5;
            material.needUpdate = true;

            self.getMaterial = function (){
                return material;
            };

            skeletonMesh.getParentObject = function(){
                return self;
            };

            self.state = skeletonMesh.state;
            self.skeleton = skeletonMesh.skeleton;
            self.skeletonMesh = skeletonMesh;

            self.skeletonMesh.skeleton.setSkinByName(self.defaultSkin);
            self.skeletonMesh.skeleton.setToSetupPose();
            if (skeletonData.animations && skeletonData.animations.length){

                self.setAnimation(GlobalAnimationNames.idle);
            }

            self.scale.set(scale, scale, scale);

            self.add(skeletonMesh);

            clearInterval(loadCheckInterval);
            loadCheckInterval = 0;

            //self.applyGradientMapToRegion("black 0%, green 100%", "F2_Cloth2_RGB1/F2_T_Cloth1_Skirt");

            self.onLoad();
        }
    }

    function loadSkeleton (name, scale) {

        var atlas = new spine.TextureAtlas(assetManager.get(path + name + ".atlas"), function(texture_atlas_name) {
            return assetManager.get("ugly hack");
        });

        var atlasLoader = new spine.AtlasAttachmentLoader(atlas);

        var skeletonJson = new spine.SkeletonJson(atlasLoader);

        skeletonJson.scale = 1.0;

        var skeletonData = skeletonJson.readSkeletonData(assetManager.get(path + name + ".json"));

        return skeletonData;
    }
};

AvatarObject3D.prototype = Object.create (SpineAnimation.prototype);
AvatarObject3D.prototype.constructor = AvatarObject3D;

AvatarObject3D.prototype.isAvatarObject3D = true;
AvatarObject3D.prototype.isSpineAnimation = true;