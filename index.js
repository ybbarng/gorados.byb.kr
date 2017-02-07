var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');

var portal_table = 'portal';
var pokemon_table = 'pokemon';

var app = express();

app.use(express.static(__dirname + '/app'));

app.get('/portals.geojson', function(req, res) {
  db.all('SELECT * FROM ' + portal_table,
    /*+ ' WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ?',
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
    */
    function(err, rows) {
      result = {
        'type': 'FeatureCollection',
        'crs': {
          'type': 'name',
          'properties': {
            'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
          }
        },
        'features': []
      }
      for (row of rows) {
        result.features.push({
            'type': 'Feature',
            'properties': {
              'Primary ID': row['id'],
              'Secondary ID': row['id'],
              'icon': row['type']
            },
            'geometry': {
              'type': 'Point',
              'coordinates': [row['longitude'], row['latitude']]
            }
        });
      }

      res.send(result);
  });
});

app.get('/pokemons.json', function(req, res) {
  db.all('SELECT * FROM ' + pokemon_table + 
    ' WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ?' + ' LIMIT 500',
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
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
