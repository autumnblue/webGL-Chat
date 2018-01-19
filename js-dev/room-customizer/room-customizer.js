//
//
//

function main(){
    "use strict";
    RoomCustomizer = new RoomCustomizer();
}

//

Element.prototype.remove = function() {
    "use strict";
    this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    "use strict";
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
};

var RoomCustomizer = function() {

    "use strict";

    var self = this;

    self.LoadRoom = function(select) {

        if (!rooms_data)
            return;

        $("#user-customizer").hide();

        var text = select.options[select.selectedIndex].text;
        var value = select.options[select.selectedIndex].value;
        var room_id = select.options[select.selectedIndex].room_id;

        var data;

        var user_id = window.params.user_id;
        var room_creator = window.params.name;
        var room_owners = [user_id];

        if (value !== 'new') {

            data = rooms_data[room_id];

            room_creator = data.room_creator;
            room_owners = data.room_owners;

            $('input[name="roomName"]')[0].readOnly = true;
        }
        else {

            $('input[name="roomName"]')[0].readOnly = false;
        }

        $('#room-id')[0].innerHTML = room_id;
        $('#room-creator')[0].innerHTML = room_creator;

        updateRoomOwners();

        $('input[name="roomName"]')[0].value = data && data.room_name || '';
        $('input[name="pushCameraBackBy"]')[0].value = data && data.pushCameraBackBy || '';
        $('input[name="objectScale"]')[0].value = data && data.objectScale || '';
        $('input[name="floorWidth"]')[0].value = data && data.floor.width || '';
        $('input[name="floorDepth"]')[0].value = data && data.floor.depth || '';
        $('input[name="floorTiling"]')[0].value = data && data.floor.tiling || '';
        $('input[name="floorTexture"]')[0].value = data && data.floor.texture || '';

        var c = data && data.ceiling;

        $('input[name="ceiling"]')[0].checked = c;

        if (c){
            document.getElementById('ceilingBlock').classList.remove('hidden');
        }
        else{
            document.getElementById('ceilingBlock').classList.add('hidden');
        } 

        $('input[name="ceilingWidth"]')[0].value = data && data.ceiling && data.ceiling.width || '';
        $('input[name="ceilingDepth"]')[0].value = data && data.ceiling && data.ceiling.depth || '';
        $('input[name="ceilingTiling"]')[0].value = data && data.ceiling && data.ceiling.tiling || '' ;
        $('input[name="ceilingTexture"]')[0].value = data && data.ceiling && data.ceiling.texture || '';
        $('input[name="ceilingHeight"]')[0].value = data && data.ceiling && data.ceiling.height || '';

        if (value !== 'new') {
            $('#room-save-btn')[0].value = 'Update';
        }
        else{
            $('#room-save-btn')[0].value = 'Create';
        }

        var bModificationsRestricted =  room_owners.indexOf(user_id) === -1;

        $( ".formInput" ).each( function(index){
            var el = this;
            resizeElement(el);
            el.readOnly = bModificationsRestricted;
        });
    };

    self.Upload = function(holder, input_name){
        var input =  $('input[name="' + input_name + '"]')[0];
        if (input) {
            input.onchange = function() {
                if (input.files.length) {
                    holder.value = input.files[0].name;
                }
                else
                    holder.value = "";

                resizeElement(holder);
            };
            $(input).click();
        }
    };

    self.ChangeRoomOwners = function( room_owners_div ){

        function userOnClick(e){
            var span = e.target;

            var room_id = span.room_id;
            var user_id = span.user_id;

            var room_creator_id = rooms_data[room_id].room_creator_id;

            if (room_creator_id !== user_id){

                var room_owners = rooms_data[room_id].room_owners;

                var indx = room_owners.indexOf(user_id);

                if ( indx > -1 ) {

                    rooms_data[span.room_id].room_owners.splice(indx,1);

                    span.data_cell.innerHTML = '';
                }
                else {

                    rooms_data[span.room_id].room_owners.push(user_id);

                    var ok_image = new Image();
                    ok_image.src = ok_image_data;
                    span.data_cell.appendChild(ok_image);
                }
            }

            updateRoomOwners();
        }

        if (users_data) {

            var current_user_id = window.params.user_id;

            var select = document.getElementById('room-select');
            var value = select.options[select.selectedIndex].value;
            var room_id = select.options[select.selectedIndex].room_id;

            var room_owners = rooms_data[room_id].room_owners;

            var bModificationsRestricted =  room_owners.indexOf(current_user_id) === -1;
            if (bModificationsRestricted){
                showMessage("red", "Error : You can't modify room");
                return;
            }

            var rect = $('#room-owners')[0].getBoundingClientRect();
            $("#user-customizer").show();
            $("#user-customizer-listview")[0].innerHTML = '';
            $("#user-customizer").css({top: rect.top + rect.height + 5, left: rect.left, position:'absolute'});

            var table = document.createElement("table");

            for ( var i in users_data ){

                if (!users_data[i])
                    continue;

                var user_id = users_data[i].id;
                var user_name = users_data[i].name;

                var row = table.insertRow(table.rows.length);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);

                var u = document.createElement("u");
                var span = document.createElement("span");

                span.style.cursor = "pointer";

                span.room_id = room_id;
                span.user_id = user_id;
                span.user_cell = cell1;
                span.data_cell = cell2;

                span.innerHTML = user_name;

                span.onclick = userOnClick;

                if ( room_owners.indexOf(user_id) > -1 ){

                    var ok_image = new Image();
                    ok_image.src = ok_image_data;
                    cell2.appendChild(ok_image);
                }

                u.appendChild(span);
                cell1.appendChild(u);
            }

            $("#user-customizer-listview")[0].appendChild(table);
        }
    };

    // --------------------- internals 

    var rooms_data, users_data;

    function clearRoomData(){
        rooms_data = {};
        rooms_data["-new-"] = {
            room_creator : window.params.name,
            room_creator_id : window.params.user_id,
            room_owners : [window.params.user_id]
        };
    }
    clearRoomData();

    $('#form').submit(function (e) {

        e.preventDefault();

        var current_user_id = window.params.user_id;

        var select = document.getElementById("room-select");

        if (!select || !rooms_data)
            return false;

        var text = select.options[select.selectedIndex].text;
        var value = select.options[select.selectedIndex].value;
        var room_id = select.options[select.selectedIndex].room_id;
        console.log("new id " + room_id);

        var room_creator = rooms_data[room_id].room_creator;
        var room_creator_id = rooms_data[room_id].room_creator_id;
        var room_owners =  rooms_data[room_id].room_owners;

        var bModificationsRestricted =  room_owners.indexOf(current_user_id) === -1;
        if (bModificationsRestricted){
            showMessage("red", "Error : You can't modify room");
            return false;
        }

        select.readOnly = true;

        // ---------------------
        var json = {};

        function getValue(name){
            return $('input[name="' + name +'"]')[0].value ? $('input[name="' + name +'"]')[0].value : $('input[name="' + name +'"]')[0].placeholder;
        }

        json.room_action = value;
        json.room_name = getValue("roomName");
        json.room_id = room_id;
        json.room_creator = room_creator;
        json.room_creator_id = room_creator_id;
        json.room_owners = room_owners;

        var data = {};

        data.pushCameraBackBy = getValue("pushCameraBackBy");
        data.objectScale = getValue("objectScale");

        data.floor = {};
        data.floor.width = getValue("floorWidth");
        data.floor.depth = getValue("floorDepth");
        data.floor.tiling = getValue("floorTiling");
        data.floor.texture = "assets/green.jpg";

        if ($('input[name="ceiling"]')[0].checked){
            data.ceiling = {};
            data.ceiling.width = getValue("ceilingWidth");
            data.ceiling.depth = getValue("ceilingDepth");
            data.ceiling.tiling = getValue("ceilingTiling");
            data.ceiling.texture =  "assets/dirt.jpg";
            data.ceiling.height = getValue("ceilingHeight");
        }

        data.sky = {};
        data.sky.width = 1920; // getValue("");
        data.sky.height = 460; // getValue("");
        data.sky.texture ="assets/stars.gif";
        data.sky.z = -300; // getValue("");
        data.sky.x = 0;// getValue("");

        json.data = data;

        $.post(
            "/room/saveroom",
            json,
            function(data, textStatus, jqXHR ){
                console.log(data);
                select.readOnly = false;

                if (data.result === "ok" && !data.error) {

                    if (value === 'exist') {

                        showMessage("green", "Room updated");

                        self.LoadRoom(select);
                    }
                    else if (value === 'new') {

                        showMessage("green", "Room created");

                        select.readOnly = true;

                        uploadRooms(function(select) {

                            for (var i = 0; i < select.options.length; i++)
                            {
                                var option = select.options[i];

                                if (option.room_id && option.room_id.toString() === data.room_id.toString())
                                {
                                    select.selectedIndex = i;
                                    break;
                                }
                            }

                            select.readOnly = false;

                            self.LoadRoom(select);

                        });
                    }
                }
                else {

                    showMessage("red", "Error : " + data.error);
                }

                json = undefined;
            });

        return false;
    });

    function showMessage(color, msg){
        var result = $('#form-result'); 
        result.css("color", color);
        result[0].innerHTML = msg;
        result.show(0, function(){
            setTimeout(function(){$( "#form-result" ).hide(0);},2000);
        });
    }

    function updateRoomOwners() {

        var select = document.getElementById('room-select');
        var value = select.options[select.selectedIndex].value;
        var room_id = select.options[select.selectedIndex].room_id;

        var room_owners = rooms_data[room_id].room_owners;

        var room_owners_div = $('#room-owners')[0];
        room_owners_div.innerHTML = "";

        for (var i = 0; i < room_owners.length; i++) {

            var owner = users_data[room_owners[i]].name;

            var html = '';
            if ( i > 0 )
                room_owners_div.innerHTML += ',&nbsp';

            room_owners_div.innerHTML += '<u><span style="cursor: pointer;">' + owner + '</span></u>';
        }
        room_owners_div.room_owners = room_owners;
    }

    function uploadRooms( callback ){

        clearRoomData();
        users_data = null;

        var select = document.getElementById('room-select');
        var option_new = select.options[0];
        option_new.room_id = "-new-";
        select.options.length = 0;
        select.add(option_new);
        select.readOnly = true;

        var div = document.getElementById("room-customizer-view");
        var spinner = new CanvasSpinner(div, 6).init();

        $.when(

            $.getJSON('room/getrooms'),
            $.getJSON('getusers')

        ).then(function (rooms, users) {

            rooms_data = rooms[0];
            rooms_data["-new-"] = {
                room_creator : window.params.name,
                room_creator_id : window.params.user_id,
                room_owners : [window.params.user_id]
            };
            users_data = users[0];

            for (var id in rooms_data){

                if (!rooms_data.hasOwnProperty(id))
                    continue;

                if (id === "-new-")
                    continue;

                var option = document.createElement ('option');
                option.room_id = rooms_data[id].room_id;
                console.log("room id " + rooms_data[id].room_id);
                option.text = "id : " + id + " , name : " + rooms_data[id].room_name;
                option.value = "exist";

                select.add(option);
            }

            select.readOnly = false;
            if (callback)
                callback(select);

            spinner.deallocate();
            spinner = null;

        }).fail(function (e) {
            console.log(e);
            select.readOnly = false;
            spinner.deallocate();
            spinner = null;
        });
    }
    uploadRooms();

    var room_owners_div = $('#room-owners')[0];
    room_owners_div.room_owners = [window.params.user_id];

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 1;

    function getWidthOfInput(input){
        var text = input.value ? input.value : input.placeholder;
        var style = window.getComputedStyle(input);
        ctx.font = style.font;
        var text_width = ctx.measureText(text).width;
        return Math.ceil(text_width);
    }

    function resizeElement(el) {
        var width = getWidthOfInput(el);
        el.style.width = width + 'px';
    }

    $( ".formInput" ).each( function(index){
        var el = this;
        var e = 'onkeydown,onkeyup,onkeypress,onfocus,onblur,onchange'.split(',');
        function f(e){
            resizeElement(el);
        }
        for (var i in e){
            el[e[i]] = f;
        }
        resizeElement(el);
    });

    var ok_image_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAA" + 
    "PD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIg" +
    "eDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6" +
    "cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3Jk" +
    "ZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+nhxg7wAAAllJREFUKJFVkTtoVFEQhr8559y9ye5qssSAxgc2ShAUtYgILgpWogFTWUQLS" +
    "aNlLARBRVAbS3uxSW0Kk04ENY1BES18oIgsvsJqNmv2fc89Y3GN6A9TDMM3//CP0L4N2oHeEniBoMdBJghhH8oAQh1rX0A6i5F5oiK4BpgEBxbEgDJMEu4QdJ" +
    "w1GYFUwfv9CFNY7uPSKYxUkYABD6nfQru3SMo4RvhbawucBaPgwzjNziJp2II6DMknaFZnCHY7TvhfChJB6EC6AtQgJNv5JTO0BjF03AS+exhrQRWQf8AY0jo" +
    "kFR4MTXN38CzIKhAO02hPOJBJ1IEoqIHQAhP/AVcg+cLMhosc7dvD504VMKAtyLlJQ/CjiAARaD1zDE1If4CvMDt8mcnCIV42P7K1egHEghZBdNQAeUTAL1HO7" +
    "WZ54y129+2CziLzw9c5mR/jeeMDe39MgwNMCSRASPMO1RbWQpqiqVAyRZ6WzvOqcIwD8U4WGm8oL1+DXAnMJtBe9gGhZWjzDqfgRljoPUS+3aRfcxm4+pryz6s" +
    "QFcCMgHazUJ1Ay721nDvoWSenSAPYIfBPedZrssnHHKnfgCgPZmPmiIAxEBlYrl+RwutL0uzvPmJQyrTIhmEZQgKuCKwDeqACCuQjqHUe06kcceu/NnQgcPrrD" +
    "vuEkt1GouAHslDUAgmIZKfmBGrtysiHcKbIZjWrqsSeCm+7Yyx159EAfRZiB7FAbLIehe/dOd73xoqeSkEtLhKhGgmoWaLqT1DTcQoyQb/Zh5UBUq3TSl/Qlnsk" +
    "YQ4jrESCU+U3O8MFbMW7tUAAAAAASUVORK5CYII=";
};

