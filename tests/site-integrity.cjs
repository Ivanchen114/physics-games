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
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(?:https?:|data:|#)/.test(match[1])) continue;
    const assetPath = match[1].split("?")[0];
    assert.ok(fs.existsSync(path.resolve(root, assetPath)), `${filename}: ${assetPath} missing`);
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
for (const contract of ["選擇已刻下", "剛才的痕跡已不再代表現在的狀態", "law-temple-v3-\\$\\{name\\}-completed", "law-temple-v3-\\$\\{track\\}-completed"]) assert.match(app, new RegExp(contract));
for (const labPhrase of ["判斷已封存", "舊證據已失效", "顯示轉動證據", "提交解釋", "驗證模型"]) assert.doesNotMatch(app, new RegExp(labPhrase));
assert.match(app, /drawWaveVisual/);
assert.match(app, /drawTitanVisual/);
assert.match(app, /drawChronoVisual/);
assert.match(app, /drawPhotoVisual/);
assert.match(app, /drawMeasureVisual/);
assert.match(app, /drawExpansionVisual/);
assert.match(app, /function controlMarkup/);
assert.match(app, /data-control-option/);
assert.match(app, /data-workbench/, "stage must bind canvas and active controls into one workbench");
assert.match(app, /function activatePhase/, "phase dock must collapse previous steps when the active step changes");
assert.match(app, /setPhaseSummary\("prediction"/, "sealed foundation predictions must remain visible as a compact summary");
assert.match(app, /setPhaseSummary\("control"/, "completed control runs must remain visible as a compact summary");
assert.match(app, /setPhaseSummary\("model"/, "advanced model selection must collapse before numeric input");
assert.match(app, /pixelWidth \/ logicalWidth/, "canvas backing pixels must map onto the invariant 1000x562 physics coordinate system");
assert.match(app, /minimumLabelPx = "12"/);
assert.match(app, /minimumKeyPx = "14"/);
const templeHtml = fs.readFileSync(path.join(root, "temple.html"), "utf8");
assert.match(templeHtml, /styles\.css\?v=/, "stage stylesheet must be cache-busted for structural responsive releases");
assert.match(templeHtml, /app\.js\?v=/, "stage runtime must be cache-busted for structural responsive releases");
assert.match(app, /type === "pivot"/);
assert.match(app, /二頭肌拉力/);
assert.match(app, /formatModelValue\(reference\?\.answer, reference\?\.tolerance\)/, "candidate comparison must format the model value with its state-contract tolerance");
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
assert.doesNotMatch(index, /先立下預測|操作變因|取得證據/);
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.match(styles, /\.workbench\s*\{/);
assert.match(styles, /\.phase-panel\.is-active \.phase-body/);
assert.match(styles, /min-height:\s*44px/);
assert.doesNotMatch(styles, /\.evidence-canvas[^}]*transform\s*:/, "evidence canvas must not use CSS transform scaling");
assert.equal(artAssets.size, 33);

console.log("V5 site integrity: routes, 33 art assets, recoverable flame, campaign guidance and procedural audio OK");
