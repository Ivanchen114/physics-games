const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const data = require("../data.js");
const physics = require("../physics.js");

const auditedTemples = new Set(["titans", "photo", "ripple", "optics", "magnetic"]);
const auditedLevels = data.temples.flatMap(temple => [...temple.tracks.foundation, ...temple.tracks.advanced]);

let operations = [];
const canvasContext = new Proxy({}, {
  get(target, property) {
    if (property in target) return target[property];
    const method = (...args) => operations.push([String(property), ...args]);
    target[property] = method;
    return method;
  },
  set(target, property, value) {
    operations.push(["set", String(property), value]);
    target[property] = value;
    return true;
  }
});
const canvas = { width: 1000, height: 562, getContext: () => canvasContext };
const main = { querySelector: selector => selector === "[data-canvas]" ? canvas : null };
const sandbox = {
  console,
  document: { body: { dataset: {} }, documentElement: { style: { setProperty: () => {} } }, querySelector: selector => selector === "#main" ? main : null },
  localStorage: { getItem: () => null, setItem: () => {} },
  location: { search: "", href: "http://local/" }, history: {}, URL, URLSearchParams, setTimeout, clearTimeout,
  window: { TempleData: data, TemplePhysics: physics, addEventListener: () => {}, matchMedia: () => ({ matches: true }) }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const source = fs.readFileSync(require.resolve("../app.js"), "utf8")
  .replace(/window\.addEventListener\("popstate", render\);\s*render\(\);\s*$/, "")
  + "\n;globalThis.__drawVisual = drawVisual;";
vm.runInContext(source, sandbox, { filename: "app.js" });

function texts(level, state) {
  operations = [];
  sandbox.__drawVisual(level, state);
  return operations.filter(entry => entry[0] === "fillText").map(entry => String(entry[1])).join(" | ");
}

for (const level of auditedLevels) {
  assert.ok(level.assessedClaim, `${level.code}: claim must be declared before disclosure review`);
  const before = texts(level, { phase: "pre-plan", value: level.control?.base });
  for (const field of level.inputs ? physics.solveAdvanced(level) : []) {
    const escaped = String(field.answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const answerToken = new RegExp(`(^|[^0-9.])${escaped}(?![0-9.])`);
    const answerWithUnit = field.unit ? new RegExp(`(^|[^0-9.])${escaped}\\s*${field.unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9A-Za-z])`) : null;
    if (level.known.some(item => answerToken.test(item))) continue;
    if (Math.abs(Number(field.answer)) < 10 && !answerWithUnit) continue;
    assert.ok(!(answerWithUnit ? answerWithUnit.test(before) : answerToken.test(before)), `${level.code}: pre-plan canvas leaks answer ${field.answer} ${field.unit} for claim ${level.assessedClaim}`);
  }
}

const byCode = Object.fromEntries(auditedLevels.map(level => [level.code, level]));
const auditedFoundation = data.temples.flatMap(temple => temple.tracks.foundation);
for (const level of auditedFoundation) {
  const evidence = physics.deriveEvidenceState(level, { phase: "evidence", value: level.control.target });
  const conclusion = physics.deriveQualitativeConclusion(level, evidence);
  const correctLabel = level.prediction.options.find(item => item.value === conclusion.prediction).label;
  const publicBeforePlan = [level.storyTeaser, level.storyProblem, ...(level.prePlanKnown || [])].join("｜");
  assert.ok(level.storyTeaser && level.storyProblem && level.prePlanKnown, `${level.code}: explicit pre-plan disclosure copy missing`);
  if (publicBeforePlan.includes(correctLabel)) {
    assert.ok(level.disclosureContract.prePlanConclusionException, `${level.code}: map/brief/known copy leaks correct conclusion 「${correctLabel}」 for ${level.assessedClaim}`);
    assert.ok(level.disclosureContract.prePlanConclusionException.length > 35, `${level.code}: pre-plan conclusion exception lacks an assessedClaim-specific rationale`);
  }
}
assert.doesNotMatch(texts(byCode["G-A1"], { phase: "pre-plan" }), /300 N|6:1/);
assert.doesNotMatch(texts(byCode["G-A4"], { phase: "pre-plan" }), /1000 N/);
assert.doesNotMatch(texts(byCode["P-A1"], { phase: "pre-plan" }), /3\.1 eV/);
assert.doesNotMatch(texts(byCode["O-F1"], { phase: "pre-plan", value: 60 }), /反射光/);
assert.doesNotMatch(texts(byCode["B-F2"], { phase: "pre-plan", value: 4 }), /F_B/);

const waveLevel = byCode["W-F1"];
const slow = physics.deriveWaveEvidence(waveLevel, { phase: "evidence", value: 2 });
const fast = physics.deriveWaveEvidence(waveLevel, { phase: "evidence", value: 4 });
assert.ok(fast.observable.wavelength < slow.observable.wavelength, "W-F1 causal mutation: frequency increase must shorten wavelength");
const inPhase = physics.deriveWaveEvidence(byCode["W-A2"], { phase: "evidence", values: { phase: 0 } });
const antiPhase = physics.deriveWaveEvidence(byCode["W-A2"], { phase: "evidence", values: { phase: 180 } });
assert.ok(inPhase.observable.centerIntensity > antiPhase.observable.centerIntensity, "W-A2 causal mutation: phase must change central interference semantically");
const magneticWide = physics.magneticTrajectory({ charge: 1, mass: 1, speed: 3, magneticField: 1 });
const magneticTight = physics.magneticTrajectory({ charge: 1, mass: 1, speed: 3, magneticField: 2 });
assert.ok(magneticTight.radius < magneticWide.radius, "magnetic causal mutation: increasing B must tighten the trajectory");
assert.equal(physics.magneticTrajectory({ charge: -1, mass: 1, speed: 3, magneticField: 2 }).direction, "down", "magnetic causal mutation: changing charge sign must reverse bend direction");
assert.ok(physics.snellAngle(1, 1.8, 45) < physics.snellAngle(1, 1.2, 45), "optics causal mutation: increasing n must bend the ray closer to the normal");
assert.ok(physics.thinLens(10, 30).imageDistance < physics.thinLens(10, 20).imageDistance, "optics causal mutation: object distance must move the image through the lens equation");
const magneticWrongEntry = physics.deriveEvidenceState(byCode["B-A2"], { phase: "evidence", values: { radius: 1.5 } });
assert.equal(magneticWrongEntry.magnetic.trajectory.radius, 3, "magnetic evidence geometry must come from q,m,v,B rather than the answer field");
assert.equal(magneticWrongEntry.magnetic.studentRadius, 1.5, "magnetic evidence must retain the player's claim separately");
const opticsWrongEntry = physics.deriveEvidenceState(byCode["O-A3"], { phase: "evidence", values: { distance: 12 } });
assert.ok(Math.abs(opticsWrongEntry.optics.imageDistance - 15) < 1e-9, "optics physical ray intersection must come from f and do");
assert.equal(opticsWrongEntry.optics.studentImageDistance, 12, "optics evidence must retain the player's claimed image distance separately");
const snellWrongEntry = physics.deriveEvidenceState(byCode["O-A1"], { phase: "evidence", values: { angle: 70 } });
assert.ok(Math.abs(snellWrongEntry.optics.refraction - 19.4712) < 1e-3, "O-A1 physical refraction ray must stay on Snell's law when the player enters 70 degrees");
assert.equal(snellWrongEntry.optics.studentAngle, 70, "O-A1 must retain the player's angle as a separate comparison marker");
const criticalWrongEntry = physics.deriveEvidenceState(byCode["O-A2"], { phase: "evidence", values: { angle: 70 } });
assert.ok(Math.abs(criticalWrongEntry.optics.incidence - 41.8103) < 1e-3, "O-A2 physical critical ray must stay at the model angle when the player enters 70 degrees");
assert.equal(criticalWrongEntry.optics.studentAngle, 70, "O-A2 must retain the player's angle as a separate comparison marker");

const chronoMeet = physics.deriveEvidenceState(byCode["C-F2"], { phase: "evidence", value: 6 }).chrono;
assert.equal(chronoMeet.contractId, "chrono.meet");
assert.ok(Math.abs(chronoMeet.meetingTime - 6) < 1e-9);
const chronoBrake = physics.deriveEvidenceState(byCode["C-A4"], { phase: "evidence", values: { distance: 50 } }).chrono;
assert.equal(chronoBrake.contractId, "chrono.brake");
assert.ok(Math.abs(chronoBrake.stopPosition - 50) < 1e-9);
assert.equal(chronoBrake.conclusion, "safe_stop");

const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
assert.match(app, /physics\.interferenceAt\(px,py,wave\.params\)/, "wave renderer must consume the domain model, not fixed decoration");
assert.doesNotMatch(app, /第一步｜鎖定質性預測|第二步｜操作變因並取得證據|第三步｜用證據選出理由/);
assert.doesNotMatch(app, />鎖定預測<|預測已鎖定|結果不會在預測前顯示/);

console.log(`Disclosure contracts: all ${auditedLevels.length} levels reviewed claim-by-claim, including ${auditedFoundation.length} map/brief/known layers; water, magnetic and optics causal mutations guarded`);
