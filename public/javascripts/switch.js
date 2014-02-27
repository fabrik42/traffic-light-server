(function(win, $){
  'use strict';

  var switches = null;

  function switchLight() {
    var el = $(this);
    var color = el.data('color');
    var newState = !el.hasClass('on');

    newState ? el.addClass('on') : el.removeClass('on');

    TrafficLight.set(color, newState);
  }

  function update(e, data) {
    switches.each(function() {
      var el = $(this);
      var state = data[el.data('color')];
      state ? el.addClass('on') : el.removeClass('on');
    });
  }

  $(function() {
    switches = $('#switch a[data-color]');
    switches.each(function() {
      $(this).click(switchLight);
    });

    $(window).on('trafficlight:update', update);
  });

})(this, jQuery);
