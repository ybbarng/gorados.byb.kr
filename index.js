var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');

var table_name = 'portal';

var app = express();

app.use(express.static(__dirname + '/app'));

app.get('/data.geojson', function(req, res) {
  db.all('SELECT * FROM ' + table_name,
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

var port = 12026;
app.listen(port, function() {
  console.log('Server is started.');
  console.log('Listening on ' + port);
});

process.on('SIGINT', function() {
  db.close();
  process.exit();
});
