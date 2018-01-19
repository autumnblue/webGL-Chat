( function() {

if( typeof require !== 'undefined' && typeof Wtools === 'undefined' ) Wtools = require( '../include/Wtools.js' );

var Self = {};
var _ = Wtools;

//

var formatThis /*= Object.prototype.format = Array.prototype.format*/ = function() {

  var result = this;
  var self = this;
  var args = [].slice.call( arguments, 0 );
  var matched = 0;

  if( args.length === 0 ) {
    return function() {
      var args = [].slice.call( arguments, 0 );
      return formatThis.apply( self, args );
    };
  }

  if( _.strIs( this ) ) result = formatString.apply( self,arguments );
  else if( _.objectIs( self ) || _.arrayIs( self ) )
  _.each( self,function( e,k,i ){

    self[ k ] = formatThis.apply( e,args );

  });
  else result = self;

  return result;
}

//

/*
var formatString = String.prototype.format = function() {
}
*/

//

var formatString = String.prototype.format = function() {

  var self = this;
  var args = [].slice.call( arguments, 0 );
  var matched = 0;

  //console.log( this );
  //if( this.indexOf( 'absolute' ) !== -1 )
  //console.log( '---',this );

  // closure

  if( args.length === 0 ) {
    return function() {
      var args = [].slice.call( arguments, 0 );
      return self.format.apply( self, args );
    };
  }

  //

  var handleReplace = function( match, literal, key, transformer ) {

    //console.log( 'match',match );
    //console.log( 'literal',literal );
    //console.log( 'key',key );
    //console.log( 'transformer',transformer );

    if( literal ) return literal;

    matched += 1;

    if( key.length ) {

      explicit = true;
      if( implicit ) throw new error;
      value = Self.lookup( args, key );

    } else {

      implicit = true;
      if( explicit ) throw new error;
      value = args[index++];

    }

    //value = String( value );

    if( transformer )
    {
      var t = formatString.transformers[ transformer ]
      if( !t )
      {
        logger.warn( 'Format:','Transformer not found:',transformer );
        return value;
      }
      return t.call( value );
    }
    else return value;
  }

  //

  var result = '';
  var index = 0;
  var explicit = 0
  var implicit = 0;
  var error = 'Implicit and explicit modes are mixed';
  var value;

  try {

    var match = /^([{}])\1|[{](.*?)(?:!(.+?))?[}]$/g.exec( self );
    if( match ) result = handleReplace.apply( self,match );
    else result = this.replace( /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g,handleReplace );

  } catch( err ) {

    if( self.strict ) throw _.err( 'Format failed:',self,'\n',err );
    else return undefined;

  }

  if( matched )
  if( _.objectIs( result ) || _.arrayIs( result ) )
  {
    result = formatThis.apply( result,arguments );
  }

  return result;
}

//

var lookup = function( object, key ) {

  var match;

  if( !/^(\d+)([.]|$)/.test( key ) ) {
    key = '0.' + key;
  }

  //if( object === undefined ) return object;

  while( match = /(.+?)[.](.+)/.exec( key ) ) {

    object = resolve( object, match[1] );
    key = match[2];
    //if( object === undefined ) return object;
  }

  return resolve( object, key );
};

//

var resolve = function( object, key ) {

  var value;
  value = object[key];

  if( typeof value === 'function' ) return value.call( object );
  if( typeof value === 'undefined' ) throw _.err( 'Cant reslove key',key );

  return value;
};

// -- var

formatString.transformers = {};


// -- proto

var Self =
{

  formatString: formatString,
  formatThis: formatThis,
  resolve: resolve,
  lookup: lookup,

}

}).call( this );