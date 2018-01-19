( function(){

var ChildProcess = require( 'child_process' );
var Path = require( 'path' );
//var spawn = require( 'child_process' ).spawn;
var Stools = require( './Stools.js' );

//

Commander = function() {
  arguments.callee.prototype.init.apply( this,arguments );
};

var Self = Commander;
var Parent = null;
var _ = Stools;

//

var init = function( options ) {

  var self = _.extend( this,options );

  if( self._command === undefined ) self._command = '';

  if( self._args === undefined ) self._args = [];

  if( self._options === undefined ) self._options = {};

  if( self.path )
  {
    if( self._options.env === undefined ) self._options.env = {};
    var path = process.env[ 'PATH' ] || process.env[ 'path' ];
    var delimeter = ( path.indexOf( ';' ) !== -1 ) ? ';' : ':';
    self._options.env[ 'PATH' ] = _.arrayAs( self.path ).map( function( a ){ return Path.normalize( a ); } ).join( delimeter ) + delimeter + path;
  }

}

//
/*
var command = function( command ) {

  var self = this;

  if( !_.strIs( command ) ) throw _.err( 'Commander.commnad:','require string' );

  self._command = command;

  return self;
}
*/
//

var raw = function() {

  var self = this;

  for( var a = 0 ; a < arguments.length ; a++ )
  {
    var argument = arguments[ a ];
    if( !_.strIs( argument ) ) throw _.err( 'Commander.raw:','require string' );
    self._args.push( argument );
  }

  return self;
}

//

var argument = function() {

  var self = this;

  for( var a = 0 ; a < arguments.length ; a++ )
  {
    var argument = arguments[ a ];
    if( !_.strIs( argument ) ) throw _.err( 'Commander.argument:','require string' );
    self._args.push( '"' + argument + '"' );
  }

  return self;
}

//

var exec = function( options ) {

  var self = _.extend( this,options );

  var err = null;
  var output = '';
  var error = '';
  var args = self._args;
  var command = self._args.join( ' ' );

  self.handleBegin( err, output, error, command );
  //console.log( 'command:',command );

  /*
  if ( self.sourceBuffer ) {

    proc.stdin.write( this.sourceBuffer );
    proc.stdin.end();

  } else if ( self.sourceStream ) {

    if ( !self.sourceStream.readable ) {
      err = new Error( "gm().stream() or gm().write() with a non-readable stream." );
      return handleEnd( err );
    }

    self.sourceStream.pipe( proc.stdin );

    if ( self.bufferStream && !this._buffering ) {

      if ( !Buffer.concat ) {
        throw new Error( noBufferConcat );
      }

      self._buffering = true;

      streamToBuffer( self.sourceStream, function( err, buffer ) {
        self.sourceBuffer = buffer;
        self.sourceStream = null;
      } )
    }
  }*/

  var proc = self.proc = ChildProcess.exec( command, self._options );

  proc.stdout.on( 'data', function( data ) {
    output += data;
  });

  proc.stderr.on( 'data', function( data ) {
    error += data;
  });

  proc.on( 'close', function( code, signal ) {

    if ( code !== 0 || signal !== null ) {
      err = _.err( 'Commander.exec:','failed','\nReqeust:',command,'\nError:',error );
      err.code = code;
      err.signal = signal;
    };

    self.handleEnd( err, output, error, command );

  });

  proc.on( 'error', function( err ){ self.handleEnd( err, output, error, command ); });

  return self;
}

//

var handleBegin = function( err, output, error, command ) {

  var self = this;

  if( self.executing ) throw _.err( 'Commander.handleBegin:','already executing' );

  self.executing = 1;

  if( self.onBegin) self.onBegin.call( self, err, output, error, command );

}

//

var handleEnd = function( err, output, error, command ) {

  var self = this;

  if( !self.executing ) return;

  self.executing = 0;
  self._args = [];

  if( err && self.onError ) self.onError.call( self, err, output, error, command );

  if( self.onEnd ) self.onEnd.call( self, err, output, error, command );

}

//

var onBegin = function(){
}

//

var onEnd = function(){
}

//

var onError = function(){
}

// -- prototype

Self.prototype =
{

  init: init,

  //

  //command: command,
  raw: raw,
  argument: argument,
  arg: argument,
  exec: exec,

  //

  handleBegin: handleBegin,
  handleEnd: handleEnd,

  //

  onBegin: onBegin,
  onEnd: onEnd,
  onError: onError,

};

// -- export

if( typeof module !== "undefined" && module !== null ) {
  module['exports'] = Self;
}

})();