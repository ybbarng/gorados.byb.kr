const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

function clean() {
  if (fs.existsSync(dist)) {
    fs.rmSync(dist, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Clean dist/
clean();
console.log("dist/ cleaned");

// 2. Vite build → dist/js/map.js
execSync("npx vite build", { cwd: root, stdio: "inherit" });
console.log("Vite build done");

// 3. Copy app files
copyRecursive(path.join(root, "app/index.html"), path.join(dist, "index.html"));
copyRecursive(path.join(root, "app/css"), path.join(dist, "css"));
copyRecursive(
  path.join(root, "app/js/L.Control.Locate.min.js"),
  path.join(dist, "js/L.Control.Locate.min.js"),
);
copyRecursive(path.join(root, "app/robots.txt"), path.join(dist, "robots.txt"));
console.log("app/ files copied");

// 4. Copy static/
copyRecursive(path.join(root, "static"), path.join(dist, "static"));
console.log("static/ copied");

// 5. Copy data/places.json
copyRecursive(
  path.join(root, "data/places.json"),
  path.join(dist, "data/places.json"),
);
console.log("data/places.json copied");

console.log("Build complete → dist/");
