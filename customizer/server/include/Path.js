(function(){

var Self = Wtools;
var _ = Wtools;

//

var urlDocument = function( path,options ) {

  var options = options || {};

  if( path === undefined ) path = window.location.href;

  if( path.indexOf( '//' ) === -1 )
  {
    path = 'http:/' + ( path[0] === '/' ? '' : '/' ) + path;
  }

  var a = path.split( '//' );
  var b = a[ 1 ].split( '?' );

  //

  if( options.withoutServer )
  {
    var i = b[ 0 ].indexOf( '/' );
    if( i === -1 ) i = 0;
    return b[ 0 ].substr( i );
  }
  else
  {
    if( options.withoutProtocol ) return b[0];
    else return a[ 0 ] + '//' + b[ 0 ];
  }

}

//

var urlServer = function( path ) {

  var a,b;

  if( path === undefined ) path = window.location.href;

  if( path.indexOf( '//' ) === -1 )
  {
    if( path[0] === '/' ) return '/';
    a = [ '',path ]
  }
  else
  {
    a = path.split( '//' );
    a[ 0 ] += '//';
  }

  b = a[1].split( '/' );

  console.log( 'urlServer',path,'->',a[0] + b[0] );

  return a[0] + b[0];
}

//

var urlQuery = function( path ) {

  if( path === undefined ) path = window.location.href;

  if( path.indexOf( '?' ) === -1 ) return '';
  return path.split( '?' )[ 1 ];
}

//

var urlDequery = function( query ) {

  var result = {};
  var query = query || window.location.search.split('?')[1];
  if( !query || !query.length ) return result;
  var vars = query.split("&");
  for( var i=0;i<vars.length;i++ ){

    var w = vars[i].split("=");
    w[0] = decodeURIComponent( w[0] );
    if( w[1] === undefined ) w[1] = '';
    else w[1] = decodeURIComponent( w[1] );

    if( (w[1][0] == w[1][w[1].length-1]) && ( w[1][0] == '"') )
    w[1] = w[1].substr( 1,w[1].length-1 );

    if( result[w[0]] === undefined ) {
      result[w[0]] = w[1];
    } else if( Wtools.strIs( result[w[0]] )){
      result[w[0]] = result[result[w[0]], w[1]]
    } else {
      result[w[0]].push(w[1]);
    }

  }

  return result;
}

//

var urlIs = function( url ){

  var p =
    '^(https?:\\/\\/)?'                                     // protocol
    + '(\\/)?'                                              // relative
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'    // domain
    + '((\\d{1,3}\\.){3}\\d{1,3}))'                         // ip
    + '(\\:\\d+)?'                                          // port
    + '(\\/[-a-z\\d%_.~+]*)*'                               // path
    + '(\\?[;&a-z\\d%_.~+=-]*)?'                            // query
    + '(\\#[-a-z\\d_]*)?$';                                 // anchor

  var pattern = new RegExp( p,'i' );
  return pattern.test( url );

}

//

var urlDataIs = function( url ){
  return url.substring( 0,5 ) == 'data:';
}

//

var urlJoin = function() {

  var result = _pathJoin( arguments,{ relative : 0, url : 1 } );
  return result;
}

/*
  if( src2.indexOf( '//' ) !== -1 ) return src2;

  if( src1[src1.length-1] === '/' ) src1 = src1.substr( 0,src1.length-1 );

  if( src2[0] === '/' )
  {
    src1 = urlServer( src1 );
    return src1 + src2;
  }
  else
  {
    return src1 + '/' + src2;
  }

}
*/
/*
  if( !_.strIs( src2 ) ) throw _.err( 'pathJoin','require strings as arguments' );

  if( src2.indexOf( '//' ) !== -1 ) return src2;

  if( src1[src1.length-1] === '/' ) src1 = src1.substr( 0,src1.length-1 );

  if( src2[0] === '/' )
  {
    return src2;
  }
  else
  {
    return src1 + '/' + src2;
  }
*/

// -- path

var _pathJoin = function( pathes,options ) {

  var result = '';

  for( var a = pathes.length-1 ; a >= 0 ; a-- )
  {

    if( !_.strIs( pathes[ a ] ) ) throw _.err( 'pathJoin','require strings as path' );

    var src = pathes[ a ];

    if( result && result[ 0 ] !== '/' ) result = '/' + result;
    if( result && src[ src.length-1 ] === '/' ) src = src.substr( 0,src.length-1 );

    result = src + result;

    //if( src.indexOf( '//' ) !== -1 ) return result;
    if( !options.relative )
    {
      if( options.url )
      {
        if( src.indexOf( '//' ) !== -1 ) return result;
      }
      if( src[ 0 ] === '/' )
      {
        //if( options.url ) return urlServer( pathes[ 0 ] ) + result;
        //else
        return result;
      }
    }

  }

  //console.log( '_pathJoin',pathes,'->',result );

  return result;
}

//

var pathJoin = function() {

  var result = _pathJoin( arguments,{ relative : 0 } );
  return result;
}

//

var pathJoinRelative = function() {

  var result = _pathJoin( arguments,{ relative : 1 } );
  return result;
}

//

var pathName = function( path ) {

  return path.replace(/^.*[\\\/]/, '');

}

//

var pathExt = function( path ) {

  var index = path.lastIndexOf('/');
  if( index >= 0 ) path = path.substr( index,path.length-index  );
  var index = path.lastIndexOf('.');
  if( index === -1 ) return '';
  index += 1;
  return path.substr( index,path.length-index );

}

//

var pathPrefix = function( path ) {

  var n = path.lastIndexOf( '/' );
  if( n === -1 ) n = 0;

  var parts = [ path.substr( 0,n ),path.substr( n ) ];

  var n = parts[ 1 ].indexOf( '.' );
  if( n === -1 ) n = parts[ 1 ].length;

  var result = parts[ 0 ] + parts[ 1 ].substr( 0, n );
  //console.log( 'pathPrefix',path,'->',result );
  return result;
}

//

var pathWithoutExt = function( path ) {

  var n = path.indexOf( '.' );
  if( n === -1 ) n = path.length;
  var result = path.substr( 0, n );
  return result;
}

//

var pathChangeExt = function( path,ext ) {

  return pathWithoutExt( path ) + '.' + ext;

}

//

var pathNameWithoutExt = function( path ) {

  return pathWithoutExt( pathName( path ) );

}

// -- var

var EPS = 0.000001;
var EPS2 = EPS*EPS;
var SQRT2 = 1.4142135623730950488016887242097;

// -- prototype

_.mapExtend( Self,{


  urlDocument: urlDocument,
  urlServer: urlServer,
  urlQuery: urlQuery,
  urlDequery: urlDequery,
  urlIs: urlIs,
  urlDataIs: urlDataIs,
  urlJoin: urlJoin,

  _pathJoin: _pathJoin,
  pathJoin: pathJoin,
  pathJoinRelative: pathJoinRelative,
  pathName: pathName,
  pathPrefix: pathPrefix,
  pathWithoutExt: pathWithoutExt,
  pathNameWithoutExt: pathNameWithoutExt,
  pathChangeExt: pathChangeExt,
  pathExt: pathExt,

});

//_.mapExtend( Wtools,Proto );

// -- export

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
}

})();