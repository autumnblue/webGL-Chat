(function(){

Printer = function () {
  arguments.callee.prototype.init.apply( this,arguments );
};

var Self = Printer;
var Parent = null;
var _ = Wtools;

//

var init = function( options ) {

  var self = this;
  options = options || {};
  Wtools.mapExtend( self,options );

  self.format = _.clone( self.format );

}

//

var bindWriter = function( name,routine,context ) {

  //

  var write = function() {

    //if( arguments[ 0 ] && arguments[ 0 ].indexOf &&  arguments[ 0 ].indexOf( 'assessment.modal.jade' ) !== -1 )
    //console.log( xxx );

    var args = Array.prototype.slice.call( arguments,0 );
    args.unshift( this.format.prefix.current );
    args.push( this.format.postfix.current );
    return routine.apply( context,args );

  }

  //

  var writeUp = function() {

    var result = this[name].apply( this,arguments );
    this.up();
    return result;

  }

  //

  var writeDown = function() {

    this.down();
    if( arguments.length )
    var result = this[name].apply( this,arguments );
    return result;

  }

  this[ name ] = write;
  this[ name + 'Up' ] = writeUp;
  this[ name + 'Down' ] = writeDown;

}

//

var up = function( delta ) {

  if( delta === undefined ) delta = 1;
  for( var d = 0 ; d < delta ; d++ )
  {
    var fix = this.format.prefix;
    if( Wtools.strIs( fix.up ) ) fix.current += fix.up;
    else if( Wtools.arrayIs( fix.up ) ) fix.current = fix.current.substring( fix.up[0],fix.current.length - fix.up[1] );
    var fix = this.format.postfix;
    if( Wtools.strIs( fix.up ) ) fix.current += fix.up;
    else if( Wtools.arrayIs( fix.up ) ) fix.current = fix.current.substring( fix.up[0],fix.current.length - fix.up[1] );
    this.format.level++;
  }
}

//

var down = function( delta ) {

  if( delta === undefined ) delta = 1;
  for( var d = 0 ; d < delta ; d++ )
  {
    this.format.level--;
    var fix = this.format.prefix;
    if( Wtools.strIs( fix.down ) ) fix.current += fix.down;
    else if( Wtools.arrayIs( fix.down ) ) fix.current = fix.current.substring( fix.down[0],fix.current.length - fix.down[1] );
    var fix = this.format.postfix;
    if( Wtools.strIs( fix.down ) ) fix.current += fix.down;
    else if( Wtools.arrayIs( fix.down ) ) fix.current = fix.current.substring( fix.down[0],fix.current.length - fix.down[1] );
  }

}

// -- var

var format =
{
  level : 0,
  prefix:
  {
    current: '',
    up: '  ',
    down: [2,0]
  },
  postfix:
  {
    current: '',
    up: '',
    down: ''
  }
}

// -- prototype

var Proto =
{

  // -- routine
  init: init,
  bindWriter: bindWriter,
  up: up,
  down: down,

  // -- var
  format: format

};

Self.prototype = Proto;

// -- export

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
} else if (typeof window !== "undefined" && window !== null) {
  window['Printer'] = Self;
}

})();