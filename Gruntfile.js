
module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {
            app: {
                src: [
                    'js-dev/globals/**/*.js',
                    'js-dev/app/**/*.js'
                ],
                dest: 'public/app/app.js'
            },
            app_room_customizer: {
                src: [
                    'js-dev/globals/**/*.js',
                    'js-dev/room-customizer/**/*.js'
                ],
                dest: 'public/app-room-customizer/app.js'
            },
            clothes_editor: {
                src: [
                    'js-dev/globals/**/*.js',
                    'js-dev/app/engine/avatar.js',
                    'js-dev/clothes-editor/main.js'
                ],
                dest: 'public/clothes-editor/app.js'
            },
            clothes_editor_libs: {
                src: [
                    'js-dev/clothes-editor-libs/tether.min.js',
                    'js-dev/clothes-editor-libs/bootstrap.min.js',
                    'js-dev/clothes-editor-libs/pixi.min.js',
                    'js-dev/clothes-editor-libs/pixi-spine.js',
                    'js-dev/libs/three.js/*.js',
                    'js-dev/libs/spine/**/*.js'
                ],
                dest: 'public/clothes-editor/libs.js'
            },
            clothes_editor_libs_css: {
                src: [
                    'js-dev/clothes-editor-libs/css/*.css'
                ],
                dest: 'public/clothes-editor/libs.css'
            },
            libs: {
                src: [
                    'js-dev/libs/detector/*.js',
                    'js-dev/libs/he/*.js',
                    'js-dev/libs/three.js/*.js',
                    'js-dev/libs/three.js/plugins/TransformControls.js',
                    'js-dev/libs/three.js/plugins/EffectComposer.js',
                    'js-dev/libs/three.js/plugins/ShaderPass.js',
                    'js-dev/libs/three.js/plugins/RenderPass.js',
                    'js-dev/libs/three.js/plugins/BokehPass.js',
                    'js-dev/libs/three.js/plugins/SMAAPass.js',
                    'js-dev/libs/three.js/plugins/SSAARenderPass.js',
                    'js-dev/libs/three.js/plugins/MaskPass.js',
                    'js-dev/libs/three.js/shaders/*.js',
                    'js-dev/libs/spine/**/*.js',
                    'js-dev/libs/tween.js/**/*.js',
                    'js-dev/libs/duotone/*.js',
                    'js-dev/libs/colorpicker/*.js',
                    'js-dev/libs/gradient_picker/*.js'
                ],
                dest: 'public/libs/libs.js'
            },
            libs_css: {
                src: [
                    'js-dev/libs/colorpicker/css/*.css',
                    'js-dev/libs/gradient_picker/*.css'
                ],
                dest: 'public/libs/libs.css'
            }
        },
        uglify: {
            app: {
                options: {
                    banner: '// <%= grunt.template.today("dd.mm.yyyy") %> by <%= pkg.author %>\n'
                },
                src: '<%= concat.app.dest %>',
                dest: '<%= concat.app.dest %>'
            }
        },
        jshint: {
            options: {
                esversion: 6,
                eqeqeq: false,
                eqnull: true,
                "-W041": false,
                noempty: true,
                nonbsp: true,
                strict: true,
                undef: true,
                unused: false,
                laxcomma: true,
                proto: true,
                globals: {
                    alert : true,
                    promt : true,
                    define:true,
                    exports : true,
                    global : true,
                    // browser
                    FormData : true,
                    DocumentTouch : true,
                    Element : true,
                    NodeList : true,
                    HTMLCollection : true,
                    console: true,
                    module: true,
                    require: true,
                    window: true,
                    document: true,
                    setTimeout: true,
                    clearTimeout : true,
                    setInterval : true,
                    clearInterval : true,
                    XMLHttpRequest: true,
                    screen: true,
                    Image: true,
                    ArrayBuffer: true,
                    DataView: true,
                    Int8Array: true,
                    Uint8Array: true,
                    Uint8ClampedArray: true,
                    Int16Array: true,
                    Uint16Array: true,
                    Uint32Array: true,
                    Float32Array: true,
                    Float64Array: true,
                    Map: true,
                    requestAnimationFrame : true,
                    MutationObserver : true,
                    Blob: true,
                    Worker: true,
                    URL: true,
                    // libs
                    jQuery: true,
                    $: true,
                    addPropertyWithEvent : true,
                    THREE : true,
                    TWEEN : true,
                    Stats : true,
                    zip : true,
                    //
                    spine : true,
                    //
                    he : true
                },
                reporter: require('jshint-stylish')
            },
            files: [
                '<%= concat.app.dest %>',
                '<%= concat.app_room_customizer.dest %>'
            ]
        },
        clean: ['public'],
        copy: {
            jquery: {
                files: [
                  // includes files within path and its sub-directories
                  // { expand: true, src: ['assets/**/*'], dest: 'public/' },
                  { expand: true, cwd: 'js-jquery-libs/', src: ['**/*'], dest: 'public/jquery' },
                ]
            },
            images: {
                files: [
                    {expand: true, cwd: 'js-dev/libs/gradient_picker/images/', src: ['**'], dest: 'public/libs/images'},
                    {expand: true, cwd: 'js-dev/libs/colorpicker/images/', src: ['**'], dest: 'public/images'}
                ]
            },
            zLib: {
                files: [
                  { expand: true, flatten: true, src: ['js-dev/zip-lib/*'], dest: 'public/zip-lib/' }
                ]
            }
        },
        watch: {
            scripts: {
                files: ['js-dev/**/*.js'],
                tasks: ['default'],
                options: {
                    spawn: false,
                    debounceDelay: 800,
                },
            },
        }
    });

    grunt.registerTask('default', [ 'clean', 'concat', 'jshint', "copy" ]); // "uglify"]);
    grunt.registerTask('dev', ['clean' ,'concat', 'jshint', "copy" ]);
};
