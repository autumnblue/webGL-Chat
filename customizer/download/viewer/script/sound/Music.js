Music = function () {
  arguments.callee.prototype.init.apply( this,arguments );
};

(function(){

var $ = jQuery;
var dir = '/music/';
var limit = 9999;
var volume = 50;
var focused = 1;
var playing = 1;
var time =
{
  delay: 1000,
  start: 5000,
  pause: 1000
}

// -- routine

var init = function( options ){

  var self = this;
  options = options || {};
  Wtools.mapExtend( self,options );
  self.sounds = {};
  self.time = Wtools.clone( time );

  var vol = 0, volSteps = 1, volInterval = 50;
  var f;
  for( f in Playlist ) break;
  var file = self.dir + f;

  setTimeout( function(){ self.newSound( file ) },self.time.delay );

  var handleBlur = function()
  {
    if( !self.sound || self.focused ) return;
    if( vol <= 0 )
    {
      self.sound.pause();
      //console.log( 'paused' );
      return;
    }
    vol--;
    self.sound.setVolume( 0 + self.sound.getVolume()*vol/volSteps );
    setTimeout( handleBlur,volInterval );
  }

  $(window).blur(function(){
    //return;
    if( !self.focused || !self.playing || !self.sound ) return;
    //console.log('blur');
    //self.sound.fadeTo( 0,self.time.pause );
    vol = volSteps;
    self.focused = 0;
    handleBlur();
  });
  $(window).focus(function(){
    if( self.focused || !self.playing || !self.sound ) return;
    //console.log('focus');
    self.sound.setVolume( 0 );
    self.sound.play();
    self.sound.fadeTo( self.volume,self.time.pause );
    self.focused = 1;
  });

}

//

var togglePlay = function(){

  var self = this;
  if( !self.sound ) return;
  if( self.playing )
  {
    self.playing = 0;
    self.sound.fadeTo( 0,self.time.pause );
    setTimeout( function(){self.sound.pause()},self.time.pause );
  }
  else
  {
    self.playing = 1;
    self.sound.setVolume( 0 );
    self.sound.play();
    self.sound.fadeTo( self.volume,self.time.pause );
  }

}

//

var newSound = function( file,limit ){

  var self = this;
  if( limit === undefined ) limit = self.limit;
  if( limit < 0 ) console.log( 'playing: ',file,' failed! Limit exceed!' );
  console.log( 'playing: ',file );

  if( !self.sounds[file] )
  {
    self.sound = new buzz.sound(file, {
      formats: [ "ogg", "mp3", "aac", "wav" ],
      preload: true,
      autoplay: true,
      loop: false
    });
    self.sound.file = file;
    self.sound
      //.setSpeed( 2 )
      .setVolume( 0 )
      .bind("playing", function( e ) {
        //this.setPercent( 98 );
      })
      //.bind("ended empty", function( e ) {
      .bind("ended", function( e ) {
        var f,found = 0;
        for( f in Playlist )
        {
          if( found )
          {
            found = 0;
            break;
          }
          if( self.dir+f == this.file ) found = 1;
        }
        if( found ) for( f in Playlist ) break;
        self.newSound( self.dir + f,limit-1 );
      });
    self.sounds[file] = self.sound;
  }

  self.sound = self.sounds[file];
  self.sound
    //.setSpeed( 2 )
    .setVolume( 0 )
    //.play()
    .fadeTo( volume,5000 );

  return self.sound;

}

// -- prototype

Music.prototype = {

// constructor
  init: init,
  newSound: newSound,
  togglePlay: togglePlay,

// var
  dir: dir,
  limit: limit,
  volume: volume,
  focused: focused,
  playing: playing,
  time: time

}

})();