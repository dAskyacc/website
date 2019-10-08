/**
 * MetaMask Support
 *  |\_/|,,_____,~~`
 *  (.".)~~     )`~}}
 *   \o/\ /---~\\ ~}}
 *     _//    _// ~}
 * 
 * Copyright (c) 2019 hyperorchid.org,orchid2ev
 * E-mail :orchid@hyperorchid.org
 * git@flash:hyperorchidlab/website.git
 * 
 */
(function($){
  'use strict';

  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').on('click',function(e){
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 70)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }    
  });

  $('.js-scroll-trigger').on('click',function(e){
    $('.navbar-collapse').collapse('hide');
  });

  //submenus click
  $('.sub-menu-container a.js-scroll-trigger').on('click',(e)=>{
    $('.dropdown.show .dropdown-toggle').dropdown('toggle');
  });  

  $('body').scrollspy({
    target: '#mainNav',
    offset: 100
  }); 

  var navbarCollapse = function() {
    if ($("#mainNav").offset().top > 100) {
      $("#mainNav").addClass("navbar-shrink");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
    }
  };
  // Collapse now if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  $(window).scroll(navbarCollapse);   

  var i18n = new I18n('en');
  i18n.indexInit();
})(jQuery);