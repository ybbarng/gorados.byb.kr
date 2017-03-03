var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');
var classification = require('./classification.json');

var place_table = 'place';
var pokemon_table = 'pokemon';

var app = express();

app.use(express.static(__dirname + '/app'));

function get_center(req) {
  return {
    latitude: (parseFloat(req.query.max_latitude) + parseFloat(req.query.min_latitude)) / 2,
    longitude: (parseFloat(req.query.max_longitude) + parseFloat(req.query.min_longitude)) / 2,
  };
}

app.get('/places.json', function(req, res) {
  var center = get_center(req);
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
      res.send(rows);
  });
});

app.get('/pokemons.json', function(req, res) {
  if (!req.query.zoom_level) {
    res.send([]);
    return;
  }
  var zoom_level = parseInt(req.query.zoom_level) - 12;
  zoom_level = Math.min(Math.max(0, zoom_level), 4);
  console.log('Zoom Level: ' + req.query.zoom_level + ', ' + 'Classification Index: ' + zoom_level);
  var pokemons = classification[zoom_level];
  var timestamp = Date.now() / 1000 | 0;
  var center = get_center(req);
  db.all('SELECT * FROM ' + pokemon_table +
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
      res.send(rows);
  });
});

var port = 12026;
app.listen(port, function() {
  console.log('Server is started.');
  console.log('Listening on ' + port);
});

process.on('SIGINT', function() {
  db.close();
  process.exit();
});
