//
//
//

var DayNightMaterial2 = function (texture, parameters) {
    "use strict";

    THREE.MeshPhongMaterial.call(this);

    parameters = parameters || { transparent: true };

    if (texture)
        parameters.map = texture;

    this.setValues(parameters);
};

DayNightMaterial2.light = new THREE.AmbientLight(0xffffff);

DayNightMaterial2.setTime = function (time) {
    "use strict";
    var sint = Math.sin(time * 2 * Math.PI);
    var ssint = Math.sign(sint);
    var asint = Math.abs(sint);
    sint = ssint * asint + sint * (1.0 - asint);

    ssint = Math.sign(sint);
    asint = Math.abs(sint);
    sint = ssint * asint + sint * (1.0 - asint);

    var darkness = Math.sqrt(sint * 0.4 + 0.6);
    DayNightMaterial2.light.color.setRGB(darkness, darkness, darkness);
};

DayNightMaterial2.prototype = Object.create(THREE.MeshPhongMaterial.prototype);

var DayNightMaterial = function (texture, parameters) {
    "use strict";
    parameters = parameters || { transparent: true };

    parameters.vertexShader = parameters.vertexShader || [
        'varying vec2 vUv;',

        'void main () {',
            'vUv = uv;',
            'vec4 mvPosition = modelViewMatrix * vec4 (position, 1.0);',
            'gl_Position = projectionMatrix * mvPosition;',
        '}'
    ].join('\n');

    parameters.fragmentShader = parameters.fragmentShader || [
        'uniform sampler2D texture;',
        // bullshit part is having to handle offset and repeat in the shader
        'uniform vec2 offset;',
        'uniform vec2 repeat;',
        'uniform float time;',

        'varying vec2 vUv;',

        'void main () {',
            'vec4 color = texture2D (texture, vUv * repeat + offset);',
            // time -> darkness
            // sin (time) = +1: no change, darkness = 1
            // sin (time) = -1: dimmest, darkness = 0.2
            'float darkness = sqrt (sin (time) * 0.4 + 0.6);',
            // apply
            'float d2 = darkness * darkness;',
            'vec3 correction = vec3 (2.0 - d2, 2.0 - d2, 1.5 - 0.5 * d2);',
            'vec3 darker = pow (color.rgb, correction) * darkness;',
            'gl_FragColor = vec4 (darker, color.a);',
        '}'
    ].join('\n');

    var uniforms = {
        time: { type: 'f', value: 0 }
    };

    if (texture) {
        uniforms.texture = { type: 't', value: texture };
        uniforms.offset = { type: 'v2', value: texture.offset };
        uniforms.repeat = { type: 'v2', value: texture.repeat };
    }

    DayNightMaterial.uniforms.push(uniforms);

    parameters.uniforms = uniforms;

    THREE.ShaderMaterial.call(this);

    this.setValues(parameters);
};

DayNightMaterial.uniforms = [];
DayNightMaterial.setTime = function (time) {
    "use strict";
    for (var i = 0; i < DayNightMaterial.uniforms.length; i++) {
        DayNightMaterial.uniforms[i].time.value = time * 2 * Math.PI; // map 0..1 to 0..tau
    }
};

DayNightMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);

function SkyMaterial(starsUrl) {
    "use strict";
    return new DayNightMaterial(new THREE.ImageUtils.loadTexture(starsUrl), {
        fragmentShader: [
            'uniform sampler2D texture;',
            'uniform float time;',

            'varying vec2 vUv;',

            'void main () {',
                'vec3 day = vec3 (0.0, 160.0 / 255.0, 1.0);',
                'vec3 night = vec3 (0.0, 0.0, 0.0);',

                'float sint = sin (time);',
                'float cost = cos (time);',

                // make "flat" sine http://goo.gl/DtAm78
                'float ssint = sign (sint);',
                'float asint = abs (sint);',
                'sint = ssint * asint + sint * (1.0 - asint);',

                // make it double
                'ssint = sign (sint);',
                'asint = abs (sint);',
                'sint = ssint * asint + sint * (1.0 - asint);',

                'float darkness = sqrt (sint * 0.49 + 0.51);',
                'vec3 color = day * darkness + night * (1.0 - darkness);',

                'float down = 1.0 - vUv.y;',
                'down *= down;',

                'color += 0.15 * darkness * vec3 (down, down, down);',

                'float redness = cost * cost;',
                'redness = pow (redness, 16.0);',
                'color += 1.5 * redness * vec3(down -0.2*vUv.y, 0.4 * down -0.4*vUv.y, -0.8*vUv.y);',

                // crappy stars
                'vec3 stars = texture2D (texture, vec2(fract (vUv.x * 4.0), fract (vUv.y))).rgb * (1.0 - darkness) * 2.0;',
                'color += stars;',

                'gl_FragColor = vec4 (color, 1.0);',
            '}'
        ].join('\n')
    });
}