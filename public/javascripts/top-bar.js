(function (win, $) {
  'use strict';

  var el = null;
  var COLORS = ['red', 'yellow', 'green'];

  function update(e, data) {
    var addClasses = [];

    COLORS.forEach(function (cssClass) {
      if (data[cssClass] === true) addClasses.push(cssClass);
    });

    if (addClasses.length  > 1) addClasses = [];

    el.removeClass().addClass(addClasses.join(' '));
  }

  $(function () {
    el = $('#top-bar');
    $(window).on('trafficlight:update', update);
  });

})(this, jQuery);
