( function(){

var os = require( 'os' );
var sys = require( 'sys' );
var http = require( 'http' );
var url = require( 'url' );
var path = require( 'path' );
var fs = require( 'fs-extra' );
var exec = require( 'child_process' ).exec;

var stringify = require( 'json-stringify-safe' );
var Request = require( 'request' );
var assert = require( 'assert' );
var Jade = require( 'jade' );

var Express = require( 'express' );
Express.Params = require( 'express-params' );
Express.Logger = require( 'morgan' );

var Stools = require( './include/Stools.js' );
var Customizer = require( './Customizer.js' );

//

Server = function () {
  arguments.callee.prototype.init.apply( this,arguments );
};

var Self = Server;
var Parent = null;
var _ = Stools;

// -- constructor

var init = function( options ) {

  var self = this;
  if( !options ) options = {};
  _.extend( self,options );

  // jade

  if( self.jadePath === undefined ) self.jadePath = '../view/';

  // etc

  if( self.url === undefined ) self.url = '';

  // pre

  self.app = Express();
  self.app.use( _.bind( self.requestPreHandler,self ) );
  self.app.use( Express.Logger( 'dev' ) );

  // jade

  self.app.engine( 'sht', Jade.__express );
  self.app.locals.pretty = Config.debug;
  self.app.set( 'view engine', 'sht' );
  //self.app.set( 'view engine', 'jade' );
  self.app.set( 'views', self.jadePath );

  //self.app.use( '/www',Express.static( __dirname + '/www' ) );
  //self.app.use( '/www',Express.directory( __dirname + '/www' ) );

  //

  self.customizer = new Customizer({
    app: self.app,
    jadePath: self.jadePath,
  });

  // post

  //self.app.all( self.urlDiagnostics, _.bind( self.requestDiagnostics,self ) );
  self.app.use( _.bind( self.requestPostHandler,self ) );
  self.server = self.app.listen( 5555 );
  if( Config.debug )
  {
    console.log( 'App.locals:' );
    console.log( self.app.locals );
    console.log( '' );
    //console.log( 'App.settings:' );
    //console.log( self.app.settings );
    //console.log( '' );
    console.log( 'App launched.' );
    console.log( '' );
  }

}

// -- handler

var handleGetImageUrl = function( path,dbview ){

  var self = this;

  var result = path
    .replace( /^\.\./g, '' )
    .replace( /\/\.\//g, '/' );

  return result;
}

// -- request

var requestPreHandler = function( request, response, next ) {

  var self = this;
  var result = null;

  request.u = url.parse( request.url );
  //console.log( 'url',request.url );
  //console.log( 'u',request.u );
  //self.allowCrossDomain( request, response );

  next();

}

//

var requestPostHandler = function( request, response, next ) {

  var self = this;
  var result = null;

  if( response.finished ) return next( request, response, next );
  //console.log( 'url',request.url,result );
  //console.log( 'response.finished',response.finished );
  self.returnError( request, response, next );

}

//

var Proto =
{

  init: init,
  handleGetImageUrl: handleGetImageUrl,

  requestPreHandler: requestPreHandler,
  requestPostHandler: requestPostHandler,

}

//

Self.prototype = Proto;
_.mapSupplement( Self.prototype,Stools );

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
}

server = new Server();

})();