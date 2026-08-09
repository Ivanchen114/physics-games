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
  }
  for (const level of temple.tracks.advanced) {
    codes.push(level.code);
    assert.ok(level.models.length >= 3, `${level.code} needs model alternatives`);
    assert.ok(level.inputs.length >= 1, `${level.code} needs calculable output`);
    assert.ok(level.inputs.every(field => Number.isFinite(field.answer)), `${level.code} missing reference answer`);
  }
}
assert.equal(new Set(codes).size, 97);

const water = data.temples.find(t => t.id === "ripple");
assert.match(water.tracks.foundation[0].explanation, /頻率增加，波長縮短/);
assert.match(water.tracks.foundation[1].explanation, /只改振幅不會改變/);
assert.match(water.tracks.foundation[3].explanation, /干涉線數通常增加/);
assert.match(water.tracks.advanced[2].known.join(" "), /完整平面/);

for (const temple of data.temples) {
  for (const field of ["act", "region", "guardian", "relic", "crisis", "oath"]) assert.ok(temple[field], `${temple.id} missing ${field}`);
}

console.log("V4 learning contracts: 48 qualitative and 49 model-calculation levels separated OK");
