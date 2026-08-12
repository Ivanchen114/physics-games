const assert = require("node:assert/strict");
const data = require("../data.js");

const codes = [];
for (const temple of data.temples) {
  assert.equal(temple.tracks.foundation.length, 4, `${temple.id} foundation count`);
  assert.ok(temple.tracks.advanced.length >= 4, `${temple.id} advanced count`);
  for (const level of temple.tracks.foundation) {
    codes.push(level.code);
    assert.ok(level.prediction && level.reason && level.control, `${level.code} foundation loop incomplete`);
    assert.equal(level.models, undefined, `${level.code} must not require advanced model selection`);
    assert.equal(level.inputs, undefined, `${level.code} must not require numeric calculation`);
    assert.ok(level.assessedClaim && level.observableSchema && level.modelId, `${level.code} missing state contract`);
  }
  for (const level of temple.tracks.advanced) {
    codes.push(level.code);
    assert.ok(level.models.length >= 3, `${level.code} needs model alternatives`);
    assert.ok(level.inputs.length >= 1, `${level.code} needs calculable output`);
    assert.ok(level.inputs.every(field => Number.isFinite(field.answer)), `${level.code} missing reference answer`);
    assert.ok(level.assessedClaim && level.observableSchema && level.modelId, `${level.code} missing state contract`);
  }
}
assert.equal(new Set(codes).size, 137);

const water = data.temples.find(t => t.id === "ripple");
assert.match(water.tracks.foundation[0].explanation, /頻率增加，波長縮短/);
assert.match(water.tracks.foundation[1].explanation, /只改振幅不會改變/);
assert.match(water.tracks.foundation[3].explanation, /干涉線數通常增加/);
assert.match(water.tracks.advanced[2].known.join(" "), /完整平面/);

for (const temple of data.temples) {
  for (const field of ["act", "region", "guardian", "relic", "crisis", "oath"]) assert.ok(temple[field], `${temple.id} missing ${field}`);
}

const measurement = data.temples.find(t => t.id === "uncertainty");
assert.equal(measurement.name, "無刻神殿");
assert.match(measurement.short, /量測不確定度/);
const quantum = data.temples.find(t => t.id === "quantum");
assert.match(quantum.tracks.foundation.map(level => level.skill).join(" "), /電子的發現.*電荷量子化.*量子論的發現.*原子模型/);
assert.match(quantum.tracks.advanced.map(level => level.skill).join(" "), /eV=hc\/λmin.*E=hf.*λ=h\/p.*ΔE/);
const nuclear = data.temples.find(t => t.id === "nuclear");
assert.match(nuclear.tracks.foundation.map(level => level.skill).join(" "), /強作用.*衰變.*半衰期.*基本交互作用/);
assert.match(nuclear.curriculum.advanced, /跨科銜接/);
const momentum = data.temples.find(t => t.id === "momentum");
assert.match(momentum.curriculum.foundation, /加深加廣選修/);
assert.match(water.curriculum.advanced, /必修.*選修/);
for (const temple of data.temples) assert.ok(temple.history && temple.history.length > 35, `${temple.id}: science-history inscription missing`);
for (const temple of data.temples) {
  for (const track of ["foundation", "advanced"]) {
    for (const level of temple.tracks[track]) {
      assert.ok(level.storyTeaser && level.storyProblem && Array.isArray(level.prePlanKnown), `${level.code}: story-first disclosure entry missing`);
      assert.ok(level.disclosureContract?.prePlan && level.disclosureContract?.afterRun && level.disclosureContract?.afterEvaluation, `${level.code}: six-layer disclosure contract missing`);
      assert.doesNotMatch(level.storyProblem, /現在請預測|操作變因|取得證據|鎖定質性預測/, `${level.code}: academic workflow label leaked into story problem`);
    }
  }
}

console.log("V5 learning contracts: 68 qualitative and 69 model-calculation levels separated OK");
