//
//
var CanvasSpinner = function( dom , divider){

    "use strict";

    var self = this;

    if (!dom)
        throw "Select DOM";

    self.init = function(){

        if (canvas)
            return;

        canvas = document.createElement('canvas');

        var rect = dom.getBoundingClientRect();
        var max = rect.width > rect.height? rect.width : rect.height;
        canvas.width = max / divider;
        canvas.height = max / divider;
        canvas.style.position = "absolute";
        canvas.style.top = Math.round(rect.top + rect.height / 2 - canvas.height / 2) + "px";
        canvas.style.left = Math.round(rect.left + rect.width / 2 - canvas.width / 2) + "px";
        canvas.style.zIndex = "100";

        document.body.appendChild(canvas);

        start = new Date();  

        loader_interval = setInterval(draw, 1000 / 30);

        return self;
    };

    self.deallocate = function(){
        if (!canvas)
            return;
        clearInterval(loader_interval);
        document.body.removeChild(canvas);
        canvas = null;
        loader_interval = 0;
        return self;
    };

    // ===============

    var canvas = null;
    var loader_interval = 0;
    var start = new Date();
    var lines = 16;  

    function draw(){
        if (!canvas)
            return;

        var rect = dom.getBoundingClientRect();
        var max = rect.width > rect.height? rect.width : rect.height;
        canvas.width = max / divider;
        canvas.height = max / divider;
        canvas.style.top = Math.round(rect.top + rect.height / 2 - canvas.height / 2) + "px";
        canvas.style.left = Math.round(rect.left + rect.width / 2 - canvas.width / 2) + "px";

        var context = canvas.getContext('2d');
        var cW = context.canvas.width;
        var cH = context.canvas.height;
        
        var rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;

        var line_length = cW;

        context.save();
        context.clearRect(0, 0, cW, cH);
        context.translate(cW / 2, cH / 2);
        context.rotate(Math.PI * 2 * rotation);

        for (var i = 0; i < lines; i++) {
            context.beginPath();
            context.rotate(Math.PI * 2 / lines);
            context.moveTo(line_length / 10, 0);
            context.lineTo(line_length / 4, 0);
            context.lineWidth = line_length / 30;
            context.strokeStyle = "rgba(0, 0, 0," + i / lines + ")";
            context.stroke();
        }
        context.restore();
    }
};