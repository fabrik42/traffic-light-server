(function(win, $){
  'use strict';

  var data = {};
  var pollPeriod = 5 * 1000;
  var pollTimeout = null;

  function load() {
    $.get('/lights', emit, 'json');
  }

  function set(color, state) {
    var changes = {};
    changes[color] = state;
    $.post('/lights', changes, emit, 'json');
  }

  function emit(response) {
    data = response;
    $(window).trigger('trafficlight:update', data);
    poll();
  }

  function poll() {
    if(pollTimeout) win.clearTimeout(pollTimeout);
    win.setTimeout(load, pollPeriod);
  }

  win.TrafficLight = {
    set: set
  };

  $(load);

})(this, jQuery);
