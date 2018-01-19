"use strict";

class AvatarData {
    constructor(avatar, avatarHome) {
        this.skinNames = [];
        let skins = avatar.skeleton.data.skins;
        for (let skin of skins) {
            this.skinNames.push(skin.name);
        }

        this.avatar = avatar;
        this.avatarHome = avatarHome;
    }
}

class AvatarViewPixi {
    constructor(width, height, avatars, defaultAvatar, skins, onLoadCallback) {
        this.avatarNames = avatars;
        this.defaultAvatar = defaultAvatar;
        this.skins = skins;
        this.currentAvatar = defaultAvatar;
        this.avatarData = new Map();
        this.currentClothingItem = new ClothingItem();

        this.app = new PIXI.Application();
        document.body.appendChild(this.app.view);

        this.app.stop();

        let path = "/assets/avatars/";

        for (let i = 0; i < avatars.length; ++i) {
            PIXI.loader.add(avatars[i], path + avatars[i] + "/" + avatars[i] + ".json");
        }

        PIXI.loader.load((loader, res)=>{
            this.onAssetsLoaded(loader, res);
            onLoadCallback();
        });
    }

    onAssetsLoaded(loader, res) {
        for (let i = 0; i < this.avatarNames.length; ++i) {
            let avatar = new PIXI.spine.Spine(res[this.avatarNames[i]].spineData);

            avatar.skeleton.setSkinByName(this.skins[i]);
            avatar.skeleton.setToSetupPose();

            //avatar.state.setAnimation(0, "M1_T_Walk_Loop1", true);
            avatar.update(0);
            avatar.autoUpdate = false;

            let avatarHome = new PIXI.Container();
            avatarHome.addChild(avatar);

            let localRect = avatar.getLocalBounds();
            avatar.position.set(-localRect.x, -localRect.y);

            let scale = Math.min(
                (this.app.screen.width * 0.7) / avatarHome.width,
                (this.app.screen.height * 0.7) / avatarHome.height
            );
            avatarHome.scale.set(scale, scale);
            avatarHome.position.set(
                (this.app.screen.width - avatarHome.width) * 0.5,
                (this.app.screen.height - avatarHome.height) * 0.5
            );

            this.app.stage.addChild(avatarHome);

            for (let j = 0; j < avatar.children.length; ++j) {
                avatar.children[j].interactive = true;
                avatar.children[j].buttonMode = true;

                let sprite = avatar.children[j].children[0];
                avatar.children[j].on('pointerdown', ()=> {
                    AvatarViewPixi.highlightSprite(sprite);
                    console.log(avatar);
                    console.log(this.findAttachmentNumber(this.avatarNames[i],
                        avatar.skeleton.skin.name, sprite.region.name));
                });
            }

            avatarHome.visible = false;
            this.avatarData.set(this.avatarNames[i], new AvatarData(avatar, avatarHome));
        }

        this.switchAvatar(this.defaultAvatar);
        this.app.start();
    }

    static highlightSprite(sprite) {
        if (!sprite.isTinted) {
            sprite.tint = 0xFF0000;
            sprite.isTinted = true;
        } else {
            sprite.tint = 0xFFFFFF;
            sprite.isTinted = false;
        }
    }

    selectSprite(sprite) {
        if (!sprite.isTinted) {
            let regionName = sprite.region.name;
            this.currentAvatar.addAttachment(
                AvatarViewPixi.transformRegionNameToAttachmentName(regionName),
                regionName, this.findAttachmentNumber());
        } else {
        }
    }

    switchAvatar(name) {
        this.avatarData.get(this.currentAvatar).avatarHome.visible = false;
        this.avatarData.get(name).avatarHome.visible = true;
        this.currentAvatar = name;
    }

    getSkinNames(name) {
        return this.avatarData.get(name).skinNames;
    }

    setSkin(name) {
        let avatar = this.avatarData.get(this.currentAvatar).avatar;
        let skeleton = avatar.skeleton;
        skeleton.setSkinByName(name);
        skeleton.setToSetupPose();
        avatar.update();
    }

    /***
     * Translates region name to corresponding attachment name
     * based on naming convention proposed by the animator
     *
     * @param regionName
     * @return {string}
     */
    static transformRegionNameToAttachmentName(regionName) {
        return regionName.split('/')[1].replace('_T_', '_T_SP_');
    }

    findSkinNumber(avatarName, skinName) {
        let skins = this.avatarData.get(avatarName).avatar.skeleton.data.skins;

        for (let i = 0; i < skins.length; ++i) {
            if (skins[i].name === skinName)
                return i;
        }
    }

    findAttachmentNumber(avatarName, skinName, regionName) {

        let attachmentName = AvatarViewPixi.transformRegionNameToAttachmentName(regionName);

        let attachments = this.avatarData.get(avatarName).avatar
            .skeleton.data.findSkin(skinName).attachments;

        for (let i = 0; i < attachments.length; ++i) {
            if (attachments[i] && attachments[i][attachmentName]) {
                return i;
            }
        }
    }
}

class AvatarKeeperThree {
    constructor(avatars, skins) {
        this.avatars = new Map();

        let path = "/assets/avatars/",
            assetManager = new spine.threejs.AssetManager();

        for (let i = 0; i < avatars.length; ++i) {
            let avatarPath = path + avatars[i] + "/" + avatars[i];
            assetManager.loadText(avatarPath + ".json");
            assetManager.loadText(avatarPath + ".atlas");
            assetManager.loadTexture(avatarPath + ".png");
        }

        requestAnimationFrame(load);

        let self = this;
        function load() {
            if (assetManager.isLoadingComplete()) {
                for (let i = 0; i < avatars.length; ++ i) {
                    let skeletonData = loadSkeleton(avatars[i], 0.2);

                    let skeletonMesh = new spine.threejs.SkeletonMesh(skeletonData);
                    //skeletonMesh.state.setAnimation(0, "M1_T_Walk_Loop1", true);

                    skeletonMesh.skeleton.setSkinByName(skins[i]);
                    skeletonMesh.skeleton.setToSetupPose();

                    self.avatars.set(avatars[i], skeletonMesh);
                }
            } else requestAnimationFrame(load);
        }

        function loadSkeleton (name, scale) {
            let atlas = new spine.TextureAtlas(assetManager.get(path + name + "/" + name + ".atlas"), function(localPath) {
                    return assetManager.get(path + name + "/" + localPath);
                }),

                atlasLoader = new spine.AtlasAttachmentLoader(atlas);

            let skeletonJson = new spine.SkeletonJson(atlasLoader);

            skeletonJson.scale = scale;
            return skeletonJson.readSkeletonData(assetManager.get(path + name + "/" + name + ".json"));
        }
    }
}

class UI {
    constructor(avatars, defaultAvatar, pixiView) {
        this.avatarUIs = new Map();
        this.menu = $("#avatar-menu");

        for (let name of avatars) {
            let wrap = $("<div></div>");
            let select = $('<select class="form-control" id="skin"></select>');
            let skins = pixiView.getSkinNames(name);
            for (let skin of skins) {
                select.append($("<option>" + skin + "</option>"));
            }

            select.on("change", function () {
                pixiView.setSkin($(this).val());
            });
            wrap.append(select);
            this.menu.append(wrap);
            this.avatarUIs.set(name, wrap);
            wrap.hide();
        }
        this.currentUI = defaultAvatar;
        this.switch(defaultAvatar);
    }

    switch(name) {
        this.avatarUIs.get(this.currentUI).hide();
        this.avatarUIs.get(name).show();
        this.currentUI = name;
    }
}

class ClothingItem {
    constructor() {
        this.names = [];
        this.atlasPaths = [];
        this.skin = "";
        this.skinNumber = -1;
        this.attachmentIndexes = [];
        this.colors = [];
        this.clothingSlot = "";
    }

    check() {
        if (!this.names.length) {
            console.log("no attachments added");
            return false;
        } else if (this.skinNumber === -1) {
            console.log("skin is not set");
            return false;
        }
        return true;
    }

    addAttachment(name, atlasPath, index) {
        if (!name || !name.length || !atlasPath ||
            !atlasPath.length || index < 0) {
            console.log("add attachment failed");
            return;
        }
        this.names.push(name);
        this.atlasPaths.push(atlasPath);
        this.attachmentIndexes.push(index);
    }

    serialize() {
        return JSON.stringify(this);
    }
}

class ClothesEditor {
    constructor() {
        let avatars = ["Male1", "Female2"];
        let skins = ["M1_T_SP_Clothes1", "F2_SP_Head2_Cloth1"];

        this.pixiView = new AvatarViewPixi($("#view")[0].clientWidth,
            window.innerHeight, avatars, "Male1", skins,
            ()=>{this.ui = new UI(avatars, "Male1", this.pixiView);});

        $("canvas").prependTo("#view");
        let avatarOptions = $("#avatars");
        for (let i = 0; i < avatars.length; ++i) {
            avatarOptions.append($("<option>" + avatars[i] + "</option>"));
        }
        let self = this;
        avatarOptions.change(function () {
            self.switchAvatar($(this).val());
        });
    }

    switchAvatar(name) {
        this.pixiView.switchAvatar(name);
        this.ui.switch(name);
    }
}

new ClothesEditor();
