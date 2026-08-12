const assert = require("node:assert/strict");
const data = require("../data.js");
const physics = require("../physics.js");

assert.equal(data.temples.length, 17);
assert.deepEqual(data.totals, { foundation: 68, advanced: 69 });
assert.equal(data.version, "5.1.0");
assert.match(data.world.premise, /十七座神殿/);

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
const transformer = data.temples.find(t => t.id === "emwave").tracks.advanced[1];
assert.equal(physics.solveAdvanced(transformer)[0].answer, 24);
const hydrogen = data.temples.find(t => t.id === "quantum").tracks.advanced[3];
assert.ok(Math.abs(physics.solveAdvanced(hydrogen)[0].answer - 1.89) < .01);
assert.ok(Math.abs(physics.solveAdvanced(hydrogen)[1].answer - 656) < 2);
const halfLife = data.temples.find(t => t.id === "nuclear").tracks.advanced[0];
assert.equal(physics.solveAdvanced(halfLife)[0].answer, 100);

console.log("V5 physics models: 17 temples and representative reference values OK");
