var express = require('express');
var redis = require('redis');
var path = require('path');

var db;
var app = express();

var COLORS = ['red', 'yellow', 'green'];

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
  var redisUrl = require("url").parse(process.env.REDISTOGO_URL);
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

  if (mode === 'public') {
    getPublicColors(callback);
  } else if (mode === 'ci') {
    getTravisColors(callback);
  }
}

function getPublicColors(callback) {
  var arr = COLORS.map(function (color) { return 'trafficlight:' + color; });

  db.mget(arr, function (err, states) {
    var colors = { mode: getLightMode() };
    COLORS.forEach(function (color, index) {
      colors[color] = states[index] === 'true';
    });
    callback(null, colors);
  });
}

function getTravisColors(callback) {
  db.get('trafficlight:travis', function (err, travisState) {
    var colors = { mode: getLightMode() };
    COLORS.forEach(function (color) { colors[color] = false; });

    switch (travisState) {
    case 'finished':
      colors.green = true;
      break;
    case 'started':
      colors.yellow = true;
      break;
    case 'errored':
      colors.red = true;
      break;
    }

    callback(null, colors);
  });
}

function getLightMode() {
  var mode = process.env.LIGHT_MODE;
  if (mode !== 'public' && mode !== 'ci') throw('Unknown light mode!');
  return mode;
}

function extractTravisState(payload) {
  var states = payload.matrix.map(function(matrix) { return matrix.state });

  var order = {
    started:  0,
    errored:  1,
    finished: 2
  };

  var sorted = states.sort(function (a, b) {
    if(order[a] > order[b])
      return 1;
    else if(order[a] < order[b])
      return -1;
    else
      return 0;
  });

  return sorted[0];
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

  console.warn("--- TRAVIS CI WEBHOOK ---");
  console.warn(extractTravisState(payload));
  console.warn("--- TRAVIS CI WEBHOOK END ---");

  db.set('trafficlight:travis', extractTravisState(payload));
  res.send(201);
});

app.get('/travis/:secret', function (req, res){
  if (!authorizeTravis(req, res)) return;

  db.get('trafficlight:travis:last', function (err, data) {
    res.send(data);
  });
});

app.listen(app.get('port'));
