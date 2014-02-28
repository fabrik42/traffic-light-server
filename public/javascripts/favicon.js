(function (win, $) {
  'use strict';

  var head = null;
  var link = null;
  var canvas;
  var context;

  var radius = 2;
  var width = 16;
  var height = 16;
  var padding = 1;

  function drawBackground() {
    context.beginPath();
    // background
    // width: two times the size of a light
    // position: center
    var bgCenter = width / 2;
    var bgWidth = radius * 2 * 2;
    var bgStartX = bgCenter - bgWidth / 2;
    var bgStartY = 0;
    context.rect(bgStartX, bgStartY, bgWidth, height);
    context.fillStyle = '#222222';
    context.fill();
  }

  function drawCircle(position, color) {
    var centerX = width / 2;
    var centerY = position * (radius * 2 + padding) + (radius + padding);
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
  }

  function update(e, data) {
    canvas = document.createElement('canvas');
    canvas.height = canvas.width = width;
    context = canvas.getContext('2d');

    drawBackground();
    if(data.red)    drawCircle(0, '#ff4b4a');
    if(data.yellow) drawCircle(1, '#ffff03');
    if(data.green)  drawCircle(2, '#05ff03');

    if(link) link.remove();
    link = $('<link rel="shortcut icon" type="image/png" />')[0];
    link.href = canvas.toDataURL('image/png');
    head.appendChild(link);
  }

  $(function () {
    head = document.getElementsByTagName('head')[0];
    $(window).on('trafficlight:update', update);
  });

})(this, jQuery);
