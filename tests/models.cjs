const assert = require("node:assert/strict");
const data = require("../data.js");
const physics = require("../physics.js");

assert.equal(data.temples.length, 5);
assert.deepEqual(data.totals, { foundation: 20, advanced: 21 });

assert.ok(Math.abs(physics.tricepsWeight(300, 5, 30, 150) - 100) < 1e-9);
assert.ok(Math.abs(physics.deadliftWeight(2250, 8, 300, 40, 60) - 100) < 1e-9);
assert.ok(Math.abs(physics.achillesWeight(3000, 120, 1, 20) - 129.9038106) < 1e-5);
assert.deepEqual(physics.lineCounts(3.2), { antinodes: 7, nodes: 6 });
assert.ok(Math.abs(physics.typeB(1) - .288675) < 1e-5);

const measurements = [25.40, 25.70, 25.80, 25.60];
assert.ok(Math.abs(physics.mean(measurements) - 25.625) < 1e-12);
assert.ok(Math.abs(physics.standardUncertaintyOfMean(measurements) - .085391) < 1e-5);
assert.ok(Math.abs(physics.rootSumSquare([physics.standardUncertaintyOfMean(measurements), physics.typeB(.1)]) - .09014) < 1e-4);

const triceps = data.temples.find(t => t.id === "titans").tracks.advanced[1];
assert.equal(triceps.inputs[0].answer, 100);
assert.match(triceps.known.join(" "), /150°/);
const waterCount = data.temples.find(t => t.id === "ripple").tracks.advanced[2];
assert.deepEqual(waterCount.inputs.map(field => field.answer), [7, 6]);

console.log("V3 physics models: torque, motion, waves and uncertainty reference values OK");
