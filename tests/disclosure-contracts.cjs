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
const storageState = new Map([["law-temple-v5-evidence-ledger", JSON.stringify({
  "chrono.meet.entrySpeed": { value: 8, evidenceVersionId: "tab-a-v1", contractVersion: "chrono-meet-v2", status: "supported" },
  "chrono.meet.availableDistance": { value: 80, evidenceVersionId: "tab-a-v1", contractVersion: "chrono-meet-v2", status: "supported" }
})]]);
const sandbox = {
  console,
  document: { body: { dataset: {} }, documentElement: { style: { setProperty: () => {} } }, querySelector: selector => selector === "#main" ? main : null },
  localStorage: { getItem: key => storageState.get(key) ?? null, setItem: (key, value) => storageState.set(key, value) },
  location: { search: "", href: "http://local/" }, history: {}, URL, URLSearchParams, setTimeout, clearTimeout,
  window: { TempleData: data, TemplePhysics: physics, addEventListener: () => {}, matchMedia: () => ({ matches: true }) }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const source = fs.readFileSync(require.resolve("../app.js"), "utf8")
  .replace(/window\.addEventListener\("popstate", render\);\s*render\(\);\s*$/, "")
  + "\n;globalThis.__drawVisual = drawVisual; globalThis.__dependencySnapshot = dependencySnapshot; globalThis.__dependencyContext = dependencyContext;";
vm.runInContext(source, sandbox, { filename: "app.js" });

function texts(level, state) {
  operations = [];
  sandbox.__drawVisual(level, state);
  return operations.filter(entry => entry[0] === "fillText").map(entry => String(entry[1])).join(" | ");
}

for (const level of auditedLevels) {
  assert.ok(level.assessedClaim, `${level.code}: claim must be declared before disclosure review`);
  const before = texts(level, { phase: "pre-plan", value: level.control?.base });
  const disclosureUpstream = level.code === "C-A4" ? {
    "chrono.meet.entrySpeed": { value: 20, evidenceVersionId: "disclosure:C-A3", contractVersion: "chrono-meet-v2", status: "supported" },
    "chrono.meet.availableDistance": { value: 50, evidenceVersionId: "disclosure:C-A3", contractVersion: "chrono-meet-v2", status: "supported" }
  } : undefined;
  const disclosureSnapshot = level.code === "C-A4" ? {
    "chrono.meet.entrySpeed": "disclosure:C-A3",
    "chrono.meet.availableDistance": "disclosure:C-A3"
  } : undefined;
  const solvedFields = level.inputs ? physics.deriveEvidenceState(level, { phase: "pre-plan", values: {}, upstreamEvidence: disclosureUpstream, dependencyVersionSnapshot: disclosureSnapshot }).domainEvidence.solution.outputs : [];
  for (const field of solvedFields) {
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
  const previewEvidence = physics.deriveEvidenceState(level, { phase: "preview", value: level.control.target });
  assert.equal(previewEvidence.observed, false, `${level.code}: preview must not be certified as an observation`);
  assert.equal(previewEvidence.previewActive, true, `${level.code}: preview must retain a separate live-control phase`);
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

const previewLeakChecks = {
  "U-F1": /63\s*g|電子秤讀值/,
  "U-F3": /游標卡尺|最小刻度.*不確定度/,
  "U-F4": /同一小數位|誠實位數/,
  "RES-F2": /節點：振幅|腹點.*最大/,
  "O-F3": /全反射|臨界角/,
  "NUC-F2": /A.?[−-]4|Z.?[−-]2|α.*衰變/,
  "C-F2": /會合時間|碰撞|安全通過/,
  "H-F2": /ΔT|熱容量較小|溫升.*較大/,
  "NWT-F4": /水平速度不變|vₓ.*固定/
};
for (const [code, leakPattern] of Object.entries(previewLeakChecks)) {
  assert.doesNotMatch(texts(byCode[code], { phase: "preview", value: byCode[code].control.target }), leakPattern, `${code}: preview leaks the assessed conclusion before the apparatus runs`);
}

for (const level of auditedFoundation) {
  assert.ok(Array.isArray(level.disclosureContract.previewGeometry), `${level.code}: preview geometry whitelist must be declared per level`);
  const preview = physics.derivePreviewGeometry(level, physics.deriveEvidenceState(level, { phase: "preview", value: level.control.target }));
  assert.deepEqual(preview.primitives, level.disclosureContract.previewGeometry, `${level.code}: preview renderer must consume the declared whitelist exactly`);
  assert.ok(preview.primitives.every(primitive => physics.previewPrimitiveCatalog.includes(primitive)), `${level.code}: preview uses an unknown geometry primitive`);
}

assert.deepEqual(physics.derivePreviewGeometry(byCode["O-F3"], physics.deriveEvidenceState(byCode["O-F3"], { phase: "preview", value: 60 })).primitives,
  ["optical-boundary", "surface-normal", "incident-ray"], "O-F3 preview may show the controlled incident ray, but no reflected/refracted outcome branch");
assert.deepEqual(physics.derivePreviewGeometry(byCode["NWT-F4"], physics.deriveEvidenceState(byCode["NWT-F4"], { phase: "preview", value: 4 })).primitives,
  ["launch-platform", "time-dial"], "NWT-F4 preview must not draw the projectile path or velocity components");
assert.deepEqual(physics.derivePreviewGeometry(byCode["S-F3"], physics.deriveEvidenceState(byCode["S-F3"], { phase: "preview", value: 4 })).primitives,
  ["central-body", "radius-dial"], "S-F3 preview may show the radius control, but no orbit, orbital velocity or force arrows");

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
const upstreamEvidence = {
  "chrono.meet.entrySpeed": { value: 11, evidenceVersionId: "C-A3:evidence:handoff", contractVersion: "chrono-meet-v2", status: "supported" },
  "chrono.meet.availableDistance": { value: 70, evidenceVersionId: "C-A3:evidence:handoff", contractVersion: "chrono-meet-v2", status: "supported" }
};
const dependencyVersionSnapshot = {
  "chrono.meet.entrySpeed": "C-A3:evidence:handoff",
  "chrono.meet.availableDistance": "C-A3:evidence:handoff"
};
const chronoBrakeEvidence = physics.deriveEvidenceState(byCode["C-A4"], { phase: "evidence", values: { distance: 15.125 }, upstreamEvidence, dependencyVersionSnapshot });
const chronoBrake = chronoBrakeEvidence.chrono;
assert.equal(chronoBrake.contractId, "chrono.brake");
assert.equal(chronoBrake.initialSpeed, 11, "Chrono brake must consume the resolved upstream entry speed");
assert.equal(chronoBrake.gatePosition, 70, "Chrono brake must consume the resolved upstream available distance");
assert.ok(Math.abs(chronoBrake.stopPosition - 15.125) < 1e-9);
assert.equal(chronoBrake.conclusion, "safe_stop");
assert.match(chronoBrakeEvidence.evidenceVersionId, /^ev:C-A4:/);
assert.equal(chronoBrakeEvidence.dependencyResolution.status, "supported");
assert.equal(chronoBrakeEvidence.causalMutationCase.changed, true, "Chrono brake must prove that changing deceleration changes the outcome");
const missingUpstream = physics.deriveEvidenceState(byCode["C-A4"], { phase: "evidence", values: { distance: 50 } });
assert.equal(missingUpstream.dependencyResolution.status, "upstream_inconclusive", "Chrono brake must not silently invent missing upstream evidence");
assert.equal(missingUpstream.chrono, null, "Chrono brake must not fall back to hard-coded 20/50 when upstream evidence is missing");
assert.equal(missingUpstream.certified, false, "inconclusive upstream evidence cannot certify a downstream result");
const staleUpstream = physics.deriveEvidenceState(byCode["C-A4"], {
  phase: "evidence",
  values: { distance: 50 },
  upstreamEvidence,
  dependencyVersionSnapshot: {
    "chrono.meet.entrySpeed": "old-version",
    "chrono.meet.availableDistance": "C-A3:evidence:handoff"
  }
});
assert.equal(staleUpstream.dependencyResolution.status, "upstream_inconclusive", "stale Chrono dependencies must be marked honestly");

const staleContractEvidence = structuredClone(upstreamEvidence);
staleContractEvidence["chrono.meet.entrySpeed"].contractVersion = "chrono-meet-v1";
const staleContract = physics.deriveEvidenceState(byCode["C-A4"], {
  phase: "evidence",
  values: { distance: 15.125 },
  upstreamEvidence: staleContractEvidence,
  dependencyVersionSnapshot
});
assert.equal(staleContract.dependencyResolution.status, "upstream_inconclusive", "a mismatched upstream contract must invalidate the brake result");
assert.equal(staleContract.chrono, null, "invalid Chrono contracts must not render a brake trace");

const cA3Evidence = physics.deriveEvidenceState(byCode["C-A3"], { phase: "evidence", values: { time: 10 }, modelOK: true, valuesOK: true });
assert.equal(cA3Evidence.handoffEvidence["chrono.meet.entrySpeed"].value, cA3Evidence.chrono.second.v0, "Chrono handoff speed must come from the actual meet trace");
assert.equal(cA3Evidence.handoffEvidence["chrono.meet.availableDistance"].value, cA3Evidence.chrono.meetingPosition, "Chrono handoff distance must come from the actual meet trace");

const lockedTabASnapshot = sandbox.__dependencySnapshot(byCode["C-A4"]);
storageState.set("law-temple-v5-evidence-ledger", JSON.stringify({
  "chrono.meet.entrySpeed": { value: 8, evidenceVersionId: "tab-b-v2", contractVersion: "chrono-meet-v2", status: "supported" },
  "chrono.meet.availableDistance": { value: 80, evidenceVersionId: "tab-b-v2", contractVersion: "chrono-meet-v2", status: "supported" }
}));
const crossTabContext = sandbox.__dependencyContext(byCode["C-A4"], lockedTabASnapshot);
assert.equal(crossTabContext.upstreamEvidence["chrono.meet.entrySpeed"].evidenceVersionId, "tab-b-v2", "C-A4 verification must reread the latest cross-tab ledger instead of the page-load copy");
const crossTabBrake = physics.deriveEvidenceState(byCode["C-A4"], { phase: "evidence", values: { distance: 8 }, ...crossTabContext });
assert.equal(crossTabBrake.dependencyResolution.status, "upstream_inconclusive", "a newer C-A3 version from another tab must invalidate the already-open C-A4");
assert.equal(crossTabBrake.chrono, null, "stale C-A4 must not silently calculate with the old locked version");

const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
assert.match(app, /physics\.interferenceAt\(px,py,wave\.params\)/, "wave renderer must consume the domain model, not fixed decoration");
assert.doesNotMatch(app, /第一步｜鎖定質性預測|第二步｜操作變因並取得證據|第三步｜用證據選出理由/);
assert.doesNotMatch(app, />鎖定預測<|預測已鎖定|結果不會在預測前顯示/);
assert.doesNotMatch(app, /外軌道：速率與引力箭長同步縮短|vₓ（固定）/, "conclusion-bearing geometry labels must not be unconditional renderer strings");
assert.doesNotMatch(app, /function drawPreviewApparatus[\s\S]*?observed:\s*true[\s\S]*?function drawCandidateComparison/, "preview must never pretend that evidence was observed");
assert.doesNotMatch(app, /ctx\.fillText\s*=\s*\(\)\s*=>\s*\{\}/, "preview disclosure cannot be implemented by erasing labels after drawing answer geometry");
assert.match(app, /dependencyVersionSnapshot/, "the runtime path must carry the locked dependency version snapshot");
assert.match(app, /上游資料已過期/, "cross-tab version invalidation must tell the player that the upstream trace changed");

console.log(`Disclosure contracts: all ${auditedLevels.length} levels reviewed claim-by-claim, including ${auditedFoundation.length} preview layers; water, magnetic, optics and Chrono causal mutations guarded`);
