(function (win, $) {
  'use strict';

  var el = null;

  function pad(num) {
    return num < 10 ? '0' + num : num;
  }

  function update(e, data) {
    var date = new Date();
    var dateStr = [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join(':');

    el.text(['Last Update: ', dateStr, ' (', data.mode, ')'].join(''));
  }

  $(function () {
    el = $('#update-time');
    $(window).on('trafficlight:update', update);
  });

})(this, jQuery);
