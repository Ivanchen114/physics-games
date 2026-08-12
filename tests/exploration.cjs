const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const world = require("../exploration-data.js");
const data = require("../data.js");

assert.equal(new Set(world.map.map(row => row.length)).size, 1, "maze rows must have equal width");
assert.equal(Object.keys(world.gates).length, 5, "first region should expose five representative gates");
assert.ok(world.fogRadius >= 2 && world.fogRadius <= 4, "fog must remain local and readable");

let start;
const positions = {};
world.map.forEach((row, y) => [...row].forEach((tile, x) => {
  if (tile === "S") start = { x, y };
  if (world.gates[tile]) positions[tile] = { x, y };
}));
assert.ok(start, "maze needs a player start");

const queue = [start];
const visited = new Set([`${start.x},${start.y}`]);
while (queue.length) {
  const current = queue.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = current.x + dx;
    const y = current.y + dy;
    const key = `${x},${y}`;
    if (world.map[y]?.[x] && world.map[y][x] !== "#" && !visited.has(key)) {
      visited.add(key);
      queue.push({ x, y });
    }
  }
}

for (const [symbol, gate] of Object.entries(world.gates)) {
  assert.ok(positions[symbol], `${symbol} gate missing from maze`);
  assert.ok(visited.has(`${positions[symbol].x},${positions[symbol].y}`), `${symbol} gate is unreachable`);
  assert.ok(data.temples.some(temple => temple.id === gate.templeId), `${gate.templeId} is not a real temple`);
}

const runtime = fs.readFileSync(path.resolve(__dirname, "../explore.js"), "utf8");
for (const contract of ["visibleNow", "revealAroundPlayer", "law-temple-v5-explored-forecourt", "law-temple-v3-${track}-completed", "data-move", "Enter"]) {
  assert.match(runtime, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(runtime, /requestAnimationFrame\(draw\)/);
assert.match(runtime, /prefers-reduced-motion/);

console.log("Exploration: fixed maze, local fog, persistence, five reachable gates and keyboard/touch controls OK");
