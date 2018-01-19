(function(){

_global = undefined;

if( !_global && typeof Global !== 'undefined' ) _global = Global;
if( !_global && typeof global !== 'undefined' ) _global = global;
if( !_global && typeof window !== 'undefined' ) _global = window;
if( !_global && typeof self   !== 'undefined' ) _global = self;

_global[ '_global' ] = _global;

if( typeof require === 'function' ) Underscore = require( 'underscore' );

if( typeof Wtools == 'undefined' )
{
  if( typeof Underscore !== 'undefined' ) Wtools = Underscore;
  else if( typeof _ !== 'undefined' ) Wtools = _;
  else Wtools = {};
}

var Self = Wtools;
var _ = Wtools;

// -- meta

var clone = function( src,options )
{

  var result;

  // options

  if( options !== undefined && !_.objectIs( options ) ) throw _.err( 'Wtools.clone:','need options' );

  var options = options || {};

  if( options.forWorker === undefined ) options.forWorker = 0;

  if( options.depth === undefined ) options.depth = 16;

  if( options.depth < 0 )
  {
    if( options.silent ) console.log( 'Wtools.clone: overflow' );
    else throw _.err( 'Wtools.clone:','overflow' );
  }

  //

  if( !src ) return src;

  /*
  var type = Object.prototype.toString.call( src );
  var types =
  {
    '[object Number]' : Number,
    '[object String]' : String,
    '[object Boolean]' : Boolean,
    '[object Date]' : Date
  };
  */

  /*
  if( types[type] !== undefined )
  {
    result = types[type]( src );
  }
  else
  */

  {

    if( arrayIs( src ) )
    {
      result = [];
      src.forEach(function( child, index, array ) {
        result[index] = clone( child,{
          depth: options.depth-1,
          silent:options.silent,
          forWorker: options.forWorker,
        });
      });
    }
    //else if( typeof src == "object" )
    else if( _.objectIs( src ) )
    {
      if( src.nodeType && typeof src.cloneNode === 'function' )
      {
        result = src.cloneNode( true );
      }
      else // if( !src.prototype )
      {
        result = {};
        var proto = Object.getPrototypeOf( src );
        /*
        if( len( proto ) )
        {
          function Result(){};
          Result.prototype = proto;
          result = new Result();
        }
        */
        //result = {};
        //result.__proto__ = proto;
        var result = Object.create( proto );
        for( var s in src )
        {
          if( !src.hasOwnProperty( s ) ) continue; // xxx
          var c = clone( src[ s ],{
            depth: options.depth-1,
            silent:options.silent,
            forWorker: options.forWorker,
          });
          //if( c === undefined )
          //console.warn( 'Guils.clone','dropped',s,src[ s ] );
          result[s] = c;
        }
      }
      //else
      //{
      //  result = src;
      //}
    } else if( src.constructor ) {

      if( options.forWorker )
      {
        var good = _.strIs( src ) || _.numberIs( src ) || _.dateIs( src ) || _.boolIs( src ) || _.regexpIs( src ) || _.bufferIs( src );
        if( good )
        {
          return src;
        }
        else
        {
          //console.warn( 'Guils.clone','dropped',src );
          return;
        }
      }
      else
      {
        if( _.routineIs( src ) ) result = src;
        else result = src.constructor( src );
      }

    } else {
      result = src;
    }

  }

  return result;
}

//

var same = function( src1,src2 ){

  if( Object.prototype.toString.call( src1 ) != Object.prototype.toString.call( src2 ) ) return false;
  if( arrayIs( src1 ) )
  {
    if( src1.length != src2.length ) return false;
    for( var i = 0 ; i < src1.length ; src1++ )
    if( src1[i] != src2[i] ) return false;
  }
  else if( objectIs( src1 ) )
  {
    if( len(src1) != len( src2 ) ) return false;
    for( var s in src1 )
    if( src1[s] != src2[s] ) return false;
  }
  else if( src1 != src2 ) return false;
  return true;

}

//

var len = function( src ) {
  if( src === undefined ) return 0;
  if( src.length !== undefined ) return src.length;
  else if( objectIs( src ) ) return Object.keys( src ).length;
  else return 1;
}

//

var each = function() {

  var i = 0;

  //var handlEach = function( e,k,i ){
  //
  //}

  var onEach = arguments[arguments.length-1];
  if( !_.routineIs( onEach ) ) throw 'Wtools.each: onEach is not routine';

  for( var arg = 0, l = arguments.length-1 ; arg < l ; arg++ )
  {

    var src = arguments[arg];

    if( _.arrayIs( src ) )
    {

      for( var a = 0 ; a < src.length ; a++ )
      {
        onEach.call( src,src[a],a,i );
        i++;
      }

    }
    else if( _.objectIs( src ) )
    {

      for( var a in src )
      {
        onEach.call( src,src[a],a,i );
        i++;
      }

    }
    else
    {

      onEach.call( src,src );

    }

  }

  return i;
}

//

var eachRecursive = function() {

  var i = 0;

  //var handlEach = function( e,k,i ){
  //
  //}

  var onEach = arguments[arguments.length-1];
  if( !Wtools.routineIs( onEach ) ) throw 'Wtools.each: onEach is not routine';

  for( var arg = 0, l = arguments.length-1 ; arg < l ; arg++ )
  {

    var src = arguments[arg];

    if( Wtools.arrayIs( src ) )
    {

      for( var a = 0 ; a < src.length ; a++ )
      {
        if( Wtools.arrayIs( src[a] ) || Wtools.objectIs( src[a] ) )
        {
          i += eachRecursive( src[a],onEach );
        }
        else
        {
          onEach.call( src,src[a],a,i );
          i++;
        }
      }

    }
    else if( Wtools.objectIs( src ) )
    {

      for( var a in src )
      {
        if( Wtools.arrayIs( src[a] ) || Wtools.objectIs( src[a] ) )
        {
          i += eachRecursive( src[a],onEach );
        }
        else
        {
          onEach.call( src,src[a],a,i );
          i++;
        }
      }

    }
    else
    {
      onEach.call( null,src,null,i );
    }

  }

  return i;
}

//

var elementWithKeyRecursive = function( src,key,onEach ){

  var i = 0;

  if( src[key] !== undefined )
  {
    if( onEach ) onEach.call( src,src[key],key,i );
    return src[key];
  }

  Wtools.eachRecursive( src,function( e,k,i ){

    if( k === key )
    {
      if( onEach ) onEach( e,k,i );
      return src[key];
    }

  });
}

//

var valueWithIndex = function( src,index ) {

  if( Wtools.arrayIs( src ) )
  {
    return src[index];
  }
  else if( Wtools.objectIs( src ) )
  {
    var i = 0;
    for( var s in src )
    {
      if( i === index ) return src[s];
      i++;
    }
  }
  else if( Wtools.strIs( src ) )
  {
    return src[index];
  }

}

//

var keyWithValue = function( src,value ) {

  var result = null;

  if( Wtools.arrayIs( src ) )
  {
    result = src.indexOf( value );
  }
  else if( Wtools.objectIs( src ) )
  {
    var i = 0;
    for( var s in src )
    {
      if( src[s] == value ) return s;
    }
  }
  else if( Wtools.strIs( src ) )
  {
    result = src.indexOf( value );
  }

  if( result === -1 ) result = null;
  return result;
}

// -- proto

var protoName = function( src ){
  return src.constructor.name;
  //var funcNameRegex = /function (.{1,})\(/;
  //var results = (funcNameRegex).exec(src.toString());
  //return (results && results.length > 1) ? results[1] : "";
};

//

var protoApply = function( constructor, args ) {
  var instance = Object.create( constructor.prototype );
  var result = constructor.apply( instance,args );
  return objectIs( result ) ? result : instance;
}

//

var protoApply2 = function( constructor, args ) {

  return Wtools.protoFunctor( constructor, args )();

}

//

var protoFunctor = function( constructor, args ) {

  return function() {

    var O = function(){};
    O.prototype = constructor.prototype;

    var instance = new O;
    var result = constructor.apply( instance, args );

    return objectIs( result ) ? result : instance;
  }

}

// -- convertet

var toCsv = function( src,options ) {

  var result = '';
  var options = options || {};

  if( !options.header )
  {

    options.header = [];

    Wtools.eachRecursive( Wtools.valueWithIndex( src,0 ),function( e,k,i ){
      options.header.push( k );
    });

  }

  if( options.cellSeparator === undefined ) options.cellSeparator = ',';
  if( options.rowSeparator === undefined ) options.rowSeparator = '\n';
  if( options.substitute === undefined ) options.substitute = '';
  if( options.withHeader === undefined ) options.withHeader = 1;

  //console.log( 'options',options );

  if( options.withHeader )
  {
    Wtools.eachRecursive( options.header,function( e,k,i ){
      result += e + options.cellSeparator;
    });
    result = result.substr( 0,result.length-options.cellSeparator.length ) + options.rowSeparator;
  }

  Wtools.each( src,function( row ){

    var rowString = '';

    Wtools.each( options.header,function( key ){

      var element = Wtools.elementWithKeyRecursive( row,key );
      if( element === undefined ) element = '';
      element = String( element );
      if( element.indexOf( options.rowSeparator ) !== -1 ) element = Wtools.strReplaceAll( element,options.rowSeparator,options.substitute );
      if( element.indexOf( options.cellSeparator ) !== -1 ) element = Wtools.strReplaceAll( element,options.cellSeparator,options.substitute );

      rowString += element + options.cellSeparator;

    });

    result += rowString.substr( 0,rowString.length-options.cellSeparator.length ) + options.rowSeparator;

  });

  return result;
}

//

var toBool = function( src ) {
  if( strIs( src ) )
  {
    src = src.toLowerCase();
    if( src == '0' ) return false;
    if( src == 'false' ) return false;
    if( src == 'null' ) return false;
    if( src == '' ) return false;
    return true;
  }
  return Boolean( src );
}

//

var toNumber = function( src ) {
  if( strIs( src ) )
  {
    return parseFloat( src );
  }
  return Number( src );
}

//

var toArray = function( src ) {
  if( Wtools.arrayIs( src ) ) return src;

  if( Wtools.strIs( src ) )
  {
    var sep = ( src.indexOf( ',' ) !== -1 )?( ',' ):' ';
    return src.split(/[, ]+/).map( function( s ){ if( s.length ) return parseFloat(s); } );
  }

  if( src instanceof THREE.Vector2 ) return [src.x,src.y]
  else if( src instanceof THREE.Vector3 ) return [src.x,src.y,src.z]
  else if( src instanceof THREE.Vector4 ) return [src.x,src.y,src.z,src.w]
  else return [src]
}

//

var toVector = function( src ) {
  if( Wtools.arrayIs( src ) )
  {
    switch( src.length )
    {
    case 1:
      return parseFloat( src[0] );
    case 2:
      return new THREE.Vector2( parseFloat( src[0] ),parseFloat( src[1] ) );
    case 3:
      return new THREE.Vector3( parseFloat( src[0] ),parseFloat( src[1] ),parseFloat( src[2] ) );
    case 4:
      return new THREE.Vector4( parseFloat( src[0] ),parseFloat( src[1] ),parseFloat( src[2] ),parseFloat( src[3] ) );
    default:
      return parseFloat( src );
    }
  }
  return parseFloat( src );
}

//

var toStr = function( src ) {

  var result = '';
  if( arrayIs( src ) )
  {
    if( src.length > 0 ) result = toStr( src[0] );
    for( var i = 1 ; i < src.length ; i++ )
    result += ', ' + toStr( src[i] );
  }
  else if( src instanceof THREE.Vector2 )
  {
    result = '( ' + toStr( src.x ) + ', ' + toStr( src.y ) + ' )';
  }
  else if( src instanceof THREE.Vector3 )
  {
    result = '( ' + toStr( src.x ) + ', ' + toStr( src.y ) + ', ' + toStr( src.z ) + ' )';
  }
  else if( src instanceof THREE.Vector4 )
  {
    result = '( ' + toStr( src.x ) + ', ' + toStr( src.y ) + ', ' + toStr( src.z ) + ', ' + toStr( src.w ) + ' )';
  }
  else if( src instanceof THREE.Matrix4 )
  {
    for( var i = 0 ; i < 4*4 ; i+=4 )
    result += '\n( ' + toStr( src.elements[i+0] ) + ', ' + toStr( src.elements[i+1] ) + ', ' + toStr( src.elements[i+2] ) + ', ' + toStr( src.elements[i+3] ) + ' )';
  }
  else
  {
    result = src;
  }
  return result;

}

//

var toStrFine = function( src,tab,noRoutine,limit ) {

  var result = '';
  var dtab = '  ';
  if( noRoutine === undefined ) noRoutine = 1;
  if( limit === undefined ) limit = 2;
  if( tab === undefined ) tab = '';

  if( !limit )
  {
    return '{...}';
  }
  limit--;

  if( src instanceof THREE.Vector2 )
  {
    result += '( ' + toStr( src.x ) + ', ' + toStr( src.y ) + ' )';
  }
  else if( src instanceof THREE.Vector3 )
  {
    result += '( ' + toStr( src.x ) + ', ' + toStr( src.y ) + ', ' + toStr( src.z ) + ' )';
  }
  else if( src instanceof THREE.Vector4 )
  {
    result += '( ' + toStr( src.x ) + ', ' + toStr( src.y ) + ', ' + toStr( src.z ) + ', ' + toStr( src.w ) + ' )';
  }
  else if( src instanceof THREE.Matrix4 )
  {
    var ntab = tab + '        ';
    for( var i = 0 ; i < 4 ; i++ )
    result += toStr( src.elements[i+0] ) + ', ' + toStr( src.elements[i+1] ) + ', ' + toStr( src.elements[i+2] ) + ', ' + toStr( src.elements[i+3] ) + '\n' + ntab;
  }
  else if( Wtools.routineIs( src ) && noRoutine )
  {
  }
  else if( objectIs( src ) )
  {
    if( len(src) === 0 ) return tab + '{}';
    result += '{\n';
    var ntab = tab + dtab;
    var i = 0;
    for( var s in src )
    {
      if( noRoutine && Wtools.routineIs( src[s] ) ) continue;
      result += ntab + toStr( s ) + ': ' + toStrFine( src[s],ntab,noRoutine,limit ) + ',' + '\n';
      i++;
    }
    result = result.substr( 0,result.length - 2 ) + '\n';
    result += tab + '}';
  }
  else if( Wtools.numberIs( src ) )
  {
    result += String( src );
  }
  else if( Wtools.strIs( src ) )
  {
    result += '"' + src + '"';
  }
  else if( src && src.length !== undefined )
  {
    if( src.length === 0 ) return '[]';
    result += '[';
    var ntab = tab + dtab;
    var simple = 1;
    for( var i = 0 ; i < src.length ; i++ )
    {
      simple = !arrayIs( src[i] ) && !objectIs( src[i] );
      if( !simple ) break;
    }
    if( simple )
    {
      for( var i = 0 ; i < src.length ; i++ )
      {
        if( noRoutine && Wtools.routineIs( src[i] ) ) continue;
        result += toStrFine( src[i],ntab,noRoutine,limit ) + ', ';
      }
      result = result.substr( 0,result.length - 2 );
    }
    else
    {
      for( var i = 0 ; i < src.length ; i++ )
      {
        if( noRoutine && Wtools.routineIs( src[i] ) ) continue;
        result += '\n' + ntab + toStrFine( src[i],ntab,noRoutine ) + ', ';
      }
      result = result.substr( 0,result.length - 2 ) + '\n' + tab;
    }
    result += ']';
  }
  else
  {
    result += '"' + src + '"';
  }
  return result;

}

//

var log = function() {

  var s = '';
  for( var i = 0, l = arguments.length; i < l; i++ )
  {
    s += toStr( arguments[i] ) + ' ';
  }
  console.log( s )

}

// -- type test

var mapIs = function( src ) {
  for( e in src ) return true;
  return false;
}

var htmlIs = function( src ) {
  return Object.prototype.toString.call( src ).indexOf( '[object HTML' ) !== -1;
}

var objectIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object Object]';
}

var strIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object String]';
}

var numberIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object Number]';
}

var dateIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object Date]';
}

var bufferIs = function( src ) {
  var type = Object.prototype.toString.call( src );
  var result = /\wArray/.test( type ) || type === '[object ArrayBuffer]';
  return result;
}

var arrayIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object Array]';
}

var hasLength = function( src ) {
  if( src === undefined || src === null ) return false;
  if( src.length !== undefined ) return true;
  return false;
}

var boolIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object Boolean]';
}

var routineIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object Function]';
}

var regexpIs = function( src ) {
  return Object.prototype.toString.call( src ) === '[object RegExp]';
}

var jqueryIs = function( src ) {
  return src instanceof $;
}

// -- str

var str = function() {

  var result = '';
  if( !arguments.length ) return result;

  for( var a = 0 ; a < arguments.length ; a++ )
  {
    if( arguments[a] && arguments[a].toStr ) result += arguments[a].toStr() + ' ';
    else result += String( arguments[a] ) + ' ';
  }

  return result;
}

//

var strLineCount = function( src ) {

  var result = src.indexOf( '\n' ) ? src.split( '\n' ).length : 0;
  return result;
}

//

var strSplitStrNumber = function( src ) {
  var result = {};
  var mnumber = src.match(/\d+/);
  if( mnumber && mnumber.length )
  {
    var mstr = src.match(/[^\d]*/);
    result.str = mstr[0];
    result.number = Wtools.toNumber( mnumber[0] );
  }
  else result.str = src;
  return result;
};

//

var strBegins = function( src,begin ) {
  return src.indexOf( begin ) === 0;
};

//

var strEnds = function( src,end ) {
  return src.indexOf( end,src.length - end.length ) !== -1;
};

//

var strBeginsAfter = function( src,begin ) {
  return src.substr( begin.length,src.length );
};

//

var strPrefixAfter = function( src,prefix ) {
  if( src.indexOf( prefix ) === 0 )
  return src.substr( prefix.length,src.length );
};

//

var strNameNormalize = function( src ) {
  return src.replace( / /g, '_' );
}

//

function strReplaceAll( src, ins, sub ) {
  return src.replace( new RegExp( regexpEscape( ins ),'g' ), sub );
}

//

var lattersComparison = function( src1,src2 ){

  var same = 0;

  if( src1.length === 0 && src2.length === 0 ) return 1;

  for( var l in src1 )
  {
    if( l === 'length' ) continue;
    if( src2[ l ] ) same += Math.min( src1[ l ],src2[ l ] );
  }

  return same / Math.max( src1.length,src2.length );
}

//

var strSimilarity = function( src1,src2,options ){

  var latter = [ _.strLattersCount( src1 ),_.strLattersCount( src2 ) ];
  var result = _.lattersComparison( latter[ 0 ],latter[ 1 ] );
  return result;
}

//

var strLattersCount = function( src ){

  var result = {};

  for( var s = 0 ; s < src.length ; s++ )
  {
    if( !result[ src[ s ] ] ) result[ src[ s ] ] = 1;
    else result[ src[ s ] ] += 1;
  }

  result.length = src.length;
  return result;
}

//

var strToDom = function( xmlStr ) {

  var xmlDoc = null;
  var isIEParser = window.ActiveXObject || "ActiveXObject" in window;

  if( xmlStr === undefined ) return xmlDoc;

  if ( window.DOMParser )
  {

    var parser = new window.DOMParser();
    var parsererrorNS = null;

    if( !isIEParser ) {

      try {
        parsererrorNS = parser.parseFromString( "INVALID", "text/xml" ).childNodes[0].namespaceURI;
      }
      catch( err ) {
        parsererrorNS = null;
      }
    }

    try
    {
      xmlDoc = parser.parseFromString( xmlStr, "text/xml" );
      if( parsererrorNS!= null && xmlDoc.getElementsByTagNameNS( parsererrorNS, "parsererror" ).length > 0 )
      {
        throw 'Error parsing XML';
        xmlDoc = null;
      }
    }
    catch( err )
    {
      throw 'Error parsing XML';
      xmlDoc = null;
    }
  }
  else
  {
    if( xmlStr.indexOf( "<?" )==0 )
    {
      xmlStr = xmlStr.substr( xmlStr.indexOf( "?>" ) + 2 );
    }
    xmlDoc = new ActiveXObject( "Microsoft.XMLDOM" );
    xmlDoc.async = "false";
    xmlDoc.loadXML( xmlStr );
  }

  return xmlDoc;
};

//

var strReadConfig = function( src,options ){

  var result = {};
  if( !_.strIs( src ) ) throw _.err( 'Wtools.strReadConfig:','require string' );

  var options = options || {};
  if( options.delimeter === undefined ) options.delimeter = ':';

  var src = src.split( '\n' );

  for( var s = 0 ; s < src.length ; s++ )
  {

    var row = src[ s ];
    var i = row.indexOf( options.delimeter );
    if( i === -1 ) continue;

    var key = row.substr( 0,i ).trim();
    var val = row.substr( i+1 ).trim();

    result[ key ] = val;

  }

  return result;
}

// -- err

var err = function() {

  //var message = _.str.apply( this,arguments );
  //var result = Error( message );

  var result = new Error();

  if( !arguments.length ) return result;

  for( var a = 0 ; a < arguments.length ; a++ )
  {
    if( arguments[a] instanceof Error )
    {
      //return arguments[a];
      result = arguments[a];
      arguments[a] = result.message;
      break;
    }
  }

  //console.log( 'result.message',result.message );
  //if( !result.message )
  result.message = '';

  for( var a = 0 ; a < arguments.length ; a++ )
  {
    if( arguments[a] && arguments[a].toStr ) result.message += arguments[a].toStr() + ' ';
    else result.message += String( arguments[a] ) + ' ';
  }

  return result;
}

// -- regex

var regexpEscape = function( src ) {
  return src.replace( /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1" );
}

//

var regexpObjectJoin = function( src1,src2 ) {

  var result = {};

  if( !_.objectIs( src1 ) ) throw _.err( 'regexpObjectExecute:','src must be object',src1 );
  if( !_.objectIs( src2 ) ) throw _.err( 'regexpObjectExecute:','src must be object',src2 );

  if( src1.excludeAll || src2.excludeAll ) result.excludeAll = _.arrayAppendArray( src1.excludeAll,src2.excludeAll );
  if( src1.excludeAny || src2.excludeAny ) result.excludeAny = _.arrayAppendArray( src1.excludeAny,src2.excludeAny );
  if( src1.includeAll || src2.includeAll ) result.includeAll = _.arrayAppendArray( src1.includeAll,src2.includeAll );
  if( src1.includeAny || src2.includeAny ) result.includeAny = _.arrayAppendArray( src1.includeAny,src2.includeAny );

  return result;
}

//
/*
var regexpMake = function( src ) {

  if( _.regexpIs( src ) ) return src;

  if( _.strIs( src ) ) return new RegExp( _.regexpEscape( src ) );

  if( !src )
  throw _.err( 'regexpMake:','fail to create',src );
  //return src;

  if( _.arrayIs( src ) ) src = _.arrayIron( src );

  _.each( src,function( e,k,i ){

    src[ k ] = _.regexpMake( e );

  });

  if( !src ) throw _.err( 'regexpMake:','fail to create',src );

  return src;
}
*/

//

var regexpMakeObject = function( src,defaultMode ) {

  var result = {};

  if( _.regexpIs( src ) ) src = [ src ];

  if( _.strIs( src ) ) src = [ new RegExp( _.regexpEscape( src ) ) ];

  if( !src ) src = [];

  //if( !src ) throw _.err( 'regexpMake:','fail to create',src );
  //return src;

  if( _.arrayIs( src ) )
  {

    src = _.arrayIron( src );
    if( !defaultMode ) throw _.err( 'regexpMakeObject:','defaultMode is needed for array' );
    result[ defaultMode ] = _.regexpMakeArray( src );

  }
  else if( _.objectIs( src ) )
  {

    _.each( src,function( e,k,i ){
      result[ k ] = _.regexpMakeArray( e );
    });

  }
  else throw _.err( 'regexpMakeObject:','unknown src',src );

  return result;
}

//

var regexpMakeArray = function( src ) {

  src = _.arrayAs( src );

  _.each( src,function( e,k,i ){

    src[ k ] = _.regexpMakeExpression( e );

  });

  return src;
}

//

var regexpMakeExpression = function( src ) {

  if( _.regexpIs( src ) ) return src;

  if( _.strIs( src ) ) return new RegExp( _.regexpEscape( src ) );

  throw _.err( 'regexpMakeExpression:','unknown src',src );
}

//
/*
var regexpInclusion = function( mask,ins ) {

  var mask = _.arrayAs( mask );
  var next = mask.length;
  for( var m = 0 ; m < mask.length ; m++ )
  {
    if( mask[ m ].test( ins ) ) return 1;
  }
  return !next;
}

//

var regexpExclusion = function( exc,ins ) {

  var exc = _.arrayAs( exc );
  var next = 0;
  for( var m = 0 ; m < exc.length ; m++ )
  {
    if( exc[ m ].test( ins ) ) return 0;
  }
  return 1;
}
*/

//

var regexpAny = function( arr,ins,none ) {

  var arr = _.arrayAs( arr );
  for( var m = 0 ; m < arr.length ; m++ )
  {
    if( arr[ m ].test( ins ) ) return 1;
  }
  return arr.length ? 0 : none;
}

//

var regexpAll = function( arr,ins ) {

  var arr = _.arrayAs( arr );
  for( var m = 0 ; m < arr.length ; m++ )
  {
    if( !arr[ m ].test( ins ) ) return 0;
  }
  return 1;
}

//

var regexpTest = function( src,ins ){

  if( !_.objectIs( src ) )
  throw _.err( 'regexpObjectExecute:','src must be object',src );

  if( src.excludeAll )
  {
    if( _.regexpAll( src.excludeAll,ins ) ) return 0;
  }

  if( src.excludeAny )
  {
    if( _.regexpAny( src.excludeAny,ins,0 ) ) return 0;
  }

  if( src.includeAll )
  {
    if( !_.regexpAll( src.includeAll,ins ) ) return 0;
  }

  if( src.includeAny )
  {
    if( !_.regexpAny( src.includeAny,ins,1 ) ) return 0;
  }

  return 1;
}

//

var regexpBut = function( src ) {

  //if( _.regexpIs( src ) ) throw _.err( 'regexpBut: expects string' );

  if( _.regexpIs( src ) ) return new RegExp( '^((?!(' + src.source + ')).)*$' );

  if( _.strIs( src ) ) return new RegExp( '^((?!(' + _.regexpEscape( src ) + ')).)*$' );

  if( !src ) return src;

  if( _.arrayIs( src ) ) src = _.arrayIron( src );

  _.each( src,function( e,k,i ){

    src[ k ] = _.regexpBut( e );

  });

  return src;
}

//

var regexpOrderingExclusion = function( before,after ) {

  return [
    _.regexpBut( before ),
    new  RegExp( '((' + _.regexpEscape( before ) + ')|(' + _.regexpEscape( after ) + '))' ),
    _.regexpBut( after ),
  ];

}

//

/*
var regexpInclusion = function( mask,ins ) {

  var mask = _.arrayAs( mask );
  var next = mask.length;
  for( var m = 0 ; m < mask.length ; m++ )
  {
    if( mask[ m ].test( ins ) )
    {
      next = 0;
      break;
    }
  }

  return !next;
}

//

var regexpExclusion = function( exc,ins ) {

  var exc = _.arrayAs( exc );
  var next = 0;
  for( var m = 0 ; m < exc.length ; m++ )
  {
    if( exc[ m ].test( ins ) )
    {
      next = m+1;
      break;
    }
  }

  return !next;
}
*/
// -- array
/*
var arrayMoveTimes = function( times,array,dstIndex,srcRange ) {

  var l = srcRange[1]-srcRange[0];
  for( var t = 0 ; t < times ; t++ )
  {
    for( var s = 0 ; s < l ; s++ )
    {
      array[dstIndex+t*l+s] = array[srcRange[0]+s];
    }
  }

}

//

var arrayMoveVector3 = function( array,dstIndex,vector ) {

  array[dstIndex+0] = vector.x;
  array[dstIndex+1] = vector.y;
  array[dstIndex+2] = vector.z;

}
*/
//

var arrayIron = function(){

  //if( !result )
  var result = _.arrayIs( this ) ? this : [];

  for( var a = 0 ; a < arguments.length ; a++ )
  {

    var src = arguments[ a ];

    if( !Wtools.arrayIs( src ) )
    {
      if( src !== undefined ) result.push( src );
      //return result;
      continue;
    }

    for( var s = 0 ; s < src.length ; s++ )
    {
      if( Wtools.arrayIs( src[s] ) ) Wtools.arrayIron.call( result,src[s] );
      else result.push( src[s] );
    }

  }

  return result;
}

//

var arrayCopy = function() {

  var result = [];

  for( var a = 0 ; a < arguments.length ; a++ )
  {
    var argument = arguments[ a ];
    if( argument === undefined ) continue;
    if( _.arrayIs( argument ) ) _.arrayAddArray( result,argument );
    else result.push( argument );
  }

  return result;
}

//

var arrayExtend = function( dst,src2 ) {

  //var result = [];
  var result = [];

  //if( Wtools.arrayIs( src1 ) ) result = src1.slice( 0 );
  //else if( src1 !== undefined ) result = [src1];

  if( Wtools.arrayIs( dst ) ) result = dst;
  else if( dst !== undefined ) result = [dst];

  if( Wtools.arrayIs( src2 ) ) result.push.apply( result,src2 );
  else if( src2 !== undefined ) result.push( src2 );

  return result;
}

//

var arrayAppendArray = function( dst,src ) {
  dst.push.apply( dst,src );
  return dst;
}

//

var arrayToMap = function( array ) {

  var result = {};
  for( var a = 0 ; a < array.length ; a++ )
  result[a] = array[a];
  return result;
}

//

var arrayRemoveItem = function( array,item ) {
  var index = array.indexOf( item );
  if( index === -1 ) return array;
  else
  {
    var result = [];
    for( var i = 0; i < array.length; i++ )
    if( i !== index ) result.push( array[i] );
    return result;
  }
}

//

var arrayAppend = function( dst,src ) {
  if( Wtools.arrayIs( dst ) ) dst.push.apply( dst,src );
  else dst = [src];
  return dst;
}

//

var arrayFilter = function( src,filter ) {

  var result = [];

  for( var s = 0 ; s < src.length ; s++ )
  {
    var match = 1;

    if( Wtools.objectIs( filter ) )
    {
      for( var f in filter )
      {
        if( src[s][f] != filter[f] )
        {
          match = 0;
          break;
        }
      }
    }
    else if( Wtools.routineIs( filter ) )
    {
      match = filter( src[s] );
    }
    else throw 'Wtools.arrayFilter: unknown ';
    if( match ) result.push( src[s] );
  }

  return result;
}

//

var arrayIterate = function( array,onElement,onCollect )
{
  if( !arrayIs( array ) ) array = [array];
  if( !onCollect ) onCollect = function( collection,component )
  {
    if( collection ) return arrayAppendArray( collection,component );
    else return [component];
  }

  var collection = null;
  for( var a = 0 ; a < array.length ; a++ )
  {
    var component = onElement( array[a],a );
    collection = onCollect( collection,component );
  }
  return collection;
}

//

var arrayClone = function( array )
{

  return array.slice( 0 );

}

//

var arrayAs = function( src ) {

  if( src === null || src === undefined ) return [];
  else if( _.ais( src ) ) return src
  else return [src];
};

//

var arrayToStr = function( src,options ) {

  var result = '';
  var options = options || {};

  if( options.precission === undefined ) options.precission = 5;
  if( options.type === undefined ) options.type = 'mixed';

  if( !src.length ) return result;

  if( options.type === 'float' )
  {
    for( var s = 0 ; s < src.length-1 ; s++ )
    {
      result += src[ s ].toPrecision( options.precission ) + ' ';
    }
    result += src[ s ].toPrecision( options.precission );
  }
  else if( options.type === 'int' )
  {
    for( var s = 0 ; s < src.length-1 ; s++ )
    {
      result += String( src[ s ] ) + ' ';
    }
    result += String( src[ s ] ) + ' ';
  }
  else
  {
    throw 'Wtools.arrayToStr: not tested';
    for( var s = 0 ; s < src.length-1 ; s++ )
    {
      result += String( src[ s ] ) + ' ';
    }
    result += String( src[ s ] ) + ' ';
  }

  return result;
}

//

var arrayCompare = function( src1,src2 ){

  var result = 0;

  for( var s = 0 ; s < src1.length ; s++ )
  {

    result = _.hasLength( src1[ s ] ) ? _.arrayCompare( src1[ s ],src2[ s ] ) : src1[ s ] - src2[ s ];
    if( result !== 0 ) return result;

  }

  return result;
}

//

var arraySame = function( src1,src2 ){

  var result = true;

  for( var s = 0 ; s < src1.length ; s++ )
  {

    result = _.hasLength( src1[ s ] ) ? _.arraySame( src1[ s ],src2[ s ] ) : src1[ s ] === src2[ s ];
    if( !result ) return result;

  }

  return result;
}

//

var arrayFind = function( arr,ins ){

  for( var a = 0 ; a < arr.length ; a++ )
  {

    if( _.arraySame( arr[ a ],ins ) ) return arr[ a ];

  }

  return;
}

//

var _arraySortedFindAct = function( arr,ins,comparator,left,right ){

  var d = 0;
  var current = Math.floor( ( left + right + 1 ) / 2 );

  while( left < right )
  {

    //var current = Math.floor( ( left + right + 1 ) / 2 );

    var d = comparator( arr[ current ],ins );

    if( d < 0 )
    {
      left = current + 1;
      current = Math.floor( ( left + right ) / 2 );
    }
    else if( d > 0 )
    {
      right = current - 1;
      current = Math.ceil( ( left + right ) / 2 );
    }
    else return current;

  }

  if( current < arr.length )
  {
    var d = comparator( arr[ current ],ins );
    if( d < 0 ) current += 1;
    //else if( d > 0 ) current -= 1;
  }

  return current;
}

//

var arraySortedFind = function( arr,ins,comparator ){

  if( comparator === undefined ) comparator = function( a,b ){ return a-b };
  var l = arr.length;
  var index = _._arraySortedFindAct( arr,ins,comparator,0,l-1 );

  //console.log( 'arraySortedFind',arr,ins,'->',index );

  if( index === l ) return;

  if( comparator( ins,arr[ index ] ) !== 0 ) return;

  return arr[ index ];
}

//

var arraySortedAdd = function( arr,ins,comparator ){

  if( comparator === undefined ) comparator = function( a,b ){ return a-b };
  var l = arr.length;
  var index = _._arraySortedFindAct( arr,ins,comparator,0,l-1 );

  var add = index === l || comparator( ins,arr[ index ] ) !== 0;

  //console.log( 'arraySortedAdd',arr,ins );

  if( add ) arr.splice( index,0,ins );

  //console.log( 'arraySortedAdd',arr,ins );

  return add;
}

//

var arraySortedAddArray = function( dst,src,comparator ){

  var result = 0;

  //throw 'Not tested';

  if( comparator === undefined ) comparator = function( a,b ){ return a-b };

  for( var s = 0 ; s < src.length ; s++ )
  result += arraySortedAdd( dst,src[ s ],comparator );

  return result;
}

// -- array buffer

var bufferRelen = function( src,len )
{
  var result = src;

  if( len > src.length )
  {
    result = new src.constructor( len );
    result.set( src );
  }
  else if( len < src.length )
  {
    result = src.subarray( 0,len );
  }

  return result;
}

//

var bufferResize = function( src,size )
{
  var result;

  if( !( src instanceof ArrayBuffer ) ) throw 'Wtools.ArrayBuffer: src is not instance of ArrayBuffer';

  if( size > src.byteLength )
  {
    result = new src.constructor( size );
    var resultTyped = new Uint8Array( result,0,result.byteLength );
    var srcTyped = new Uint8Array( src,0,src.byteLength );
    resultTyped.set( srcTyped );
  }
  else if( size < src.length )
  {
    result = src.slice( 0,size );
  }

  return result;
}

//

var bufferToStr = function( src,options ) {

  var result = '';
  var options = options || {};

  if( src instanceof ArrayBuffer ) src = new Uint8Array( src,0,src.byteLength );

  try
  {
    result = String.fromCharCode.apply( null, src );
  }
  catch( e )
  {
    for( var i = 0 ; i < src.byteLength ; i++ )
    {
      result += String.fromCharCode( src[i] );
    }
  }

  return result;
}

//

var bufferToDom = function( xmlBuffer ) {

  var result;

  if( typeof DOMParser !== 'undefined' && DOMParser.prototype.parseFromBuffer )
  {

    var parser = new DOMParser();
    result = parser.parseFromBuffer( xmlBuffer,xmlBuffer.byteLength,'text/xml' );
    console.warn( 'Wtools.bufferToDom:','parseFromBuffer untested routine' );//xxx

  }
  else
  {

    var xmlStr = _.bufferToStr( xmlBuffer );
    result = this.strToDom( xmlStr );

  }

  return result;
}

// -- map
/*
var mapInject = function( dst,src ) {

  if( !Wtools.objectIs( dst ) ) throw 'Wtools.mapClone: is not map';
  if( !Wtools.objectIs( src ) ) throw 'Wtools.mapClone: is not map';

  for( var s in src )
  {
    if( dst[s] !== undefined && dst[s] !== null )
    {
      dst[ '__parent_' + s + '__' ] = dst[s];
    }
    dst[s] = src[s];
  }

}
*/
//

var mapClone = function( src,cloneArray ) {

  var result = {};

  if( !Wtools.objectIs( src ) ) throw 'Wtools.mapClone: is not map';
  if( cloneArray !== undefined ) throw 'mapExtend: cloneArray deprecated use mapCloneArrayClonning';

  /*
  if( cloneArray )
  {
    for( var s in src )
    {
      if( Wtools.arrayIs( src[s] ) ) result[s] = src[s].slice( 0 );
      else result[s] = src[s];
    }
  }
  else
  */

  {
    for( var s in src )
    result[s] = src[s];
  }

  return result

}

//

var mapCopy = function() {

  var result = {};

  for( var a = 0 ; a < arguments.length ; a++ )
  {

    var argument = arguments[ a ];
    if( argument === undefined ) continue;

    if( _.objectIs( argument ) ) _.mapExtend( result,argument );
    else throw _.err( 'Wtools.mapCopy:','require object as argument' );

  }

  return result;
}

//
/*
var mapCloneExtending = function( src1,src2,cloneArray ) {

  var result = {};

  if( !Wtools.objectIs( src1 ) ) throw 'Wtools.mapCloneExtending: is not map';

  if( cloneArray )
  {
    for( var s in src1 )
    {
      if( Wtools.arrayIs( src1[ s ] ) ) result[ s ] = src1[ s ].slice( 0 );
      else result[ s ] = src1[ s ];
    }
    for( var s in src2 )
    {
      if( src2[ s ] !== undefined )
      if( Wtools.arrayIs( src2[ s ] ) ) result[ s ] = src2[ s ].slice( 0 );
      else result[ s ] = src2[ s ];
    }
  }
  else
  {
    for( var s in src1 )
    result[ s ] = src1[ s ];
    for( var s in src2 )
    if( src2[ s ] !== undefined )
    result[ s ] = src2[ s ];
  }

  return result;
}
*/
//

var mapExtend = function( dst,def,cloneArray ) {

  var result = dst;

  if( cloneArray !== undefined ) throw 'mapExtend: cloneArray deprecated use mapExtendArrayClonning';

  for( var s in def )
  {
    result[s] = def[s];
  }

  return result;
}

//

var mapExtendArrayClonning = function( dst,def ) {

  var result = dst;

  for( var s in def )
  {
    if( Wtools.arrayIs( def[s] ) ) result[s] = def[s].slice( 0 );
    else result[s] = def[s];
  }

  return result;
}

//

var mapExtendArraying = function( dst,def ) {

  var result = dst;

  for( var s in def )
  {
    if( result[s] !== undefined )
    {
      result[s] = _.arrayAs( result[s] );
      result[s].push( def[s] );
    }
    else
    {
      result[s] = def[s];
    }
  }

  return result;
}

//

var mapExtendOwn = function( dst,def,cloneArray ) {

  var result = dst;

  for( var s in def )
  {
    if( !def.hasOwnProperty( s ) ) continue;
    if( cloneArray && Wtools.arrayIs( def[s] ) ) result[s] = def[s].slice( 0 );
    else result[s] = def[s];
  }

  return result;
}

//

var mapSupplementDeep = function( dst,def,deep,cloneArray ) {

  var result = dst;

  if( !Wtools.objectIs( dst ) ) throw 'Wtools.mapSupplementDeep: is not map';

  if( deep === undefined ) deep = 1;

  for( var s in def )
  if( result[s] === undefined )
  {
    if( cloneArray && Wtools.arrayIs( def[s] ) ) result[s] = def[s].slice( 0 );
    else result[s] = def[s];
  }
  else if( deep && Wtools.objectIs( result[s] ) && Wtools.objectIs( def[s] ) )
  {
    result[s] = mapSupplementDeep( result[s],def[s],deep,cloneArray );
  }

  return result;
}

//

var mapSupplement = function( dst,def,cloneArray ) {

  var result = dst;

  //if( !Wtools.objectIs( dst ) ) throw 'Wtools.mapSupplement: is not map';

  if( cloneArray )
  {

    for( var s in def )
    if( result[s] === undefined )
    {
      if( Wtools.arrayIs( def[s] ) ) result[s] = def[s].slice( 0 );
      else result[s] = def[s];
    }

  }
  else
  {

    for( var s in def )
    if( result[s] === undefined )
    result[s] = def[s];

  }

  return result;
}

//

var mapSupplementCopy = function( src,def,cloneArray ) {

  var result = {};

  if( !Wtools.objectIs( src ) ) throw 'Wtools.mapSupplementCopy: is not map';

  if( def )
  for( var s in def )
  if( src[s] === undefined )
  {
    if( cloneArray && Wtools.arrayIs( def[s] ) ) result[s] = def[s].slice( 0 );
    else result[s] = def[s];
  }

  for( var s in src )
  if( result[s] === undefined )
  {
    if( cloneArray && Wtools.arrayIs( src[s] ) ) result[s] = src[s].slice( 0 );
    else result[s] = src[s];
  }

  return result;
}

//

var mapToArray = function( src ) {
  var result = [];
  for( var s in src )
  {
    result.push( { key:s,val:src[s] } );
  }
  return result;
}

//

var mapKeys = function( src ) {
  var result = [];
  for( var s in src )
  {
    result.push( s );
  }
  return result;
}

//

var mapVals = function( src ) {
  var result = [];
  for( var s in src )
  {
    result.push( src[s] );
  }
  return result;
}

//

var mapValWithIndex = function( src,index ) {

  if( index < 0 ) return;

  var i = 0;
  for( var s in src )
  {
    if( i == index ) return src[s];
    i++;
  }
}

//

var mapKeyWithIndex = function( src,index ) {

  if( index < 0 ) return;

  var i = 0;
  for( var s in src )
  {
    if( i == index ) return s;
    i++;
  }

}

//

var mapToString = function( src,keyValSep,tupleSep ) {

  if( !Wtools.strIs( keyValSep ) ) keyValSep = ': ';
  if( !Wtools.strIs( tupleSep ) ) keyValSep = '; ';
  var result = '';
  for( var s in src )
  {
    result += s + keyValSep + src[s] + tupleSep;
  }
  result = result.substr( 0,result.length-tupleSep.length )
  return result

}

// -- time

var timeAfter = function( delay,onReady ){

  setTimeout( onReady,delay );

}

// -- exec

var execStages = function( stages,options ){

  if( !_.arrayIs( stages ) ) _.err( 'Wtools.execStages:','stages must be array',stages );

  var options = options || {};

  if( options.delay === undefined ) options.delay = 10;

  var stages = options.stages = stages || options.stages;

  var s = 0;

  if( options.onBegin ) options.onBegin( options );

  var execStage = function(){

    var stage = stages[ s ];
    if( !stage )
    {
      if( options.onEnd ) options.onEnd( options );
      return;
    }

    stage();
    if( options.onUpdate ) options.onUpdate( options,stage );

    s += 1;
    _.timeAfter( options.delay,execStage );

  }

  _.timeAfter( options.delay,execStage );

}

// -- id

var idGenerateDate = function( prefix,postfix,fast ) {

  var date = new Date;

  if( prefix === undefined ) prefix = '';
  if( postfix === undefined ) postfix = '';
  if( fast ) return prefix + date.valueOf() + postfix;

  var d =
  [
    date.getFullYear(),
    date.getMonth()+1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    Math.floor( 1 + Math.random()*0x100000000 ).toString(16),
  ].join( '-' );

  return prefix + d + postfix
}

//

var idGenerateGuid = (function() {

  function s4() {
    return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
  }

  return function() {

    var result =
    [
      s4() + s4(),
      s4(),
      s4(),
      s4(),
      s4() + s4() + s4(),
    ].join( '-' );

  };

})();

// -- var

var EPS = 0.000001;
var EPS2 = EPS*EPS;
var SQRT2 = 1.4142135623730950488016887242097;

// -- prototype

Proto = {


  // -- meta
  clone: clone,
  same: same,
  len: len,

  each: each,
  eachRecursive: eachRecursive,
  elementWithKeyRecursive: elementWithKeyRecursive,
  valueWithIndex: valueWithIndex,
  keyWithValue: keyWithValue,


  // -- proto
  protoName: protoName,
  protoApply: protoApply,
  protoFunctor: protoFunctor,


  // -- converter
  toCsv: toCsv,
  toBool: toBool,
  toNumber: toNumber,
  toVector: toVector,
  toArray: toArray,
  toStr: toStr,
  toStrFine: toStrFine,
  log: log,


  // -- type test
  mapIs: mapIs,
  htmlIs: htmlIs,
  jqueryIs: jqueryIs,

  objectIs: objectIs,
  strIs: strIs,
  bufferIs: bufferIs,
  arrayIs: arrayIs,
  hasLength: hasLength,
  numberIs: numberIs,
  dateIs: dateIs,
  boolIs: boolIs,
  routineIs: routineIs,
  regexpIs: regexpIs,

  ois: objectIs,
  sis: strIs,
  ais: arrayIs,
  nis: numberIs,
  dis: dateIs,
  bis: boolIs,
  ris: routineIs,


  // -- str
  str: str,
  strLineCount: strLineCount,
  strSplitStrNumber: strSplitStrNumber,
  strBegins: strBegins,
  strEnds: strEnds,
  strBeginsAfter: strBeginsAfter,
  strPrefixAfter: strPrefixAfter,
  strNameNormalize: strNameNormalize,
  strReplaceAll: strReplaceAll,

  lattersComparison: lattersComparison,

  strSimilarity: strSimilarity,
  strLattersCount: strLattersCount,

  strToDom: strToDom,

  strReadConfig: strReadConfig,


  // -- err
  err: err,


  // -- regex
  regexpEscape: regexpEscape,

  regexpObjectJoin: regexpObjectJoin,

  regexpMakeObject: regexpMakeObject,
  regexpMakeArray: regexpMakeArray,
  regexpMakeExpression: regexpMakeExpression,

  //regexpInclusion: regexpInclusion,
  //regexpExclusion: regexpExclusion,

  regexpAny: regexpAny,
  regexpAll: regexpAll,
  regexpTest: regexpTest,

  regexpBut: regexpBut,
  regexpOrderingExclusion: regexpOrderingExclusion,


  // -- array
  //arrayMoveVector3: arrayMoveVector3,
  //arrayMoveTimes: arrayMoveTimes,
  arrayIron: arrayIron,
  //arrayJoin: arrayJoin,
  arrayCopy: arrayCopy,
  arrayExtend: arrayExtend,
  arrayAppendArray: arrayAppendArray,
  arrayRemoveItem: arrayRemoveItem,
  arrayToMap: arrayToMap,
  arrayAppend: arrayAppend,
  arrayFilter: arrayFilter,
  arrayIterate: arrayIterate,
  arrayClone: arrayClone,
  arrayAs: arrayAs,
  arrayToStr: arrayToStr,

  arrayCompare: arrayCompare,
  arraySame: arraySame,
  arrayFind: arrayFind,

  _arraySortedFindAct: _arraySortedFindAct,
  arraySortedFind: arraySortedFind,
  arraySortedAdd: arraySortedAdd,
  arraySortedAddArray: arraySortedAddArray,

  // -- array buffer
  bufferRelen: bufferRelen,
  bufferResize: bufferResize,
  bufferToStr: bufferToStr,
  bufferToDom: bufferToDom,


  // -- map
  //mapInject: mapInject,
  mapClone: mapClone,
  //mapCloneExtending: mapCloneExtending,
  mapCopy: mapCopy,

  mapExtend: mapExtend,
  mapExtendArrayClonning: mapExtendArrayClonning,
  mapExtendArraying: mapExtendArraying,
  mapExtendOwn: mapExtendOwn,

  //mapSupplement: mapSupplementCopy,
  mapSupplementCopy: mapSupplementCopy,
  mapSupplementInplace: mapSupplement,
  mapSupplement: mapSupplement,

  mapToArray: mapToArray,
  mapKeys: mapKeys,
  mapVals: mapVals,
  mapValWithIndex: mapValWithIndex,
  mapKeyWithIndex: mapKeyWithIndex,
  mapToString: mapToString,


  // -- time
  timeAfter: timeAfter,
  timeOut: timeAfter,


  // -- exec
  execStages: execStages,


  // -- id
  idGenerateDate: idGenerateDate,
  idGenerateGuid: idGenerateGuid,


  // -- var
  EPS: EPS,
  EPS2: EPS2,
  SQRT2: SQRT2,


};

mapExtend( Self, Proto );

// -- export

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
} else if (typeof window !== "undefined" && window !== null) {
  window['Wtools'] = Self;
}

})();