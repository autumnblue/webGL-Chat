(function(){

CharacterCustomizer = function () {
  arguments.callee.prototype.init.apply( this,arguments );
};

var Self = CharacterCustomizer;
var $ = jQuery;
var _ = Wtools;

DEBUG = 1;

// -- routine

var init = function( options ) {

  var self = this;
  instances.push( self );
  options = options || {};
  _.mapExtend( self,options );

  //

  $( document ).ready( function(){

/*
    $.ajax({
      type: "GET",
      url: "/customizer",
    })
    .done(function( msg ) {

      $( '.panel.mid' ).html( msg );
      //console.log( msg );

    });
*/

    var character = self.character = {};
    character.detail = {};

    self.initGui();
    self.initSounds();

  });

}

//

var initGui = function(){

  var self = this;

  $( '[data-content],[html-content]' ).popup();

  // forms

  var formOptions = {
    inline: true,
    on: 'blur',
    transition: 'fade down',
  };

  $( '.page.login > .form' )
  .form( {},formOptions )
  .submit( function( event ){

    self.handleLoginClick.call( self,event );

    return false;
  });

  // keyboard

  Mousetrap.bind( [ 'return' ],_.bind( self.handleNextClick, self ) );

  Mousetrap.bind( [ 'backspace' ],_.bind( self.handlePrevClick, self ) );

  // arrows

  $( '.arrows.right .icon' )
  .click( _.bind( self.handleNextClick, self ) );

  $( '.arrows.left .icon' )
  .click( _.bind( self.handlePrevClick, self ) );

  // specific

  //$( '.page.login .submit' )
  //.click( _.bind( self.handleLoginClick, self ) );

  $( '.sex.pickable' )
  .click( _.bind( self.handleSexClick, self ) );

  $( '.character.pickable' )
  .click( _.bind( self.handleCharacterClick, self ) );

  $( '.menu-detail-type .item' )
  .click( _.bind( self.handleDetailTypeClick, self ) );

}

//

var initSounds = function() {

  var self = this;
  var formats = [ "ogg", "mp3", "aac", "wav" ];

  self.sound = {};

  self.sound.message = new buzz.sound( "/viewer/sound/message",{ formats: formats, preload: true });
}

// --

var updateDetailType = function( type ){

  var self = this;
  var character = self.character;

  var type = type || character.currentDetailType || 'head';
  character.currentDetailType = type;
  //delete character.currentDetailType;

  console.log( 'updateDetailType',type );

  $( '.menu-detail-type .item.active' ).removeClass( 'active' );
  $( '.menu-detail-type .item[type=' + character.currentDetailType + ']' ).addClass( 'active' );

  $( '.menu-detail-pick' ).remove();

  $.ajax({

    url: self.urlPostDetails,
    data: JSON.stringify( self.character ),
    cache: false,
    processData: false,
    contentType: "application/html; charset=utf-8",
    dataType: 0,
    type: 'POST',
    success: function ( html ) {

      var html = $( html );
      $( '.menu-detail-pick' ).remove();
      $( '.panel.customizer' ).append( html );

      html.find( '.item' )
      .click( _.bind( self.handleDetailPickClick, self ) );

    },
    error: function ( status ) {

      throw _.err( 'Customizer:','Failed to post details:',status.responseText );

    }

  });

}

//

var updateCharacter = function(){

  var self = this;
  var character = self.character;

  $( '.menu-detail-type' ).removeClass( 'layout-invisible' );

  $.ajax({

    url: self.urlPostCharacter,
    data: JSON.stringify( self.character ),
    cache: false,
    processData: false,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    type: 'POST',
    success: function ( character ) {

      self.character = character;
      $( '.page.details .image.details' ).css( 'background-image','url( ' + character.pathImage + '?' + new Date().getTime() + ' )' );
      console.log( 'character',character );

    },
    error: function ( status ) {

      throw _.err( 'Customizer:','Failed to post character:',status.responseText );

    }

  });

}

//

var handleNextClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );
  var character = self.character;

  if( !$( '.page.details' ).hasClass( 'layout-invisible' ) )
  {

    var url = '/chat';
    var fields =
    {

      name : $( '.page.login > .form input.name' ).val() || 'Unknown',
      password : $( '.page.login > .form input.password' ).val() || 'password',
      avatar: character.pathImageTexture,
      //avatar: '/character/generated/texture.png',

    };

    form = viewFormPost({ url: url, fields: fields });
    var form = $( form ).appendTo( 'body' )
    form.submit();

    self.sound.message.play();

  }
  else if( !$( '.page.login' ).hasClass( 'layout-invisible' ) )
  {

    self.handleLoginClick( event );

  }

}

//

var handlePrevClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );
  var character = self.character;

  self.$pageCharacter = $( '.page.character.' + character.sex );

  if( !$( '.page.details' ).hasClass( 'layout-invisible' ) )
  {

    $( '.page.details' ).addClass( 'layout-invisible' );
    $( '.menu-detail-type' ).addClass( 'layout-invisible' );
    $( '.menu-detail-pick' ).addClass( 'layout-invisible' );

    self.$pageCharacter.removeClass( 'layout-invisible' );
    self.sound.message.play();

  }
  else if( !$( '.page.sex' ).hasClass( 'layout-invisible' ) )
  {

    $( '.page.sex' ).addClass( 'layout-invisible' );
    $( '.page.login' ).removeClass( 'layout-invisible' );
    self.sound.message.play();

  }
  else if( !self.$pageCharacter.hasClass( 'layout-invisible' ) && self.$pageCharacter.length )
  {

    self.$pageCharacter.addClass( 'layout-invisible' );
    $( '.page.sex' ).removeClass( 'layout-invisible' );
    self.sound.message.play();

  }

  character.detail = {};

  return false;
}

//

var handleLoginClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );

  $( '.page.login' ).addClass( 'layout-invisible' );
  $( '.page.sex' ).removeClass( 'layout-invisible' );

  self.sound.message.play();

}

//

var handleSexClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );
  var character = self.character;

  if( target.hasClass( 'male' ) ) character.sex = 'male'
  else character.sex = 'female';

  $( '.page.sex' ).addClass( 'layout-invisible' );
  $( '.page.character.' + character.sex ).removeClass( 'layout-invisible' );

  self.sound.message.play();

}

//

var handleCharacterClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );
  var character = self.character;

  character.pathBodyPreview = target.attr( 'type' );
  character.pathBody = /(.+)-preview(.+)/.exec( character.pathBodyPreview );
  character.pathBody = character.pathBody[1] + character.pathBody[2];
  //character.pathBodyPreview = _.urlDocument( character.pathBodyPreview,{ withoutServer:1 } );
  character.pathCharacter = /(.+\/body\/).+/.exec( character.pathBodyPreview )[ 1 ] + '..';

  $( '.page.character.' + character.sex ).addClass( 'layout-invisible' );
  $( '.page.details' ).removeClass( 'layout-invisible' );

  self.updateDetailType();

  console.log( 'character',character );

  self.updateCharacter();

  self.sound.message.play();

}

//

var handleDetailTypeClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );
  var character = self.character;

  var type = target.attr( 'type' );
  self.updateDetailType( type );

  self.sound.message.play();

}

//

var handleDetailPickClick = function( event ){

  var self = this;
  var target = $( event.currentTarget );
  var character = self.character;

  var type = target.attr( 'type' );
  var file = target.attr( 'file' );

  $( '.menu-detail-pick .item.active' ).removeClass( 'active' );
  target.addClass( 'active' );

  character.detail[ character.currentDetailType ] = type;

  self.updateCharacter();

  self.sound.message.play();

}

// -- var

var instances = [];
var surfacePath = 'body';
var urlPostCharacter = '/customizer/character';
var urlPostDetails = '/customizer/details';

// -- proto

Self.prototype = {

// -- constructor

  init: init,
  initGui: initGui,
  initSounds: initSounds,

// --

  updateDetailType: updateDetailType,
  updateCharacter: updateCharacter,

// -- handle

  handleNextClick: handleNextClick,
  handlePrevClick: handlePrevClick,

  handleLoginClick: handleLoginClick,
  handleSexClick: handleSexClick,
  handleCharacterClick: handleCharacterClick,
  handleDetailTypeClick: handleDetailTypeClick,
  handleDetailPickClick: handleDetailPickClick,

// -- var

  instances: instances,
  surfacePath: surfacePath,
  urlPostCharacter: urlPostCharacter,
  urlPostDetails: urlPostDetails,

};

//

$( document ).ready( function(){

  app = (typeof app !== 'undefined') ? app : new Self({
    surfacePath: '.main.surface',
  });

});

})();