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

  function magneticForce(q, speed, magneticField, angleDegrees = 90) {
    return Math.abs(q) * speed * magneticField * Math.sin(deg(angleDegrees));
  }

  function magneticRadius(mass, speed, charge, magneticField) {
    return mass * speed / (Math.abs(charge) * magneticField);
  }

  function magneticTrajectory({ charge = 1, mass = 1, speed = 1, magneticField = 1, origin = { x: 0, y: 0 } } = {}) {
    const radius = magneticRadius(mass, speed, charge, magneticField);
    const bendSign = Math.sign(charge * magneticField) || 1;
    return {
      radius,
      speed,
      direction: bendSign > 0 ? "up" : "down",
      center: { x: origin.x, y: origin.y - bendSign * radius }
    };
  }

  function snellAngle(n1, n2, incidenceDegrees) {
    const sine = n1 * Math.sin(deg(incidenceDegrees)) / n2;
    if (Math.abs(sine) > 1) return null;
    return Math.asin(sine) * 180 / Math.PI;
  }

  function criticalAngle(nHigh, nLow) {
    if (!(nHigh > nLow && nLow > 0)) return null;
    return Math.asin(nLow / nHigh) * 180 / Math.PI;
  }

  function thinLens(focalLength, objectDistance) {
    const inverseImage = 1 / focalLength - 1 / objectDistance;
    const imageDistance = Math.abs(inverseImage) < 1e-12 ? Infinity : 1 / inverseImage;
    return { imageDistance, magnification: -imageDistance / objectDistance };
  }

  function interferenceAt(x, y, params) {
    const wavelength = params.speed / params.frequency;
    const half = params.separation / 2;
    const r1 = Math.hypot(x + half, y);
    const r2 = Math.hypot(x - half, y);
    const phase = 2 * Math.PI * (r2 - r1) / wavelength + deg(params.phase || 0);
    return (1 + Math.cos(phase)) / 2;
  }

  function singleWaveAt(x, y, params) {
    const wavelength = params.speed / params.frequency;
    const phase = 2 * Math.PI * Math.hypot(x, y) / wavelength + deg(params.phase || 0);
    return (1 + Math.cos(phase)) / 2;
  }

  function deriveWaveEvidence(level, condition = {}) {
    const value = Number(condition.value ?? level.control?.base ?? 0);
    const values = Object.fromEntries(Object.entries(condition.values || {}).map(([key, raw]) => [key, Number(raw)]));
    const phase = condition.phase || "pre-plan";
    const type = level.visual;
    const state = {
      phase,
      observed: phase === "preview" || phase === "evidence",
      certified: phase === "evidence" && condition.valuesOK !== false,
      sources: 1,
      amplitude: 1,
      params: { speed: 12, frequency: 3, separation: 6, phase: 0 },
      observable: {}
    };
    if (type === "wave-frequency") state.params.frequency = Math.max(.25, value);
    else if (type === "wave-amplitude") state.amplitude = Math.max(.2, value);
    else if (type === "wave-two-source") state.sources = Math.round(value) >= 2 ? 2 : 1;
    else if (type === "wave-separation") {
      state.sources = 2;
      state.params.separation = Math.max(.5, value);
    } else if (type === "wave-calc") {
      state.params.frequency = 6;
      state.params.speed = Number.isFinite(values.speed) ? values.speed : 3;
    } else if (type === "wave-phase") {
      state.sources = 2;
      state.params.phase = Number.isFinite(values.phase) ? values.phase : 180;
    } else if (type === "wave-lines") {
      state.sources = 2;
      state.params.speed = 10;
      state.params.frequency = 1;
      state.params.separation = 32;
      state.observable.lineCounts = lineCounts(3.2);
    } else if (type === "wave-inverse") {
      state.sources = 2;
      state.params.frequency = Number.isFinite(values.frequency) ? values.frequency : 3;
      state.params.phase = Number.isFinite(values.phase) ? values.phase : 180;
      state.params.separation = 8;
    }
    state.observable.wavelength = state.params.speed / state.params.frequency;
    state.observable.centerIntensity = state.sources === 1
      ? singleWaveAt(0, 0, state.params)
      : interferenceAt(0, 0, state.params);
    return state;
  }

  function deriveEvidenceState(level, condition = {}) {
    const phase = condition.phase || (condition.revealed ? "evidence" : condition.preview ? "preview" : "pre-plan");
    const values = Object.fromEntries(Object.entries(condition.values || {}).map(([key, raw]) => [key, Number(raw)]));
    const evidence = {
      phase,
      observed: phase === "preview" || phase === "evidence",
      certified: phase === "evidence" && condition.valuesOK !== false,
      value: Number(condition.value ?? level.control?.base ?? 0),
      values,
      modelOK: condition.modelOK,
      valuesOK: condition.valuesOK,
      claimRef: level.assessedClaim,
      version: `${level.code}:${phase}:${JSON.stringify(values)}`
    };
    if (level.visual.startsWith("wave-")) evidence.wave = deriveWaveEvidence(level, { ...condition, phase, values });
    if (level.visual.startsWith("magnetic-")) {
      const isRadius = level.visual.includes("radius");
      const isForceCalc = level.visual === "magnetic-calc-force";
      const magneticField = level.visual === "magnetic-lorentz" ? Math.max(.25, evidence.value) : isForceCalc ? .5 : 2;
      const charge = level.visual === "magnetic-lorentz" ? 1 : isForceCalc ? 2e-6 : .002;
      const mass = level.visual === "magnetic-lorentz" ? 1 : .004;
      const speed = level.visual === "magnetic-lorentz" ? 3 : isForceCalc ? 3e4 : 3;
      evidence.magnetic = {
        field: magneticField,
        force: magneticForce(charge, speed, magneticField),
        trajectory: magneticTrajectory({ charge, mass, speed, magneticField }),
        studentRadius: Number.isFinite(values.radius) ? values.radius : null,
        studentForce: Number.isFinite(values.force) ? values.force : null,
        observable: isRadius ? "trajectory-radius" : "force-direction"
      };
    }
    if (level.visual.startsWith("optics-")) {
      const incidence = level.visual.includes("reflection") || level.visual === "optics-tir"
        ? evidence.value
        : level.visual === "optics-refraction" ? 45 : 30;
      const n1 = level.visual.includes("tir") || level.visual.includes("critical") ? 1.5 : 1;
      const n2 = level.visual.includes("tir") || level.visual.includes("critical") ? 1 : (level.visual === "optics-refraction" ? evidence.value : 1.5);
      const lens = thinLens(10, 30);
      evidence.optics = {
        incidence,
        reflection: incidence,
        refraction: Number.isFinite(values.angle) ? values.angle : snellAngle(n1, n2, incidence),
        critical: criticalAngle(1.5, 1),
        imageDistance: lens.imageDistance,
        magnification: lens.magnification,
        studentImageDistance: Number.isFinite(values.distance) ? values.distance : null,
        studentImageHeight: Number.isFinite(values.height) ? values.height : null
      };
    }
    return evidence;
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
    magneticForce,
    magneticRadius,
    magneticTrajectory,
    snellAngle,
    criticalAngle,
    thinLens,
    interferenceAt,
    singleWaveAt,
    deriveWaveEvidence,
    deriveEvidenceState
  };
});
