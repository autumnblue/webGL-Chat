//
//
//

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
Math.sign = Math.sign || function (x) {
    "use strict";
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
};


// ovveride
// THREE.ImageUtils.crossOrigin = '';

THREE.ImageUtils.loadTexture = function ( url, mapping, onLoad, onError, crossOrigin ) {
    "use strict";

    var loader = new THREE.TextureLoader();
    crossOrigin = crossOrigin ? crossOrigin : 'anonymous';
    loader.setCrossOrigin( crossOrigin );

    var texture = loader.load( url, onLoad, undefined, onError );

    if ( mapping ) 
        texture.mapping = mapping;

    return texture;
};

// color as a function of id
function id2color (id) {
    "use strict";
    // pick "random" hue (range: 0...1)
    var hue = 0.127 * id; hue -= Math.floor (hue);
    var color = new THREE.Color ();
    // #96cce0 is 196° 54% 73% in HSL, so make all colors like that
    color.setHSL (hue, 0.54, 0.73);
    // return the string for css
    return color.getStyle ();
}

function playSound (id) {
    "use strict";
    document.getElementById(id).play();
}

function param (name) {
    "use strict";
    return window.params[name];
}

function objectUrl (objectId, block) {
    "use strict";
    var id = ('' + objectId).split ('/');
    if (id.length < 2)
        id.unshift ('default');
    return window.params.s3_bucket + 'assets/' + (block ? 'blocks' : 'objects') + '/' + id[0] + '/' + parseInt (id[1]) + '.png';
}

// URL
function getURLQueryParams(name, url) {
    "use strict";
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}
