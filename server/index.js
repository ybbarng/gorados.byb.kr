const express = require("express");
const compression = require("compression");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("data.db");
const classification = require("./classification.json");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const timeOffset = 9 * 60 * 60 * 1000;

function timestamp() {
  return new Date(Date.now() + timeOffset).toISOString();
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.printf(
          (info) =>
            `[${timestamp()}] ${info.level.toUpperCase()} | ${info.message ? info.message : ""}`,
        ),
      ),
    }),
    new DailyRotateFile({
      filename: "./log/debug-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "debug",
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.printf(
          (info) =>
            `[${timestamp()}] ${info.level.toUpperCase()} | ${info.message ? info.message : ""}`,
        ),
      ),
    }),
  ],
});

const place_table = "place";
const pokemon_table = "pokemon";

const app = express();

const oneDay = 864000000;

app.use(compression());
app.use(express.static(`${__dirname}/app`));
app.use("/static", express.static(`${__dirname}/static`, { maxAge: oneDay }));

function get_center(req) {
  return {
    latitude:
      (Number.parseFloat(req.query.max_latitude) +
        Number.parseFloat(req.query.min_latitude)) /
      2,
    longitude:
      (Number.parseFloat(req.query.max_longitude) +
        Number.parseFloat(req.query.min_longitude)) /
      2,
  };
}

app.get("/places.json", (req, res) => {
  const center = get_center(req);
  const startTime = performance.now();
  logger.log("debug", "Places query is requested to the DB.");
  db.all(
    `SELECT * FROM ${place_table} WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ? ORDER BY ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) ASC LIMIT 500`,
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
    center.latitude,
    center.latitude,
    center.longitude,
    center.longitude,
    (err, rows) => {
      const endTime = performance.now();
      logger.log(
        "debug",
        "The response of Places query is received from the DB.",
      );
      logger.log("info", "Places query time spent: %d ms", endTime - startTime);
      res.send(rows);
    },
  );
});

app.get("/pokemons.json", (req, res) => {
  if (!req.query.zoom_level) {
    res.send([]);
    return;
  }
  let id = null;
  if (req.query.id && /^\w+$/.test(req.query.id)) {
    id = req.query.id;
  }
  let zoom_level = Number.parseInt(req.query.zoom_level) - 12;
  zoom_level = Math.min(Math.max(0, zoom_level), 4);
  logger.log(
    "info",
    "Zoom Level: %s, Classification Index: %s",
    req.query.zoom_level,
    zoom_level,
  );
  let pokemons = classification[zoom_level];
  if (req.query.filters) {
    if (/^[\d,]+$/.test(req.query.filters)) {
      const filters = req.query.filters.split(",");
      pokemons = pokemons.concat(filters);
      pokemons = Array.from(new Set(pokemons));
    }
  }
  const timestamp = 1491960000; // 1491965245 Date.now() / 1000 | 0;
  const center = get_center(req);
  const startTime = performance.now();
  logger.log("debug", "Pokemons query is requested to the DB.");
  db.all(
    `SELECT * FROM ${pokemon_table} INDEXED BY pokemon_despawn_idx WHERE latitude >= ? AND latitude < ? AND longitude >= ? AND longitude < ? AND despawn > ? AND pokemon_id in ( ${pokemons.join(",")}) ORDER BY ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) ASC LIMIT 500`,
    req.query.min_latitude,
    req.query.max_latitude,
    req.query.min_longitude,
    req.query.max_longitude,
    timestamp,
    center.latitude,
    center.latitude,
    center.longitude,
    center.longitude,
    (err, rows) => {
      const endTime = performance.now();
      logger.log(
        "debug",
        "The response of Pokemons query is received from the DB.",
      );
      logger.log(
        "info",
        "Pokemons query time spent: %d ms",
        endTime - startTime,
      );
      res.send(rows);
    },
  );
});

app.get("/pokemon.json", (req, res) => {
  let id = null;
  if (req.query.id && /^\w+$/.test(req.query.id)) {
    id = req.query.id;
  } else {
    res.send([]);
    return;
  }
  const startTime = performance.now();
  logger.log("debug", "Pokemon query is requested to the DB.");
  db.all(`SELECT * FROM ${pokemon_table} WHERE id = ?`, id, (err, rows) => {
    const endTime = performance.now();
    logger.log(
      "debug",
      "The response of Pokemon query is received from the DB.",
    );
    logger.log("info", "Pokemon query time spent: %d ms", endTime - startTime);
    res.send(rows);
  });
});

const port = 12026;
app.listen(port, () => {
  logger.log("info", "Server is started.");
  logger.log("info", "Listening on %d", port);
});

process.on("SIGINT", () => {
  logger.log("info", "SIGINT is received. Server is stopped.");
  db.close();
  process.exit();
});
