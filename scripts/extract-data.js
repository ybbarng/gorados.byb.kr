const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "..", "data.db"));
const dataDir = path.join(__dirname, "..", "data");

const typeIndexMap = {
  pokestop: 0,
  gym: 1,
  "7-eleven": 2,
  lotteria: 3,
  "angel-in-us": 4,
};

// places.json: [[lat, lng, typeIndex], ...]
db.all(
  "SELECT latitude, longitude, type FROM place ORDER BY latitude, longitude",
  (err, rows) => {
    if (err) throw err;
    const places = rows.map((r) => [
      r.latitude,
      r.longitude,
      typeIndexMap[r.type],
    ]);
    fs.writeFileSync(path.join(dataDir, "places.json"), JSON.stringify(places));
    console.log(`places.json: ${places.length}개 추출`);
  },
);

// move-pools.json: { "1": { "fast": [228,220,...], "charge": [254,270,...] }, ... }
db.all(
  "SELECT pokemon_id, GROUP_CONCAT(DISTINCT move1) as fast, GROUP_CONCAT(DISTINCT move2) as charge FROM pokemon GROUP BY pokemon_id ORDER BY pokemon_id",
  (err, rows) => {
    if (err) throw err;
    const movePools = {};
    for (const row of rows) {
      movePools[row.pokemon_id] = {
        fast: row.fast.split(",").map(Number),
        charge: row.charge.split(",").map(Number),
      };
    }
    fs.writeFileSync(
      path.join(dataDir, "move-pools.json"),
      JSON.stringify(movePools),
    );
    console.log(`move-pools.json: ${Object.keys(movePools).length}개 종 추출`);
    db.close();
  },
);
