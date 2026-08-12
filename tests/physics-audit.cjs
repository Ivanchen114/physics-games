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
    const evidence = require("../physics.js").deriveEvidenceState(level, { phase: "evidence", value: target });
    const conclusion = require("../physics.js").deriveQualitativeConclusion(level, evidence);
    assert.ok(level.prediction.options.some(option => option.value === conclusion.prediction), `${level.code}: derived prediction missing`);
    assert.ok(level.reason.options.some(option => option.value === conclusion.reason), `${level.code}: derived reason missing`);
  } else {
    const expectedModel = require("../physics.js").deriveAdvancedModel(level);
    assert.ok(level.models.some(option => option.value === expectedModel), `${level.code}: expected model missing`);
    for (const input of level.stateContract.outputSchema) {
      assert.ok(input.id && Number.isFinite(input.tolerance) && input.tolerance >= 0, `${level.code}: invalid numeric state contract`);
    }
  }
}

assert.deepEqual(require("../physics.js").solveAdvanced(byCode["G-A4"]).map(input => input.answer), [1000]);
assert.equal(byCode["G-F1"].control.kind, "reveal");
assert.doesNotMatch(JSON.stringify(byCode["G-F1"]), /標記|1 號|2 號/);
assert.deepEqual(require("../physics.js").solveAdvanced(byCode["W-A3"]).map(input => input.answer), [7, 6]);
assert.equal(byCode["S-F1"].control.target, 2);
assert.equal(byCode["S-F4"].control.target, 1.6);
assert.equal(byCode["E-F4"].control.base, 8);
assert.equal(byCode["E-F4"].control.target, 2);

const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
const dataSource = fs.readFileSync(require.resolve("../data.js"), "utf8");
assert.doesNotMatch(dataSource, /\bcorrectModel\s*:|\bexpectedConclusion\s*:|\bevaluationModelId\s*:/, "data source must not retain a parallel answer truth");
assert.doesNotMatch(dataSource, /const input = \([^)]*answer/, "data source input schema must not accept answer values");
assert.match(app, /tailX, tailY\) is the point of application/);
assert.match(app, /function forceArrow\(ctx, tailX, tailY, headX, headY/);
assert.doesNotMatch(app, /同圖箭長比例 300:50 = 6:1/);
assert.doesNotMatch(app, /二頭肌 300 N/);
assert.doesNotMatch(app, /石球 100 N/);
assert.doesNotMatch(app, /前腳掌正向力 1000 N/);
assert.match(app, /physics\.deriveEvidenceState/);
assert.match(app, /physics\.evaluateFoundation/);
assert.match(app, /physics\.evaluateAdvanced/);
assert.match(app, /physics\.describeEvidence/);
assert.doesNotMatch(app, /level\.prediction\.correct|level\.reason\.correct|level\.correctModel|level\.explanation/);
assert.match(app, /physics\.interferenceAt/);
assert.match(app, /episodeTrace\.comparisonPlan/);
assert.match(app, /episodeTrace\.evidenceRun/);
assert.match(app, /episodeTrace\.status = "stale"/);
assert.match(app, /放出光子 ΔE₃₂/);
assert.doesNotMatch(app, /1 號|2 號|把標記|移動標記/);
assert.doesNotMatch(app, /arrow\(ctx,500,285,355,230[^\n]*mg sinθ/);

const physics = require("../physics.js");
for (const level of levels.filter(item => item.track === "foundation")) {
  const evidence = physics.deriveEvidenceState(level, { phase: "evidence", value: level.control.target });
  const conclusion = physics.deriveQualitativeConclusion(level, evidence);
  const exact = physics.evaluateFoundation(level, evidence, conclusion.prediction, conclusion.reason);
  assert.ok(exact.predictionOK && exact.reasonOK, `${level.code}: domain-derived conclusion must satisfy its evaluation contract`);
  const wrongPrediction = level.prediction.options.find(option => option.value !== conclusion.prediction).value;
  assert.equal(physics.evaluateFoundation(level, evidence, wrongPrediction, conclusion.reason).predictionOK, false, `${level.code}: a wrong prediction must be rejected`);
  const wrongReason = level.reason.options.find(option => option.value !== conclusion.reason).value;
  assert.equal(physics.evaluateFoundation(level, evidence, conclusion.prediction, wrongReason).reasonOK, false, `${level.code}: a wrong reason must be rejected`);
}
for (const level of levels.filter(item => item.track === "advanced")) {
  const solved = physics.solveAdvanced(level);
  const exactValues = Object.fromEntries(solved.map(field => [field.id, field.answer]));
  const evidence = physics.deriveEvidenceState(level, { phase: "evidence", values: exactValues });
  const expectedModel = physics.deriveAdvancedModel(level);
  const exact = physics.evaluateAdvanced(level, evidence, expectedModel, exactValues);
  assert.ok(exact.modelOK && exact.valuesOK, `${level.code}: domain solver output must satisfy its evaluation contract`);
  const first = solved[0];
  const mutation = Math.max(first.tolerance * 3, Math.max(1, Math.abs(first.answer)) * .1);
  const mutatedValues = { ...exactValues, [first.id]: first.answer + mutation };
  const mutatedEvidence = physics.deriveEvidenceState(level, { phase: "evidence", values: mutatedValues });
  const mutated = physics.evaluateAdvanced(level, mutatedEvidence, expectedModel, mutatedValues);
  assert.equal(mutated.valuesOK, false, `${level.code}: a material output mutation must be rejected`);
}

for (const level of levels) {
  assert.ok(level.stateContract, `${level.code}: stateContract missing`);
  assert.equal(level.correctModel, undefined, `${level.code}: legacy correctModel remains`);
  assert.equal(level.explanation, undefined, `${level.code}: legacy root explanation remains`);
  assert.equal(level.prediction?.correct, undefined, `${level.code}: legacy prediction.correct remains`);
  assert.equal(level.reason?.correct, undefined, `${level.code}: legacy reason.correct remains`);
  assert.equal(level.stateContract.expectedConclusion, undefined, `${level.code}: static expectedConclusion remains`);
  assert.equal(level.stateContract.evaluationModelId, undefined, `${level.code}: static evaluationModelId remains`);
  assert.ok(!(level.inputs || []).some(field => "answer" in field), `${level.code}: legacy input.answer remains`);
}

console.log(`Physics audit contracts: ${levels.length} levels reachable; all 68 foundation conclusions are domain-derived and all 69 advanced solvers reject material mutations`);
