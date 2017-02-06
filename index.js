var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');

var table_name = 'portal';

var app = express();

app.use(express.static(__dirname + '/app'));

app.get('/data.json', function(req, res) {
  console.log(req.query);
  db.all('SELECT * FROM ' + table_name + ' WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ?',
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
    function(err, rows) {
      console.log(rows);
  });
});

var port = 12025;
app.listen(port, function() {
  console.log('Server is started.');
  console.log('Listening on ' + port);
});

process.on('SIGINT', function() {
  db.close();
  process.exit();
});
