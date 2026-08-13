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

  const lensModes = Object.freeze({ "O-F4": "focus", "O-A3": "image", "O-A4": "image" });

  function classifyLensProjection(raw) {
    const inverseObjectDistance = Number(raw.inverseObjectDistance);
    const imageDistance = Number(raw.imageDistance);
    const magnification = Number(raw.magnification) + 0;
    if (![inverseObjectDistance, imageDistance, magnification, Number(raw.focalLength)].every(Number.isFinite)) {
      throw new Error("lens projection contains a non-finite physical value");
    }
    const pointFocus = inverseObjectDistance === 0;
    const absoluteMagnification = Math.abs(magnification);
    const objectHeight = raw.objectHeight === null || raw.objectHeight === undefined ? null : Number(raw.objectHeight);
    const imageHeight = objectHeight === null ? raw.imageHeight : objectHeight * magnification;
    return {
      ...raw,
      magnification,
      imageHeight,
      imageClass: pointFocus ? "point-focus" : "converging-image",
      rayState: pointFocus ? "point-focus" : "converging-image",
      orientation: pointFocus ? null : magnification < 0 ? "倒立" : magnification > 0 ? "正立" : null,
      scaleClass: pointFocus ? null : nearly(absoluteMagnification, 1, 1e-9) ? "等大" : absoluteMagnification > 1 ? "放大" : "縮小"
    };
  }

  function deriveLensProjection(levelOrCode, controlValue) {
    const code = typeof levelOrCode === "string" ? levelOrCode : levelOrCode?.code;
    const mode = lensModes[code];
    if (!mode) throw new Error(`${String(code)} is not a supported lens projection level`);
    const focalLength = 10;
    let inverseObjectDistance;
    if (code === "O-F4") {
      const parallelism = Number(controlValue);
      if (!Number.isFinite(parallelism) || parallelism < 1 || parallelism > 3) {
        throw new Error(`O-F4 光束平行度超出定義域 [1, 3]：${String(controlValue)}`);
      }
      inverseObjectDistance = (3 - parallelism) / 60;
    } else {
      inverseObjectDistance = 1 / 30;
    }
    const imageDistance = 1 / (1 / focalLength - inverseObjectDistance);
    const magnification = -(imageDistance * inverseObjectDistance) + 0;
    const objectDistance = inverseObjectDistance === 0 ? "infinite_distance" : 1 / inverseObjectDistance;
    const objectHeight = code === "O-A4" ? 4 : null;
    const imageHeight = objectHeight === null ? null : objectHeight * magnification;
    return classifyLensProjection({
      code,
      mode,
      focalLength,
      inverseObjectDistance,
      objectDistance,
      imageDistance,
      magnification,
      objectHeight,
      imageHeight
    });
  }

  function describeOpticsProjection(projection) {
    if (!projection) throw new Error("optics projection is required");
    const di = fixedObservation(projection.imageDistance, 2, "optics.projection.imageDistance");
    const f = fixedObservation(projection.focalLength, 2, "optics.projection.focalLength");
    if (projection.rayState === "point-focus") {
      return `入射光完全平行主軸；像收斂到像側焦點 F；像距 di = ${di} cm ＝ f`;
    }
    if (projection.mode === "focus") {
      const distanceBeyondFocus = projection.imageDistance - projection.focalLength;
      return `入射光尚未完全平行；像距 di = ${di} cm；像點位於像側焦點 F 外 ${fixedObservation(distanceBeyondFocus, 2, "optics.projection.distanceBeyondFocus")} cm（f = ${f} cm）`;
    }
    if (projection.mode !== "image" || !projection.orientation || !projection.scaleClass) {
      throw new Error("image-mode lens projection lacks a physical image classification");
    }
    const objectDistance = projection.objectDistance === "infinite_distance"
      ? "平行光（物距無限遠）"
      : `物距 do = ${fixedObservation(projection.objectDistance, 2, "optics.projection.objectDistance")} cm`;
    const m = fixedObservation(projection.magnification, 3, "optics.projection.magnification");
    const height = projection.imageHeight === null ? "" : `；像高 hi = ${fixedObservation(projection.imageHeight, 2, "optics.projection.imageHeight")} cm`;
    return `${objectDistance}；像距 di = ${di} cm；放大率 m = ${m}${height}；${projection.orientation}、${projection.scaleClass}`;
  }

  function chronoMeeting({ first = { x0: 20, v0: 2, a: 0 }, second = { x0: 0, v0: 4, a: 0 }, duration = 10, samples = 41 } = {}) {
    const positionAt = (body, time) => body.x0 + body.v0 * time + .5 * body.a * time * time;
    const velocityAt = (body, time) => body.v0 + body.a * time;
    const series = Array.from({ length: samples }, (_, index) => {
      const time = duration * index / (samples - 1);
      const x1 = positionAt(first, time), x2 = positionAt(second, time);
      return { time, x1, x2, v1: velocityAt(first, time), v2: velocityAt(second, time), gap: Math.abs(x1 - x2) };
    });
    const A = .5 * (second.a - first.a), B = second.v0 - first.v0, C = second.x0 - first.x0;
    let meetingTime = null;
    if (Math.abs(A) < 1e-12) {
      if (Math.abs(B) > 1e-12) meetingTime = -C / B;
    } else {
      const discriminant = B * B - 4 * A * C;
      if (discriminant >= 0) {
        const roots = [(-B - Math.sqrt(discriminant)) / (2 * A), (-B + Math.sqrt(discriminant)) / (2 * A)].filter(time => time >= 0);
        if (roots.length) meetingTime = Math.min(...roots);
      }
    }
    const timeTolerance = Math.max(1, duration) * 1e-10;
    if (!(meetingTime >= -timeTolerance && meetingTime <= duration + timeTolerance)) meetingTime = null;
    else meetingTime = Math.max(0, Math.min(duration, meetingTime));
    return {
      contractId: "chrono.meet",
      modelId: Math.abs(first.a) + Math.abs(second.a) > 1e-12 ? "relative_accelerated_motion" : "uniform_relative_motion",
      first, second, duration, series,
      meetingTime,
      meetingPosition: meetingTime === null ? null : positionAt(first, meetingTime),
      minimumGap: Math.min(...series.map(point => point.gap)),
      conclusion: meetingTime === null ? "safe_pass" : "collision"
    };
  }

  function chronoBrake({ initialSpeed = 20, deceleration = 4, brakeStart = 0, gatePosition = 50, duration = 8, samples = 41 } = {}) {
    const magnitude = Math.max(0, deceleration);
    const stopTime = magnitude > 0 ? initialSpeed / magnitude : Infinity;
    const stopDistance = magnitude > 0 ? initialSpeed * initialSpeed / (2 * magnitude) : Infinity;
    const series = Array.from({ length: samples }, (_, index) => {
      const time = duration * index / (samples - 1);
      const brakingTime = Math.max(0, time - brakeStart);
      const activeTime = Math.min(brakingTime, stopTime);
      return {
        time,
        velocity: Math.max(0, initialSpeed - magnitude * brakingTime),
        position: initialSpeed * Math.min(time, brakeStart) + initialSpeed * activeTime - .5 * magnitude * activeTime * activeTime
      };
    });
    return {
      contractId: "chrono.brake",
      modelId: "constant_acceleration_stop",
      initialSpeed, deceleration: magnitude, brakeStart, gatePosition, duration, series,
      stopTime: brakeStart + stopTime,
      stopPosition: initialSpeed * brakeStart + stopDistance,
      conclusion: initialSpeed * brakeStart + stopDistance <= gatePosition ? "safe_stop" : "overshoot"
    };
  }

  const foundationConclusionRules = {
    pivot: () => ["pivot", "rotate"],
    "lever-distance": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "farther"],
    "force-direction": (level, evidence) => [Math.sin(deg(evidence.value)) > Math.sin(deg(level.control.base)) ? "increase" : "decrease", "perpendicular"],
    posture: (level, evidence) => [evidence.value < level.control.base ? "decrease" : "increase", "shorter"],
    "xt-slope": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "more-position"],
    "xt-meet": (level, evidence) => [evidence.chrono?.meetingTime !== null && nearly(evidence.value, evidence.chrono.meetingTime, .01) ? "meet" : "stop", "same-coordinates"],
    chase: (level, evidence) => [evidence.value > 0 ? "decrease" : "same", "relative"],
    brake: (level, evidence) => [evidence.value > level.control.base ? "decrease" : "same", "steeper-down"],
    "photo-threshold": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "threshold"],
    "photo-intensity": () => ["no", "per-photon"],
    "photo-metal": () => ["A", "lower"],
    "photo-budget": () => ["threshold-first", "intensity"],
    "wave-frequency": (level, evidence) => [evidence.wave.observable.wavelength < 12 / level.control.base ? "narrow" : "same", "inverse"],
    "wave-amplitude": (level, evidence) => [evidence.value > level.control.base ? "contrast" : "same", "frequency"],
    "wave-two-source": (level, evidence) => [evidence.value >= 2 ? "bands" : "rings", "superpose"],
    "wave-separation": (level, evidence) => [evidence.value > level.control.base ? "denser" : "same", "wavelength"],
    "measure-scale": () => ["63g", "digits"],
    "measure-scatter": () => ["A", "repeatability"],
    "measure-tool": () => ["caliper", "resolution"],
    "measure-report": () => ["honest", "place"],
    "momentum-impulse": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "impulse"],
    "momentum-recoil": () => ["left", "total"],
    "momentum-cushion": (level, evidence) => [evidence.value > level.control.base ? "decrease" : "same", "same-impulse"],
    "momentum-stick": () => ["p-only", "other"],
    "energy-work": (level, evidence) => [Math.cos(deg(evidence.value)) < 0 ? "negative" : "positive", "dot"],
    "energy-height": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "mgh"],
    "energy-friction": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "thermal"],
    "energy-power": (level, evidence) => [evidence.value < level.control.base ? "increase" : "decrease", "work-time"],
    "electric-charge": (level, evidence) => [evidence.value > 0 ? "repel" : "attract", "same"],
    "electric-field": () => ["out", "positive-test"],
    "electric-series": () => ["same", "one-path"],
    "electric-parallel": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "decrease"],
    "magnetic-poles": () => ["repel", "pole-rule"],
    "magnetic-lorentz": (level, evidence) => [evidence.magnetic.trajectory.direction, "perpendicular"],
    "magnetic-wire": (level, evidence) => [evidence.value !== level.control.base ? "reverse" : "same", "cross"],
    "magnetic-induction": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "rate"],
    "optics-reflection": (level, evidence) => [evidence.optics.reflection > level.control.base ? "increase" : "same", "equal"],
    "optics-refraction": () => ["toward", "speed"],
    "optics-tir": (level, evidence) => [evidence.value > evidence.optics.critical ? "tir" : "refract", "high-low"],
    "optics-lens": () => ["focus", "ray"],
    "thermal-flow": () => ["hot-cold", "equal-temp"],
    "thermal-capacity": () => ["larger", "q-over-c"],
    "thermal-gas": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "collisions"],
    "thermal-compress": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "work-in"],
    "celestial-gravity": (level, evidence) => [nearly(evidence.value / level.control.base, 2, .01) ? "quarter" : "same", "inverse-square"],
    "celestial-circular": () => ["center", "direction-change"],
    "celestial-period": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "slower-longer"],
    "celestial-weight": () => ["mass-same", "mg"],
    "newton-inertia": (level, evidence) => [nearly(evidence.value, 0, 1e-9) ? "constant" : "accelerate", "inertia"],
    "newton-net": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "fma"],
    "newton-friction": () => ["match", "balance"],
    "newton-projectile": () => ["components", "gravity-vertical"],
    "resonance-pitch": (level, evidence) => [evidence.value > level.control.base ? "higher" : "same", "frequency-count"],
    "resonance-standing": () => ["still", "max"],
    "resonance-match": () => ["peak", "resonance"],
    "resonance-tube": () => ["node", "antinode"],
    "emwave-ac": () => ["reverse", "one-direction"],
    "emwave-generator": (level, evidence) => [evidence.value > level.control.base ? "increase" : "same", "flux-rate"],
    "emwave-transformer": (level, evidence) => [evidence.value > level.control.base ? "higher" : "same", "turns"],
    "emwave-polarization": (level, evidence) => [Math.abs(Math.cos(deg(evidence.value))) < Math.abs(Math.cos(deg(level.control.base))) ? "decrease" : "same", "transverse"],
    "quantum-electron": (level, evidence) => [evidence.value > level.control.base ? "bend" : "straight", "charged-particle"],
    "quantum-charge": () => ["integer", "quantized"],
    "quantum-planck": () => ["nhf", "packets"],
    "quantum-atom": () => ["probability", "levels"],
    "nuclear-core": () => ["strong", "strong-no-charge"],
    "nuclear-radiation": () => ["minus4", "energy"],
    "nuclear-halflife": () => ["same", "half"],
    "nuclear-forces": () => ["weak", "strong"]
  };

  function computeFoundationConclusion(level, observable, evidenceVersion) {
    const model = foundationConclusionRules[level.visual];
    if (!model) throw new Error(`No qualitative domain model for ${level.code} (${level.visual})`);
    const domainView = {
      value: observable.controlValue,
      wave: { observable },
      chrono: observable.contract,
      magnetic: { trajectory: observable.trajectory },
      optics: observable
    };
    const [prediction, reason] = model(level, domainView);
    return { prediction, reason, contractId: level.stateContract.contractId, evidenceVersion };
  }

  function deriveQualitativeConclusion(level, evidence) {
    if (!evidence.domainEvidence?.conclusion) throw new Error(`${level.code}: missing domain conclusion`);
    return evidence.domainEvidence.conclusion;
  }

  function evaluateFoundation(level, evidence, selectedPrediction, selectedReason) {
    const conclusion = evidence.domainEvidence?.conclusion;
    if (!conclusion) throw new Error(`${level.code}: missing domain conclusion`);
    return {
      predictionOK: selectedPrediction === conclusion.prediction,
      reasonOK: selectedReason === conclusion.reason,
      expectedPrediction: conclusion.prediction,
      expectedReason: conclusion.reason,
      evidenceVersion: conclusion.evidenceVersion
    };
  }

  function evaluateAdvanced(level, evidence, selectedModel, values) {
    const solution = evidence.domainEvidence?.solution;
    const upstreamOK = evidence.dependencyResolution?.status !== "upstream_inconclusive";
    const results = solution ? checkInputs({ inputs: solution.outputs }, values) : [];
    return {
      modelOK: Boolean(solution) && selectedModel === solution.model,
      valuesOK: Boolean(solution) && upstreamOK && results.every(result => result.ok),
      upstreamOK,
      results,
      evidenceVersion: evidence.version
    };
  }

  const advancedModelByVisual = {
    biceps:"balance", triceps:"sine", deadlift:"sum", achilles:"ankle",
    "chrono-uniform":"uniform", "chrono-accel":"accel", "chrono-delay":"relative", "chrono-stop":"v2",
    "photo-energy":"lambda", "photo-kmax":"subtract", "photo-voltage":"stopping", "photo-flux":"flux",
    "wave-calc":"wave", "wave-phase":"phase", "wave-lines":"count", "wave-inverse":"inverse",
    "uncertainty-mass":"rect", "uncertainty-dimension":"rect", "uncertainty-perimeter":"rss", "uncertainty-density":"relative", "uncertainty-repeat":"combine",
    "momentum-calc-impulse":"impulse", "momentum-calc-recoil":"conserve", "momentum-calc-stick":"stick", "momentum-calc-loss":"loss",
    "energy-calc-work":"dot", "energy-calc-height":"mgh", "energy-calc-speed":"conserve", "energy-calc-power":"power",
    "electric-calc-force":"coulomb", "electric-calc-field":"field", "electric-calc-series":"series", "electric-calc-parallel":"parallel",
    "magnetic-calc-force":"lorentz", "magnetic-calc-radius":"radius", "magnetic-calc-wire":"wire", "magnetic-calc-emf":"faraday",
    "optics-calc-snell":"snell", "optics-calc-critical":"critical", "optics-calc-lens":"lens", "optics-calc-magnify":"magnify",
    "thermal-calc-heat":"heat", "thermal-calc-mix":"balance", "thermal-calc-gas":"ideal", "thermal-calc-firstlaw":"firstlaw",
    "celestial-calc-gravity":"gravity", "celestial-calc-speed":"orbit", "celestial-calc-period":"period", "celestial-calc-kepler":"kepler",
    "newton-calc-net":"net", "newton-calc-friction":"friction", "newton-calc-incline":"parallel", "newton-calc-projectile":"separate",
    "resonance-calc-wave":"wave", "resonance-calc-string":"half-wave", "resonance-calc-tube":"quarter", "resonance-calc-harmonic":"harmonic",
    "emwave-calc-faraday":"faraday", "emwave-calc-voltage":"ratio", "emwave-calc-current":"power", "emwave-calc-wavelength":"wave",
    "quantum-calc-xray":"cutoff", "quantum-calc-photon":"planck", "quantum-calc-matter":"debroglie", "quantum-calc-spectrum":"transition",
    "nuclear-calc-half":"half-life", "nuclear-calc-mass":"mass-energy", "nuclear-calc-alpha":"subtract", "nuclear-calc-beta":"beta-minus"
  };

  function deriveAdvancedModel(level) {
    const model = advancedModelByVisual[level.visual];
    if (!model) throw new Error(`No advanced domain model for ${level.code} (${level.visual})`);
    return model;
  }

  function solveAdvanced(level, evidence = null) {
    const visual = level.visual;
    let result;
    if (visual === "biceps") result = { force: 50 * 30 / 5 };
    else if (visual === "triceps") result = { weight: tricepsWeight(300, 5, 30, 150) };
    else if (visual === "deadlift") result = { weight: deadliftWeight(2250, 8, 300, 40, 60) };
    else if (visual === "achilles") result = { normal: achillesNormalForce(3000, 5, 15) };
    else if (visual === "chrono-uniform") result = { speed: 120 / 20 };
    else if (visual === "chrono-accel") result = { acceleration: 2 * 100 / 10 ** 2 };
    else if (visual === "chrono-delay") result = { time: 4 * 10 / (8 - 4) };
    else if (visual === "chrono-stop") {
      if (!evidence?.chrono) throw new Error(`${level.code}: chrono.brake requires resolved upstream evidence`);
      result = { distance: evidence.chrono.stopPosition };
    }
    else if (visual === "photo-energy") result = { energy: 1240 / 400 };
    else if (visual === "photo-kmax") result = { kmax: 3.5 - 2.3 };
    else if (visual === "photo-voltage") result = { voltage: 1.4 };
    else if (visual === "photo-flux") result = { electrons: 20 * 10 * 2 * .25 };
    else if (visual === "wave-calc") result = { speed: 6 * .5 };
    else if (visual === "wave-phase") result = { phase: (360 * 1.5) % 360 };
    else if (visual === "wave-lines") result = lineCounts(3.2);
    else if (visual === "wave-inverse") result = { frequency: 12 / 4, phase: 180 };
    else if (visual === "uncertainty-mass") result = { uncertainty: typeB(1) };
    else if (visual === "uncertainty-dimension") result = { uncertainty: typeB(.1) };
    else if (visual === "uncertainty-perimeter") result = { uncertainty: 2 * rootSumSquare([.03, .03]) };
    else if (visual === "uncertainty-density") {
      const density = 270 / (10 * 5 * 2);
      result = { density, uncertainty: density * rootSumSquare([.29 / 270, .03 / 10, .03 / 5, .03 / 2]) };
    } else if (visual === "uncertainty-repeat") {
      const readings = [25.40, 25.70, 25.80, 25.60];
      result = { mean: Number(mean(readings).toFixed(2)), uncertainty: rootSumSquare([standardUncertaintyOfMean(readings), typeB(.1)]) };
    } else if (visual === "momentum-calc-impulse") result = { impulse: 120 * .25 };
    else if (visual === "momentum-calc-recoil") result = { speed: 3 * 8 / 60 };
    else if (visual === "momentum-calc-stick") result = { speed: 2 * 6 / (2 + 1) };
    else if (visual === "momentum-calc-loss") result = { energy: .5 * 2 * 6 ** 2 - .5 * 3 * 4 ** 2 };
    else if (visual === "energy-calc-work") result = { work: 50 * 3 * Math.cos(deg(60)) };
    else if (visual === "energy-calc-height") result = { energy: 2 * 9.8 * 5 };
    else if (visual === "energy-calc-speed") result = { speed: Math.sqrt(2 * 9.8 * 5) };
    else if (visual === "energy-calc-power") result = { power: 30 * 9.8 * 5 / 10 };
    else if (visual === "electric-calc-force") result = { force: 9e9 * 2e-6 * 3e-6 / .3 ** 2 };
    else if (visual === "electric-calc-field") result = { field: 9e9 * 4e-6 / .3 ** 2 };
    else if (visual === "electric-calc-series") result = { current: 12 / (4 + 6) };
    else if (visual === "electric-calc-parallel") { const resistance = 1 / (1 / 6 + 1 / 3); result = { resistance, current: 12 / resistance }; }
    else if (visual === "magnetic-calc-force") result = { force: magneticForce(2e-6, 3e4, .5) };
    else if (visual === "magnetic-calc-radius") result = { radius: magneticRadius(.004, 3, .002, 2) };
    else if (visual === "magnetic-calc-wire") result = { force: .4 * 3 * .5 * Math.sin(deg(90)) };
    else if (visual === "magnetic-calc-emf") result = { emf: 200 * .03 / .5 };
    else if (visual === "optics-calc-snell") result = { angle: snellAngle(1, 1.5, 30) };
    else if (visual === "optics-calc-critical") result = { angle: criticalAngle(1.5, 1) };
    else if (visual === "optics-calc-lens") result = { distance: thinLens(10, 30).imageDistance };
    else if (visual === "optics-calc-magnify") result = { height: 4 * thinLens(10, 30).magnification };
    else if (visual === "thermal-calc-heat") result = { heat: .5 * 4200 * 10 };
    else if (visual === "thermal-calc-mix") result = { temperature: (80 + 20) / 2 };
    else if (visual === "thermal-calc-gas") result = { pressure: 1 * 8.31 * 300 / .0249 / 1000 };
    else if (visual === "thermal-calc-firstlaw") result = { energy: 500 - 200 };
    else if (visual === "celestial-calc-gravity") result = { force: 6.67e-11 * 1000 * 1000 / 10 ** 2 };
    else if (visual === "celestial-calc-speed") result = { speed: Math.sqrt(3.986e14 / 6.37e6) / 1000 };
    else if (visual === "celestial-calc-period") result = { period: 2 * Math.PI * 7e6 / 7.5e3 };
    else if (visual === "celestial-calc-kepler") result = { ratio: 4 ** 1.5 };
    else if (visual === "newton-calc-net") result = { acceleration: (28 - 8) / 5 };
    else if (visual === "newton-calc-friction") result = { acceleration: (50 - .2 * 10 * 9.8) / 10 };
    else if (visual === "newton-calc-incline") result = { acceleration: 9.8 * Math.sin(deg(30)) };
    else if (visual === "newton-calc-projectile") { const time = Math.sqrt(2 * 45 / 10); result = { time, range: 20 * time }; }
    else if (visual === "resonance-calc-wave") result = { wavelength: 120 / 60 };
    else if (visual === "resonance-calc-string") result = { frequency: 340 / (2 * .85) };
    else if (visual === "resonance-calc-tube") result = { frequency: 340 / (4 * .425) };
    else if (visual === "resonance-calc-harmonic") result = { frequency: 3 * 200 };
    else if (visual === "emwave-calc-faraday") result = { voltage: 200 * .015 / .1 };
    else if (visual === "emwave-calc-voltage") result = { voltage: 120 * 200 / 1000 };
    else if (visual === "emwave-calc-current") result = { current: 120 * 1 / 24 };
    else if (visual === "emwave-calc-wavelength") result = { wavelength: 3e8 / 1e8 };
    else if (visual === "quantum-calc-xray") result = { wavelength: 1240 / 12400 };
    else if (visual === "quantum-calc-photon") result = { energy: 4.14e-15 * 6e14 };
    else if (visual === "quantum-calc-matter") result = { wavelength: 6.63e-34 / 6.63e-24 / 1e-9 };
    else if (visual === "quantum-calc-spectrum") { const energy = 13.6 * (1 / 2 ** 2 - 1 / 3 ** 2); result = { energy, wavelength: 1240 / energy }; }
    else if (visual === "nuclear-calc-half") result = { nuclei: 800 * .5 ** (6 / 2) };
    else if (visual === "nuclear-calc-mass") result = { energy: .002 * 931.5 };
    else if (visual === "nuclear-calc-alpha") result = { massNumber: 238 - 4, atomicNumber: 92 - 2 };
    else if (visual === "nuclear-calc-beta") result = { atomicNumber: 6 + 1 };
    else throw new Error(`No advanced solver for ${level.code} (${visual})`);
    return level.stateContract.outputSchema.map(field => ({ ...field, answer: result[field.id] }));
  }

  function describeEvidence(level, evidence) {
    const domain = evidence.domainEvidence;
    const material = domain?.family === "optics" && domain.observable?.opticsProjection
      ? deriveDomainExplanation(level, domain.family, domain.observable, evidence, domain.conclusion, domain.solution)
      : domain?.explanation;
    if (!Array.isArray(material)) throw new Error(`${level.code}: missing domain explanation material`);
    return material.join(" ");
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
      observed: phase === "evidence",
      previewActive: phase === "preview",
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

  const titanVisuals = new Set(["pivot", "lever-distance", "force-direction", "posture", "biceps", "triceps", "deadlift", "achilles"]);

  function familyForLevel(level) {
    const visual = level.visual || "";
    if (titanVisuals.has(visual)) return "titans";
    if (level.code?.startsWith("C-")) return "chrono";
    if (visual.startsWith("photo-")) return "photo";
    if (visual.startsWith("wave-")) return "ripple";
    if (visual.startsWith("measure-") || visual.startsWith("uncertainty-")) return "uncertainty";
    for (const family of ["momentum", "energy", "electric", "magnetic", "optics", "thermal", "celestial", "newton", "resonance", "emwave", "quantum", "nuclear"]) {
      if (visual.startsWith(`${family}-`)) return family;
    }
    throw new Error(`No temple family for ${level.code} (${visual})`);
  }

  const previewPrimitiveCatalog = Object.freeze([
    "apparatus-silhouette", "control-dial", "optical-boundary", "surface-normal", "incident-ray",
    "launch-platform", "time-dial", "central-body", "radius-dial",
    "stone-door", "door-hinge", "door-candidates", "selected-force"
  ]);

  function derivePreviewGeometry(level, evidence) {
    const declared = level.disclosureContract?.previewGeometry;
    if (!Array.isArray(declared)) throw new Error(`${level.code}: preview geometry whitelist is not declared`);
    const unknown = declared.filter(primitive => !previewPrimitiveCatalog.includes(primitive));
    if (unknown.length) throw new Error(`${level.code}: unknown preview geometry ${unknown.join(", ")}`);
    return {
      primitives: [...declared],
      controlValue: evidence.domainEvidence.observable.controlValue,
      normalizedControl: evidence.domainEvidence.observable.normalizedControl,
      opticalIncidence: evidence.optics?.incidence ?? null
    };
  }

  function normalizeControl(level, value) {
    if (!level.control) return 0;
    const min = Number(level.control.min), max = Number(level.control.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  function deriveFamilyObservable(level, evidence) {
    const value = evidence.value;
    const base = Number(level.control?.base ?? value);
    const observable = {
      visual: level.visual,
      controlValue: value,
      controlBase: base,
      controlTarget: Number(level.control?.target ?? value),
      normalizedControl: normalizeControl(level, value),
      candidateValues: { ...evidence.values },
      wave: evidence.wave || null,
      magnetic: evidence.magnetic || null,
      optics: evidence.optics || null,
      chrono: evidence.chrono || null,
      dependencyResolution: evidence.dependencyResolution
    };
    const family = familyForLevel(level);
    if (family === "titans") {
      observable.momentArm = value;
      observable.torqueFactor = level.visual === "force-direction" ? Math.sin(deg(value)) : value / Math.max(1, base);
      observable.muscleLoadRatio = level.visual === "posture" ? value / 5 : null;
      if (level.code === "G-F2") {
        const target = Number(level.control.target);
        const trial = momentArm => ({
          momentArm,
          torqueFactor: momentArm / Math.max(1, base),
          forceMagnitude: 1,
          forceDirection: "perpendicular-to-door",
          actionDuration: 1,
          initialDoorAngle: 0,
          responseAngle: 12 * momentArm / Math.max(1, base),
          conditionSignature: `${level.code}:arm-${momentArm}:force-1:direction-perpendicular:duration-1`
        });
        observable.pairedComparison = {
          sharedConditions: { sameDoor: true, forceMagnitude: 1, forceDirection: "perpendicular-to-door", actionDuration: 1, initialDoorAngle: 0 },
          base: trial(base),
          target: trial(target),
          comparesWith: [base, target]
        };
      }
    } else if (family === "photo") {
      observable.photonEnergy = value;
      observable.thresholdCrossed = value > base;
      observable.relativePhotonCount = level.visual === "photo-intensity" ? value / Math.max(1, base) : 1;
    } else if (family === "ripple") {
      observable.wavelength = evidence.wave.observable.wavelength;
      observable.centerIntensity = evidence.wave.observable.centerIntensity;
      observable.sources = evidence.wave.sources;
    } else if (family === "uncertainty") {
      observable.instrumentReading = level.visual === "measure-scale" ? 63 : null;
      observable.resolution = level.visual === "measure-tool" ? value : null;
      observable.sampleSpread = level.visual === "measure-scatter" ? value : null;
    } else if (family === "momentum") {
      observable.impulseFactor = level.visual.includes("impulse") ? value : 1;
      observable.forceFactor = level.visual.includes("cushion") ? 1 / Math.max(.001, value) : 1;
    } else if (family === "energy") {
      observable.workFactor = level.visual.includes("work") ? Math.cos(deg(value)) : 1;
      observable.energyFactor = level.visual.includes("power") ? 1 / Math.max(.001, value) : value / Math.max(1, base);
    } else if (family === "electric") {
      observable.chargeSign = Math.sign(value) || 1;
      observable.fieldFactor = level.visual.includes("field") ? 1 / Math.max(.001, value * value) : 1;
      observable.branchCount = level.visual.includes("parallel") ? Math.max(1, Math.round(value)) : 1;
    } else if (family === "magnetic") {
      observable.field = evidence.magnetic.field;
      observable.force = evidence.magnetic.force;
      observable.trajectory = evidence.magnetic.trajectory;
    } else if (family === "optics") {
      observable.incidence = evidence.optics.incidence;
      observable.reflection = evidence.optics.reflection;
      observable.refraction = evidence.optics.refraction;
      observable.critical = evidence.optics.critical;
      observable.imageDistance = evidence.optics.imageDistance;
      observable.magnification = evidence.optics.magnification;
      observable.opticsProjection = evidence.optics.projection;
    } else if (family === "thermal") {
      observable.temperatureFactor = value / Math.max(1, base);
      observable.pressureFactor = level.visual.includes("gas") ? value / 300 : null;
      observable.temperatureDifference = level.visual.includes("flow") ? Math.max(0, 60 - 12 * value) : null;
    } else if (family === "celestial") {
      observable.radiusFactor = value / Math.max(1, base);
      observable.gravityFactor = level.visual.includes("gravity") ? 1 / Math.max(.001, observable.radiusFactor ** 2) : null;
      observable.orbitalSpeedFactor = 1 / Math.sqrt(Math.max(.001, observable.radiusFactor));
    } else if (family === "newton") {
      observable.netForce = level.visual.includes("inertia") ? value : value - base;
      observable.horizontalVelocity = level.visual.includes("projectile") ? 1 : null;
      observable.verticalVelocityFactor = level.visual.includes("projectile") ? value : null;
    } else if (family === "resonance") {
      observable.frequencyFactor = value / Math.max(1, base);
      observable.relativeAmplitude = level.visual.includes("match") ? 1 / (1 + (value - Number(level.control?.max ?? value)) ** 2 * 1.6) : null;
      observable.harmonic = level.visual.includes("pitch") ? Math.max(1, value) : null;
    } else if (family === "emwave") {
      observable.changeRate = value / Math.max(1, base);
      observable.polarizedIntensity = level.visual.includes("polarization") ? Math.cos(deg(value)) ** 2 : null;
    } else if (family === "quantum") {
      observable.deflectionFactor = level.visual.includes("electron") ? value : null;
      observable.energyLevel = level.visual.includes("atom") ? value : null;
      observable.quantumCount = level.visual.includes("charge") ? Math.round(value) : null;
    } else if (family === "nuclear") {
      observable.separationFactor = value / Math.max(1, base);
      observable.remainingFraction = level.visual.includes("halflife") ? .5 ** value : null;
      observable.decayDelta = level.visual.includes("radiation") ? { massNumber: -4, atomicNumber: -2 } : null;
    } else if (family === "chrono") {
      observable.contract = evidence.chrono;
      observable.meetingTime = evidence.chrono?.meetingTime ?? null;
      observable.stopPosition = evidence.chrono?.stopPosition ?? null;
    }
    return observable;
  }

  function stableRecord(value) {
    if (Array.isArray(value)) return value.map(stableRecord);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableRecord(value[key])]));
    return value;
  }

  function resolveDependencies(level, condition) {
    const manifest = level.stateContract?.dependencyManifest || [];
    const upstream = condition.upstreamEvidence || {};
    const snapshot = condition.dependencyVersionSnapshot || {};
    const entries = manifest.map(dependency => {
      if (dependency.provenance === "scenario_constraint") return { ...dependency, status: "supported" };
      const source = upstream[dependency.valueRef];
      const expectedVersion = snapshot[dependency.valueRef];
      const versionMatches = !expectedVersion || source?.evidenceVersionId === expectedVersion;
      const contractMatches = !dependency.contractVersion || source?.contractVersion === dependency.contractVersion;
      return {
        ...dependency,
        value: source?.value,
        evidenceVersionId: source?.evidenceVersionId,
        status: source?.status === "supported" && versionMatches && contractMatches ? "supported" : "upstream_inconclusive",
        reason: !source ? "missing_upstream_evidence" : !versionMatches ? "stale_upstream_evidence" : !contractMatches ? "stale_upstream_contract" : source.status !== "supported" ? "unsupported_upstream_evidence" : null
      };
    });
    return {
      manifest,
      entries,
      status: entries.some(entry => entry.status === "upstream_inconclusive") ? "upstream_inconclusive" : "supported"
    };
  }

  function resolvedDependencyValue(resolution, valueRef) {
    const entry = resolution.entries.find(item => item.valueRef === valueRef);
    return entry?.status === "supported" && Number.isFinite(Number(entry.value)) ? Number(entry.value) : null;
  }

  function outputLabel(level, type, value) {
    const options = type === "prediction" ? level.prediction?.options : level.reason?.options;
    return options?.find(option => option.value === value)?.label || value;
  }

  function fixedObservation(value, digits, field) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${field}: observable is not finite`);
    return number.toFixed(digits);
  }

  function exponentialObservation(value, digits, field) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${field}: observable is not finite`);
    return number.toExponential(digits);
  }

  function domainObservation(family, observable, evidence) {
    if (family === "titans" && observable.pairedComparison) {
      const pair = observable.pairedComparison;
      return `同一扇門在相同推力、方向與作用時間下，${pair.base.momentArm} cm 留下較小轉動痕跡，${pair.target.momentArm} cm 留下較大轉動痕跡`;
    }
    if (family === "titans") return `力臂 ${fixedObservation(observable.momentArm, 2, "titans.momentArm")}，力矩因子 ${fixedObservation(observable.torqueFactor, 3, "titans.torqueFactor")}`;
    if (family === "photo") return `光子能量刻度 ${fixedObservation(observable.photonEnergy, 2, "photo.photonEnergy")}，門檻${observable.thresholdCrossed ? "已跨越" : "未跨越"}`;
    if (family === "ripple") return `波長 ${fixedObservation(observable.wavelength, 3, "ripple.wavelength")}，中央強度 ${fixedObservation(observable.centerIntensity, 3, "ripple.centerIntensity")}`;
    if (family === "uncertainty") return `儀器控制值 ${fixedObservation(observable.controlValue, 3, "uncertainty.controlValue")}，讀值與解析度由同一狀態保留`;
    if (family === "momentum") return `衝量因子 ${fixedObservation(observable.impulseFactor, 3, "momentum.impulseFactor")}，平均力因子 ${fixedObservation(observable.forceFactor, 3, "momentum.forceFactor")}`;
    if (family === "energy") return `功因子 ${fixedObservation(observable.workFactor, 3, "energy.workFactor")}，能量因子 ${fixedObservation(observable.energyFactor, 3, "energy.energyFactor")}`;
    if (family === "electric") return `電荷符號 ${observable.chargeSign > 0 ? "+" : "−"}，支路數 ${observable.branchCount}`;
    if (family === "magnetic") return `磁力 ${exponentialObservation(observable.force, 3, "magnetic.force")}，軌跡半徑 ${fixedObservation(observable.trajectory.radius, 3, "magnetic.radius")}`;
    if (family === "optics") {
      if (observable.visual.includes("reflection")) return `入射角 ${fixedObservation(observable.incidence, 2, "optics.incidence")}°，反射角 ${fixedObservation(observable.reflection, 2, "optics.reflection")}°`;
      if (observable.visual.includes("tir") || observable.visual.includes("critical")) return `入射角 ${fixedObservation(observable.incidence, 2, "optics.incidence")}°，臨界角 ${fixedObservation(observable.critical, 2, "optics.critical")}°，${observable.refraction === null ? "沒有折射光" : "仍有折射光"}`;
      if (observable.visual.includes("lens") || observable.visual.includes("magnify")) return describeOpticsProjection(observable.opticsProjection);
      return `入射角 ${fixedObservation(observable.incidence, 2, "optics.incidence")}°，折射角 ${observable.refraction === null ? "無" : `${fixedObservation(observable.refraction, 2, "optics.refraction")}°`}`;
    }
    if (family === "thermal") return observable.temperatureDifference === null ? `溫度因子 ${fixedObservation(observable.temperatureFactor, 3, "thermal.temperatureFactor")}${observable.pressureFactor === null ? "" : `，壓力因子 ${fixedObservation(observable.pressureFactor, 3, "thermal.pressureFactor")}`}` : `兩物體溫差降至 ${fixedObservation(observable.temperatureDifference, 2, "thermal.temperatureDifference")}°C`;
    if (family === "celestial") return `半徑因子 ${fixedObservation(observable.radiusFactor, 3, "celestial.radiusFactor")}，軌道速率因子 ${fixedObservation(observable.orbitalSpeedFactor, 3, "celestial.orbitalSpeedFactor")}`;
    if (family === "newton") return `合力狀態 ${fixedObservation(observable.netForce, 3, "newton.netForce")}${observable.horizontalVelocity === null ? "" : `，水平速度因子 ${fixedObservation(observable.horizontalVelocity, 3, "newton.horizontalVelocity")}`}`;
    if (family === "resonance") return `頻率因子 ${fixedObservation(observable.frequencyFactor, 3, "resonance.frequencyFactor")}${observable.relativeAmplitude === null ? "" : `，相對振幅 ${fixedObservation(observable.relativeAmplitude, 3, "resonance.relativeAmplitude")}`}`;
    if (family === "emwave") return `變化率因子 ${fixedObservation(observable.changeRate, 3, "emwave.changeRate")}${observable.polarizedIntensity === null ? "" : `，透射強度比 ${fixedObservation(observable.polarizedIntensity, 3, "emwave.polarizedIntensity")}`}`;
    if (family === "quantum") return `量子控制值 ${fixedObservation(observable.controlValue, 3, "quantum.controlValue")}，離散與帶電粒子狀態由此運算`;
    if (family === "nuclear") return `核狀態控制值 ${fixedObservation(observable.controlValue, 3, "nuclear.controlValue")}${observable.remainingFraction === null ? "" : `，剩餘比例 ${fixedObservation(observable.remainingFraction, 3, "nuclear.remainingFraction")}`}`;
    if (family === "chrono") {
      if (evidence.dependencyResolution.status === "upstream_inconclusive") return "上游軌跡不足或版本已失效，暫不形成煞車結論";
      if (evidence.chrono?.contractId === "chrono.brake") return `入站速度 ${evidence.chrono.initialSpeed} m/s，可用距離 ${evidence.chrono.gatePosition} m，停止位置 ${fixedObservation(evidence.chrono.stopPosition, 3, "chrono.stopPosition")} m`;
      return evidence.chrono?.meetingTime === null ? "時限內未會合" : `會合時間 ${fixedObservation(evidence.chrono.meetingTime, 3, "chrono.meetingTime")} s，位置 ${fixedObservation(evidence.chrono.meetingPosition, 3, "chrono.meetingPosition")} m`;
    }
    return `控制值 ${fixedObservation(observable.controlValue, 3, `${family}.controlValue`)}`;
  }

  // Formal epistemic terms appear only after the player has acted: the temple
  // distinguishes a variable, observation window, case selector or reveal;
  // the recorded response becomes evidence and the relationship becomes a
  // physical model. These are not pre-task workflow labels.
  function deriveDomainExplanation(level, family, observable, evidence, conclusion, solution) {
    const observation = domainObservation(family, observable, evidence);
    const observationText = observation.replace(/。+$/u, "");
    if (evidence.phase !== "evaluation") return [`本次機關觀察：${observationText}。`];
    if (conclusion) {
      const unit = level.control?.unit ? ` ${level.control.unit}` : "";
      const base = observable.controlBase;
      const target = observable.controlValue;
      let actionSentence;
      let evidenceSentence;
      switch (level.control.kind) {
        case "variable":
          actionSentence = `你這一輪只動了${level.control.label}（${base}${unit} → ${target}${unit}）—— 在法則的語言裡，那就是變因。`;
          evidenceSentence = `機關留下的痕跡就是證據：當${level.control.label}由 ${base}${unit} 變為 ${target}${unit}，${observationText}。`;
          break;
        case "observation-window":
          actionSentence = `你這一輪沒有改動機關本身，只把觀察挪到${level.control.label}＝${target}${unit} —— 在法則的語言裡，那是觀察條件，不是變因。`;
          evidenceSentence = `機關留下的痕跡就是證據：在${level.control.label}＝${target}${unit} 這個時刻／位置上，${observationText}。`;
          break;
        case "case-selector":
          actionSentence = `你這一輪切換的是不同的${level.control.label}（${base}${unit} → ${target}${unit}）—— 你不是在同一個案例內連續調一個量，而是在幾個預先存在的案例之間切換比較。`;
          evidenceSentence = `機關留下的痕跡就是證據：在${level.control.label}＝${target}${unit} 這個案例中，${observationText}。`;
          break;
        case "reveal":
          actionSentence = "你這一輪只是喚醒了機關；這一關沒有可調的變因，你要判斷的是眼前已經存在的結構。";
          evidenceSentence = `機關留下的痕跡就是證據：${observationText}。`;
          break;
        default:
          throw new Error(`${level.code}: unknown control.kind ${String(level.control.kind)}`);
      }
      return [
        actionSentence,
        evidenceSentence,
        `讀懂這道痕跡靠的是「${level.skill}」這個物理模型 —— ${level.stateContract.explanation}`,
        `所以本次判讀是「${outputLabel(level, "prediction", conclusion.prediction)}」，依據是「${outputLabel(level, "reason", conclusion.reason)}」。`
      ];
    }
    if (solution) {
      const modelLabel = level.models?.find(option => option.value === solution.model)?.label || solution.model;
      const inputLabels = (level.inputs || []).map(field => field.label).join("與");
      const outputEvidence = (solution.outputs || []).map(field => {
        const input = level.inputs?.find(item => item.id === field.id);
        const label = input?.label || field.id;
        const unit = input?.unit ? ` ${input.unit}` : "";
        const value = formatModelOutput(field.answer, field.tolerance, `${level.code}.${field.id}`);
        return `${label}＝${value}${unit}`;
      }).join("；");
      const status = solution.status === "upstream_inconclusive" ? "這次證據不足" : evidence.certified ? "這次的刻印與模型一致" : "這次的刻印不支持模型";
      const projectionEvidence = family === "optics" && observable.opticsProjection ? `${observationText}；` : "";
      return [
        `你選的物理模型是「${modelLabel}」。`,
        `你據此刻入的是${inputLabels}。`,
        `機關依你的模型與輸入留下的痕跡就是證據：${projectionEvidence}${outputEvidence || "本次未取得可判讀的模型輸出"}。`,
        `${status} —— ${level.stateContract.explanation}`
      ];
    }
    throw new Error(`${level.code}: evaluation explanation has no conclusion or solution`);
  }

  function formatModelOutput(value, tolerance = 0, field = "model.output") {
    const number = Number(value);
    const margin = Math.abs(Number(tolerance));
    if (!Number.isFinite(number)) throw new Error(`${field}: model output is not finite`);
    if (!Number.isFinite(margin) || margin <= 0) return String(Number(number.toPrecision(12)));
    const decimals = Math.max(0, Math.min(6, Math.ceil(-Math.log10(margin))));
    return number.toFixed(decimals);
  }

  function accessibleProjection(level, evidence) {
    const phase = evidence.phase || "pre-plan";
    const domain = evidence.domainEvidence;
    if (phase === "pre-plan") {
      const known = level.observableSchema?.knownInputs || level.prePlanKnown || level.known || [];
      const controls = level.observableSchema?.manipulableInputs || [];
      const story = String(level.storyProblem || level.mission || "").replace(/[。！？]+$/u, "");
      return `${level.title}。${story}。進入前能確認：${known.join("、")}。可操作：${controls.join("、")}。`;
    }
    if (phase === "preview") {
      const observable = domain.observable;
      const setting = `${level.control?.label || "目前設定"} ${observable.controlValue}${level.control?.unit ? ` ${level.control.unit}` : ""}`;
      const paired = observable.pairedComparison ? "；同一扇門的兩個候選施力點與等長推力箭頭已標出" : "";
      return `${level.title}的機關調整中。${setting}${paired}；尚未正式運轉，轉動結果尚未出現。`;
    }
    const observation = domainObservation(domain.family, domain.observable, evidence);
    if (phase === "evidence") return `${level.title}的本次機關痕跡。${observation}。`;
    if (phase === "evaluation") {
      const material = domain.family === "optics" && domain.observable?.opticsProjection
        ? deriveDomainExplanation(level, domain.family, domain.observable, evidence, domain.conclusion, domain.solution)
        : domain.explanation;
      return `${level.title}的法則授證。${material.join(" ")}`;
    }
    throw new Error(`${level.code}: unsupported disclosure phase ${phase}`);
  }

  function deriveCausalMutationCase(level, evidence) {
    if (!evidence.chrono) return null;
    const baseline = evidence.chrono;
    let mutation;
    if (baseline.contractId === "chrono.brake") {
      mutation = chronoBrake({
        initialSpeed: baseline.initialSpeed,
        deceleration: Math.max(.1, baseline.deceleration * 1.25),
        brakeStart: baseline.brakeStart,
        gatePosition: baseline.gatePosition,
        duration: baseline.duration
      });
      return {
        variable: "deceleration",
        baseline: baseline.stopPosition,
        mutated: mutation.stopPosition,
        changed: Math.abs(baseline.stopPosition - mutation.stopPosition) > 1e-9,
        baselineConclusion: baseline.conclusion,
        mutatedConclusion: mutation.conclusion
      };
    }
    mutation = chronoMeeting({
      first: baseline.first,
      second: { ...baseline.second, v0: baseline.second.v0 + Math.max(.5, Math.abs(baseline.second.v0) * .1) },
      duration: baseline.duration
    });
    return {
      variable: "relativeSpeed",
      baseline: baseline.meetingTime,
      mutated: mutation.meetingTime,
      changed: baseline.meetingTime !== mutation.meetingTime,
      baselineConclusion: baseline.conclusion,
      mutatedConclusion: mutation.conclusion
    };
  }

  function deriveEvidenceState(level, condition = {}) {
    const phase = condition.phase || (condition.revealed ? "evidence" : condition.preview ? "preview" : "pre-plan");
    const values = Object.fromEntries(Object.entries(condition.values || {}).map(([key, raw]) => [key, Number(raw)]));
    const evidence = {
      phase,
      observed: phase === "evidence" || phase === "evaluation",
      previewActive: phase === "preview",
      certified: (phase === "evidence" || phase === "evaluation") && condition.valuesOK !== false,
      value: Number(condition.value ?? level.control?.base ?? 0),
      values,
      modelOK: condition.modelOK,
      valuesOK: condition.valuesOK,
      claimRef: level.stateContract?.assessedClaim || level.assessedClaim,
      contractId: level.stateContract?.contractId,
      version: `${level.code}:${phase}:${JSON.stringify(values)}`
    };
    evidence.dependencyResolution = resolveDependencies(level, condition);
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
      const boundaryCritical = criticalAngle(1.5, 1);
      const incidence = level.visual === "optics-calc-critical" ? boundaryCritical : level.visual.includes("reflection") || level.visual === "optics-tir"
        ? evidence.value
        : level.visual === "optics-refraction" ? 45 : 30;
      const n1 = level.visual.includes("tir") || level.visual.includes("critical") ? 1.5 : 1;
      const n2 = level.visual.includes("tir") || level.visual.includes("critical") ? 1 : (level.visual === "optics-refraction" ? evidence.value : 1.5);
      const projection = lensModes[level.code] ? deriveLensProjection(level, evidence.value) : null;
      evidence.optics = {
        incidence,
        reflection: incidence,
        refraction: snellAngle(n1, n2, incidence),
        studentAngle: Number.isFinite(values.angle) ? values.angle : null,
        studentRefraction: Number.isFinite(values.angle) ? values.angle : null,
        critical: boundaryCritical,
        imageDistance: projection?.imageDistance ?? null,
        magnification: projection?.magnification ?? null,
        projection,
        studentImageDistance: Number.isFinite(values.distance) ? values.distance : null,
        studentImageHeight: Number.isFinite(values.height) ? values.height : null
      };
    }
    if (level.code?.startsWith("C-")) {
      if (level.visual === "brake") evidence.chrono = chronoBrake({ initialSpeed: 12, deceleration: Math.max(.1, evidence.value), gatePosition: 80, duration: 12 });
      else if (level.visual === "chrono-stop") {
        const initialSpeed = resolvedDependencyValue(evidence.dependencyResolution, "chrono.meet.entrySpeed");
        const gatePosition = resolvedDependencyValue(evidence.dependencyResolution, "chrono.meet.availableDistance");
        evidence.chrono = initialSpeed === null || gatePosition === null ? null : chronoBrake({ initialSpeed, deceleration: 4, gatePosition, duration: Math.max(6, initialSpeed / 4 + 1) });
      }
      else if (level.visual === "xt-meet") evidence.chrono = chronoMeeting({ first: { x0: 20, v0: 1, a: 0 }, second: { x0: 0, v0: 13 / 3, a: 0 }, duration: 6 });
      else if (level.visual === "xt-slope") evidence.chrono = chronoMeeting({ first: { x0: 0, v0: 1, a: 0 }, second: { x0: 0, v0: Math.max(.1, evidence.value), a: 0 }, duration: 6 });
      else if (level.visual === "chrono-uniform") evidence.chrono = chronoMeeting({ first: { x0: 0, v0: 6, a: 0 }, second: { x0: 120, v0: 0, a: 0 }, duration: 20 });
      else if (level.visual === "chrono-accel") evidence.chrono = chronoMeeting({ first: { x0: 0, v0: 0, a: 2 }, second: { x0: 100, v0: 0, a: 0 }, duration: 10 });
      else if (level.visual === "chase" || level.visual === "chrono-delay") evidence.chrono = chronoMeeting({ first: { x0: 40, v0: 4, a: 0 }, second: { x0: 0, v0: level.visual === "chrono-delay" ? 8 : 4 + evidence.value, a: 0 }, duration: 12 });
      else evidence.chrono = chronoMeeting({ first: { x0: 0, v0: 3, a: 0 }, second: { x0: 0, v0: level.visual === "chrono-accel" ? 0 : Math.max(1, evidence.value), a: level.visual === "chrono-accel" ? 2 : 0 }, duration: 10 });
    }
    evidence.evidenceVersionId = `ev:${level.code}:${JSON.stringify(stableRecord({ phase, value: evidence.value, values }))}`;
    evidence.version = evidence.evidenceVersionId;
    if (evidence.dependencyResolution.status === "upstream_inconclusive") evidence.certified = false;
    evidence.causalMutationCase = deriveCausalMutationCase(level, evidence);
    const family = familyForLevel(level);
    const observable = deriveFamilyObservable(level, evidence);
    const conclusion = level.prediction ? computeFoundationConclusion(level, observable, evidence.version) : null;
    let solution = null;
    if (level.inputs) {
      const model = deriveAdvancedModel(level);
      const outputs = level.visual === "chrono-stop" && !evidence.chrono ? [] : solveAdvanced(level, evidence);
      solution = { model, outputs, status: outputs.length ? "resolved" : "upstream_inconclusive" };
    }
    evidence.domainEvidence = {
      family,
      contractId: evidence.contractId,
      evidenceVersionId: evidence.evidenceVersionId,
      phase,
      observed: evidence.observed,
      previewActive: evidence.previewActive,
      certified: evidence.certified,
      observable,
      conclusion,
      solution,
      explanation: deriveDomainExplanation(level, family, observable, evidence, conclusion, solution)
    };
    if (level.code === "C-A3" && phase === "evidence" && evidence.certified) {
      evidence.handoffEvidence = {
        "chrono.meet.entrySpeed": { value: evidence.chrono.second.v0, evidenceVersionId: evidence.evidenceVersionId, contractVersion: "chrono-meet-v2", status: "supported" },
        "chrono.meet.availableDistance": { value: evidence.chrono.meetingPosition, evidenceVersionId: evidence.evidenceVersionId, contractVersion: "chrono-meet-v2", status: "supported" }
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
    classifyLensProjection,
    deriveLensProjection,
    describeOpticsProjection,
    chronoMeeting,
    chronoBrake,
    interferenceAt,
    singleWaveAt,
    deriveWaveEvidence,
    previewPrimitiveCatalog,
    derivePreviewGeometry,
    familyForLevel,
    deriveEvidenceState,
    deriveQualitativeConclusion,
    evaluateFoundation,
    evaluateAdvanced,
    deriveAdvancedModel,
    solveAdvanced,
    describeEvidence
    ,accessibleProjection
  };
});
