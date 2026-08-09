const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../data.js");
const root = path.resolve(__dirname, "..");

for (const filename of ["index.html", "temple.html", "styles.css", "data.js", "physics.js", "home.js", "app.js", "favicon.svg", "og.png"]) {
  assert.ok(fs.existsSync(path.join(root, filename)), `${filename} missing`);
}

const htmlFiles = ["index.html", "temple.html"];
for (const filename of htmlFiles) {
  const html = fs.readFileSync(path.join(root, filename), "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"?#]+)"/g)) {
    if (/^(?:https?:|data:|#)/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.resolve(root, match[1])), `${filename}: ${match[1]} missing`);
  }
}

const artAssets = new Set();
for (const temple of data.temples) {
  artAssets.add(temple.heroImage);
  assert.ok(fs.existsSync(path.join(root, temple.heroImage)), `${temple.heroImage} missing`);
  for (const track of ["foundation", "advanced"]) {
    for (const level of temple.tracks[track]) {
      const image = path.join(root, level.image);
      artAssets.add(level.image);
      assert.ok(fs.existsSync(image), `${level.code}: ${level.image} missing`);
      assert.ok(fs.statSync(image).size > 100_000, `${level.code}: image too small`);
    }
  }
}

const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const contract of ["預測前顯示", "舊證據已失效", "law-temple-v3-\\$\\{name\\}-completed", "law-temple-v3-\\$\\{track\\}-completed"]) assert.match(app, new RegExp(contract));
assert.match(app, /drawWaveVisual/);
assert.match(app, /drawTitanVisual/);
assert.match(app, /drawChronoVisual/);
assert.match(app, /drawPhotoVisual/);
assert.match(app, /drawMeasureVisual/);
assert.match(app, /drawExpansionVisual/);
assert.match(app, /law-temple-v4-player/);
assert.match(app, /神火耗盡/);
assert.equal(artAssets.size, 28);

console.log("V4 site integrity: routes, 28 art assets, flame recovery and evidence invalidation OK");
