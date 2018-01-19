function viewFormPost(locals) {
var jade_debug = [{ lineno: 1, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (url, undefined, fields) {
var jade_indent = [];
jade_debug.unshift({ lineno: 0, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_debug.unshift({ lineno: 2, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_mixins["mixin_field"] = function( field,k ){
var block = (this && this.block), attributes = (this && this.attributes) || {};
jade_debug.unshift({ lineno: 4, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_debug.unshift({ lineno: 4, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
buf.push("\n");
buf.push.apply(buf, jade_indent);
buf.push("<input type=\"text\"" + (jade.attr("name", k, true, false)) + (jade.attr("value", field, true, false)) + "/>");
jade_debug.shift();
jade_debug.shift();
};
jade_debug.shift();
jade_debug.unshift({ lineno: 6, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
buf.push("\n<form" + (jade.attr("action", url, true, false)) + " method=\"post\" class=\"layout-invisible\">");
jade_debug.unshift({ lineno: undefined, filename: jade_debug[0].filename });
jade_debug.unshift({ lineno: 8, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
// iterate fields
;(function(){
  var $$obj = fields;
  if ('number' == typeof $$obj.length) {

    for (var k = 0, $$l = $$obj.length; k < $$l; k++) {
      var field = $$obj[k];

jade_debug.unshift({ lineno: 8, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_debug.unshift({ lineno: 9, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_indent.push('  ');
jade_mixins["mixin_field"]( field,k );
jade_indent.pop();
jade_debug.shift();
jade_debug.shift();
    }

  } else {
    var $$l = 0;
    for (var k in $$obj) {
      $$l++;      var field = $$obj[k];

jade_debug.unshift({ lineno: 8, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_debug.unshift({ lineno: 9, filename: "D:/pro/web/Andrew/game/customizer/proto/customizer.post/view/formPost.jht" });
jade_indent.push('  ');
jade_mixins["mixin_field"]( field,k );
jade_indent.pop();
jade_debug.shift();
jade_debug.shift();
    }

  }
}).call(this);

jade_debug.shift();
jade_debug.shift();
buf.push("\n</form>");
jade_debug.shift();
jade_debug.shift();}.call(this,"url" in locals_for_with?locals_for_with.url:typeof url!=="undefined"?url:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined,"fields" in locals_for_with?locals_for_with.fields:typeof fields!=="undefined"?fields:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "\nmixin mixin_field( field,k )\n\n  input( type='text', name=k, value=field )\n\nform.layout-invisible( action=url, method=\"post\" )\n\n  each field,k in fields\n    +mixin_field( field,k )\n");
}
}