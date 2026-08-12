const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const data = require("../data.js");
const physics = require("../physics.js");

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
const localStorage = { getItem: () => null, setItem: () => {} };
const document = {
  body: { dataset: {} },
  documentElement: { style: { setProperty: () => {} } },
  querySelector: selector => selector === "#main" ? main : null
};
const sandbox = {
  console, document, localStorage, location: { search: "", href: "http://local/" }, history: {},
  URL, URLSearchParams, setTimeout, clearTimeout,
  window: { TempleData: data, TemplePhysics: physics, addEventListener: () => {}, matchMedia: () => ({ matches: true }) }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const source = fs.readFileSync(require.resolve("../app.js"), "utf8")
  .replace(/window\.addEventListener\("popstate", render\);\s*render\(\);\s*$/, "")
  + "\n;globalThis.__drawVisual = drawVisual;";
vm.runInContext(source, sandbox, { filename: "app.js" });

function signature(level, value) {
  operations = [];
  sandbox.__drawVisual(level, { value, revealed: false, preview: true });
  return JSON.stringify(operations);
}

const foundation = data.temples.flatMap(temple => temple.tracks.foundation);
const variableLevels = foundation.filter(level => level.control.kind !== "reveal" && level.control.base !== level.control.target);
for (const level of variableLevels) {
  assert.notEqual(
    signature(level, level.control.base),
    signature(level, level.control.target),
    `${level.code}: control changes but canvas evidence does not change`
  );
}

const app = fs.readFileSync(require.resolve("../app.js"), "utf8");
for (const family of ["Momentum", "Energy", "Electric", "Magnetic", "Optics", "Thermal", "Celestial", "Newton", "Resonance", "EMWave", "Quantum", "Nuclear"]) {
  assert.match(app, new RegExp(`draw${family}Evidence\\(ctx, type, evidence`), `${family} renderer must consume the shared domain evidence instead of a parallel raw value`);
}

console.log(`Live visual contracts: ${variableLevels.length} variable foundation levels redraw at their target value`);
