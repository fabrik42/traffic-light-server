var express = require('express');
var redis = require('redis');
var path = require('path');
var url = require('url');

var COLORS = ['red', 'yellow', 'green'];

var app = express();
var db;

app.set('secret', process.env.TRAVIS_CI_SECRET);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') === 'production') {
  app.use(express.errorHandler());
  var redisUrl = url.parse(process.env.REDISTOGO_URL);
  db = redis.createClient(redisUrl.port, redisUrl.hostname);
  db.auth(redisUrl.auth.split(":")[1]);
} else {
  db = redis.createClient();
}

function authorizeTravis(req, res) {
  if (app.get('secret') !== req.params.secret) {
    res.send(401);
    return false;
  }

  return true;
}

function authorizeUser(req, res) {
  if (getLightMode() !== 'public') {
    res.send(401);
    return false;
  }

  return true;
}

function setColor(color, mode) {
  db.set('trafficlight:' + color, mode);
}

function getColors(callback) {
  var mode = getLightMode();
  var data = { mode: getLightMode() };

  if (mode === 'public') {
    getPublicColors(callback, data);
  } else if (mode === 'ci') {
    getTravisColors(callback, data);
  }
}

function getPublicColors(callback, data) {
  var arr = COLORS.map(function (color) { return 'trafficlight:' + color; });

  db.mget(arr, function (err, states) {
    COLORS.forEach(function (color, index) {
      data[color] = states[index] === 'true';
    });
    callback(null, data);
  });
}

// parse status message based on
// https://github.com/travis-ci/travis-core/blob/master/lib/travis/model/build/result_message.rb
function getTravisColors(callback, data) {
  db.get('trafficlight:travis', function (err, travisState) {
    COLORS.forEach(function (color) { data[color] = false; });

    switch (travisState) {
    case 'Failed':
    case 'Broken':
    case 'Still Failing':
    case 'Errored':
    case 'Canceled':
      data.red = true;
      break;
    case 'Pending':
      data.yellow = true;
      break;
    case 'Passed':
    case 'Fixed':
      data.green = true;
      break;
    }

    callback(null, data);
  });
}

function getLightMode() {
  var mode = process.env.LIGHT_MODE;
  if (mode !== 'public' && mode !== 'ci') throw('Unknown light mode!');
  return mode;
}

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/lights', function (req, res) {
  getColors(function (err, colors) {
    res.send(colors);
  });
});

app.post('/lights', function (req, res) {
  if (!authorizeUser(req, res)) return;

  COLORS.forEach(function(color) {
    if (req.body.hasOwnProperty(color)) {
      setColor(color, req.body[color]);
    }
  });

  getColors(function (err, colors) {
    res.send(colors);
  });
});

app.post('/travis/:secret', function (req, res) {
  if (!authorizeTravis(req, res)) return;

  var payload = JSON.parse(req.body.payload);
  db.set('trafficlight:travis', payload.status_message);

  res.send(201);
});

app.get('/travis/:secret', function (req, res){
  if (!authorizeTravis(req, res)) return;

  db.get('trafficlight:travis:last', function (err, data) {
    res.send(data);
  });
});

app.listen(app.get('port'));
