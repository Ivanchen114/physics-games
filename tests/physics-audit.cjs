const assert = require("node:assert/strict");
const fs = require("node:fs");
const data = require("../data.js");

const levels = data.temples.flatMap(temple => [
  ...temple.tracks.foundation.map(level => ({ ...level, temple: temple.id, track: "foundation" })),
  ...temple.tracks.advanced.map(level => ({ ...level, temple: temple.id, track: "advanced" }))
]);
const byCode = Object.fromEntries(levels.map(level => [level.code, level]));

for (const level of levels) {
  assert.ok(level.image && level.visual, `${level.code}: missing visual evidence`);
  assert.ok(level.assessedClaim, `${level.code}: assessedClaim missing`);
  assert.ok(level.modelId, `${level.code}: modelId missing`);
  assert.ok(level.observableSchema, `${level.code}: observableSchema missing`);
  if (level.track === "foundation") {
    const { min, max, step, base, target } = level.control;
    for (const [name, number] of Object.entries({ min, max, step, base, target })) {
      assert.ok(Number.isFinite(number), `${level.code}: non-finite control ${name}`);
    }
    assert.ok(min <= base && base <= max, `${level.code}: base outside control range`);
    assert.ok(min <= target && target <= max, `${level.code}: target outside control range`);
    const reachable = Math.abs((target - min) / step - Math.round((target - min) / step)) < 1e-9;
    assert.ok(reachable, `${level.code}: target cannot be reached by the control`);
    assert.ok(level.prediction.options.some(option => option.value === level.prediction.correct), `${level.code}: correct prediction missing`);
    assert.ok(level.reason.options.some(option => option.value === level.reason.correct), `${level.code}: correct reason missing`);
  } else {
    assert.ok(level.models.some(option => option.value === level.correctModel), `${level.code}: correct model missing`);
    for (const input of level.inputs) {
      assert.ok(Number.isFinite(input.answer) && input.tolerance >= 0, `${level.code}: invalid numeric answer contract`);
    }
  }
}

assert.deepEqual(byCode["G-A4"].inputs.map(input => input.answer), [1000]);
assert.equal(byCode["G-F1"].control.kind, "reveal");
assert.doesNotMatch(JSON.stringify(byCode["G-F1"]), /標記|1 號|2 號/);
assert.deepEqual(byCode["W-A3"].inputs.map(input => input.answer), [7, 6]);
assert.equal(byCode["S-F1"].control.target, 2);
assert.equal(byCode["S-F4"].control.target, 1.6);
assert.equal(byCode["E-F4"].control.base, 8);
assert.equal(byCode["E-F4"].control.target, 2);

const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
assert.match(app, /tailX, tailY\) is the point of application/);
assert.match(app, /function forceArrow\(ctx, tailX, tailY, headX, headY/);
assert.doesNotMatch(app, /同圖箭長比例 300:50 = 6:1/);
assert.doesNotMatch(app, /二頭肌 300 N/);
assert.doesNotMatch(app, /石球 100 N/);
assert.doesNotMatch(app, /前腳掌正向力 1000 N/);
assert.match(app, /physics\.deriveEvidenceState/);
assert.match(app, /physics\.interferenceAt/);
assert.match(app, /episodeTrace\.comparisonPlan/);
assert.match(app, /episodeTrace\.evidenceRun/);
assert.match(app, /episodeTrace\.status = "stale"/);
assert.match(app, /放出光子 ΔE₃₂/);
assert.doesNotMatch(app, /1 號|2 號|把標記|移動標記/);
assert.doesNotMatch(app, /arrow\(ctx,500,285,355,230[^\n]*mg sinθ/);

console.log(`Physics audit contracts: ${levels.length} levels reachable, answerable, and vector invariants guarded`);
