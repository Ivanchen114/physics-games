(function (root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.TemplePhysics = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const deg = angle => angle * Math.PI / 180;
  const nearly = (actual, expected, tolerance) => Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;

  function checkInputs(level, values) {
    return level.inputs.map(field => {
      const actual = Number(values[field.id]);
      return { id: field.id, actual, expected: field.answer, ok: nearly(actual, field.answer, field.tolerance) };
    });
  }

  function lineCounts(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0) return { antinodes: 0, nodes: 0 };
    return {
      antinodes: 2 * Math.floor(ratio) + 1,
      nodes: 2 * Math.floor(ratio + .5)
    };
  }

  function tricepsWeight(muscleForce, muscleArm, loadArm, angleDegrees) {
    return muscleForce * muscleArm / (loadArm * Math.sin(deg(angleDegrees)));
  }

  function deadliftWeight(muscleForce, muscleArm, torsoWeight, torsoArm, loadArm) {
    return (muscleForce * muscleArm - torsoWeight * torsoArm) / loadArm;
  }

  function achillesNormalForce(tendonForce, tendonArm, forefootArm) {
    return tendonForce * tendonArm / forefootArm;
  }

  function typeB(leastCount) { return leastCount / Math.sqrt(12); }
  function rootSumSquare(values) { return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)); }
  function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
  function sampleStandardDeviation(values) {
    const average = mean(values);
    return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
  }
  function standardUncertaintyOfMean(values) { return sampleStandardDeviation(values) / Math.sqrt(values.length); }

  function interferenceAt(x, y, params) {
    const wavelength = params.speed / params.frequency;
    const half = params.separation / 2;
    const r1 = Math.hypot(x + half, y);
    const r2 = Math.hypot(x - half, y);
    const phase = 2 * Math.PI * (r2 - r1) / wavelength + deg(params.phase || 0);
    return (1 + Math.cos(phase)) / 2;
  }

  return {
    deg,
    nearly,
    checkInputs,
    lineCounts,
    tricepsWeight,
    deadliftWeight,
    achillesNormalForce,
    typeB,
    rootSumSquare,
    mean,
    sampleStandardDeviation,
    standardUncertaintyOfMean,
    interferenceAt
  };
});
