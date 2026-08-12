const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../data.js");
const root = path.resolve(__dirname, "..");

for (const filename of ["index.html", "explore.html", "temple.html", "styles.css", "data.js", "exploration-data.js", "physics.js", "audio.js", "home.js", "explore.js", "app.js", "favicon.svg", "og.png"]) {
  assert.ok(fs.existsSync(path.join(root, filename)), `${filename} missing`);
}

const htmlFiles = ["index.html", "explore.html", "temple.html"];
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
for (const contract of ["判斷已封存", "舊證據已失效", "law-temple-v3-\\$\\{name\\}-completed", "law-temple-v3-\\$\\{track\\}-completed"]) assert.match(app, new RegExp(contract));
assert.match(app, /drawWaveVisual/);
assert.match(app, /drawTitanVisual/);
assert.match(app, /drawChronoVisual/);
assert.match(app, /drawPhotoVisual/);
assert.match(app, /drawMeasureVisual/);
assert.match(app, /drawExpansionVisual/);
assert.match(app, /function controlMarkup/);
assert.match(app, /data-control-option/);
assert.match(app, /type === "pivot"/);
assert.match(app, /二頭肌拉力/);
for (const renderer of ["drawNewtonEvidence", "drawResonanceEvidence", "drawEMWaveEvidence", "drawQuantumEvidence", "drawNuclearEvidence"]) assert.match(app, new RegExp(renderer));
assert.match(app, /law-temple-v4-player/);
assert.match(app, /神火耗盡/);
assert.match(app, /spawnSealBurst/);
assert.match(app, /TempleAudio/);
const audio = fs.readFileSync(path.join(root, "audio.js"), "utf8");
assert.match(audio, /AudioContext/);
assert.match(audio, /law-temple-audio-enabled/);
assert.match(audio, /aria-pressed/);
assert.match(audio, /aria-label/);
for (const cue of ["evidence", "damage", "rewind", "success"]) assert.match(audio, new RegExp(`${cue}:`));
const home = fs.readFileSync(path.join(root, "home.js"), "utf8");
assert.match(home, /nextMission/);
assert.match(home, /法則遠征地圖/);
assert.match(home, /先押下判斷/);
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(index, /explore\.html/);
assert.equal(artAssets.size, 33);

console.log("V5 site integrity: routes, 33 art assets, recoverable flame, campaign guidance and procedural audio OK");
