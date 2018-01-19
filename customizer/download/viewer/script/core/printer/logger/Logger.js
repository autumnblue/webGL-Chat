(function(){

if( typeof require !== 'undefined' && typeof Printer === 'undefined' ) Printer = require( '../include/Printer.js' );
if( typeof require !== 'undefined' && typeof Wtools === 'undefined' ) Wtools = require( '../include/Wtools.js' );

Logger = function () {
  arguments.callee.prototype.init.apply( this,arguments );
};

var Self = Logger;
var Parent = Printer;
var _ = Wtools;

//

var init = function( options ) {

  var self = this;
  Parent.call( self,options );

  var methods = [
    "log", "debug", "error",
    "exception", "info", "warn",
  ];

  for( var m = 0 ; m < methods.length ; m++ )
  self.bindWriter( methods[ m ],console[ methods[ m ] ],console );

}

//

var replaceConsoleMethod = function( routine, methodName ) {

  return function () {

    var args;
    alert( "console." + methodName + ": " + Wtools.toStrFine( arguments ) );
    routine.call( console,arguments );
    //args = Array.prototype.slice.call( arguments, 0 );
    //Function.prototype.apply.call( routine, console, arguments );

  };

}

//

var redirectConsole = function(){

  var self = this;

  var methods = [
    "log", "assert", "clear", "count",
    "debug", "dir", "dirxml", "error",
    "exception", "group", "groupCollapsed",
    "groupEnd", "info", "profile", "profileEnd",
    "table", "time", "timeEnd", "timeStamp",
    "trace", "warn"
  ];

  for( var i = 0, l = methods.length; i < l; i++ ) {
    var m = methods[i];
    if( m in console ) {
      var was = console[m];
      console[m] = self.replaceConsoleMethod( was,m );
    }
  }

  window.onerror = function (msg, url, line) {
    alert( "Window error: " + msg + ", " + url + ", line " + line );
  };

}

// -- prototype

//if( typeof Logger === 'undefined' ) Logger = {};
var Proto =
{

  init: init,

  // -- routine
  //log: log,
  //warn: warn,
  //logUp: logUp,
  //logDown: logDown,
  //up: up,
  //down: down,

  //
  replaceConsoleMethod: replaceConsoleMethod,
  redirectConsole: redirectConsole,

  // -- var
  //format: format

};

Self.prototype = Object.create( Parent.prototype );
_.mapExtend( Self.prototype,Proto );

this.logger = new Logger();
this[ 'logger' ] = this.logger;
this.logger.log = this.logger[ 'log' ];
this.logger.logUp = this.logger[ 'logUp' ];
this.logger.logDown = this.logger[ 'logDown' ];

// -- export

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
} else if (typeof window !== "undefined" && window !== null) {
  window['Logger'] = Self;
}

})();