const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true });
const client = path.join(out, "client");
fs.mkdirSync(client, { recursive: true });
for (const name of ["index.html", "temple.html", "styles.css", "data.js", "physics.js", "home.js", "app.js", "favicon.svg", "og.png", "assets"]) {
  fs.cpSync(path.join(root, name), path.join(client, name), { recursive: true });
}
console.log("Built static site to dist/client");
