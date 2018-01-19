//
//
//

var io;

function main() {
    "use strict";

    $.when(
        $.getJSON('assets/config.json'),
        $.getJSON('getfiles'),
        $.getJSON('/room/getroom/' + (param('room') || '0'))
    ).then(function (config, files, roomData) {

        config = config[0];
        files = files[0];
        roomData = roomData[0];

        roomData.pushCameraBackBy = parseFloat(roomData.pushCameraBackBy);
        roomData.objectScale = parseFloat(roomData.objectScale);

        if (roomData.floor) {
            roomData.floor.width = parseFloat(roomData.floor.width);
            roomData.floor.depth = parseFloat(roomData.floor.depth);
            roomData.floor.tiling = parseFloat(roomData.floor.tiling);
        }

        if (roomData.ceiling) {
            roomData.ceiling.width = parseFloat(roomData.ceiling.width);
            roomData.ceiling.depth = parseFloat(roomData.ceiling.depth);
            roomData.ceiling.height = parseFloat(roomData.ceiling.height);
        }

        if (roomData.sky) {
            roomData.sky.width = parseFloat(roomData.sky.width);
            roomData.sky.height = parseFloat(roomData.sky.height);
            roomData.sky.z = parseFloat(roomData.sky.z);
            roomData.sky.x = parseFloat(roomData.sky.x);
        }

        var serverStartedAt = 0;

        var socket = io.connect(window.location.origin, {
            query: 'room=' + (param('room') || '0') +
                '&name=' + (param('name') || 'Anonymous')
        });

        var form = $('form');
        var room = new Room(socket, $('canvas')[0], form[0], config, roomData, function (destinationId) {

            console.log('user walked through the door to location ' + destinationId + '...');

            try {
                socket.disconnect();
            } catch (whatever) {
                var whatever_ex = 0;
            }

            window.location.href = '/chat?room=' + destinationId;
        });

        // ui here for the moment -----

        var mouseY, splitAt = 0.5;

        var splitDrag = function (e) {
            var currentMouseY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            splitAt -= (currentMouseY - mouseY) / window.innerHeight;
            var splitAtPct = Math.round(100 * splitAt) + '%';
            var messages = document.getElementById('messages');
            messages.style.bottom = splitAtPct;
            var chatroom = document.getElementById('chatroom');
            chatroom.style.height = splitAtPct;
            mouseY = currentMouseY;
            e.preventDefault();
        };

        $('.splitter').on('mousedown touchstart', function (e) {
            mouseY = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].clientY : e.clientY;
            document.body.addEventListener('mousemove', splitDrag);
            document.body.addEventListener('touchmove', splitDrag, true);
            e.preventDefault();
        });

        $('body').on('mouseup mouseleave touchend touchleave touchcancel', function () {
            document.body.removeEventListener('mousemove', splitDrag);
            document.body.removeEventListener('touchmove', splitDrag, true);
            room.resize();
        });

        form.submit(function () {
            var text = $('#messageInput').val();
            if (!/^(@[^\s]+)?\s*$/.test(text)) {
                if (!room.isMap() || (text.charAt(0) == '@')) {
                    socket.emit(Events.TEXT, {
                        id: room.getCurrentUserId(),
                        name: param('name') || 'Anonymous',
                        message: text
                    });
                    $('#messageInput').val('');
                }
            }
            return false;
        });

        $('#stickers_button').click(function () {
            $('#stickers').toggleClass('stickersHidden').toggleClass('stickersOpened');
        });

        $('#objectlib_button').click(function () {
            var go = $('#global_objects');
            if (parseInt(go[0].scrollLeft) > 0) {
                go.animate({ 'scrollLeft': 0 });
            } else {
                $('#objects').toggleClass('objectsHidden').toggleClass('objectsOpened');
            }
        });

        $('#clothes_button').click(function () {
            $('#clothes').toggleClass('objectsHidden').toggleClass('objectsOpened');
        });

        $('#users_button').click(function () {
            $('#users').toggleClass('usersHidden').toggleClass('usersOpened');
        });

        window.pmUser = function (name) {
            var text = $('#messageInput').val();
            var pm = /^@(\w+)\s(.*)$/.exec(text);
            if (pm) {
                text = pm[2];
            }
            $('#messageInput').val('@' + name + ' ' + text);
        };

        // quick and dirty users list
        var users = {};

        function updateUsersList() {
            var html = '';
            for (var id in users) {
                html += '<div onclick="pmUser(\'' + users[id] + '\')"><img src="assets/user.png" class="img16" /> ' + users[id] + '</div> ';
            }
            $('#users').html(html);
        }

        socket.on(Events.CREATE_OBJECT, function (data) {
            if (data.name && (data.name != param('name'))) {
                users[data.id] = data.name;
                updateUsersList();
            }
        });
        socket.on(Events.REMOVE_OBJECT, function (data) {
            delete users[data.id];
            updateUsersList();
        });

        var expressionMap = [1, 0, 2, 3];

        function stickers_panel_onclick(i) {

            $('#stickers_panel img:eq(' + i + ')').click(function () {
                socket.emit(Events.EXPRESSION, {
                    id: room.getCurrentUserId(), expression: expressionMap[i]
                });
            });
        }
        for (var i = 0; i < 4; i++) {
            stickers_panel_onclick(i);
        }

        var showMessage = function (message, name, color, classes) {
            $('#messages').append($(
                '<div' +
                ' class="' + classes + '"' +
                ' title="' + name + '"' +
                ' style="background-color:' + color + '">' +
                he.encode(message, { encodeEverything: false, useNamedReferences: false }) +
                '</div>'
            ));
        };

        socket.on(Events.TEXT, function (data) {
            room.showQuip(data.pm ? -1 : data.id);
            showMessage(data.message, data.name, id2color(data.id), data.pm ? 'message pm' : 'message');
            playSound('soundMessage');
        });

        // load objects library

        var jstree_data = [];

        function get_jstree_data_node(files, node_array){

            for (var node in files ){

                if (files.hasOwnProperty(node)){

                    if (files[node].isFile === true) {

                        var file_node = {
                          // id          : "string" // will be autogenerated if omitted
                          text        : node, // node text
                          icon        : window.params.s3_bucket + files[node].filePath, // string for custom icon
                          objectId    : files[node].objectId,
                          isFile      : true,
                          state       : {
                            opened    : false,  // is the node open
                            disabled  : false,  // is the node disabled
                            selected  : false  // is the node selected
                          },
                          // children    : [],  // array of strings or objects
                          // li_attr     : {},  // attributes for the generated LI node
                          // a_attr      : {}  // attributes for the generated A node
                        };

                        node_array.push(file_node);
                    }
                    else {

                        var parent_node =  {
                          // id          : "string" // will be autogenerated if omitted
                          text        : node, // node text
                          //icon        : files[node].filepath, // string for custom icon
                          state       : {
                            opened    : false,  // is the node open
                            disabled  : false,  // is the node disabled
                            selected  : false  // is the node selected
                          },
                          isFile      : false,
                          children    : [],  // array of strings or objects
                          // li_attr     : {},  // attributes for the generated LI node
                          // a_attr      : {}  // attributes for the generated A node
                        };

                        get_jstree_data_node(files[node].children, parent_node.children);

                        node_array.push(parent_node);
                    }
                }
            }
        }

        get_jstree_data_node( files, jstree_data );

        $('#global_objects').jstree(
        { 
            'core' : {
                "data" : jstree_data
            },
            "contextmenu":{         
                items : function(node) {
                    node = node.original;

                    var out = {};

                    if (node.isFile){
                        out = {
                            "Create": {
                                "separator_before": false,
                                "separator_after": false,
                                "label": "Create Object",
                                "action": function (obj) { 

                                    var node = obj.item.node;

                                    room.placeObjectAt(null, node.objectId, function(_id){
                                        room.moveObject(_id);
                                    }, false);
                                },
                                node : node
                            }
                        };
                    }

                    return out;
                }
            },

            "dnd":{
                is_draggable : function(node) {

                    var bDraggable = false;

                    if (node[0]){

                        if (node[0].original){
                            bDraggable = node[0].original.isFile;
                        }

                        if (!bDraggable && node[0].a_attr){

                            var el = document.getElementById(node[0].a_attr.id);
                            if (el)
                                el.draggable = false;
                        }
                    }
                    return bDraggable;
                }
            },
            "plugins" : [ "contextmenu", "dnd" ]
        });

        $(document).on('dnd_start.vakata', function(e, data) {

            var node = data.data.origin.get_node(data.element).original;

            if (node && node.isFile){

                room.createActivePreview(data.event, node.objectId, false);
            }
        });

        $(document).on('dnd_move.vakata', function(e, data) {

            if (data.event.target === room.getCanvas()) {

                var node = data.data.origin.get_node(data.element).original;

                if (node && node.isFile){

                    if (room.moveActivePreview(data.event)){

                        data.helper.find('.jstree-icon').first().removeClass('jstree-er').addClass('jstree-ok');
                    }

                }
            }
        });
        $(document).on('dnd_stop.vakata', function(e, data) {

            if (data.event.target === room.getCanvas()) {

                var node = data.data.origin.get_node(data.element).original;

                if (node && node.isFile){

                    room.applyActivePreview();
                }
            }
            else
                room.removeActivePreview();
        });

        $.contextMenu({
            selector: 'canvas',
            build: function ($trigger, e) {

                var self = this;

                self.f_arr_onhide = [];

                var objectId = room.idOfObjectAt(e, self.f_arr_onhide);

                var disabled = objectId ? true : false;

                if (!self.events.custom_hide){

                    var base_hide_event = self.events.hide.bind(self);

                    self.events.hide = function(){
                        for ( var i = 0; i < self.f_arr_onhide.length; i++ ){
                            self.f_arr_onhide[i]();
                        }
                        self.f_arr_onhide = [];
                        base_hide_event();
                    };
                    self.events.custom_hide = true;
                }

                return {
                    callback: function (key, options) {

                        console.log(key);

                        var placeObjectHelper = function (event, message, callback, block) {
                            var id = window.prompt(message);
                            var image = new Image();
                            image.onerror = function () { 
                                window.alert('Could not load ' + (block ? 'block' : 'object') + ' #' + id); 
                            };
                            image.onload = function () { 
                                room.placeObjectAt(event, id, callback, block); 
                            };
                            image.src = objectUrl(id, block);
                        };
                        
                        switch (key) {
                            case 'new':
                                placeObjectHelper(e, 'Please enter object folder/ID:');
                                break;
                            case 'new_block':
                                placeObjectHelper(e, 'Please enter block floder/ID:', null, true);
                                break;
                            case 'new_door':
                                // New Door -> Enter destination ID  -> Enter Object ID.
                                var room_name = window.prompt('Please enter room destination name:');

                                if (room_name != (param('room') || '0')) {

                                    $.getJSON('/room/getroom/' + room_name, function (ok) {
                                        placeObjectHelper(e, 'Please enter object folder/ID for the door:', function (id) {
                                            room.makeDoor(id, room_name);
                                        });

                                    }).fail(function (e) {
                                        console.log(e);
                                        window.alert('Could not load location #' + room_name);
                                    });

                                } else {

                                    window.alert('A door destination must be another location.');
                                }
                                break;
                            case 'move':
                                room.moveObject(objectId);
                                break;
                            case 'delete':
                                room.deleteObject(objectId);
                                break;
                        }
                    },
                    items: {
                        'new': { name: 'Place Object', disabled: disabled },
                        'new_block': { name: 'Place Block' , disabled: disabled},
                        'new_door': { name: 'Place Door' , disabled: disabled},
                        'move': { name: 'Move Object', disabled: !disabled },
                        'delete': { name: 'Delete Object', disabled: !disabled },
                    }
                };
            }
        });

        if (!mobile.handleCanvasClicks(room)) {
            room.getCanvas().addEventListener('click', room.click, false);
        }

        // create avatar -----
        socket.on(Events.ID, function (data) {
            if ((serverStartedAt > 0) && (serverStartedAt != data.serverStartedAt)) {
                console.log('server was restarted, reloading the client...');
                try {
                    socket.disconnect();
                } catch (whatever) {
                    var whatever_ex = 0;
                }
                window.location.reload(true);
                return;
            }

            serverStartedAt = data.serverStartedAt;

            console.log('server issued id:', data.id);
            room.setCurrentUserId(data.id);

            $.getJSON('/clothes?avatar=' + param('avatar'), function (clothes) {

                var clothes_menu = $('#clothes_menu');

                var createCallback = function(socket1, id, event) {
                    return function() {
                        socket1.emit(event, {
                            id: id,
                            name: this.value
                        });
                    };
                };

                var clothes_menues = {};
                var pickers = {};
                var picker_containers = {};
                var readyObj = {ready: false};

                var createChange = function (key, timeout) {
                    return function (points, styles) {
                        var color = styles[0].split('deg, ')[1].slice(0, -1);
                        clearTimeout(timeout);

                        timeout = setTimeout(function () {
                            if (!readyObj.ready) return;
                            socket.emit(Events.CHANGE_COLOR,
                                {color: color, clothingSlot: key, id: room.getCurrentUserId()});
                        }, 700);
                    };
                };

                var createPicker = function (key, colors) {

                    let picker = $('<div id="picker_' + key + '" class="picker"></div>');

                    pickers[key] = picker;

                    picker_containers[key].append(picker);

                    let timeout;

                    picker.gradientPicker({
                        change: createChange(key, timeout),
                        fillDirection: "45deg",
                        controlPoints: colors
                    });
                };

                for (var key in clothes) {
                    var menu =$('<select></select>');
                    clothes_menues[key] = menu;
                    var options = clothes[key];
                    for (var j = 0; j < options.length; ++j) {
                        menu.append('<option value="' +
                            options[j] + '">' +
                            options[j] + '</option>');
                    }

                    let event = Events.CHANGE_CLOTHES;
                    let id = room.getCurrentUserId();
                    let socket1 = socket;
                    menu.on('change', createCallback(socket1, id, event));

                    let pickerContainer = $('<div class="picker_container"></div>');
                    picker_containers[key] = pickerContainer;

                    clothes_menu.append(
                        $('<p class="menu_label">' + key + '</p>'))
                        .append(menu).append(pickerContainer);

                    createPicker(key, ["black 0%", "green 100%"]);
                }

                socket.on(Events.CHANGE_CLOTHES, function (data) {
                    if (data.id === room.getCurrentUserId()) {
                        for (var i = 0; i < data.clothes.length; ++i) {
                            var item = data.clothes[i];
                            clothes_menues[item.clothingSlot].val(item.name);

                            if (item.color.length) {
                                pickers[item.clothingSlot].remove();
                                createPicker(item.clothingSlot, item.color.split(', '));
                            }
                        }
                        if (!readyObj.ready) {
                            readyObj.ready = true;
                        }
                    }
                });

                socket.emit(Events.CREATE_OBJECT, { id: data.id, name: param('name') || 'Anonymous', avatar: param('avatar') || '1' });
            });
        });

    }).fail(function (e) {
        console.log(e);
        window.alert('Could not load location #' + param('room'));
    });
}