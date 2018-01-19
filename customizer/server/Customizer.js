( function(){

var os = require( 'os' );
var sys = require( 'sys' );
var http = require( 'http' );
var url = require( 'url' );
var Path = require( 'path' );
var fs = require( 'fs-extra' );
var exec = require( 'child_process' ).exec;

var stringify = require( 'json-stringify-safe' );
var Request = require( 'request' );
var Jade = require( 'jade' );

var Express = require( 'express' );
Express.Params = require( 'express-params' );

var assert = require( 'assert' );
var Mongo = require( 'mongodb' );
var inspect = require( 'util' ).inspect;
var Busboy = require( 'busboy' );
var qs = require( 'qs' )

var gm = require( 'gm' );

var Commander = require( './include/Commander.js' );

Stools = require( './include/Stools.js' );
require( './include/Files.js' );
require( './include/Format.js' );

//

CharacterCustomizer = function () {
  arguments.callee.prototype.init.apply( this,arguments );
};

var Self = CharacterCustomizer;
var Parent = null;
var _ = Stools;

// -- constructor

var init = function( options ) {

  var self = this;
  if( !options ) options = {};
  _.extend( self,options );
  if( !self.name ) self.name = 'CharacterCustomizer';

  // db

  if( self.dbServer === undefined ) self.dbServer = 'mongodb://127.0.0.1:27017/admin';
  if( self.dbCollection === undefined ) self.dbCollection = 'users';
  if( self.dbUser === undefined ) self.dbUser = 'admin';
  if( self.dbPassword === undefined ) self.dbPassword = 'MongoMongo27017';

  // jade

  if( self.jadePath === undefined ) self.jadePath = '../view/';
  if( self.jadeCustomizer === undefined ) self.jadeCustomizer = self.jadePath + 'customizer.sht';
  if( self.jadeDetails === undefined ) self.jadeDetails = self.jadePath + 'menu.detail.pick.sht';

  // url

  if( self.url === undefined ) self.url = '/'
  if( self.urlCustomizer === undefined ) self.urlCustomizer = _.pathJoin( self.url, 'customizer' );
  if( self.urlCharacter === undefined ) self.urlCharacter = _.pathJoin( self.urlCustomizer, 'character' );
  if( self.urlMenDetails === undefined ) self.urlDetails = _.pathJoin( self.urlCustomizer, 'details' );

  // path

  if( self.pathUpload === undefined ) self.pathUpload = _.pathNormalize( _.pathJoin( __dirname,'../file/' ) );
  if( self.pathUploadImage === undefined ) self.pathUploadImaged = _.pathNormalize( _.pathJoin( __dirname,'./' ) );

  if( self.pathDownload === undefined ) self.pathDownload = _.pathNormalize( _.pathJoin( __dirname,'../download/' ) );
  if( !fs.existsSync( self.pathDownload ) ) self.pathDownload = _.pathNormalize( _.pathJoin( __dirname,'../upload/' ) );
  if( !fs.existsSync( self.pathDownload ) ) throw _.err( 'Customizer.js:','cant find "download folder"' );
  if( self.pathCharacter === undefined ) self.pathCharacter = _.pathJoin( self.pathDownload,'character/' );

  if( self.pathEmpty === undefined ) self.pathEmpty = _.pathJoin( self.pathDownload,'character/empty.png' );

  // mask

  if( self.maskImage === undefined ) self.maskImage = new RegExp( '\.(png|jpg|gif)', 'i' );
  if( self.maskExclude === undefined ) self.maskExclude = /(^|\/)-/;
  if( self.maskExpression === undefined ) self.maskExpression = '-expressions';


  // etc

  if( self.attempts === undefined ) self.attempts = 10;

  //var gm = _.pathNormalize( _.pathJoin( __dirname,'../gm/gm' ) );
  //if( fs.existsSync( gm ) ) self.gm = gm + ' ';
  //gm += '.exe';
  //if( fs.existsSync( gm ) ) self.gm = gm + ' ';

  //if( self.commanderOptions === undefined ) self.commanderOptions = { path : _.pathNormalize( _.pathJoin( __dirname,'../gm/gm' ) ) };
  Commander.prototype.path = _.arrayCopy( Commander.prototype.path,_.pathNormalize( _.pathJoin( __dirname,'../gm' ) ) );

  self.initResources();
  self.initCommander();

  // bind

  if( self.app === undefined ) self.app = Express();

  self.app.use( _.bind( self.requestHandler,self ) );
  self.app.all( new RegExp( _.regexpEscape( self.urlCustomizer )              + '\/?$' ),     _.bind( self.requestCustomizer,self ) );
  self.app.all( new RegExp( _.regexpEscape( self.urlCharacter )               + '\/?$' ),     _.bind( self.requestCharacter,self ) );
  self.app.all( new RegExp( _.regexpEscape( self.urlDetails )                 + '\/?$' ),     _.bind( self.requestDetails,self ) );

  /*
  var c = new Commander().raw( 'echo %PATH% $PATH' ).exec({ onEnd: function( err,out ){
    console.log( 'err',err );
    console.log( 'out',out );
  }});
  */

  if( Config.debug ) console.log( self.name,'bound.' );
}

//

var initResources = function( details ) {

  var self = this;
  self.resource = {};

  // detail types

  self.resource.detailTypes = _.filesFind({

    relative : self.pathDownload,
    path: _.pathJoin( self.pathCharacter,'detail' ),
    mask: self.maskImage,
    recursive : 1,

  });
  self.proceedDetails( self.resource.detailTypes );

  // female character

  self.resource.females = _.filesFind({

    relative : self.pathDownload,
    path: _.pathJoin( self.pathCharacter,'female' ),
    mask: { includeAll: [ self.maskImage,/\/body\/.+/,'-preview' ] },
    exclude: [ self.maskExclude ],
    recursive : 1,

  });
  self.proceedDetails( self.resource.females );

  // male character

  self.resource.males = _.filesFind({

    relative : self.pathDownload,
    path: _.pathJoin( self.pathCharacter,'male' ),
    mask: { includeAll: [ self.maskImage,/\/body\/.+/,'-preview' ] },
    exclude: [ self.maskExclude ],
    recursive : 1,

  });
  self.proceedDetails( self.resource.males );

}

//

var initCommander = function() {

  Commander.prototype.execInfo = function( path,options ) {

    this
    .raw( 'gm' )
    .raw( 'identify','-ping','-verbose' )
    .arg( path )
    .exec( _.mapCopy( options,{ onEnd: function( err,output ){

      if( err )
      {
        if( options.onEnd ) options.onEnd.call( this,err );
        return;
      }
      var info = _.strReadConfig( output );
      info.size = info[ 'Geometry' ].split( 'x' ).map( function( src ){ return Number( src ); } );
      if( options.onEnd ) options.onEnd.call( this,err,info );

    }}));

  }

  Commander.prototype.newPage = function( size ) {

    this
    .raw( 'gm' )
    .raw( 'convert' )
    .raw( '-colorspace Transparent' )
    .raw( '-background transparent' )
    .raw( '-quality 100' )
    .raw( '-page ' + size[ 0 ] + 'x' + size[ 1 ] )
    ;

  }

}

// -- tool

var proceedDetails = function( details ) {

  for( var d = 0 ; d < details.length ; d++ )
  {
    var detail = details[ d ]
    detail[ 'type' ] = /([^-]+)/.exec( detail.name )[ 1 ];
    detail[ 'title' ] = detail[ 'type' ];
    detail[ 'title' ] = detail[ 'title' ][ 0 ].toUpperCase() + detail[ 'title' ].substr( 1 );
    var file = /([^-]+)-.+(\..+)/.exec( detail.file );
    if( file ) detail[ 'file' ] = file[ 1 ] + file[ 2 ];
  }

  return details;
}

// -- request

var requestCustomizer = function( request, response, next ) {

  var self = this;

  //console.log( 'request.params',request.params );
  //request.range = request.params;
  //request.range[ 0 ] = Number( request.range[ 1 ] ) || 1;
  //request.range[ 1 ] = Number( request.range[ 2 ] ) || 10;

  response.render( self.jadeCustomizer, {

    _ : self,
    details : self.resource.detailTypes,
    females : self.resource.females,
    males : self.resource.males,
    //db: db,
    //range: request.range,
    //count: count,

  });

  return 1;
}

//

var requestDetails = function( request, response, next ) {

  var self = this;

  var handleVerified = function( character )
  {

    var options = {};
    options._ = self;

    if( !character.pathCharacter ) return _.returnError( request, response, next, _.err( 'Customizer:','no base path' ) );
    if( !character.currentDetailType ) return _.returnError( request, response, next, _.err( 'Customizer:','no current detail type' ) );

    var path = _.pathJoin( self.pathDownload,character.pathCharacter,character.currentDetailType );

    options.details = [];

    {

      //console.log( 'requestDetails',path );
      options.details = _.filesFind({

          relative : self.pathDownload,
          path: path,
          mask: { includeAll: [ self.maskImage,'-preview' ] },
          exclude: [ self.maskExclude,self.maskExpression ],
          recursive : 1,
          ignoreNonexistent : 1,

      });
      proceedDetails( options.details );
      //console.log( 'options',options );

    }

    response.render( self.jadeDetails,options );

  }

  return self.requestCharacterVerify( request, response, next, handleVerified );
}

//

var requestCharacterVerify = function( request, response, next, onSuccess ) {

  var self = this;

  _.getPostData( request, response, function( data ){

    var err = 0;

    //var character = qs.parse( request.data );
    var character = JSON.parse( request.data );

    _.each( character,function( e,k,i ){

      if( _.strBegins( k,'path' ) )
      {
        var e = _.pathNormalize( e )
        character[ k ] = e;
        if( !_.strBegins( e,'character/' ) ) err = k + ':' + e;
      }

    });

    if( character.currentDetailType.indexOf( '..' ) !== -1 ) err = 'character.currentDetailType' + ':' + character.currentDetailType;

    if( !character.pathImage )
    {
      //character.pathImage = '/character/female/female01/body/female01-preview.png';

      character.id = _.idGenerateDate( 'chracter-' );
      character.pathImage = 'character/generated/' + character.id + '.png';
      character.pathImageTexture = 'character/generated/' + character.id + '-texture' + '.png';
      //character.pathImageExtended = 'character/generated/' + character.id + '-extended' + '.png';

    }

    if( err )
    {
      _.returnError( request, response, next, _.err( 'Customizer:','policy corruption:',err ) );
    }
    else
    {
      onSuccess( character );
    }

  });

  return 1;
}

//

// gm "convert" "-quality" "100" "D:/pro/web/Andrew/game/customizer/download/character/male/guy/body/guy01.png"
// -page +99+0 "-mosaic" "D:/pro/web/Andrew/game/customizer/download/character/generated/chracter.png"
// gm "identify" "-ping" "-verbose" "D:/pro/web/Andrew/game/customizer/download/character/male/guy/body/guy01.png"

//

var requestCharacter = function( request, response, next ) {

  var self = this;
  var join = _.pathJoin;

  var handleVerified = function( character )
  {

    var context = {};
    context.expressions = {};
    context.details = [[],[],[],[],[]];

    context.character = character;
    context.commander = new Commander();

    context.pathBody = join( self.pathDownload,character.pathBody );
    context.pathImage = join( self.pathDownload,character.pathImage );
    context.pathImageTexture = join( self.pathDownload,character.pathImageTexture );

    self.collectImages( context,function( err ){

      if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:',err ) );

      context.commander.execInfo( context.pathBody, { onEnd : function( err,info ){

        if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:',err ) );
        context.info = info;

        self.generateImage( context,function( err ){

          if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:',err ) );

          self.generateImageTexture( context,function( err ){

            if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:',err ) );

            response.writeHead( 200,{"Content-Type": "application/json"} );
            response.write( JSON.stringify( character ) );
            response.end();

          });

        });

      }});

    });

  }

  return self.requestCharacterVerify( request, response, next, handleVerified );
}

//

var collectImages = function( context,onEnd ) {

  var self = this;
  var join = _.pathJoin;
  var c = 1;

  // collect files

  context.details[ 1 ].push( context.pathBody );
  for( var d = 0 ; d < self.resource.detailTypes.length ; d++ )
  {
    var detailName = self.resource.detailTypes[ d ].name;

    if( detailName === 'head' ) c = 2;

    if( context.character.detail[ detailName ] === undefined ) continue;

    //

    var pathDetail = join( self.pathDownload, context.character.pathCharacter, detailName, context.character.detail[ detailName ] );

    // detail

    if( fs.existsSync( pathDetail + '.png' ) ) context.details[ c ].push( pathDetail + '.png' );
    if( fs.existsSync( pathDetail + '-back.png' ) ) context.details[ 0 ].push( pathDetail + '-back.png' );
    if( fs.existsSync( pathDetail + '-front.png' ) ) context.details[ 4 ].push( pathDetail + '-front.png' );

    // expressions

    context.expressions[ detailName ] = [];
    if( fs.existsSync( pathDetail + '-expression' ) )
    {

      context.expressions[ detailName ] = _.filesFind({
        relative : self.pathDownload,
        path: pathDetail + '-expression',
        mask: [ self.maskImage ],
        recursive : 1,
      });
      self.proceedDetails( context.expressions[ detailName ] );

    }

    //

    if( detailName === 'head' )
    {
      c = 3;

      if( !fs.existsSync( pathDetail + '.png' ) ) continue;

      var expressionFallback = _.fileRecord_( pathDetail + '-preview.png',{

        relative : self.pathDownload,

      });

      // find existing expressions

      context.expressionsMap = {};

      for( var e = 0 ; e < context.expressions[ detailName ].length ; e++ )
      {
        var expression = context.expressions[ detailName ][ e ];
        expression.expressionName = /([^-]+)(-.+)?/.exec( expression.name )[ 1 ];
        expression.expressionBlink = /.+-blink/.test( expression.name );
        expression.expressionIndex = self.expressionNames.indexOf( expression.expressionName );

        if( expression.expressionIndex === -1 ) continue;

        context.expressionsMap[ expression.expressionName + (expression.expressionBlink ? '-blink' : '') ] = expression;
      }

      // find missing expressions

      for( var e = 0 ; e < self.expressionNames.length ; e++ )
      {

        var expressionName = self.expressionNames[ e ];

        if( context.expressionsMap[ expressionName ] === undefined )
        {
          var expression = _.mapClone( expressionFallback );
          context.expressionsMap[ expressionName ] = expression;
          expression.expressionName = expressionName;
          expression.expressionBlink = 0;
          expression.expressionIndex = e;
        }

        expressionName += '-blink';

        if( context.expressionsMap[ expressionName ] === undefined )
        {
          var expression = _.mapClone( expressionFallback );
          context.expressionsMap[ expressionName ] = expression;
          expression.expressionName = expressionName;
          expression.expressionBlink = 1;
          expression.expressionIndex = e;
        }

      }

    }

  }

  //

  var detailName = 'head';
  if( context.character.detail[ detailName ] )
  {

    var pathHead = join( self.pathDownload, context.character.pathCharacter, detailName, context.character.detail[ detailName ] );

    if( fs.existsSync( pathHead + '-preview.png' ) ) pathHead += '-preview.png';
    else if( fs.existsSync( pathHead + '-back-preview.png' ) ) pathHead += '-back-preview.png';
    else if( fs.existsSync( pathHead + '-front-preview.png' ) ) pathHead += '-front-preview.png';

    //console.log( 'pathHead',pathHead );

    context.commander.execInfo( pathHead, { onEnd : function( err,info ){

      context.headInfo = info;
      if( onEnd ) onEnd.call( self.err );

    }});

  }
  else if( onEnd )
  {
    _.timeAfter( onEnd.call( self ) );
  }

}

//

var generateImage = function( context,onEnd ) {

  var self = this;

  context.commander.newPage( context.info.size );

  for( var p = 0 ; p < context.details.length ; p++ )
  {
    for( var d = 0 ; d < context.details[ p ].length ; d++ )
    {
      context.commander
      .arg( context.details[ p ][ d ] );
    }
  }

  context.commander
  .raw( '-mosaic' )
  .arg( context.pathImage )
  .exec({ onEnd: onEnd, tag : 'generateImage' });

}

//

var generateImageTexture = function( context,onEnd ) {

  var self = this;
  var expressions = context.expressions[ 'head' ];

  //if( !expressions ) return _.timeAfter( 0,onEnd );

  var size = [ context.info.size[ 0 ]*2 + 2*self.headSize[ 0 ], Math.max( context.info.size[ 1 ], 256 ) ];
  context.commander.newPage( size )

  for( var p = 0 ; p < context.details.length ; p++ )
  {

    if( p === 2 )
    continue;

    if( p === 3  )
    if( context.details[ 3 ].length > 0 || context.details[ 4 ].length > 0 )
    context.commander.raw( '-page +' + ( context.info.size[ 0 ] + 2*self.headSize[ 0 ] ) + '+0' )

    for( var d = 0 ; d < context.details[ p ].length ; d++ )
    {
      context.commander.arg( context.details[ p ][ d ] );
    }

  }

  if( context.character.detail[ 'head' ] && context.headInfo )
  {

    // draw expressions

    var expressionOffset =
    [
      Math.floor( ( self.headSize[ 0 ] - context.headInfo.size[ 0 ] ) / 2 ),
      Math.floor( ( self.headSize[ 1 ] - context.headInfo.size[ 1 ] ) / 2 ),
    ];

    for( var e in context.expressionsMap )
    {
      var expression = context.expressionsMap[ e ];
      if( expression.expressionIndex === -1 ) continue;

      var pos =
      [
        self.headSize[ 0 ] * ( expression.expressionBlink ? 1 : 0 ) + expressionOffset[ 0 ] + context.info.size[ 0 ],
        self.headSize[ 1 ] *   expression.expressionIndex           + expressionOffset[ 1 ],
      ];

      context.commander
      .raw( '-page +' + pos[ 0 ] + '+' + pos[ 1 ] )
      .arg( expression.absolute );
    }

  }

  //

  context.commander
  .raw( '-mosaic' )
  .arg( context.pathImageTexture )
  .exec({ onEnd: onEnd })
  ;

}

//
/*
var requestCharacterOld = function( request, response, next ) {

  var self = this;
  var join = _.pathJoin;

  var commander = new Commander();

  var handleVerified = function( character )
  {

    var pathBody = join( self.pathDownload,character.pathBody );
    var pathImage = join( self.pathDownload,character.pathImage );

    //

    var details = [[],[],[]];
    details[ 1 ].push( pathBody );
    for( var d in character.detail )
    {
      var detail = join( self.pathDownload, character.pathCharacter, d, character.detail[ d ] );
      if( fs.existsSync( detail + '.png' ) ) details[ 1 ].push( detail + '.png' );
      if( fs.existsSync( detail + '-back.png' ) ) details[ 0 ].push( detail + '-back.png' );
      if( fs.existsSync( detail + '-front.png' ) ) details[ 2 ].push( detail + '-front.png' );
      //console.log( 'detail',detail );
    }

    var sz = gm( pathBody )
    .identify(function( err, info ){

      if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:','identify',pathBody,err ) );

      info.size = [ info.size.width,info.size.height ];

      console.log( 'err',err );
      console.log( 'info',info );

      //

      var img = gm( '', '', '#fff' )
      //.options({ imageMagick: !!self.gm, appPath:self.gm })
      //.subCommand( self.gm ? ' ' : 'convert' )
      .in( self.gm ? 'convert' : '' )
      .in( '-quality', 100 );

      for( var p = 0 ; p < details.length ; p++ )
      {
        //img.page( p * info.size[ 0 ],0 );
        //img.in( '-page +' + p*info.size[ 0 ] + '+0' );

        for( var d = 0 ; d < details[ p ].length ; d++ )
        {
          img.in( details[ p ][ d ] );
          //img.in( '-page +' + p*info.size[ 0 ] + '+0' );
        }
      }

      img
      .mosaic()
      .write( pathImage, function( err ) {

        if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:',pathImage,err ) );

        var img = gm()
        .in( pathImage )
        .gravity( 'Center' )
        .extent( '128', '128' )
        //.extent( '128', '256' )
        .write( join( self.pathDownload,character.pathImageExtended ), function( err ) {

          if( err ) return _.returnError( request, response, next, _.err( 'Customizer.requestCharacter:',pathImageExtended,err ) );

          response.writeHead( 200,{"Content-Type": "application/json"} );
          response.write( JSON.stringify( character ) );
          response.end();

        });

      });

    });

    //console.log( 'sz',sz );

  }

  return self.requestCharacterVerify( request, response, next, handleVerified );
}
*/

/*
  img = gm( '', '', '#fff' )
    .in( '-quality', 100 )
    .in( 'public/' + req.body.hairB )
    .in( 'public/' + req.body.body )
    .in( 'public/' + req.body.head )
    .in( 'public/' + req.body.hairF )
    .in( 'public/' + req.body.shoes )
    .in( 'public/' + req.body.pants )
    .in( 'public/' + req.body.shirt )
    .in( 'public/' + req.body.access )
//      .out( '-background', 'rgba( 255,255,255,1000 )' )
    .mosaic()
    .write( 'public/renders/noCrop_' + id + '.png', function( err ) {
      if ( !err ) {
        img = gm().in( 'public/renders/noCrop_' + id + '.png' ).gravity( 'Center' ).extent( '128', '256' ).write( 'public/renders/img_' + id + '.png', function( err ) {
          if ( err ) console.log( err );
          else{
          res.send( 'renders/img_' + id + '.png' );}
        } );
      } else console.log( err );
    } );
*/

//

var requestHandler = function( request, response, next ) {

  var self = this;
  var result = null;

  if( response.finished ) return;
  if( !result ) next();
};

//

var headSize = [ 64,64 ];
var expressionNames = [ 'neutral','happy','sad','mad' ];

//

var Proto =
{

  init: init,
  initResources: initResources,
  initCommander: initCommander,

  // -- tool

  proceedDetails : proceedDetails,
  collectImages: collectImages,
  generateImage: generateImage,
  generateImageTexture: generateImageTexture,

  // -- request

  requestCustomizer: requestCustomizer,
  requestDetails: requestDetails,

  requestCharacterVerify: requestCharacterVerify,
  requestCharacter: requestCharacter,
  //requestCharacterOld: requestCharacterOld,

  requestHandler: requestHandler,

  // var

  headSize: headSize,
  expressionNames: expressionNames,

}

//

Self.prototype = Proto;
_.mapSupplement( Self.prototype,Stools );

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
}

})();