var express = require('express');
var compression = require('compression');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');
var classification = require('./classification.json');
var present = require('present');
var winston = require('winston');
require('winston-daily-rotate-file');

var timeOffset = 9 * 60 * 60 * 1000;

function timestamp() {
  return new Date(Date.now() + timeOffset).toISOString();
}

function formatter(options) {
  return '[' + options.timestamp() + '] ' +
    options.level.toUpperCase() + ' | ' +
    (options.message ? options.message : '' ) +
    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'info',
      timestamp: timestamp,
      formatter: formatter
    }),
    new winston.transports.DailyRotateFile({
      filename: './log/debug-',
      datePattern: 'yyyy-MM-dd.log',
      level: 'debug',
      json: false,
      timestamp: timestamp,
      formatter: formatter
    })
  ]
});

var place_table = 'place';
var pokemon_table = 'pokemon';

var app = express();

var oneDay = 864000000;

app.use(compression());
app.use(express.static(__dirname + '/app'));
app.use('/static', express.static(__dirname + '/static', { maxAge: oneDay }));

function get_center(req) {
  return {
    latitude: (parseFloat(req.query.max_latitude) + parseFloat(req.query.min_latitude)) / 2,
    longitude: (parseFloat(req.query.max_longitude) + parseFloat(req.query.min_longitude)) / 2,
  };
}

app.get('/places.json', function(req, res) {
  var center = get_center(req);
  var startTime = present();
  logger.log('debug', 'Places query is requested to the DB.');
  db.all('SELECT * FROM ' + place_table +
    ' WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ?' +
    ' ORDER BY ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) ASC' +
    ' LIMIT 500',
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
    center.latitude,
    center.latitude,
    center.longitude,
    center.longitude,
    function(err, rows) {
      var endTime = present();
      logger.log('debug', 'The response of Places query is received from the DB.');
      logger.log('info', 'Places query time spent: %d ms', endTime - startTime);
      res.send(rows);
  });
});

app.get('/pokemons.json', function(req, res) {
  if (!req.query.zoom_level) {
    res.send([]);
    return;
  }
  var id = null;
  if (req.query.id && /^\w+$/.test(req.query.id)) {
    id = req.query.id;
  }
  var zoom_level = parseInt(req.query.zoom_level) - 12;
  zoom_level = Math.min(Math.max(0, zoom_level), 4);
  logger.log('info', 'Zoom Level: %s, Classification Index: %s', req.query.zoom_level, zoom_level);
  var pokemons = classification[zoom_level];
  if (req.query.filters) {
    if (/^[\d,]+$/.test(req.query.filters)) {
      var filters = req.query.filters.split(',');
      pokemons = pokemons.concat(filters);
      pokemons = Array.from(new Set(pokemons));
    }
  }
  var timestamp = 1491960000; // 1491965245 Date.now() / 1000 | 0;
  var center = get_center(req);
  var startTime = present();
  logger.log('debug', 'Pokemons query is requested to the DB.');
  db.all('SELECT *' +
    ' FROM ' + pokemon_table +
    ' INDEXED BY pokemon_despawn_idx' +
    ' WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ? AND despawn > ?' +
    ' AND pokemon_id in ( ' + pokemons.join(',') + ')' +
    ' ORDER BY ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) ASC' +
    ' LIMIT 500',
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
    timestamp,
    center.latitude,
    center.latitude,
    center.longitude,
    center.longitude,
    function(err, rows) {
      var endTime = present();
      logger.log('debug', 'The response of Pokemons query is received from the DB.');
      logger.log('info', 'Pokemons query time spent: %d ms', endTime - startTime);
      res.send(rows);
  });
});

app.get('/pokemon.json', function(req, res) {
  var id = null;
  if (req.query.id && /^\w+$/.test(req.query.id)) {
    id = req.query.id;
  } else {
    res.send([]);
    return;
  }
  var startTime = present();
  logger.log('debug', 'Pokemon query is requested to the DB.');
  db.all('SELECT *' +
    ' FROM ' + pokemon_table +
    ' WHERE id = ?',
    id,
    function(err, rows) {
      var endTime = present();
      logger.log('debug', 'The response of Pokemon query is received from the DB.');
      logger.log('info', 'Pokemon query time spent: %d ms', endTime - startTime);
      res.send(rows);
  });
});

var port = 12026;
app.listen(port, function() {
  logger.log('info', 'Server is started.');
  logger.log('info', 'Listening on %d', port);
});

process.on('SIGINT', function() {
  logger.log('info', 'SIGINT is received. Server is stopped.');
  db.close();
  process.exit();
});
