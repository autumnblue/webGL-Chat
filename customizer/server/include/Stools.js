(function(){

var os = require( 'os' );
var sys = require( 'sys' );
var http = require( 'http' );
var url = require( 'url' );
var Path = require( 'path' );
var fs = require( 'fs-extra' );
var assert = require( 'assert' );

var Wtools = require( './Wtools.js' );
require( './Path.js' );
Stools = Wtools;

var Parent = Wtools;
var Self = Stools;
var _ = Stools;

// -- config

var configRead = function( options ){

  var self = this;
  var result;

  var log = function(){

    return result;
    console.log( 'Config:' );
    console.log( result );
    console.log( '' );
    return result;

  }

  var options = options || {};
  if( options.path === undefined ) options.path = _.pathNormalize( __dirname + '/../' );
  if( options.name === undefined ) options.name = 'config';

  if( typeof Coffee !== 'undefined' )
  {
    var fileName = _.pathJoin( options.path, options.name + '.coffee' );
    //console.log( 'fileName',fileName );
    if( fs.existsSync( fileName ) ) {

      result = Coffee.eval( fs.readFileSync( fileName, 'utf8'),{
      //self.config = NodeParser.coffeeExecute( fs.readFileSync( fileName, 'utf8'),{
        filename : fileName,
        //context : self,
        //sandbox : self.sandbox,
      });

    }
  }

  if( result ) return log();
  var fileName = _.pathJoin( options.path, options.name + '.json' );
  if( fs.existsSync( fileName ) ) {

    result = JSON.parse( fs.readFileSync( fileName, 'utf8') );

  }

  if( result ) return log();
  result = {};

  return log();
}

// -- path

var pathNormalize = function( src ){

  var result = Path.normalize( src ).replace( /\\/g,'/' );
  return result;
}

//

var pathRelative = function( relative,path ){

  var result = Path.relative( relative,path );
  result = _.pathNormalize( result );

  return result;
}

// --

var allowCrossDomain = function( request, response ) {

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
  response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

};

//

var returnError = function( request, response, next, err ) {

  var self = this;

  //console.log( 'returnError', 'response.finished:', response.finished );

  //if( !response.finished && !response._headerSent )
  if( !response.finished )
  {

    response.writeHead( 400,{ "Content-Type": "text/plain" });
    if( err ) response.write( 'Error:\n' + String( err ) );
    else response.write( 'Not found' );
    response.end();
    //next();

  }

  if( err ) console.warn( 'Error:\n' + String( err ) );

  //if( err ) throw err;
}

//

var getPostData = function( request, response, onReady ) {

  var self = this;

  if( request.readable ) {

    request.data = '';

    request.on('data', function (data) {
      if( request.data.length > 1e6 ) {
        response.json({ error: 'Request entity too large.' }, 413);
        console.warn( 'Request entity too large.',request.data.length );
      }
      request.data += data;
    });

    request.on('end', function () {
      onReady( request.data );
    });

  }
  else {

    request.data = request.body;
    onReady( request.body );

  }
}

//

var connectDatabase = function( onReady ){

  var self = this;

  if( typeof Mongo === 'undefined' ) Mongo = require( 'mongodb' );

  Mongo.MongoClient.connect( self.dbServer, function( err, db ) {

    assert.equal( null, err );

    db.authenticate( self.dbUser, self.dbPassword, function( err, result ) {

      assert.equal( null, err );

      if( Config.debug ) console.log( "Connected to database ",self.dbServer );
      self.db = db;
      if( self.dbCollection ) self.collection = self.db.collection( self.dbCollection );
      if( onReady ) onReady.call( self );

    });

  });

}

// -- prototype

_.mapExtend( Self,Wtools );
_.mapExtend( Self,{

  // -- config
  configRead: configRead,

  // -- path
  pathNormalize: pathNormalize,
  pathRelative: pathRelative,

  // -- server
  getPostData: getPostData,
  connectDatabase: connectDatabase,
  allowCrossDomain: allowCrossDomain,
  returnError: returnError,

  // -- var
  //Config: Config,

});

//

var _ = Self;
Config = _.configRead();

// -- export

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
} else if (typeof window !== "undefined" && window !== null) {
  window['Stools'] = Self;
}

})();