const assert = require("node:assert/strict");
const data = require("../data.js");
const physics = require("../physics.js");

assert.equal(data.temples.length, 17);
assert.deepEqual(data.totals, { foundation: 68, advanced: 69 });
assert.equal(data.version, "5.1.0");
assert.match(data.world.premise, /十七座神殿/);

for (const temple of data.temples) {
  for (const level of [...temple.tracks.foundation, ...temple.tracks.advanced]) {
    const condition = level.inputs ? { phase: "pre-plan", values: {} } : { phase: "pre-plan", value: level.control.base };
    const evidence = physics.deriveEvidenceState(level, condition);
    assert.equal(evidence.domainEvidence.family, temple.id, `${level.code}: renderer, evaluator and explanation need one ${temple.id} domain state`);
    assert.equal(evidence.domainEvidence.contractId, level.stateContract.contractId, `${level.code}: domain state must identify the assessed contract`);
    assert.ok(evidence.domainEvidence.observable, `${level.code}: domain state must expose renderable observables`);
    if (level.prediction) assert.ok(evidence.domainEvidence.conclusion, `${level.code}: foundation scoring conclusion must live inside the domain result`);
    if (level.inputs) assert.ok(evidence.domainEvidence.solution, `${level.code}: advanced scoring solution must live inside the domain result`);
    assert.ok(Array.isArray(evidence.domainEvidence.explanation), `${level.code}: explanation material must live inside the domain result`);
  }
}

const pivotLevel = data.temples.find(t => t.id === "titans").tracks.foundation[0];
const pivotEvidence = physics.deriveEvidenceState(pivotLevel, { phase: "evidence", value: pivotLevel.control.target });
pivotEvidence.domainEvidence.conclusion = { prediction: "test-domain-prediction", reason: "test-domain-reason", evidenceVersion: "domain-test" };
assert.deepEqual(
  physics.evaluateFoundation(pivotLevel, pivotEvidence, "test-domain-prediction", "test-domain-reason"),
  { predictionOK: true, reasonOK: true, expectedPrediction: "test-domain-prediction", expectedReason: "test-domain-reason", evidenceVersion: "domain-test" },
  "foundation evaluator must consume the domain result, not a parallel qualitative model"
);
const bicepsLevel = data.temples.find(t => t.id === "titans").tracks.advanced[0];
const bicepsEvidence = physics.deriveEvidenceState(bicepsLevel, { phase: "evidence", values: { force: 1 } });
bicepsEvidence.domainEvidence.solution = { model: "domain-model", outputs: [{ id: "force", answer: 1, tolerance: .01 }] };
assert.equal(physics.evaluateAdvanced(bicepsLevel, bicepsEvidence, "domain-model", { force: 1 }).valuesOK, true, "advanced evaluator must consume the domain solution");
pivotEvidence.domainEvidence.explanation = ["單一領域說明測試"];
assert.match(physics.describeEvidence(pivotLevel, pivotEvidence), /單一領域說明測試/, "explanation must consume the domain result rather than static fallback copy");
const leverLevel = data.temples.find(t => t.id === "titans").tracks.foundation[1];
const leverEvidence = physics.deriveEvidenceState(leverLevel, { phase: "evidence", value: leverLevel.control.target });
leverEvidence.value = leverLevel.control.base;
assert.equal(physics.deriveQualitativeConclusion(leverLevel, leverEvidence).prediction, "increase", "foundation evaluation must ignore mutated parallel root state and read the domain observable");

const opticsReflection = data.temples.find(t => t.id === "optics").tracks.foundation[0];
const opticsReflectionEvidence = physics.deriveEvidenceState(opticsReflection, { phase: "evidence", value: opticsReflection.control.target });
const opticsReflectionDescription = physics.describeEvidence(opticsReflection, opticsReflectionEvidence);
assert.match(opticsReflectionDescription, /反射角/, "reflection evidence must describe the reflected ray");
assert.doesNotMatch(opticsReflectionDescription, /折射角/, "reflection evidence must not report an unrelated refracted ray");

assert.ok(Math.abs(physics.tricepsWeight(300, 5, 30, 150) - 100) < 1e-9);
assert.ok(Math.abs(physics.deadliftWeight(2250, 8, 300, 40, 60) - 100) < 1e-9);
assert.ok(Math.abs(physics.achillesNormalForce(3000, 5, 15) - 1000) < 1e-9);
assert.deepEqual(physics.lineCounts(3.2), { antinodes: 7, nodes: 6 });
assert.ok(Math.abs(physics.typeB(1) - .288675) < 1e-5);

const measurements = [25.40, 25.70, 25.80, 25.60];
assert.ok(Math.abs(physics.mean(measurements) - 25.625) < 1e-12);
assert.ok(Math.abs(physics.standardUncertaintyOfMean(measurements) - .085391) < 1e-5);
assert.ok(Math.abs(physics.magneticRadius(.004, 3, .002, 2) - 3) < 1e-12);
assert.equal(physics.magneticTrajectory({charge:1,mass:1,speed:3,magneticField:2}).direction, "up");
assert.equal(physics.magneticTrajectory({charge:-1,mass:1,speed:3,magneticField:2}).direction, "down");
assert.ok(Math.abs(physics.snellAngle(1, 1.5, 30) - 19.4712) < 1e-3);
assert.ok(Math.abs(physics.criticalAngle(1.5, 1) - 41.8103) < 1e-3);
assert.ok(Math.abs(physics.thinLens(10, 30).imageDistance - 15) < 1e-12);
assert.ok(Math.abs(physics.rootSumSquare([physics.standardUncertaintyOfMean(measurements), physics.typeB(.1)]) - .09014) < 1e-4);

const triceps = data.temples.find(t => t.id === "titans").tracks.advanced[1];
assert.ok(Math.abs(physics.solveAdvanced(triceps)[0].answer - 100) < 1e-9);
assert.match(triceps.known.join(" "), /150°/);
const achilles = data.temples.find(t => t.id === "titans").tracks.advanced[3];
assert.equal(physics.deriveAdvancedModel(achilles), "ankle");
assert.equal(physics.solveAdvanced(achilles)[0].answer, 1000);
const waterCount = data.temples.find(t => t.id === "ripple").tracks.advanced[2];
assert.deepEqual(physics.solveAdvanced(waterCount).map(field => field.answer), [7, 6]);
const momentumLoss = data.temples.find(t => t.id === "momentum").tracks.advanced[3];
assert.equal(physics.solveAdvanced(momentumLoss)[0].answer, 12);
const electricity = data.temples.find(t => t.id === "electric").tracks.advanced[3];
assert.deepEqual(physics.solveAdvanced(electricity).map(field => field.answer), [2, 6]);
const orbit = data.temples.find(t => t.id === "celestial").tracks.advanced[3];
assert.equal(physics.solveAdvanced(orbit)[0].answer, 8);
const projectile = data.temples.find(t => t.id === "newton").tracks.advanced[3];
assert.deepEqual(physics.solveAdvanced(projectile).map(field => field.answer), [3, 60]);
const closedTube = data.temples.find(t => t.id === "resonance").tracks.advanced[2];
assert.equal(physics.solveAdvanced(closedTube)[0].answer, 200);
const pitchLevel = data.temples.find(t => t.id === "resonance").tracks.foundation[0];
const pitchEvidence = physics.deriveEvidenceState(pitchLevel, { phase: "evidence", value: pitchLevel.control.target });
assert.deepEqual(
  { prediction: pitchEvidence.domainEvidence.conclusion.prediction, reason: pitchEvidence.domainEvidence.conclusion.reason },
  { prediction: "higher", reason: "frequency-count" },
  "RES-F1 must justify higher pitch with increased oscillations per second, not with loudness"
);
const transformer = data.temples.find(t => t.id === "emwave").tracks.advanced[1];
assert.equal(physics.solveAdvanced(transformer)[0].answer, 24);
const hydrogen = data.temples.find(t => t.id === "quantum").tracks.advanced[3];
assert.ok(Math.abs(physics.solveAdvanced(hydrogen)[0].answer - 1.89) < .01);
assert.ok(Math.abs(physics.solveAdvanced(hydrogen)[1].answer - 656) < 2);
const halfLife = data.temples.find(t => t.id === "nuclear").tracks.advanced[0];
assert.equal(physics.solveAdvanced(halfLife)[0].answer, 100);

console.log("V5 physics models: 17 temples and representative reference values OK");
