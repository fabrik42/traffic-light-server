var express = require('express');
var redis = require('redis');
var path = require('path');

var db = redis.createClient();
var app = express();

var COLORS = ['red', 'yellow', 'green'];

// all environments
app.set('secret', process.env.TRAVIS_CI_SECRET);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function authorize(req, res) {
  if(app.get('secret') !== req.params.secret) {
    res.send(401);
    return false;
  }

  return true;
}

function setColor(color, mode) {
  db.set('trafficlight:' + color, mode);
}

function getColors(callback) {
  var arr = COLORS.map(function(color) { return 'trafficlight:'+ color });

  db.mget(arr, function(err, states) {
    var data = {};
    COLORS.forEach(function(color, index) {
      data[color] = states[index] === 'true';
    });
    callback(null, data);
  });
}

app.get('/', function(req, res){
  res.render('index');
});

app.get('/lights', function(req, res){
  getColors(function(err, colors) {
    res.send(colors);
  });
});

app.post('/lights', function(req, res){
  COLORS.forEach(function(color) {
    if(req.body.hasOwnProperty(color)) {
      setColor(color, req.body[color]);
    }
  });

  getColors(function(err, colors) {
    res.send(colors);
  });
});

app.post('/travis/:secret', function(req, res) {
  if(!authorize(req, res)) return;

  db.set('trafficlight:travis:last', req.body);
});

app.get('/travis/:secret', function(req, res){
  if(!authorize(req, res)) return;

  db.get('trafficlight:travis:last', function(err, data) {
    res.send(data);
  });
});

app.listen(app.get('port'));
