(function(){

var os = require( 'os' );
var sys = require( 'sys' );
var url = require( 'url' );
var Path = require( 'path' );
var fs = require( 'fs-extra' );

var Stools = require( './Stools.js' );
require( './Path.js' );
//require( './Logger.js' );

var Self = Stools;
var _ = Stools;

//

var fileRecord_ = function( file,options ){

  var options = options || {};
  var record = {};

  if( !_.strIs( file ) ) throw _.err( 'Files._fileRecord:','file must be string' );

  if( options.path === undefined ) options.path = Path.dirname( file );
  if( options.relative === undefined ) options.relative = options.path;

  //if( options.absolute )
  file = _.pathName( file );

  return _._fileRecord( file,options );
}

//

var _fileRecord = function( file,options ){

  var record = {};

  if( !_.strIs( file ) ) throw _.err( 'Files._fileRecord:','file must be string' );
  if( options.relative === undefined ) throw _.err( 'Files._fileRecord:','options.relative is not defined' );
  if( options.path === undefined ) throw _.err( 'Files._fileRecord:','options.path is not defined' );

  //if( file.indexOf( 'modal.jade' ) !== -1 )
  //logger.log( file );

  record.file = file;
  record.ext = _.pathExt( file );
  record.name = _.pathNameWithoutExt( file );

  if( options.ext ) record.path = _.pathJoin( options.path, record.name + '.' + options.ext );
  else record.path = _.pathJoin( options.path,record.file );

  record.relative = _.pathRelative( options.relative,record.path );
  record.absolute = Path.resolve( options.relative,record.relative );
  record.absolute = _.pathNormalize( record.absolute );

  try{
    record.stat = fs.statSync( record.path );
    record.directory = record.stat.isDirectory();
  } catch( err ){};

  if( record.inclusion === undefined )
  {

    record.inclusion = 1;

    //if( options.mask.length > 1 )
    //console.log( 'options.mask.length > 1' );

    var mask = record.directory ? null : options.mask;
    if( mask ) record.inclusion = record.inclusion && _.regexpTest( mask,record.relative );

    if( options.exclude ) record.inclusion = record.inclusion && _.regexpTest( options.exclude,record.relative );

    var exclude = record.directory ? options.excludeDirs : options.excludeFiles;
    if( exclude ) record.inclusion = record.inclusion && _.regexpTest( exclude,record.relative );

  }

  if( record.inclusion && !record.directory )
  {
    if( options.read ) try{ record.read = fs.readFileSync( record.absolute,'utf8' ) } catch( err ){};
    if( options.hash ) try{ record.hash = _.fileHash( record.absolute ) } catch( err ){};
    if( options.latters && record.stat.size <= options.lattersSizeLimit ) try{ record.latters = _.strLattersCount( record.read || fs.readFileSync( record.absolute,'utf8' ) ) } catch( err ){};
    //if( options.similarity ) try{ record.similarity = _.fileSimilarity( record.absolute ) } catch( err ){};
  }

  return record;
}

//

var fileHash = function( filename,onReady ){

  var result;
  var crypto = require( 'crypto' );
  var md5sum = crypto.createHash( 'md5' );

  if( onReady ) {

    var stream = fs.ReadStream( filename );
    stream.on( 'data', function( d ) {
      md5sum.update( d );
    });

    stream.on( 'end', function() {
      var hash = md5sum.digest( 'hex' );
      //console.log( d,'-',filename );
      onReady( hash );
    });

  }
  else
  {

    if( !_.fileIs( filename ) ) return;
    var read = fs.readFileSync( filename );
    md5sum.update( read );
    result = md5sum.digest( 'hex' );
    return result;

  }

}

//

var filesShadow = function( shadows,owners ){

  var self = this;

  for( var s = 0 ; s < shadows.length ; s++ )
  {
    var shadow = shadows[ s ];

    for( var o = 0 ; o < owners.length ; o++ )
    {

      var owner = owners[ o ];

      //if( _.pathWithoutExt( shadow.relative ) === _.pathWithoutExt( owner.relative ) )
      if( _.strBegins( shadow.relative,_.pathPrefix( owner.relative ) ) )
      {
        //logger.log( '?',shadow.relative,'shadowed by',owner.relative );
        shadows.splice( s,1 );
        s -= 1;
        break;
      }

    }

  }

}

// -- find

var filesFind = function( path,mask,options,onReady ){

  var self = this;
  if( onReady ) return _.timeAfter( 0, function(){
    onReady( arguments.callee.call( self,path,mask,options ) );
  });

  // options

  if( _.objectIs( path ) )
  {
    options = path;
    path = options.path;
    mask = options.mask;
  }

  var path = _.arrayAs( path );
  //if( !path.length ) throw _.err( 'Stools.filesList:','path is needed' );

  var options = options || {};
  if( options.dst || options.src ) throw _.err( 'filesFind','src/dst is deprecated use path' );
  var options = _.mapClone( options || {});
  //if( options.shadowedOnly === undefined ) options.shadowedOnly = 0;
  if( options.ignoreNonexistent === undefined ) options.ignoreNonexistent = 0;
  if( options.shadowedOnly !== undefined ) throw _.err( 'filesFind','"shadowedOnly" is deprecated' );
  if( options.shadowOwner !== undefined ) throw _.err( 'filesFind','"shadowOwner" is deprecated' );
  //if( options.shadowOwner ) options.shadowOwner = Path.basename( options.shadowOwner );
  if( options.latters === undefined ) options.latters = 0;
  if( options.latters && options.lattersSizeLimit === undefined ) options.lattersSizeLimit = 1048576;

  // output format

  var addResult;
  var result = options.result = options.result || [];
  if( options.pathOnly !== undefined ) throw _.err( 'filesFind:','"pathOnly" deprecated, use "outputFormat"' );
  if( options.outputFormat === undefined ) options.outputFormat = 'full';
  if( options.outputFormat === 'absolute' ) addResult = function( record ){ result.push( record.absolute ); }
  else if( options.outputFormat === 'relative' ) addResult = function( record ){ result.push( record.relative ); }
  else addResult = function( record ){ result.push( record ); }

  // path

  //logger.log( '' );
  //logger.log( 'filesFind',options.path,mask );
  //logger.log( '' );
  //logger.up( '' );

  //if( options.shadowedOnly )
  //console.log( 'filesFind',options );

  // mask

  var mask = options.mask                               = _.regexpMakeObject( mask,'includeAny' );
  var excludeDirs = options.excludeDirs                 = _.regexpMakeObject( options.excludeDirs,'excludeAny' );
  var excludeFiles = options.excludeFiles               = _.regexpMakeObject( options.excludeFiles,'excludeAny' );
  var exclude = options.exclude                         = _.regexpMakeObject( options.exclude,'excludeAny' );
  //var excludeShadowed = options.excludeShadowed         = _.regexpMakeArray( options.excludeShadowed );
  var orderingExclusion = options.orderingExclusion     = _.regexpMakeArray( options.orderingExclusion );

  //
/*
  var isShadowed = function( files,record ){

    throw 'Not implemented';

    var result = 0;

    if( !options.excludeShadowed.length ) return 0;

    for( var f = 0 ; f < files.length ; f++ )
    {

      var file = files[ f ];

      //if( record.name.indexOf( 'material' ) !== -1 )
      //logger.log( file, '-' ,record.name );

      if( _.strBegins( file,record.name ) )
      {

        if( options.shadowOwner )
        if( options.shadowOwner === file )
        {
          //logger.log( '?','shadow:',files[ f ],'owner of',record.path );
          continue;
        }

        result = _.regexpInclusion( options.excludeShadowed,file );
        if( result ) {
          //logger.log( '?','shadowed:',record.path,'by',files[ f ] );
          return result;
        }

      }

    }

    return 0;
  }
*/

  //

  var filesFindAct = function( path,options ){

    options = _.mapClone( options );
    options.path = path;

    var files = fs.readdirSync( path );

    // files

    for( var f = 0 ; f < files.length ; f++ ){

      //if( files[ f ].indexOf( '.less' ) !== -1 )
      //logger.log( files[ f ] );

      var record = _._fileRecord( files[ f ],options );

      //if( record.name.indexOf( 'assessment' ) !== -1 )
      //logger.log( '-' ,record.name );

      if( record.directory ) continue;
      if( !record.inclusion ) continue;
      //if( isShadowed( files,record ) ^ options.shadowedOnly ) continue;

      addResult( record );

    }

    // dirs

    for( var f = 0 ; f < files.length ; f++ ){

      var record = _._fileRecord( files[ f ],options,0 );

      if( !record.directory ) continue;
      if( !record.inclusion ) continue;
      //if( isShadowed( files,record ) ^ options.shadowedOnly ) continue;

      if( options.directories )
      addResult( record );
      if( options.recursive ) filesFindAct( record.path + '/',options );

    }

  }

  //

  var iteratePathesAct = function( path,options ){

    for( var p = 0 ; p < path.length ; p++ )
    {

      if( path[ p ][ path[ p ].length-1 ] !== '/' ) path[ p ] += '/';
      options.path = path[ p ];
      if( !path ) throw _.err( 'Stools.filesList:','path is needed' );
      if( options.relative === undefined ) options.relative = options.path;

      if( options.ignoreNonexistent && !fs.existsSync( path[ p ] ) ) continue;

      filesFindAct( path[ p ],options );

    }

  }

  //

  if( !orderingExclusion.length ) iteratePathesAct( path,options );
  else
  {
    var excludeAny = exclude.excludeAny || [];
    for( var o = 0 ; o < orderingExclusion.length ; o++ )
    {

      options.exclude.excludeAny = excludeAny.slice();
      options.exclude.excludeAny.push( orderingExclusion[ o ] );
      iteratePathesAct( path,options );

    }
  }

  //logger.log( '' );
  //logger.down();

  return result;
}

//

var filesFindDifference = function( dst,src,options,onReady ){

  var self = this;

  if( onReady ) return _.timeAfter( 0, function(){
    onReady( arguments.callee.call( self,dst,src,options ) );
  });

  // options

  if( _.objectIs( dst ) )
  {
    options = dst;
    dst = options.dst;
    delete options.dst;
    src = options.src;
    delete options.src;
  }

  var options = ( options || {});
  var result = options.result = options.result || [];
  var ext = options.ext;
  if( options.difference === undefined ) options.difference = 1;
  if( options.latters === undefined ) options.latters = 0;
  if( options.latters && options.lattersSizeLimit === undefined ) options.lattersSizeLimit = 1048576;

  // output format

  var addResult;
  if( options.pathOnly !== undefined ) throw _.err( 'filesFindDifference:','"pathOnly" deprecated, use "outputFormat"' );
  if( options.outputFormat === undefined ) options.outputFormat = 'full';
  if( options.outputFormat === 'absolute' ) addResult = function( record ){ result.push( record.src.absolute ); }
  else if( options.outputFormat === 'relative' ) addResult = function( record ){ result.push( record.src.relative ); }
  else addResult = function( record ){ result.push( record ); }
  if( options.outputFormat !== 'full' ) options.difference = 0;

  // mask

  var mask = options.mask                           = _.regexpMakeObject( options.mask,'includeAny' );
  var excludeDirs = options.excludeDirs             = _.regexpMakeObject( options.excludeDirs,'excludeAny' );
  var excludeFiles = options.excludeFiles           = _.regexpMakeObject( options.excludeFiles,'excludeAny' );
  var exclude = options.exclude                     = _.regexpMakeObject( options.exclude,'excludeAny' );

  // dst

  var dstOptions = _.mapClone( options );
  if( dst[ dst.length-1 ] !== '/' ) dst += '/';
  dstOptions.path = dst;
  dstOptions.relative = dst;
  delete dstOptions.ext;
  if( !dstOptions.path ) throw _.err( 'Stools.filesFindDifference:','need dst path' );

  // src

  var srcOptions = _.mapClone( options );
  if( src[ src.length-1 ] !== '/' ) src += '/';
  srcOptions.path = src;
  srcOptions.relative = src;
  delete srcOptions.ext;
  if( !srcOptions.path ) throw _.err( 'Stools.filesFindDifference:','need src path' );

  //

  var act = function( dstOptions,srcOptions ){

    // src

    if( fs.existsSync( srcOptions.path ) ) {

      if( !fs.statSync( srcOptions.path ).isDirectory() ) return;
      var files = fs.readdirSync( srcOptions.path );
      files.sort();

      // files

      for( var f = 0 ; f < files.length ; f++ ){

        var srcRecord = _._fileRecord( files[ f ],srcOptions );

        //if( srcRecord.absolute.indexOf( 'cjade' ) !== -1 )
        //console.log( 'cjade',srcRecord.absolute );

        if( srcRecord.directory ) continue;
        if( !srcRecord.inclusion ) continue;

        if( srcRecord.directory ) delete dstOptions.ext;
        else dstOptions.ext = ext;

        var dstRecord = _._fileRecord( files[ f ],dstOptions );

        var record = { dst : dstRecord , src : srcRecord };
        addResult( record );

        if( dstRecord.stat )
        {

          if( !dstRecord.directory )
          {
            record.same = _.filesSame({ stat: dstRecord.stat, hash : dstRecord.path.hash }, { stat : srcRecord.stat, hash : srcRecord.path.hash });
            record.link = _.filesLinked({ stat: dstRecord.stat, hash : dstRecord.path.hash }, { stat : srcRecord.stat, hash : srcRecord.path.hash },record.same );
          }

        }

      }

      // dirs

      for( var f = 0 ; f < files.length ; f++ ){

        var srcRecord = _._fileRecord( files[ f ],srcOptions );

        if( !srcRecord.directory ) continue;
        if( !srcRecord.inclusion ) continue;

        var dstRecord = _._fileRecord( files[ f ],dstOptions );

        if( options.directories )
        {
          var record = { dst : dstRecord , src : srcRecord };
          addResult( record );
        }

        if( options.recursive )
        {
          var dstOptionsSub = _.mapClone( dstOptions );
          dstOptionsSub.path = dstRecord.path + '/';
          var srcOptionsSub = _.mapClone( srcOptions );
          srcOptionsSub.path = srcRecord.path + '/';
          act( dstOptionsSub,srcOptionsSub );
        }

      }

    }

    // -- dst

    if( options.difference )
    if( fs.existsSync( dstOptions.path ) )
    {

      if( !fs.statSync( dstOptions.path ).isDirectory() ) return;

      var files = fs.readdirSync( dstOptions.path );
      files.sort();

      // files

      for( var f = 0 ; f < files.length ; f++ ){

        var dstRecord = _._fileRecord( files[ f ],dstOptions );
        var srcRecord = _._fileRecord( files[ f ],srcOptions );

        if( !srcRecord.inclusion ) continue;

        if( srcRecord.stat ) continue;

        if( dstRecord.directory ) continue;

        var record = { dst : dstRecord , src : srcRecord };
        addResult( record );

        delete srcRecord.stat;

      }

      // directories

      //if( _.strEnds( dstOptions.path, 'character/male/guy/' ) )
      //console.log( dstOptions );

      for( var f = 0 ; f < files.length ; f++ ){

        var dstRecord = _._fileRecord( files[ f ],dstOptions );
        var srcRecord = _._fileRecord( files[ f ],srcOptions );

        //if( dstRecord.absolute.indexOf( 'type1' ) !== -1 )
        //console.log( dstRecord );

        if( !srcRecord.inclusion ) continue;
        if( srcRecord.stat ) continue;
        if( !dstRecord.directory ) continue;

        if( options.directories )
        {
          var record = { dst : dstRecord , src : srcRecord };
          addResult( record );
        }

        if( options.recursive )
        {
          var found = _.filesFind({
            path: dstRecord.path + '/',
            outputFormat: options.outputFormat,
            //result: result,
            recursive: 1
          })
          for( var fo = 0 ; fo < found.length ; fo++ )
          {
            var relative = Path.relative( dstOptions.relative,found[ fo ].absolute );
            var record = { dst : found[ fo ], src : _._fileRecord( relative,srcOptions ) }; // xxx
            addResult( record );
          }
        }

      }

    }

  }

  act( dstOptions,srcOptions );

  return result;
}

//

var filesFindSame = function( path,mask,options,onReady ){

  var self = this;
  if( onReady ) return _.timeAfter( 0, function(){
    onReady( arguments.callee.call( self,path,mask,options ) );
  });

  // options

  if( _.objectIs( path ) )
  {
    options = path;
    path = options.path;
    mask = options.mask;
  }

  //var path = _.arrayAs( path );
  var options = options || {};
  if( options.dst || options.src ) throw _.err( 'filesFindSame','src/dst is deprecated use path' );
  var options = _.mapClone( options || {} );
  if( options.useName === undefined ) options.useName = 1;
  if( options.hash === undefined ) options.hash = 1;
  if( options.latters === undefined ) options.latters = 0;
  if( options.lattersSizeLimit === undefined ) options.lattersSizeLimit = 1048576;
  //if( options.lattersSizeLimit === undefined ) options.lattersSizeLimit = 1048576;

  // output format

  var addResult;
  if( options.pathOnly !== undefined ) throw _.err( 'filesFindSame:','"pathOnly" deprecated, use "outputFormat"' );
  if( options.outputFormat === undefined ) options.outputFormat = 'full';
  if( options.outputFormat !== 'full' ) throw _.err( 'filesFindSame:','outputFormat could be only full' );

  console.log( 'filesFindSame',options );

  //

  var result = options.result || {};
  if( !result.same ) result.same = [];
  if( !result.sameContent ) result.sameContent = [];
  if( !result.sameName ) result.sameName = [];
  if( !result.similar ) result.similar = [];

  var findOptions = _.mapClone( options );
  findOptions.result = [];

  var files = _.filesFind( path,mask,findOptions );

  for( var f1 = 0 ; f1 < files.length ; f1++ )
  {

    var file1 = files[ f1 ];

    var sameRecord = [ file1 ];
    var sameNameRecord = [ file1 ];
    var sameContentRecord = [ file1 ];

    for( var f2 = f1 + 1 ; f2 < files.length ; f2++ )
    {

      var file2 = files[ f2 ];
      var same = _.filesSame( file1,file2 );
      if( same )
      {
        if( options.useName && file1.file !== file2.file )
        {
          if( !file2._haveSameContent )
          {
            file2._haveSameContent = 1;
            sameContentRecord.push( file2 );
          }
          continue;
        }
        if( file2.file.indexOf( 'null' ) !== -1 )
        console.log( file2 );
        sameRecord.push( file2 );
        files.splice( f2,1 );
        f2 -= 1;
      }
      else
      {
        if( options.similarity )
        if( file1.stat.size <= options.lattersSizeLimit && file1.stat.size <= options.lattersSizeLimit )
        if( Math.min( file1.stat.size,file2.stat.size ) / Math.max( file1.stat.size,file2.stat.size ) >= options.similarity )
        {
          var similarity = _.filesSimilarity( file1,file2 );
          if( similarity >= options.similarity )
          {
            var similarity = _.filesSimilarity( file1,file2 );
            result.similar.push({ files:[ file1,file2 ],similarity:similarity });

            //logger.logUp( 'Similar content( ',similarity*100,'% )' );
            //logger.log( file1.absolute );
            //logger.log( file2.absolute );
            //logger.logDown();

          }
        }
        if( file1.file === file2.file && !file2._haveSameName )
        {
          file2._haveSameName = 1;
          sameNameRecord.push( file2 );
          continue;
        }
      }

    }

    if( sameRecord.length > 1 )
    result.same.push( sameRecord );

    if( sameContentRecord.length > 1 && sameRecord.length !== sameContentRecord.length )
    result.sameContent.push( sameContentRecord );

    if( sameNameRecord.length > 1 && sameRecord.length !== sameNameRecord.length )
    result.sameName.push( sameNameRecord );

  }

  return result;
}

//

var directoryIs = function( filename ){

    try{

      var stat = fs.statSync( filename );
      return stat.isDirectory();

    } catch( err ){ return };

}

//

var fileIs = function( filename ){

    try{

      var stat = fs.statSync( filename );
      return stat.isFile();

    } catch( err ){ return };

}

//

var filesSame = function( ins1,ins2 ){

  if( _.strIs( ins1 ) ) ins1 = { stat : fs.statSync( ins1 ) };
  if( _.strIs( ins2 ) ) ins2 = { stat : fs.statSync( ins2 ) };

  //if( ins1.file === ins2.file )
  //console.log( ins1.file );

  var result = ins1.stat.size === ins2.stat.size;
  if( ( !ins1.hash || !ins2.hash ) && ( !ins1.read || !ins2.read ) ) result = result && ins1.stat.mtime.getTime() === ins2.stat.mtime.getTime();
  if( result && ins1.hash && ins2.hash ) result = ins1.hash === ins2.hash;
  if( result && ins1.read && ins2.read ) result = ins1.read === ins2.read;

  return result;
}

//

var filesLinked = function( ins1,ins2,isSame ){

  if( _.strIs( ins1 ) ) ins1 = { stat : fs.statSync( ins1 ) };
  if( _.strIs( ins2 ) ) ins2 = { stat : fs.statSync( ins2 ) };

  if( isSame === undefined ) isSame = _.filesSame( ins1,ins2 );

  //if( !ins2 || !ins1 )
  //console.log( ins2,ins1 );

  var result = isSame && ins1.stat.nlink > 1 && ins1.stat.nlink === ins2.stat.nlink && ins1.stat.ino === ins2.stat.ino;

  return result;
}

//

var filesSimilarity = function( src1,src2,options,onReady ){

  var self = this;
  if( onReady ) return _.timeAfter( 0, function(){
    onReady( arguments.callee.call( self,options ) );
  });

  var options = options || { latters : 1 };

  if( _.strIs( src1 ) || _.strIs( src2 ) ) throw _.err( 'filesSimilarity:','require file records' );

  if( _.strIs( src1 ) ) src1 = _._fileRecord( src1 );
  if( _.strIs( src2 ) ) src2 = _._fileRecord( src2 );

  var srcLatters1 = src1.latters || _.strLattersCount( src1.read || fs.readFileSync( src1.absolute,'utf8' ) );
  var srcLatters2 = src2.latters || _.strLattersCount( src2.read || fs.readFileSync( src2.absolute,'utf8' ) );

  var result = _.lattersComparison( srcLatters1,srcLatters2 );
  return result;
}

// -- prototype

_.mapExtend( Self,{

  fileRecord_: fileRecord_,
  _fileRecord: _fileRecord,

  fileHash: fileHash,
  filesShadow: filesShadow,

  // find

  filesFind: filesFind,
  filesFindDifference: filesFindDifference,
  filesFindSame: filesFindSame,

  //

  directoryIs: directoryIs,
  fileIs: fileIs,

  //

  filesSame: filesSame,
  filesLinked: filesLinked,
  filesSimilarity: filesSimilarity,

});

// -- export

if (typeof module !== "undefined" && module !== null) {
  module['exports'] = Self;
}

})();