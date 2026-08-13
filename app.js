const data = window.TempleData;
const physics = window.TemplePhysics;
const main = document.querySelector("#main");
const params = new URLSearchParams(location.search);
const temple = data.temples.find(item => item.id === params.get("temple")) || data.temples[0];
const track = params.get("track") === "advanced" ? "advanced" : "foundation";
const route = data.tracks[track];
const levels = temple.tracks[track];
const completed = readProgress(track);
const profile = readProfile();
const evidenceLedger = readEvidenceLedger();
let attempts = 0;
let hintOpen = false;
let flame = 3;
let mistakes = 0;
let usedHint = false;
let rewinds = 0;
let episodeTrace = null;
let canvasResizeObserver = null;
let lastVisualRequest = null;
let canvasTypography = { cssScale: 1 };
let stageDependencyCapture = null;

document.body.dataset.track = track;
document.documentElement.style.setProperty("--temple-color", temple.color);
window.TempleAudio?.setTheme(temple.id);

function readProgress(name) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`law-temple-v3-${name}-completed`) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveProgress() {
  localStorage.setItem(`law-temple-v3-${track}-completed`, JSON.stringify([...completed]));
}

function readEvidenceLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem("law-temple-v5-evidence-ledger") || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveEvidenceLedger() {
  localStorage.setItem("law-temple-v5-evidence-ledger", JSON.stringify(evidenceLedger));
}

function captureDependencies(level) {
  const latestEvidenceLedger = readEvidenceLedger();
  const snapshot = {};
  const upstreamEvidence = {};
  for (const dependency of level.stateContract?.dependencyManifest || []) {
    const source = latestEvidenceLedger[dependency.valueRef];
    if (dependency.provenance === "upstream_evidence" && source) {
      upstreamEvidence[dependency.valueRef] = source;
      snapshot[dependency.valueRef] = source.evidenceVersionId;
    }
  }
  return { upstreamEvidence, dependencyVersionSnapshot: snapshot };
}

function dependencySnapshot(level) {
  return captureDependencies(level).dependencyVersionSnapshot;
}

function dependencyContext(level, dependencyVersionSnapshot = {}) {
  const manifest = level.stateContract?.dependencyManifest || [];
  const latestEvidenceLedger = readEvidenceLedger();
  const upstreamEvidence = {};
  for (const dependency of manifest) {
    if (dependency.provenance === "upstream_evidence" && latestEvidenceLedger[dependency.valueRef]) upstreamEvidence[dependency.valueRef] = latestEvidenceLedger[dependency.valueRef];
  }
  return { upstreamEvidence, dependencyVersionSnapshot };
}

function storeHandoffEvidence(evidence) {
  if (!evidence?.handoffEvidence) return;
  Object.assign(evidenceLedger, readEvidenceLedger(), evidence.handoffEvidence);
  saveEvidenceLedger();
}

function readProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem("law-temple-v4-player") || "{}");
    return {
      xp: Number(parsed.xp) || 0,
      streak: Number(parsed.streak) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      relics: Array.isArray(parsed.relics) ? parsed.relics : [],
      levels: parsed.levels && typeof parsed.levels === "object" ? parsed.levels : {}
    };
  } catch {
    return { xp: 0, streak: 0, bestStreak: 0, relics: [], levels: {} };
  }
}

function saveProfile() {
  localStorage.setItem("law-temple-v4-player", JSON.stringify(profile));
}

function playerRank(xp = profile.xp) {
  if (xp >= 14000) return "微界法則師";
  if (xp >= 8000) return "十七殿巡禮者";
  if (xp >= 4500) return "天穹法則師";
  if (xp >= 2200) return "證據鍛造者";
  if (xp >= 900) return "雙印解讀者";
  if (xp >= 300) return "神火行者";
  return "法則見習者";
}

function sound(name) {
  window.TempleAudio?.play(name);
}

function spawnSealBurst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const burst = document.createElement("div");
  burst.className = "seal-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.innerHTML = Array.from({ length: 16 }, (_, index) => `<span style="--angle:${index * 22.5}deg;--delay:${index % 4 * 35}ms"></span>`).join("");
  document.body.append(burst);
  setTimeout(() => burst.remove(), 1200);
}

function levelUnlocked(index) {
  return index === 0 || levels.slice(0, index).every(level => completed.has(level.code));
}

function setLocation(levelCode) {
  const next = new URL(location.href);
  if (levelCode) next.searchParams.set("level", levelCode);
  else next.searchParams.delete("level");
  history.pushState({}, "", next);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const requested = new URLSearchParams(location.search).get("level");
  const index = levels.findIndex(level => level.code === requested);
  if (index >= 0 && levelUnlocked(index)) renderStage(levels[index], index);
  else renderMap();
}

function topbar(center, right, backAction) {
  return `<header class="topbar">
    ${backAction === "home" ? `<a href="index.html">← 神殿總圖</a>` : `<button type="button" data-back>← 關卡地圖</button>`}
    <span class="brand">${center}</span><span class="stage-count">${right}</span>
  </header>`;
}

function renderMap() {
  document.title = `${temple.name}・${route.label}｜法則神殿`;
  const finished = levels.filter(level => completed.has(level.code)).length;
  main.innerHTML = `<section class="map-page">
    ${topbar(temple.name, `${finished} / ${levels.length}`, "home")}
    <header class="map-hero" style="--hero-image:url('${temple.heroImage}')">
      <div class="map-hero-content">
        <p class="eyebrow">TEMPLE ${temple.number} · ${temple.eyebrow}</p>
        <p class="story-act">${temple.act} · ${temple.region}</p>
        <span class="route-badge">${route.grade} · ${route.task}</span>
        <span class="curriculum-badge">${temple.curriculum?.[track] || route.grade}</span>
        <h1>${temple.name}</h1>
        <p class="lead">${temple.description}</p>
        <nav class="track-switch" aria-label="切換學習路線">
          <a class="${track === "foundation" ? "current" : ""}" href="temple.html?temple=${temple.id}&track=foundation">初階殿・${temple.curriculum?.foundation?.startsWith("加深") ? "選修" : "必修"}</a>
          <a class="${track === "advanced" ? "current" : ""}" href="temple.html?temple=${temple.id}&track=advanced">進階殿・${temple.curriculum?.advanced?.includes("必修") ? "必修＋選修" : "選修"}</a>
        </nav>
      </div>
    </header>
    <div class="shell">
      <section class="route-contract" aria-label="路線說明">
        <div class="contract-chip"><span>建議年級</span><strong>${route.grade}</strong></div>
        <div class="contract-chip"><span>任務形式</span><strong>${route.task}</strong></div>
        <div class="contract-chip"><span>需要能力</span><strong>${route.ability}</strong></div>
        <div class="contract-chip"><span>單關時間</span><strong>${route.duration}</strong></div>
      </section>
      <section class="guardian-panel" aria-label="神殿故事">
        <div><span>神殿守護者</span><strong>${temple.guardian}</strong><small>等待修復：${temple.relic}</small></div>
        <p>${temple.crisis}</p><blockquote>「${temple.oath}」</blockquote>
        <details class="guardian-history"><summary>讀取守護者留下的歷史刻痕</summary><p>${temple.history}</p></details>
      </section>
      <section class="level-grid" aria-label="${route.label}關卡">
        ${levels.map((level, index) => {
          const locked = !levelUnlocked(index);
          const done = completed.has(level.code);
          return `<button type="button" class="level-card" data-level="${level.code}" ${locked ? "disabled" : ""}>
            <span class="level-code">${level.code} · ${level.time}</span><h2>${level.title}</h2><p>${level.storyTeaser || level.summary}</p>
            <footer><span>${locked ? "完成前一關後解鎖" : done ? "重新挑戰" : "進入機關"}</span><span class="${done ? "done" : ""}">${done ? "已完成 ✓" : locked ? "鎖定" : "→"}</span></footer>
          </button>`;
        }).join("")}
      </section>
      <div class="track-progress"><strong>${route.label}進度 ${finished} / ${levels.length}</strong><div class="progress-track"><div class="progress-bar" style="width:${finished / levels.length * 100}%"></div></div></div>
    </div>
  </section>`;
  main.querySelectorAll("[data-level]").forEach(button => button.addEventListener("click", () => { sound("enter"); setLocation(button.dataset.level); }));
}

function renderStage(level, index, session) {
  canvasResizeObserver?.disconnect();
  canvasResizeObserver = null;
  lastVisualRequest = null;
  attempts = session?.attempts || 0;
  hintOpen = Boolean(session?.hintOpen);
  flame = session?.flame ?? 3;
  mistakes = session?.mistakes || 0;
  usedHint = Boolean(session?.usedHint);
  rewinds = session?.rewinds || 0;
  episodeTrace = session?.episodeTrace || {
    assessedClaim: level.assessedClaim,
    modelId: level.modelId,
    comparisonPlan: null,
    evidenceRun: null,
    status: "planning"
  };
  stageDependencyCapture = session?.dependencyCapture || captureDependencies(level);
  document.title = `${level.title}｜${temple.name} ${route.label}`;
  main.innerHTML = `<section class="stage-page">
    ${topbar(`${temple.name} · ${route.label}`, `${index + 1} / ${levels.length}`, "map")}
    <div class="shell stage-layout">
      <aside class="brief-panel">
        <div class="stage-badges"><span class="route-badge">${route.grade} · ${route.task}</span><span class="curriculum-badge">${temple.curriculum?.[track] || route.grade}</span><span class="guardian-badge">${temple.guardian}</span></div>
        <section class="flame-panel" aria-label="神火狀態"><div><span>修復者神火</span><strong data-flame>${flameGlyphs()}</strong></div><small data-flame-note>錯誤會使神火衰減；歸零時守護者會啟動回溯，不會封鎖學習。</small></section>
        <h1>${level.title}</h1><p class="mission">${level.storyProblem || level.mission}</p>
        <div class="metadata"><div><span>任務類型</span><strong>${level.skill}</strong></div><div><span>需要能力</span><strong>${level.prerequisites}</strong></div><div><span>預估時間</span><strong>${level.time}</strong></div></div>
        <section class="known"><h2>進入前能確認的事</h2><ul>${stageKnownItems(level, stageDependencyCapture).map(item => `<li>${item}</li>`).join("")}</ul></section>
        <section class="hint-box"><button type="button" data-hint>${hintOpen ? "收起線索" : "查看一層線索"}</button><p data-hint-text aria-live="polite">${hintOpen ? level.hint : ""}</p></section>
      </aside>
      <section class="workbench" data-workbench aria-label="物理機關工作檯">
        <figure class="scene-frame"><img src="${level.image}" alt="${level.title}的神殿情境圖"><canvas class="evidence-canvas" width="1000" height="562" data-canvas aria-label="程式繪製的物理證據圖"></canvas><figcaption class="scene-caption">情境圖只提供故事；向量、圖線、刻度與數值由程式繪製。</figcaption></figure>
        <div class="phase-dock" data-phase-dock>${track === "foundation" ? foundationChallenge(level, index) : advancedChallenge(level, index)}</div>
      </section>
    </div>
  </section>`;
  main.querySelector("[data-back]").addEventListener("click", () => setLocation(null));
  main.querySelector("[data-hint]").addEventListener("click", event => {
    sound("hint");
    hintOpen = !hintOpen;
    if (hintOpen) usedHint = true;
    main.querySelector("[data-hint-text]").textContent = hintOpen ? level.hint : "";
    event.currentTarget.textContent = hintOpen ? "收起線索" : "查看一層線索";
  });
  if (track === "foundation") bindFoundation(level, index);
  else bindAdvanced(level, index, stageDependencyCapture);
  drawVisual(level, { value: level.control?.base, phase: "pre-plan" });
  bindCanvasResize(level);
}

function stageKnownItems(level, capture = captureDependencies(level)) {
  const items = [...(level.prePlanKnown || level.known)];
  if (level.code !== "C-A4") return items;
  const speed = capture.upstreamEvidence["chrono.meet.entrySpeed"];
  const distance = capture.upstreamEvidence["chrono.meet.availableDistance"];
  if (!speed || !distance) return [...items, "上游軌跡尚未完成：星門不會自行補入預設初速或距離"];
  return [...items,
    `已鎖定上游初速 ${formatControlValue(speed.value)} m/s（版本 ${speed.evidenceVersionId}）`,
    `已鎖定可用距離 ${formatControlValue(distance.value)} m（版本 ${distance.evidenceVersionId}）`
  ];
}

function flameGlyphs() {
  return `<span class="flame-on">${"◆".repeat(flame)}</span><span class="flame-off">${"◇".repeat(Math.max(0, 3 - flame))}</span>`;
}

function updateFlame() {
  const target = main.querySelector("[data-flame]");
  if (target) target.innerHTML = flameGlyphs();
}

function loseFlame(level) {
  mistakes += 1;
  flame -= 1;
  if (flame > 0) {
    sound("damage");
    updateFlame();
    return `<span class="damage-note">神火 −1，剩餘 ${flame} 格。</span>`;
  }
  rewinds += 1;
  flame = 2;
  usedHint = true;
  hintOpen = true;
  const hintText = main.querySelector("[data-hint-text]");
  const hintButton = main.querySelector("[data-hint]");
  if (hintText) hintText.textContent = level.hint;
  if (hintButton) hintButton.textContent = "收起線索";
  updateFlame();
  sound("rewind");
  return `<span class="rewind-note">神火耗盡：${temple.guardian} 啟動第 ${rewinds} 次回溯，恢復 2 格神火並揭示一層線索。</span>`;
}

function stageSession() {
  return { attempts, hintOpen, flame, mistakes, usedHint, rewinds, episodeTrace, dependencyCapture: stageDependencyCapture };
}

function foundationChallenge(level) {
  const evidenceStep = level.control.kind === "reveal"
    ? phasePanel("control", "操作機關", `<p class="step-label">喚醒石臂</p>
        <p class="question">讓沉睡的石臂完成一次轉動。</p>
        <input id="level-control" type="hidden" value="${level.control.target}" data-control>
        <button type="button" class="primary-button" data-run>喚醒石臂</button>`, "control-step", "data-control-step")
    : phasePanel("control", "操作機關", `<p class="step-label">親手試一次</p>
        <div class="slider-head"><span class="control-label">${level.control.label}</span><output data-readout>${formatControlValue(level.control.base)} ${level.control.unit}</output></div>
        ${controlMarkup(level.control)}
        <div class="live-observation" data-live-observation aria-live="polite">
          <span>機關回應</span><strong data-live-text></strong>
          <i aria-hidden="true"><b data-live-meter></b></i>
        </div>
        <p class="target-note">把控制調到 <strong>${formatControlValue(level.control.target)} ${level.control.unit}</strong>，再讓機關運轉。</p>
        <button type="button" class="primary-button" data-run>讓機關運轉</button>`, "control-step", "data-control-step");
  return `<section class="challenge-card">
    ${phasePanel("prediction", "你的判斷", `<div class="prediction-step">
      <p class="step-label">先說你認為會發生什麼</p><p class="question">${level.prediction.question}</p>
      <div class="choices" data-predictions>${choiceButtons(level.prediction.options, "prediction")}</div>
      <div class="action-row"><span class="attempts" data-attempts>機關仍在等待</span><button type="button" class="primary-button" data-lock disabled>就押這個</button></div>
    </div>`, "visible is-active")}
    ${evidenceStep}
    ${phasePanel("reason", "你的解釋", `<p class="step-label">把剛才看見的事說清楚</p><p class="question">${level.reason.question}</p>
      <div class="choices" data-reasons>${choiceButtons(level.reason.options, "reason")}</div>
      <button type="button" class="primary-button" data-submit-reason disabled>告訴守護者</button>`, "reason-step", "data-reason-step")}
    <div class="feedback" data-feedback aria-live="polite">先選一種可能；機關會等你決定後才運轉。</div>
  </section>`;
}

function phasePanel(name, labelText, body, classes = "", attributes = "") {
  return `<section class="phase-panel ${classes}" data-phase-panel="${name}" ${attributes}>
    <button type="button" class="phase-summary" data-phase-toggle="${name}" aria-expanded="false">
      <span>${labelText}</span><strong data-phase-summary="${name}">尚未完成</strong><i aria-hidden="true">⌄</i>
    </button>
    <div class="phase-body">${body}</div>
  </section>`;
}

function choiceLabel(selector, value) {
  return main.querySelector(`${selector}[data-prediction="${value}"], ${selector}[data-model="${value}"]`)?.textContent?.trim() || value;
}

function setPhaseSummary(name, text) {
  const summary = main.querySelector(`[data-phase-summary="${name}"]`);
  if (summary) summary.textContent = text;
}

function activatePhase(name, { align = true } = {}) {
  const dock = main.querySelector("[data-phase-dock]");
  if (!dock) return;
  dock.classList.remove("has-review");
  dock.querySelectorAll("[data-phase-panel]").forEach(panel => {
    const active = panel.dataset.phasePanel === name;
    panel.classList.toggle("is-active", active);
    panel.classList.remove("is-reviewing");
    const toggle = panel.querySelector(":scope > [data-phase-toggle]");
    toggle?.setAttribute("aria-expanded", "false");
  });
  if (align) alignWorkbench();
}

function bindPhaseDock() {
  const dock = main.querySelector("[data-phase-dock]");
  dock?.querySelectorAll("[data-phase-toggle]").forEach(toggle => toggle.addEventListener("click", () => {
    const panel = toggle.closest("[data-phase-panel]");
    const opening = !panel.classList.contains("is-reviewing");
    dock.querySelectorAll("[data-phase-panel]").forEach(item => {
      item.classList.remove("is-reviewing");
      item.querySelector(":scope > [data-phase-toggle]")?.setAttribute("aria-expanded", "false");
    });
    dock.classList.toggle("has-review", opening);
    panel.classList.toggle("is-reviewing", opening);
    toggle.setAttribute("aria-expanded", String(opening));
    if (opening) alignWorkbench();
  }));
}

function alignWorkbench() {
  const workbench = main.querySelector("[data-workbench]");
  if (!workbench || !window.matchMedia("(max-width: 1199px)").matches) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => workbench.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }));
}

function controlMarkup(control) {
  const count = Math.round((Number(control.max) - Number(control.min)) / Number(control.step)) + 1;
  if (Number.isFinite(count) && count >= 2 && count <= 3) {
    const values = Array.from({ length: count }, (_, index) => Number(formatControlValue(Number(control.min) + index * Number(control.step))));
    return `<div class="control-options" role="group" aria-label="${control.label}">
      ${values.map(value => `<button type="button" class="control-option ${value === Number(control.base) ? "selected" : ""}" data-control-option="${formatControlValue(value)}" aria-pressed="${value === Number(control.base)}">${formatControlValue(value)} ${control.unit}</button>`).join("")}
    </div><input id="level-control" type="hidden" value="${control.base}" data-control>`;
  }
  return `<input id="level-control" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.base}" aria-label="${control.label}" data-control>`;
}

function formatControlValue(value) {
  return String(Number(Number(value).toPrecision(12)));
}

function formatModelValue(value, tolerance = 0) {
  const numeric = Number(value);
  const margin = Math.abs(Number(tolerance));
  if (!Number.isFinite(numeric)) return "—";
  if (!Number.isFinite(margin) || margin <= 0) return formatControlValue(numeric);
  const decimals = Math.max(0, Math.min(6, Math.ceil(-Math.log10(margin))));
  return numeric.toFixed(decimals);
}

function updateLiveObservation(level, value) {
  const text = main.querySelector("[data-live-text]");
  const meter = main.querySelector("[data-live-meter]");
  if (!text || !meter) return;
  const observation = liveObservation(level, value);
  text.textContent = observation.text;
  meter.style.width = `${Math.round(observation.ratio * 100)}%`;
}

function liveObservation(level, value) {
  const min = Number(level.control.min), max = Number(level.control.max);
  const progress = max === min ? 1 : (Number(value) - min) / (max - min);
  const clamp = number => Math.max(0, Math.min(1, number));
  const shown = `${formatControlValue(value)}${level.control.unit ? ` ${level.control.unit}` : ""}`;
  return { ratio: clamp(progress), text: `${level.control.label} ${shown}；機關幾何已同步移動，關係要等完整運轉後再判讀` };
}

function advancedChallenge(level) {
  return `<section class="challenge-card">
    ${phasePanel("model", "選定法則", `<p class="step-label">從碑文中選一條法則</p><p class="question">哪一條關係能讓這道機關成立？</p>
      <div class="choices model-choices" data-models>${choiceButtons(level.models, "model")}</div>`, "visible is-active")}
    ${phasePanel("calculation", "數值刻印", `<p class="step-label">把你的數值刻入機關</p>
      <div class="number-grid">${level.inputs.map(field => `<label class="number-field">${field.label}<div><input data-answer="${field.id}" type="number" inputmode="decimal" step="any" aria-label="${field.label}"><span>${field.unit}</span></div></label>`).join("")}</div>
      <div class="action-row"><span class="attempts" data-attempts>刻印仍未回應</span><button type="button" class="primary-button" data-verify>啟動刻印</button></div>
    `, "calculation-step", "data-calculation-step")}
    <div class="feedback" data-feedback aria-live="polite">先選一條法則，石碑才會接受你的數值。</div>
  </section>`;
}

function choiceButtons(options, type) {
  return options.map(item => `<button type="button" class="choice" data-${type}="${item.value}">${item.label}</button>`).join("");
}

function bindFoundation(level, index) {
  let selectedPrediction = null;
  let selectedReason = null;
  let evidenceValid = false;
  const lock = main.querySelector("[data-lock]");
  const controlInput = main.querySelector("[data-control]");
  const controlStep = main.querySelector("[data-control-step]");
  const reasonStep = main.querySelector("[data-reason-step]");
  const feedback = main.querySelector("[data-feedback]");
  bindPhaseDock();

  main.querySelectorAll("[data-prediction]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    selectedPrediction = button.dataset.prediction;
    selectOne("[data-prediction]", button);
    lock.disabled = false;
  }));
  lock.addEventListener("click", () => {
    sound("lock");
    lock.textContent = "選擇已刻下";
    lock.disabled = true;
    main.querySelectorAll("[data-prediction]").forEach(button => { button.disabled = true; });
    episodeTrace.comparisonPlan = {
      claim: level.assessedClaim,
      predictedDirection: selectedPrediction,
      controlledQuantity: level.control.label,
      conditionSet: [level.control.base, level.control.target]
    };
    episodeTrace.status = "plan-locked";
    controlStep.classList.add("visible");
    setPhaseSummary("prediction", `已刻下：${choiceLabel(".choice", selectedPrediction)}`);
    activatePhase("control");
    if (level.control.kind !== "reveal") {
      updateLiveObservation(level, Number(controlInput.value));
      drawVisual(level, { value: Number(controlInput.value), phase: "preview" });
    }
    feedback.textContent = level.control.kind === "reveal"
      ? "選擇已刻下。現在喚醒石臂。"
      : `選擇已刻下。請把${level.control.label}調到目標值，再讓機關運轉。`;
  });
  controlInput.addEventListener("input", () => {
    const readout = main.querySelector("[data-readout]");
    if (readout) readout.textContent = `${formatControlValue(controlInput.value)} ${level.control.unit}`;
    updateLiveObservation(level, Number(controlInput.value));
    if (evidenceValid) {
      evidenceValid = false;
      episodeTrace.status = "stale";
      if (episodeTrace.evidenceRun) episodeTrace.evidenceRun.supersededBy = `${level.code}:pending`;
      main.querySelector("[data-submit-reason]").disabled = true;
      feedback.className = "feedback";
      feedback.textContent = selectedReason
        ? "你改動了機關；剛才的痕跡已失效，但守護者替你保留了尚未送出的理由。重新運轉後再決定是否提交。"
        : "你改動了機關；剛才的痕跡已不再代表現在的狀態。請重新運轉一次。";
    } else {
      feedback.className = "feedback";
      feedback.textContent = "機關正在回應你的調整；調到目標後，讓它完整運轉一次。";
    }
    drawVisual(level, { value: Number(controlInput.value), phase: "preview" });
  });
  main.querySelectorAll("[data-control-option]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    main.querySelectorAll("[data-control-option]").forEach(option => {
      const selected = option === button;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    controlInput.value = button.dataset.controlOption;
    controlInput.dispatchEvent(new Event("input", { bubbles: true }));
  }));
  main.querySelector("[data-run]").addEventListener("click", () => {
    const value = Number(controlInput.value);
    attempts += 1;
    updateAttempts("已運轉", attempts);
    if (!physics.nearly(value, level.control.target, Math.max(Number(level.control.step) / 2, .001))) {
      feedback.className = "feedback bad";
      feedback.textContent = `控制值還不是目標 ${formatControlValue(level.control.target)} ${level.control.unit}；先調整再運轉。`;
      return;
    }
    evidenceValid = true;
    const observable = physics.deriveEvidenceState(level, { value, phase: "evidence" });
    episodeTrace.evidenceRun = {
      version: `${level.code}:${attempts}`,
      plan: episodeTrace.comparisonPlan,
      condition: level.code === "G-F2"
        ? { pairedComparison: observable.domainEvidence.observable.pairedComparison }
        : { [level.control.label]: value },
      observable
    };
    episodeTrace.status = "evidence-recorded";
    sound("evidence");
    if (level.code === "G-F2") animateDoorRun(level, episodeTrace.evidenceRun.observable);
    else drawVisual(level, { value, phase: "evidence" });
    reasonStep.classList.add("visible");
    setPhaseSummary("control", `本次條件：${formatControlValue(value)} ${level.control.unit} · 第 ${attempts} 次`);
    activatePhase("reason");
    main.querySelector("[data-submit-reason]").disabled = !selectedReason;
    feedback.className = "feedback";
    const outcome = physics.evaluateFoundation(level, episodeTrace.evidenceRun.observable, selectedPrediction, null);
    feedback.textContent = outcome.predictionOK ? "機關留下的痕跡與你原先的想法一致。現在說明原因。" : "機關的回應和你原先想的不一樣。看看痕跡，再選出原因。";
  });
  main.querySelectorAll("[data-reason]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    selectedReason = button.dataset.reason;
    selectOne("[data-reason]", button);
    main.querySelector("[data-submit-reason]").disabled = false;
  }));
  main.querySelector("[data-submit-reason]").addEventListener("click", () => {
    if (!evidenceValid) return;
    const outcome = physics.evaluateFoundation(level, episodeTrace.evidenceRun.observable, selectedPrediction, selectedReason);
    const { predictionOK, reasonOK } = outcome;
    markChoice("prediction", outcome.expectedPrediction);
    markChoice("reason", outcome.expectedReason);
    if (predictionOK && reasonOK) completeLevel(level, index, feedback);
    else {
      const damage = loseFlame(level);
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>機關尚未接受這條解釋。</strong><br>${predictionOK ? "原先判斷正確；再比較三個理由與畫面證據。" : "原先判斷和證據不一致；請重新進入本關修正整條因果鏈。"}<br>${damage}<br><button type="button" class="secondary-button next-button" data-retry>重新判斷</button>`;
      const session = stageSession();
      main.querySelector("[data-retry]").addEventListener("click", () => renderStage(level, index, session));
    }
  });
}

function bindAdvanced(level, index, dependencyCapture = captureDependencies(level)) {
  let selectedModel = null;
  let evidenceValid = false;
  const lockedDependencySnapshot = dependencyCapture.dependencyVersionSnapshot;
  const feedback = main.querySelector("[data-feedback]");
  const calculation = main.querySelector("[data-calculation-step]");
  bindPhaseDock();
  main.querySelectorAll("[data-model]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    selectedModel = button.dataset.model;
    selectOne("[data-model]", button);
    calculation.classList.add("visible");
    setPhaseSummary("model", `已選定：${button.textContent.trim()}`);
    activatePhase("calculation");
    episodeTrace.comparisonPlan = { claim: level.assessedClaim, selectedModel, requiredOutputs: level.inputs.map(field => field.id) };
    episodeTrace.status = "plan-locked";
    if (evidenceValid) invalidateAdvanced(level, feedback);
    feedback.className = "feedback";
    feedback.textContent = "法則已選定。刻入數值後啟動石碑；若再修改，石碑會重新計算。";
  }));
  main.querySelectorAll("[data-answer]").forEach(input => input.addEventListener("input", () => {
    if (evidenceValid) {
      evidenceValid = false;
      episodeTrace.status = "stale";
      if (episodeTrace.evidenceRun) episodeTrace.evidenceRun.supersededBy = `${level.code}:pending`;
      drawVisual(level, { phase: "pre-plan" });
      feedback.className = "feedback";
      feedback.textContent = "數值已改變；剛才的光紋不再代表這組刻印。請重新啟動石碑。";
    }
  }));
  main.querySelector("[data-verify]").addEventListener("click", () => {
    attempts += 1;
    updateAttempts("已啟動", attempts);
    const values = Object.fromEntries([...main.querySelectorAll("[data-answer]")].map(input => [input.dataset.answer, input.value]));
    const dependencies = dependencyContext(level, lockedDependencySnapshot);
    const proposedEvidence = physics.deriveEvidenceState(level, { phase: "evidence", values, ...dependencies });
    const outcome = physics.evaluateAdvanced(level, proposedEvidence, selectedModel, values);
    const { results, modelOK, valuesOK, upstreamOK } = outcome;
    const evidence = physics.deriveEvidenceState(level, { phase: "evidence", values, modelOK, valuesOK, ...dependencies });
    evidenceValid = true;
    episodeTrace.evidenceRun = {
      version: `${level.code}:${attempts}`,
      plan: episodeTrace.comparisonPlan,
      condition: values,
      observable: evidence
    };
    episodeTrace.status = modelOK && valuesOK ? "supported" : "contradicted";
    sound("evidence");
    drawVisual(level, { phase: "evidence", values, modelOK, valuesOK, ...dependencies });
    markChoice("model", evidence.domainEvidence.solution?.model);
    if (!upstreamOK) {
      evidenceValid = false;
      episodeTrace.status = "upstream_inconclusive";
      feedback.className = "feedback";
      const staleUpstream = proposedEvidence.dependencyResolution.entries.some(entry => entry.reason === "stale_upstream_evidence" || entry.reason === "stale_upstream_contract");
      feedback.innerHTML = staleUpstream
        ? "<strong>上游資料已過期。</strong><br>另一個分頁已更新「延遲追擊」的軌跡；本頁不會沿用舊版本結算。請返回關卡地圖再進入本關，重新鎖定最新資料；這次不扣神火。"
        : "<strong>星門沒有收到上一段狹道軌跡。</strong><br>請先重新完成「延遲追擊」，讓入站速度與可用距離留下可追溯版本；這次不扣神火。";
    } else if (modelOK && valuesOK) completeLevel(level, index, feedback);
    else {
      const wrongFields = results.filter(result => !result.ok).map(result => level.inputs.find(field => field.id === result.id).label);
      const damage = loseFlame(level);
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>這組刻印還無法啟動機關。</strong><br>${modelOK ? "法則可行；請重算：" + wrongFields.join("、") : "先回到已知條件，換一條能連起它們的關係。"}<br>${damage}`;
    }
  });
}

function invalidateAdvanced(level, feedback) {
  drawVisual(level, { revealed: false });
  feedback.className = "feedback";
  feedback.textContent = "你換了一條法則；剛才的光紋已熄滅。";
}

function selectOne(selector, selected) {
  main.querySelectorAll(selector).forEach(button => button.classList.toggle("selected", button === selected));
}

function markChoice(type, correct) {
  main.querySelectorAll(`[data-${type}]`).forEach(button => {
    button.classList.toggle("correct", button.dataset[type] === correct);
    button.classList.toggle("wrong", button.classList.contains("selected") && button.dataset[type] !== correct);
  });
}

function updateAttempts(label, count) {
  const target = main.querySelector("[data-attempts]");
  if (target) target.textContent = `${label} ${count} 次`;
}

function completeLevel(level, index, feedback) {
  const recordedEvidence = episodeTrace.evidenceRun?.observable;
  storeHandoffEvidence(recordedEvidence);
  const firstClear = !completed.has(level.code);
  completed.add(level.code);
  saveProgress();
  let reward = 0;
  if (firstClear) {
    reward = 100 + Math.max(0, 60 - mistakes * 20) + (usedHint ? 0 : 20);
    profile.xp += reward;
    profile.streak = mistakes === 0 && !usedHint ? profile.streak + 1 : 0;
    profile.bestStreak = Math.max(profile.bestStreak, profile.streak);
    profile.levels[level.code] = { mistakes, usedHint, rewinds, reward, episodeTrace };
    const foundationDone = temple.tracks.foundation.every(item => readProgress("foundation").has(item.code));
    const advancedDone = temple.tracks.advanced.every(item => readProgress("advanced").has(item.code));
    if (foundationDone && advancedDone && !profile.relics.includes(temple.id)) profile.relics.push(temple.id);
    saveProfile();
  }
  const trackEnding = index + 1 === levels.length ? `<br><strong>${route.label}完成：${track === "foundation" ? "觀測印" : "演算印"}已與 ${temple.relic} 共鳴。</strong>` : "";
  const rewardText = firstClear ? `<br><span class="reward-note">+${reward} 法則經驗・目前階級：${playerRank()}</span>` : `<br><span class="reward-note">重試完成，不重複計算經驗。</span>`;
  feedback.className = "feedback ok";
  const evaluationCondition = track === "foundation"
    ? { phase: "evaluation", value: recordedEvidence.value, valuesOK: true }
    : {
        phase: "evaluation",
        values: recordedEvidence.values,
        modelOK: recordedEvidence.modelOK,
        valuesOK: recordedEvidence.valuesOK,
        upstreamEvidence: recordedEvidence.dependencyResolution?.entries?.reduce((sources, entry) => {
          if (entry.provenance === "upstream_evidence") sources[entry.valueRef] = {
            value: entry.value,
            evidenceVersionId: entry.evidenceVersionId,
            contractVersion: entry.contractVersion,
            status: entry.status
          };
          return sources;
        }, {}),
        dependencyVersionSnapshot: stageDependencyCapture?.dependencyVersionSnapshot
      };
  const evaluationEvidence = physics.deriveEvidenceState(level, evaluationCondition);
  const explanation = physics.describeEvidence(level, evaluationEvidence);
  drawVisual(level, { evidenceState: evaluationEvidence });
  feedback.innerHTML = `<strong>法則刻印已取得。</strong><br>${explanation}<br>${temple.relic}已回應你的刻印。${rewardText}${trackEnding}<br><button type="button" class="primary-button next-button" data-next>${index + 1 < levels.length ? "前往下一關" : "返回關卡地圖"}</button>`;
  sound("success");
  if (firstClear) spawnSealBurst();
  main.querySelector("[data-next]").addEventListener("click", () => index + 1 < levels.length ? setLocation(levels[index + 1].code) : setLocation(null));
}

function drawVisual(level, state) {
  const canvas = main.querySelector("[data-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  lastVisualRequest = { level, state: structuredCloneSafe(state) };
  const { w, h } = prepareEvidenceCanvas(canvas, ctx);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const evidence = state?.evidenceState || physics.deriveEvidenceState(level, state);
  canvas.setAttribute?.("aria-label", physics.accessibleProjection(level, evidence));
  const value = evidence.value;
  const observed = evidence.phase === "evidence" || evidence.phase === "evaluation";
  const revealed = observed && evidence.certified;
  const preview = evidence.phase === "preview";
  drawBasePlate(ctx, w, h, observed ? (evidence.certified ? "刻印與機關吻合" : "刻印與機關不合") : preview ? "機關調整中" : "機關尚未啟動");
  const type = level.visual;
  if (evidence.phase === "pre-plan") {
    drawDormantApparatus(ctx, level, evidence, w, h);
    ctx.restore();
    return;
  }
  if (preview) {
    drawPreviewApparatus(ctx, level, evidence, w, h);
    ctx.restore();
    return;
  }
  const renderEvidence = renderStateFromDomain(evidence.domainEvidence);
  drawEvidenceApparatus(ctx, level, renderEvidence, revealed, w, h);
  if (observed && level.inputs) drawCandidateComparison(ctx, level, renderEvidence, w, h);
  ctx.restore();
}

function animateDoorRun(level, evidenceState) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof window.requestAnimationFrame !== "function") {
    drawVisual(level, { evidenceState });
    return;
  }
  const duration = 720;
  const start = window.performance?.now?.() ?? Date.now();
  const frame = now => {
    const elapsed = Math.max(0, Number(now) - start);
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - (1 - progress) ** 3;
    const animated = structuredCloneSafe(evidenceState);
    const pair = animated.domainEvidence.observable.pairedComparison;
    pair.base.responseAngle *= eased;
    pair.target.responseAngle *= eased;
    drawVisual(level, { evidenceState: animated });
    if (progress < 1) window.requestAnimationFrame(frame);
    else drawVisual(level, { evidenceState });
  };
  window.requestAnimationFrame(frame);
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function prepareEvidenceCanvas(canvas, ctx) {
  const logicalWidth = 1000;
  const logicalHeight = 562;
  const rect = canvas.getBoundingClientRect?.();
  const cssWidth = Number(rect?.width) || logicalWidth;
  const cssHeight = Number(rect?.height) || cssWidth * logicalHeight / logicalWidth;
  const dpr = Math.min(3, Math.max(1, Number(window.devicePixelRatio) || 1));
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  ctx.setTransform?.(pixelWidth / logicalWidth, 0, 0, pixelHeight / logicalHeight, 0, 0);
  canvasTypography = { cssScale: cssWidth / logicalWidth };
  if (canvas.dataset) {
    canvas.dataset.logicalSize = `${logicalWidth}x${logicalHeight}`;
    canvas.dataset.backingSize = `${pixelWidth}x${pixelHeight}`;
    canvas.dataset.minimumLabelPx = "12";
    canvas.dataset.minimumKeyPx = "14";
  }
  return { w: logicalWidth, h: logicalHeight };
}

function bindCanvasResize(level) {
  const frame = main.querySelector(".scene-frame");
  if (!frame || typeof ResizeObserver !== "function") return;
  let previousSize = "";
  canvasResizeObserver = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect;
    const nextSize = `${Math.round(rect?.width || 0)}x${Math.round(rect?.height || 0)}@${window.devicePixelRatio || 1}`;
    if (!lastVisualRequest || nextSize === previousSize) return;
    previousSize = nextSize;
    drawVisual(lastVisualRequest.level || level, lastVisualRequest.state);
  });
  canvasResizeObserver.observe(frame);
}

function canvasFontSize(text, requested, key = false) {
  const scale = Math.max(.01, canvasTypography.cssScale || 1);
  const isKey = key || requested >= 20 || /\d|°|[=×±ΔΦρλ]/.test(String(text));
  const minimumCssPixels = isKey ? 14 : 12;
  return Math.max(requested, minimumCssPixels / scale);
}

function renderStateFromDomain(domainResult) {
  const observable = domainResult.observable;
  return {
    observed: domainResult.observed,
    phase: domainResult.phase,
    certified: domainResult.certified,
    value: observable.controlValue,
    values: observable.candidateValues,
    wave: observable.wave,
    magnetic: observable.magnetic,
    optics: observable.optics,
    chrono: observable.chrono,
    dependencyResolution: observable.dependencyResolution,
    pairedComparison: observable.pairedComparison,
    domainEvidence: domainResult
  };
}

function drawEvidenceApparatus(ctx, level, evidence, revealed, w, h) {
  const type = level.visual;
  if (type.startsWith("wave-")) drawWaveVisual(ctx, type, evidence, revealed, w, h);
  else if (type.startsWith("photo-")) drawPhotoVisual(ctx, type, evidence, revealed, w, h);
  else if (type.startsWith("measure-") || type.startsWith("uncertainty-")) drawMeasureVisual(ctx, type, evidence, revealed);
  else if (type.startsWith("xt-") || type.startsWith("chase") || type.startsWith("brake") || type.startsWith("chrono-")) drawChronoVisual(ctx, type, evidence, revealed, w, h);
  else if (["momentum-","energy-","electric-","magnetic-","optics-","thermal-","celestial-","newton-","resonance-","emwave-","quantum-","nuclear-"].some(prefix => type.startsWith(prefix))) drawExpansionVisual(ctx, type, evidence, revealed, w, h);
  else drawTitanVisual(ctx, type, evidence, revealed, w, h);
}

function drawPreviewApparatus(ctx, level, evidence, w, h) {
  const preview = physics.derivePreviewGeometry(level, evidence);
  for (const primitive of preview.primitives) drawPreviewPrimitive(ctx, primitive, preview, w, h);
  const x = 185 + preview.normalizedControl * 630;
  ctx.strokeStyle = "rgba(255,220,139,.72)";
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(185,472); ctx.lineTo(815,472); ctx.stroke();
  dot(ctx, x, 472, "#ffdc8b", 12);
  label(ctx, `${level.control.label} ${formatControlValue(preview.controlValue)}${level.control.unit ? ` ${level.control.unit}` : ""}`, 185, 515, "#ffdc8b", 18);
  label(ctx, "完整痕跡待運轉", 690, 515, "#dbe3ef", 15);
}

function drawPreviewPrimitive(ctx, primitive, preview, w, h) {
  if (primitive === "apparatus-silhouette") {
    ctx.fillStyle = "rgba(220,230,242,.18)"; ctx.fillRect(270,205,460,190);
  } else if (primitive === "control-dial" || primitive === "time-dial" || primitive === "radius-dial") {
    ctx.strokeStyle = "rgba(255,220,139,.75)"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(500,300,88,Math.PI*.75,Math.PI*2.25); ctx.stroke();
    const angle = Math.PI*.75 + preview.normalizedControl*Math.PI*1.5;
    arrow(ctx,500,300,500+Math.cos(angle)*70,300+Math.sin(angle)*70,"#ffdc8b","");
  } else if (primitive === "optical-boundary") {
    ctx.strokeStyle = "#dce6f2"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(150,300); ctx.lineTo(850,300); ctx.stroke();
  } else if (primitive === "surface-normal") {
    ctx.strokeStyle = "rgba(220,230,242,.65)"; ctx.lineWidth = 4; ctx.setLineDash([9,8]); ctx.beginPath(); ctx.moveTo(500,135); ctx.lineTo(500,465); ctx.stroke(); ctx.setLineDash([]);
  } else if (primitive === "incident-ray") {
    const theta = Number(preview.opticalIncidence || 0)*Math.PI/180;
    arrow(ctx,500-Math.sin(theta)*200,300+Math.cos(theta)*200,500,300,"#ffdc8b","");
  } else if (primitive === "launch-platform") {
    ctx.strokeStyle = "#dce6f2"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(160,180); ctx.lineTo(160,430); ctx.lineTo(820,430); ctx.stroke(); dot(ctx,210,180,"#ffdc8b",13);
  } else if (primitive === "central-body") {
    dot(ctx,500,300,"#ffbf5c",55);
  } else if (primitive === "stone-door") {
    drawStoneDoor(ctx, 500, 300, 0, 360, "rgba(198,164,111,.82)");
  } else if (primitive === "door-hinge") {
    dot(ctx, 500, 300, "#ffd86f", 16); label(ctx, "門軸", 445, 345, "#ffdc8b", 18);
  } else if (primitive === "door-candidates") {
    dot(ctx, 620, 300, "#dbe3ef", 11); dot(ctx, 800, 300, "#dbe3ef", 11);
    label(ctx, "10 cm", 585, 270, "#dbe3ef", 16); label(ctx, "30 cm", 765, 270, "#dbe3ef", 16);
  } else if (primitive === "selected-force") {
    const selectedX = preview.controlValue >= 30 ? 800 : 620;
    dot(ctx, selectedX, 300, "#55e2db", 16);
    forceArrow(ctx, selectedX, 300, selectedX, 415, "#55e2db", "相同推力");
  }
}

function drawCandidateComparison(ctx, level, evidence, w, h) {
  const candidates = evidence.values || {};
  const expected = Object.fromEntries((evidence.domainEvidence.solution?.outputs || []).map(field => [field.id, field]));
  const fields = level.inputs.map(field => {
    const candidate = Number(candidates[field.id]);
    const reference = expected[field.id];
    return `${field.label}：你刻 ${Number.isFinite(candidate) ? formatControlValue(candidate) : "—"}${field.unit}／機關 ${formatModelValue(reference?.answer, reference?.tolerance)}${field.unit}`;
  });
  ctx.fillStyle = evidence.certified ? "rgba(11,61,54,.90)" : "rgba(68,29,35,.92)";
  ctx.fillRect(105, 490, w - 210, 48);
  label(ctx, `${evidence.certified ? "刻印吻合" : "刻印不合"}｜${fields.join("　")}`, 125, 520, evidence.certified ? "#a1fff5" : "#ffc0b8", 16);
}

function drawDormantApparatus(ctx, level, evidence, w, h) {
  const type = level.visual;
  if (type === "lever-distance") {
    ctx.fillStyle = "rgba(7,15,25,.55)";
    ctx.fillRect(95, 115, w - 190, h - 175);
    drawStoneDoorPlan(ctx);
    return;
  }
  ctx.fillStyle = "rgba(7,15,25,.55)";
  ctx.fillRect(95, 115, w - 190, h - 175);
  ctx.strokeStyle = "rgba(220,230,242,.72)";
  ctx.lineWidth = 5;
  if (type.startsWith("xt-") || type === "chase" || type === "brake") {
    graphAxes(ctx, 165, 420, 650, 235, "時間", type === "brake" ? "速度" : "位置");
    drawCart(ctx, 245, 315, "#ffb454", 120); drawCart(ctx, 625, 315, "#55e2db", 120);
  } else if (type.includes("lens") || type.includes("optics")) {
    ctx.beginPath(); ctx.moveTo(155,315); ctx.lineTo(845,315); ctx.stroke();
    ctx.setLineDash([10,8]); ctx.beginPath(); ctx.moveTo(500,145); ctx.lineTo(500,455); ctx.stroke(); ctx.setLineDash([]);
    if (type.includes("lens")) { ctx.strokeStyle="#b99cff";ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(500,315,38,140,0,0,Math.PI*2);ctx.stroke(); }
  } else if (type.includes("nuclear") || type.includes("quantum")) {
    for (let i=0;i<16;i++){const a=i*2.4,r=25+(i%4)*23;dot(ctx,500+Math.cos(a)*r,290+Math.sin(a)*r,i%2?"#ff7396":"#73c8ff",12);}
  } else if (type.includes("resonance") || type.includes("wave")) {
    ctx.beginPath();ctx.moveTo(175,315);ctx.lineTo(825,315);ctx.stroke();dot(ctx,315,315,"#78f5ec",11);dot(ctx,685,315,"#78f5ec",11);
  } else if (type.includes("electric") || type.includes("magnetic") || type.includes("emwave")) {
    ctx.strokeRect(235,190,530,225);dot(ctx,330,302,"#ff806b",28);dot(ctx,670,302,"#84a7ff",28);
  } else if (type.includes("thermal") || type.includes("energy")) {
    ctx.strokeRect(210,225,230,165);ctx.strokeRect(560,225,230,165);
  } else if (type.includes("momentum") || type.includes("newton")) {
    drawCart(ctx,235,315,"#ff806b",150);drawCart(ctx,615,315,"#7fa5c9",150);
  } else if (type.includes("celestial")) {
    dot(ctx,365,300,"#ffbf5c",45);dot(ctx,670,300,"#91a8ff",30);
  } else if (type.includes("measure") || type.includes("uncertainty")) {
    ctx.beginPath();ctx.moveTo(190,340);ctx.lineTo(810,340);ctx.stroke();for(let x=210;x<810;x+=45){ctx.beginPath();ctx.moveTo(x,340);ctx.lineTo(x,315);ctx.stroke();}
  } else {
    ctx.beginPath();ctx.moveTo(230,355);ctx.lineTo(790,355);ctx.stroke();dot(ctx,310,355,"#ffd86f",13);dot(ctx,705,315,"#d9c79d",30);
  }
  label(ctx, level.storyTeaser || "機關正在等待你的選擇", 175, 470, "#dbe3ef", 18);
}

function drawBasePlate(ctx, w, h, revealed) {
  ctx.fillStyle = "rgba(5,10,17,.52)";
  ctx.fillRect(26, 28, 300, 50);
  ctx.fillStyle = revealed === "刻印與機關吻合" ? "#8fffd4" : revealed === "刻印與機關不合" ? "#ff9b91" : revealed === "機關調整中" ? "#ffdc8b" : "#d2d9e4";
  ctx.font = `800 ${canvasFontSize(revealed, 20, true)}px system-ui`;
  ctx.fillText(revealed, 46, 60);
}

function drawStoneDoor(ctx, hingeX, hingeY, angleDegrees, length, color) {
  ctx.save();
  ctx.translate(hingeX, hingeY);
  ctx.rotate(angleDegrees * Math.PI / 180);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,228,172,.9)";
  ctx.lineWidth = 4;
  ctx.fillRect(0, -34, length, 68);
  ctx.strokeRect(0, -34, length, 68);
  ctx.restore();
  dot(ctx, hingeX, hingeY, "#ffd86f", 13);
}

function drawStoneDoorPlan(ctx) {
  ctx.fillStyle = "rgba(8,17,27,.82)";
  ctx.fillRect(125, 130, 750, 330);
  ctx.strokeStyle = "rgba(223,229,238,.34)";
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 9]);
  ctx.beginPath(); ctx.moveTo(500, 300); ctx.lineTo(850, 300); ctx.stroke();
  ctx.setLineDash([]);
  drawStoneDoor(ctx, 500, 300, 0, 350, "rgba(198,164,111,.78)");
  dot(ctx, 617, 300, "#dbe3ef", 11); dot(ctx, 850, 300, "#dbe3ef", 11);
  label(ctx, "10 cm", 575, 260, "#dbe3ef", 17); label(ctx, "30 cm", 805, 260, "#dbe3ef", 17);
  label(ctx, "門軸", 450, 350, "#ffdc8b", 18);
  label(ctx, "同一扇門 · 相同推力 · 相同方向 · 相同作用時間", 235, 430, "#dbe3ef", 17);
}

function drawPairedDoorEvidence(ctx, pair, revealed) {
  if (!pair?.base || !pair?.target) throw new Error("G-F2: paired door evidence is incomplete");
  const trials = [
    { x: 265, title: `${pair.base.momentArm} cm 試推`, data: pair.base },
    { x: 735, title: `${pair.target.momentArm} cm 試推`, data: pair.target }
  ];
  for (const trial of trials) {
    ctx.fillStyle = "rgba(8,17,27,.78)";
    ctx.fillRect(trial.x - 205, 105, 410, 355);
    ctx.strokeStyle = "rgba(223,229,238,.3)";
    ctx.lineWidth = 3;
    ctx.strokeRect(trial.x - 205, 105, 410, 355);
    label(ctx, trial.title, trial.x - 62, 145, "#ffdc8b", 18);
    ctx.strokeStyle = "rgba(220,230,242,.52)";
    ctx.lineWidth = 5;
    ctx.setLineDash([9, 8]);
    ctx.beginPath(); ctx.moveTo(trial.x - 120, 330); ctx.lineTo(trial.x + 135, 330); ctx.stroke();
    ctx.setLineDash([]);
    const projectedAngle = -Number(trial.data.responseAngle);
    drawStoneDoor(ctx, trial.x - 120, 330, projectedAngle, 255, "rgba(198,164,111,.86)");
    const theta = projectedAngle * Math.PI / 180;
    const forceX = trial.x - 120 + Math.cos(theta) * 210;
    const forceY = 330 + Math.sin(theta) * 210;
    forceArrow(ctx, forceX, forceY, forceX + Math.sin(theta) * 78, forceY - Math.cos(theta) * 78, "#55e2db", "相同推力");
    ctx.strokeStyle = "rgba(255,216,111,.7)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(trial.x - 120, 330, 88, projectedAngle * Math.PI / 180, 0); ctx.stroke();
    label(ctx, "轉動痕跡", trial.x - 90, 430, "#dbe3ef", 16);
  }
  if (revealed) evidenceCaption(ctx, `${pair.base.momentArm} cm 與 ${pair.target.momentArm} cm 使用同一推力；較長力臂留下較大的轉動痕跡`);
}

// Vector convention used everywhere in the game:
// (tailX, tailY) is the point of application, the arrowhead gives direction,
// and arrows compared in the same diagram use one common px-per-unit scale.
function arrow(ctx, tailX, tailY, headX, headY, color, label) {
  const angle = Math.atan2(headY - tailY, headX - tailX);
  const length = Math.hypot(headX - tailX, headY - tailY);
  const headSize = Math.min(20, Math.max(10, length * .16));
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(headX, headY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX, headY); ctx.lineTo(headX - headSize * Math.cos(angle - .5), headY - headSize * Math.sin(angle - .5)); ctx.lineTo(headX - headSize * Math.cos(angle + .5), headY - headSize * Math.sin(angle + .5)); ctx.closePath(); ctx.fill();
  if (label) { ctx.font = `800 ${canvasFontSize(label, 21, true)}px system-ui`; ctx.fillStyle = "white"; ctx.fillText(label, headX + 12, headY - 8); }
}

function dot(ctx, x, y, color, radius = 10) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function label(ctx, text, x, y, color = "white", size = 20) { ctx.fillStyle = color; ctx.font = `800 ${canvasFontSize(text, size)}px system-ui`; ctx.fillText(text, x, y); }
function forceArrow(ctx, tailX, tailY, headX, headY, color, text) {
  dot(ctx, tailX, tailY, "rgba(248,251,255,.95)", 8);
  dot(ctx, tailX, tailY, color, 5);
  arrow(ctx, tailX, tailY, headX, headY, color, text);
}

function drawTitanVisual(ctx, type, evidence, revealed, w, h) {
  const value = evidence.domainEvidence.observable.controlValue;
  const pivotX = 350, pivotY = 385;
  if (type === "triceps") {
    const ballX = 460, ballY = 195;
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(pivotX,pivotY); ctx.lineTo(ballX,ballY); ctx.stroke();
    dot(ctx,pivotX,pivotY,"#ffd86f",13); dot(ctx,ballX,ballY,"#d9c79d",22);
    const weight = evidence.values.weight;
    forceArrow(ctx,ballX,ballY,ballX,ballY+50,"#ff766c",revealed && Number.isFinite(weight)?`石球 ${formatControlValue(weight)} N`:"石球重力 W");
    forceArrow(ctx,pivotX-20,pivotY+15,pivotX-155,pivotY+80,"#55e2db","三頭肌 300 N");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(pivotX,pivotY,86,-Math.PI/3,Math.PI/2);ctx.stroke();ctx.setLineDash([]);
    label(ctx,"θ = 150°",420,365,"#ffdc8b",22);
    if(revealed && Number.isFinite(weight))evidenceCaption(ctx,`你的輸入 W = ${formatControlValue(weight)} N；畫面與計算使用同一份數值`);
  } else if (type === "pivot") {
    const elbowX=300,elbowY=360,insertionX=390,insertionY=350,handX=720,handY=340,ballX=720,ballY=180;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(elbowX,elbowY);ctx.lineTo(handX,handY);ctx.stroke();
    forceArrow(ctx,insertionX,insertionY,330,215,"#55e2db","二頭肌拉力");
    forceArrow(ctx,ballX,ballY,ballX,430,"#ff766c","石球重力");
    dot(ctx,elbowX,elbowY,revealed?"#ffd86f":"rgba(220,228,239,.85)",revealed?14:10);
    label(ctx,"肘關節",elbowX-45,elbowY-28,revealed?"#ffdc8b":"#dbe3ef",18);
    if(revealed){
      ctx.fillStyle="#ffd86f";ctx.beginPath();ctx.moveTo(elbowX-24,elbowY+48);ctx.lineTo(elbowX+24,elbowY+48);ctx.lineTo(elbowX,elbowY+8);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#ffdc8b";ctx.lineWidth=5;ctx.beginPath();ctx.arc(elbowX,elbowY,68,-.85,.65);ctx.stroke();
      label(ctx,"支點：前臂繞此處轉動",elbowX-65,elbowY+92,"#ffdc8b",20);
      evidenceCaption(ctx,"肘關節是前臂轉動中心，因此在槓桿模型中是支點");
    }
  } else if (type === "lever-distance") {
    drawPairedDoorEvidence(ctx, evidence.pairedComparison, evidence.phase === "evaluation");
  } else if (type === "force-direction") {
    const px=250,py=355,tailX=610,theta=Number(value)*Math.PI/180,len=150;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(790,py);ctx.stroke();
    dot(ctx,px,py,"#ffd86f",14);label(ctx,"支點",215,410,"#ffdc8b",18);
    forceArrow(ctx,tailX,py,tailX+Math.cos(theta)*len,py+Math.sin(theta)*len,"#55e2db","相同施力 F");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=4;ctx.beginPath();ctx.arc(tailX,py,70,0,theta);ctx.stroke();label(ctx,`θ = ${value}°`,tailX+35,py+72,"#ffdc8b",18);
    if(revealed)evidenceCaption(ctx,"施力點不變：力越接近垂直力臂，轉動效果越大");
  } else if (type === "posture") {
    const hipX=270,hipY=380,loadX=hipX+Number(value)*9;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(790,hipY);ctx.stroke();
    dot(ctx,hipX,hipY,"#ffd86f",14);label(ctx,"髖關節",220,430,"#ffdc8b",18);dot(ctx,loadX,330,"#d9c79d",32);
    const forceScale=35;forceArrow(ctx,loadX,330,loadX,330+forceScale,"#ff766c","石球重力 W（相同）");
    const muscleTailX=hipX+54,muscleTailY=hipY-10,muscleRatio=Number(value)/5,muscleLength=muscleRatio*forceScale;
    const muscleLoad=Math.max(0,Math.min(1,(Number(value)-15)/30));
    ctx.save();ctx.globalAlpha=.16+muscleLoad*.22;ctx.fillStyle="#55e2db";ctx.beginPath();ctx.ellipse(hipX+48,hipY-52,48+muscleLoad*14,33+muscleLoad*10,-.35,0,Math.PI*2);ctx.fill();ctx.restore();
    forceArrow(ctx,muscleTailX,muscleTailY,muscleTailX-muscleLength*.72,muscleTailY-muscleLength*.7,"#55e2db","臀大肌等髖伸肌群");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(hipX,450);ctx.lineTo(loadX,450);ctx.stroke();ctx.setLineDash([]);
    label(ctx,`重力力臂 ${value} cm`,Math.min(loadX-55,610),490,"#ffdc8b",18);label(ctx,`同一力刻度：髖伸肌力約 ${formatControlValue(muscleRatio)} W`,145,170,"#a1fff5",19);
    if(revealed)evidenceCaption(ctx,"把負重靠近髖關節，重力力臂縮短，肌肉負擔下降");
  } else if (type === "biceps") {
    const elbowX=280,elbowY=360,handX=720,handY=345;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(elbowX,elbowY);ctx.lineTo(handX,handY);ctx.stroke();
    dot(ctx,elbowX,elbowY,"#ffd86f",14);label(ctx,"肘支點",235,420,"#ffdc8b",18);dot(ctx,handX,handY-35,"#d9c79d",30);
    const force = evidence.values.force;
    const muscleLength = revealed && Number.isFinite(force) ? Math.max(30,Math.min(160,force*.48)) : 90;
    forceArrow(ctx,360,357,360-muscleLength*.28,357-muscleLength*.96,"#55e2db",revealed&&Number.isFinite(force)?`二頭肌 ${formatControlValue(force)} N`:"二頭肌拉力 F");
    forceArrow(ctx,handX,handY-35,handX,handY-10,"#ff766c","石球 50 N");
    if(revealed&&Number.isFinite(force))label(ctx,`同一比例尺：${formatControlValue(force)} N 與 50 N`,515,485,"#dbe3ef",17);
    if(revealed)evidenceCaption(ctx,"箭尾在施力點；箭頭給方向；同圖箭長按輸入力大小繪製");
  } else if (type === "deadlift") {
    const hipX=260,hipY=400,torsoX=500,torsoY=285,loadX=760,loadY=350;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(640,225);ctx.lineTo(loadX,loadY);ctx.stroke();
    dot(ctx,hipX,hipY,"#ffd86f",14);label(ctx,"髖支點",205,455,"#ffdc8b",18);
    forceArrow(ctx,torsoX,torsoY,torsoX,torsoY+24,"#ff9b79","上半身 300 N");
    const weight = evidence.values.weight;
    forceArrow(ctx,loadX,loadY,loadX,loadY+Math.max(12,Math.min(80,(Number.isFinite(weight)?weight:100)*.25)),"#ff766c",revealed&&Number.isFinite(weight)?`石球 ${formatControlValue(weight)} N`:"石球重力 W");
    forceArrow(ctx,305,376,160,250,"#55e2db","髖伸肌 2250 N");
    if(revealed)label(ctx,"箭長使用同一比例尺；畫面採玩家輸入的石球重力",390,485,"#dbe3ef",17);
    if(revealed)evidenceCaption(ctx,"髖伸肌力矩 = 上半身力矩 + 石球力矩");
  } else if (type === "achilles") {
    const heelX=300,ankleX=470,toeX=760,footY=365;
    ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(heelX,footY);ctx.lineTo(toeX,footY);ctx.stroke();
    dot(ctx,ankleX,footY,"#ffd86f",14);label(ctx,"踝關節支點",405,420,"#ffdc8b",18);
    forceArrow(ctx,heelX,footY,heelX,185,"#55e2db","阿基里斯腱 3000 N");
    const normal = evidence.values.normal;
    const normalLength = revealed&&Number.isFinite(normal)?Math.max(30,Math.min(180,normal*.06)):70;
    forceArrow(ctx,toeX,footY,toeX,footY-normalLength,"#ff9b79",revealed&&Number.isFinite(normal)?`前腳掌正向力 ${formatControlValue(normal)} N`:"前腳掌正向力 N");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(heelX,455);ctx.lineTo(ankleX,455);ctx.moveTo(ankleX,485);ctx.lineTo(toeX,485);ctx.stroke();ctx.setLineDash([]);
    label(ctx,"5 cm 等效力臂",315,450,"#ffdc8b",16);label(ctx,"15 cm",590,480,"#ffdc8b",16);
    if(revealed&&Number.isFinite(normal))evidenceCaption(ctx,`取踝關節力矩檢查你的輸入：3000×5 與 ${formatControlValue(normal)}×15`);
  }
}

function graphAxes(ctx, x, y, w, h, xLabel, yLabel) {
  ctx.strokeStyle="rgba(235,242,252,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();
  label(ctx,xLabel,x+w-20,y+35,"#dbe3ef",16); label(ctx,yLabel,x-20,y-h-12,"#dbe3ef",16);
}

function drawChronoVisual(ctx, type, evidence, revealed, w, h) {
  const value = evidence.domainEvidence.observable.controlValue;
  const x=130,y=460,gw=720,gh=320;
  const velocityGraph=type === "brake" || type === "chrono-stop";
  graphAxes(ctx,x,y,gw,gh,"t",velocityGraph?"速度 v":"位置 x");
  const chrono=evidence.chrono;
  if(!chrono){
    label(ctx,"上游軌跡不足或版本已失效",280,285,"#ffbd93",24);
    label(ctx,"先回到相遇機關，重新取得同一版本的入站資料。",220,335,"#dbe3ef",18);
    evidenceCaption(ctx,"chrono.brake｜上游證據不足，未繪製煞車曲線");
    return;
  }
  const line=(color,x1,y1,x2,y2)=>{ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  const plot=(key,color,maxValue)=>{
    const series=chrono?.series||[],duration=chrono?.duration||1,cap=maxValue||Math.max(1,...series.map(point=>Math.abs(point[key]||0)));
    ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();
    series.forEach((point,index)=>{const px=x+gw*point.time/duration,py=y-gh*Math.max(0,point[key]||0)/cap;if(index)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
    ctx.stroke();
  };
  if(type === "xt-slope") {
    const cap=Math.max(...chrono.series.map(point=>Math.max(point.x1,point.x2)),1);plot("x1","#ffb454",cap);plot("x2","#55e2db",cap);
    if(revealed)evidenceCaption(ctx,"位置—時間圖斜率越大，速度越大");
  } else if(type === "xt-meet") {
    const cap=Math.max(...chrono.series.map(point=>Math.max(point.x1,point.x2)),1);plot("x1","#ffb454",cap);plot("x2","#55e2db",cap);
    const fraction=Math.max(0,Math.min(1,Number(value)/chrono.duration)),cursorX=x+gw*fraction,point=chrono.series.reduce((best,item)=>Math.abs(item.time-value)<Math.abs(best.time-value)?item:best,chrono.series[0]);
    const orangeY=y-gh*point.x1/cap,cyanY=y-gh*point.x2/cap,gap=Number(point.gap.toFixed(1));
    ctx.setLineDash([8,7]);line("rgba(255,216,111,.7)",cursorX,y,cursorX,Math.min(orangeY,cyanY));ctx.setLineDash([]);
    dot(ctx,cursorX,orangeY,"#ffb454",10);dot(ctx,cursorX,cyanY,"#55e2db",10);label(ctx,`t = ${value} s｜圖上距離差 ${gap}`,Math.min(cursorX+15,610),165,"#ffdc8b",18);
    if(revealed){const t=chrono.meetingTime,meetX=x+gw*t/chrono.duration,meetY=y-gh*chrono.meetingPosition/cap;dot(ctx,meetX,meetY,"#ffd86f",12);label(ctx,`t = ${formatControlValue(t)} s：同時同地`,x+415,y-140,"#9fffea",19);evidenceCaption(ctx,"chrono.meet｜交點的時間與位置座標都相同");}
  } else if(type === "chase") {
    const cap=Math.max(...chrono.series.map(point=>Math.max(point.x1,point.x2)),1);plot("x1","#ffb454",cap);plot("x2","#55e2db",cap);
    if(revealed)evidenceCaption(ctx,`chrono.meet｜最小間距 ${formatControlValue(chrono.minimumGap)} m；後車較快時距離縮短`);
  } else if(type === "brake") {
    plot("velocity","#55e2db",chrono.initialSpeed);const stopX=x+gw*Math.min(1,chrono.stopTime/chrono.duration);
    if(revealed){dot(ctx,stopX,y,"#ffd86f",11);evidenceCaption(ctx,`chrono.brake｜停止時間 ${formatControlValue(chrono.stopTime)} s；煞車越強越早到 v=0`);}
  } else if(type === "chrono-uniform") {
    plot("x1","#55e2db",120);if(revealed)evidenceCaption(ctx,`chrono.meet｜${formatControlValue(chrono.meetingTime)} s 抵達 120 m 入口`);
  } else if(type === "chrono-accel") {
    plot("x1","#55e2db",100);if(revealed)evidenceCaption(ctx,`chrono.meet｜等加速軌跡在 ${formatControlValue(chrono.meetingTime)} s 抵達 100 m`);
  } else if(type === "chrono-delay") {
    const cap=Math.max(...chrono.series.map(point=>Math.max(point.x1,point.x2)),1);plot("x1","#ffb454",cap);plot("x2","#55e2db",cap);if(revealed)evidenceCaption(ctx,`chrono.meet｜橙隊先行 40 m；${formatControlValue(chrono.meetingTime)} s 後追上`);
  } else if(type === "chrono-stop") {
    plot("velocity","#55e2db",chrono.initialSpeed);const stopX=x+gw*Math.min(1,chrono.stopTime/chrono.duration);dot(ctx,stopX,y,"#ffd86f",11);if(revealed)evidenceCaption(ctx,`chrono.brake｜停止位置 ${formatControlValue(chrono.stopPosition)} m｜${chrono.conclusion === "safe_stop" ? "停在安全窗內" : "越過星門"}`);
  }
}

function drawPhotoVisual(ctx, type, evidence, revealed, w, h) {
  const value = evidence.domainEvidence.observable.controlValue;
  const left=160,right=835,axisY=345,scale=120;
  ctx.fillStyle="rgba(16,30,52,.84)";ctx.fillRect(110,120,780,340);
  ctx.strokeStyle="#dce6f2";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(left,axisY);ctx.lineTo(right,axisY);ctx.stroke();
  label(ctx,"能量（eV）→",left,395,"#b7ccff",18);
  const bar=(energy,color="#70a7ff",text)=>{ctx.fillStyle=color;ctx.fillRect(left,235,energy*scale,58);if(text)label(ctx,text,left+10,272,"white",18);};
  const threshold=(energy,text,color="#f6bd4a")=>{const x=left+energy*scale;ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,190);ctx.lineTo(x,365);ctx.stroke();label(ctx,text,x-38,175,color,17);};
  if(!evidence.observed){
    ctx.fillStyle="#70a7ff";ctx.fillRect(190,220,180,70);label(ctx,"待調整的光束",205,263,"white",18);
    ctx.strokeStyle="#f6bd4a";ctx.lineWidth=6;ctx.strokeRect(650,205,115,115);label(ctx,"金屬光門",657,340,"#ffdc8b",17);
    label(ctx,"先決定你的做法，光電子結果尚未出現",265,435,"#dbe3ef",19);
    return;
  }
  if(type === "photo-threshold") {
    const energy=1.3*Number(value);bar(energy,"#70a7ff",`光子能量：${formatControlValue(value)} 級`);threshold(3.5,"功函數 Φ");
    if(revealed)evidenceCaption(ctx,energy>=3.5?"Eγ ≥ Φ：單一光子已能放出電子":"Eγ < Φ：仍無光電子");
  } else if(type === "photo-intensity") {
    bar(2.2,"#70a7ff","每顆光子能量固定");threshold(3.5,"功函數 Φ");const count=Math.max(1,Math.round(Number(value)*2));for(let i=0;i<count;i++)dot(ctx,185+i*42,430,"#8db6ff",7);
    if(revealed)evidenceCaption(ctx,"強度只讓低能光子變多；每顆仍低於功函數");
  } else if(type === "photo-metal") {
    const selected=Math.round(Number(value));bar(3.2,"#70a7ff","同一束入射光");threshold(2.4,selected===1?"ΦA｜本次測試":"ΦA","#65ded2");threshold(4.0,selected===2?"ΦB｜本次測試":"ΦB","#ff8f86");
    label(ctx,selected===1?"金屬 A：Eγ > ΦA，放出電子":"金屬 B：Eγ < ΦB，沒有電子",285,445,selected===1?"#a1fff5":"#ffb6ac",19);
    if(revealed)evidenceCaption(ctx,"ΦA < Eγ < ΦB：A 放出電子，B 不會");
  } else if(type === "photo-budget") {
    const energy=1.05*Number(value);bar(energy,"#70a7ff",`頻率設定 ${formatControlValue(value)} 級`);threshold(2.2,"門 1");threshold(3.2,"門 2");threshold(4.2,"門 3");
    if(revealed)evidenceCaption(ctx,"先讓 Eγ 剛越過目標門檻，再以強度控制電子數");
  } else if(type === "photo-energy") {
    const energy=evidence.values.energy;if(Number.isFinite(energy))bar(energy,"#70a7ff",`你的光子能量 ${formatControlValue(energy)} eV`);if(revealed&&Number.isFinite(energy))evidenceCaption(ctx,"畫面長度直接取自你的 E=hc/λ 計算結果");
  } else if(type === "photo-kmax") {
    const kmax=evidence.values.kmax;bar(3.5,"#70a7ff","已知 Eγ = 3.5 eV");threshold(2.3,"功函數 Φ");if(Number.isFinite(kmax)){ctx.fillStyle="#65ded2";ctx.fillRect(left,420,kmax*scale,22);label(ctx,`你的 Kmax = ${formatControlValue(kmax)} eV`,left,470,"#a1fff5",18);}if(revealed)evidenceCaption(ctx,"綠條由你的 Kmax 輸入生成，不預先代入答案");
  } else if(type === "photo-voltage") {
    const voltage=evidence.values.voltage;bar(1.4,"#70a7ff","已知 Kmax = 1.4 eV");if(Number.isFinite(voltage)){threshold(voltage,`你的反向電壓 ${formatControlValue(voltage)} V`,"#ff8f86");}if(revealed)evidenceCaption(ctx,"反向電壓位置由你的輸入生成");
  } else {
    const electrons=evidence.values.electrons;bar(2.5,"#70a7ff","20 W × 2 s");if(Number.isFinite(electrons)){const count=Math.max(1,Math.min(20,Math.round(electrons/10)));for(let i=0;i<count;i++)dot(ctx,190+i*32,425,"#8db6ff",7);label(ctx,`你的有效電子數：${formatControlValue(electrons)}`,525,430,"#a1fff5",18);}if(revealed)evidenceCaption(ctx,"電子點數依玩家輸入縮放，沒有預存正解畫面");
  }
}

function drawWaveVisual(ctx, type, evidence, revealed, w, h) {
  const value = evidence.domainEvidence.observable.controlValue;
  const cx=w/2,cy=h/2+18,wave=evidence.wave;
  ctx.fillStyle="rgba(6,31,48,.72)";ctx.fillRect(90,105,w-180,h-155);
  if(!wave.observed){
    const sourceCount=type === "wave-frequency" || type === "wave-amplitude" || (type === "wave-two-source" && Number(value) === 1)?1:2;
    for(let i=0;i<sourceCount;i++)dot(ctx,cx+(i-(sourceCount-1)/2)*150,cy,"#78f5ec",12);
    label(ctx,sourceCount===1?"沉睡的水眼":"兩座沉睡的水眼",sourceCount===1?430:405,cy+70,"#a1fff5",19);
    label(ctx,"先決定要怎麼喚醒它；波紋結果尚未出現",285,485,"#d6deea",19);
    return;
  }
  const plot={x:120,y:125,width:760,height:335},cols=76,rows=34,cellW=plot.width/cols,cellH=plot.height/rows;
  const spanX=36,spanY=16;
  for(let row=0;row<rows;row++){
    const py=-spanY/2+(row+.5)*spanY/rows;
    for(let col=0;col<cols;col++){
      const px=-spanX/2+(col+.5)*spanX/cols;
      const intensity=wave.sources===1?physics.singleWaveAt(px,py,wave.params):physics.interferenceAt(px,py,wave.params);
      const contrast=Math.max(.12,Math.min(1,wave.amplitude/3));
      const light=Math.round(18+intensity*58*contrast);
      ctx.fillStyle=`hsl(${185+Math.round(intensity*18)} 70% ${light}%)`;
      ctx.fillRect(plot.x+col*cellW,plot.y+row*cellH,cellW+1,cellH+1);
    }
  }
  const sourcePx=separation=>separation/spanX*plot.width;
  const half=wave.sources===2?sourcePx(wave.params.separation)/2:0;
  dot(ctx,cx-half,cy,"#fff0a6",9);if(wave.sources===2)dot(ctx,cx+half,cy,"#fff0a6",9);
  label(ctx,`f=${formatControlValue(wave.params.frequency)} Hz　λ=${formatControlValue(wave.observable.wavelength)}`,135,112,"#a1fff5",17);
  if(type === "wave-lines" && wave.observable.lineCounts) label(ctx,`腹線 ${wave.observable.lineCounts.antinodes}｜節線 ${wave.observable.lineCounts.nodes}`,655,112,"#ffdc8b",17);
  else if(type === "wave-inverse" || type === "wave-phase") label(ctx,`中央強度 ${wave.observable.centerIntensity.toFixed(2)}｜相位 ${formatControlValue(wave.params.phase)}°`,570,112,"#ffdc8b",17);
  else label(ctx,wave.sources===1?"單源波場":"雙源干涉場",748,112,"#ffdc8b",17);
  if(revealed)evidenceCaption(ctx,type === "wave-frequency"?"波速固定時，模型以 λ=v/f 生成條紋間距":type === "wave-amplitude"?"只改振幅，模型中的 λ 不變":type === "wave-separation"?"只改源距，波長保持不變":type === "wave-lines"?"節腹線數由 d/λ 計算，背景波場也用同一組參數":"畫面每格由兩源程差與相位直接計算");
}

function drawMeasureVisual(ctx, type, evidence, revealed) {
  const value = evidence.domainEvidence.observable.controlValue;
  ctx.fillStyle="rgba(17,15,35,.8)";ctx.fillRect(120,120,760,330);
  if(type === "measure-scale" || type === "uncertainty-mass") {
    const display=type === "measure-scale"?["—","63 g","63.000 g"][Math.max(0,Math.min(2,Math.round(Number(value))))]:"63 g";
    ctx.fillStyle="#0c1922";ctx.fillRect(330,205,340,130);ctx.strokeStyle="#b99cff";ctx.lineWidth=5;ctx.strokeRect(330,205,340,130);label(ctx,display,display.length>5?385:440,285,"#a1fff5",48);
    if(type === "measure-scale")label(ctx,Number(value)===1?"儀器實際提供的位數":"不要自行補出儀器未顯示的位數",300,390,Number(value)===1?"#a1fff5":"#ffb6ac",18);
    if(revealed) label(ctx,type === "uncertainty-mass"?"uB = 1/√12 ≈ 0.29 g":"只記錄儀器實際提供的位數",300,405,"#e2d6ff",21);
  } else if(type === "measure-scatter" || type === "uncertainty-repeat") {
    const a=[.2,.25,.29,.23], b=[.06,.62,.31,.78];
    const values=type === "measure-scatter" && value===2?b:a;
    ctx.strokeStyle="#d6ddec";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(190,340);ctx.lineTo(810,340);ctx.stroke();
    values.forEach((v,i)=>dot(ctx,230+v*650,240+i*24,i%2?"#b99cff":"#55e2db",9));
    if(revealed) label(ctx,type === "uncertainty-repeat"?"A 類散布 + B 類刻度 → 組合":"A 組範圍較小，重複性較好",300,410,"#e2d6ff",21);
  } else if(type === "measure-tool") {
    const caliper=Number(value)>=2;ctx.strokeStyle=caliper?"#b99cff":"#d6ddec";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(180,320);ctx.lineTo(820,320);ctx.stroke();for(let i=0;i<=20;i++){ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(190+i*30,320);ctx.lineTo(190+i*30,295-(i%5===0?18:0));ctx.stroke();}
    if(caliper){ctx.fillStyle="#55e2db";ctx.fillRect(315,205,26,115);ctx.fillRect(650,205,26,115);label(ctx,"游標尺：可分辨 0.1 mm",345,190,"#a1fff5",18);}else label(ctx,"公分尺：最小刻度 1 mm",350,190,"#ffdc8b",18);if(revealed)evidenceCaption(ctx,"任務要分辨 0.1 mm，因此選擇游標尺");
  } else if(type === "measure-report") {
    const honest=Number(value)>=2;label(ctx,honest?"(25.63 ± 0.09) mm":"(25.625000 ± 0.09) mm",honest?285:205,285,honest?"#a1fff5":"#ffb6ac",honest?40:34);ctx.strokeStyle=honest?"#55e2db":"#ff806b";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(245,320);ctx.lineTo(755,320);ctx.stroke();label(ctx,honest?"末位一致":"多寫了沒有依據的小數位",honest?405:350,380,honest?"#a1fff5":"#ffb6ac",19);if(revealed)evidenceCaption(ctx,"量值與不確定度必須報到相同小數位");
  } else {
    ctx.strokeStyle="#b99cff";ctx.lineWidth=4;ctx.strokeRect(315,205,370,150);label(ctx,"L × W × H",410,290,"#d8c8ff",34);
    if(revealed) label(ctx,type.includes("density")?"ρ = 2.70 ± 0.045 g/cm³":type.includes("perimeter")?"獨立來源以平方和組合":type.includes("dimension")?"三個尺寸各自有量值與不確定度":"解析度與報告位數必須一致",235,415,"#e2d6ff",21);
  }
}

function drawExpansionVisual(ctx, type, evidence, revealed, w, h) {
  ctx.fillStyle = "rgba(7,14,24,.58)";
  ctx.fillRect(90, 105, w - 180, h - 155);
  const family = type.split("-")[0];
  if (family === "momentum") drawMomentumEvidence(ctx, type, evidence, revealed);
  else if (family === "energy") drawEnergyEvidence(ctx, type, evidence, revealed);
  else if (family === "electric") drawElectricEvidence(ctx, type, evidence, revealed);
  else if (family === "magnetic") drawMagneticEvidence(ctx, type, evidence, revealed);
  else if (family === "optics") drawOpticsEvidence(ctx, type, evidence, revealed);
  else if (family === "thermal") drawThermalEvidence(ctx, type, evidence, revealed);
  else if (family === "celestial") drawCelestialEvidence(ctx, type, evidence, revealed);
  else if (family === "newton") drawNewtonEvidence(ctx, type, evidence, revealed);
  else if (family === "resonance") drawResonanceEvidence(ctx, type, evidence, revealed);
  else if (family === "emwave") drawEMWaveEvidence(ctx, type, evidence, revealed);
  else if (family === "quantum") drawQuantumEvidence(ctx, type, evidence, revealed);
  else drawNuclearEvidence(ctx, type, evidence, revealed);
}

function evidenceCaption(ctx, text, color = "#a1fff5") {
  const size = canvasFontSize(text, 20, true);
  const maxWidth = 730;
  const parts = String(text).split(/(?<=[；｜。])/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const part of parts.length ? parts : [String(text)]) {
    const candidate = current + part;
    ctx.font = `800 ${size}px system-ui`;
    if (current && ctx.measureText?.(candidate).width > maxWidth) {
      lines.push(current);
      current = part;
    } else current = candidate;
  }
  if (current) lines.push(current);
  if (lines.length === 1 && ctx.measureText?.(lines[0]).width > maxWidth) {
    const midpoint = Math.ceil(lines[0].length / 2);
    lines.splice(0, 1, lines[0].slice(0, midpoint), lines[0].slice(midpoint));
  }
  lines.slice(0, 2).forEach((lineText, index) => label(ctx, lineText, 145, 486 + index * Math.min(size * 1.08, 48), color, 20));
}

function drawCart(ctx, x, y, color, width = 130) {
  ctx.fillStyle = color; ctx.fillRect(x, y, width, 58);
  dot(ctx, x + 28, y + 66, "#202a37", 15); dot(ctx, x + width - 28, y + 66, "#202a37", 15);
}

function drawMomentumEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  const calc = type.includes("calc");
  if(type.includes("impulse")) {
    drawCart(ctx, 370, 320, "#ff806b",180);
    const duration=calc?.25:domain.impulseFactor,forceLength=calc?150:125;
    forceArrow(ctx,550,348,550+forceLength,348,"#ffd36d",calc?"F = 120 N":"相同平均力 F");
    ctx.strokeStyle="#65ded2";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(250,210);ctx.lineTo(250+(calc?150:duration*120),210);ctx.stroke();
    label(ctx,calc?"Δt = 0.25 s":`作用時間 ${duration} 級`,250,185,"#a1fff5",18);
  } else if(type.includes("recoil")) {
    drawCart(ctx, 230, 315, "#7fa5c9",180);dot(ctx,680,290,"#d9c79d",26);
    const stoneLen=calc?170:90+Number(value)*28;arrow(ctx,680,290,680+stoneLen,290,"#ffd36d",calc?"石塊 p = 24":"石塊動量");
    const cartLen=stoneLen;arrow(ctx,320,300,320-cartLen,300,"#65ded2",calc?"人舟 p = −24":"人舟反向動量");
  } else if(type.includes("cushion")) {
    drawCart(ctx, 360, 240, "#ff806b",180);arrow(ctx,450,220,450,340,"#ffd36d","入射動量");
    const time=Math.max(1,Number(value)),padHeight=25+time*22,forceLength=190*domain.forceFactor;
    ctx.fillStyle="#6ce7a8";ctx.fillRect(300,400-padHeight,400,padHeight);label(ctx,"厚軟墊",455,440,"#bfffe0",18);
    forceArrow(ctx,450,385-padHeight,450,385-padHeight-forceLength,"#ff806b","平均撞擊力");
  } else {
    const stickLevel=!calc&&type.includes("stick")?Number(value):1,leftX=230+stickLevel*45,rightX=650-stickLevel*35;
    if(type.includes("stick")&&stickLevel>=3){drawCart(ctx,410,300,"#c68a79",230);label(ctx,"黏合＋形變",445,275,"#ffdc8b",18);ctx.fillStyle="#ff806b";ctx.fillRect(430,430,Math.min(190,50+stickLevel*45),20);label(ctx,"內能／聲音",430,475,"#ffb6ac",16);}else{drawCart(ctx,leftX,300,"#ff806b");drawCart(ctx,rightX,300,"#7fa5c9");}
    arrow(ctx,leftX+110,280,Math.min(leftX+270,500),280,"#ffd36d",calc?"p₁":"碰前動量");
    if(type.includes("stick")){ctx.strokeStyle="#dce6f2";ctx.lineWidth=4;ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(565,190);ctx.lineTo(565,440);ctx.stroke();ctx.setLineDash([]);if(calc||stickLevel>=3)arrow(ctx,620,390,750,390,"#65ded2","碰後共同速度");}
  }
  if (revealed) {
    if (type.includes("impulse")) evidenceCaption(ctx, calc ? "J = FΔt = 30 N·s" : "作用時間 ↑　動量改變 ↑");
    else if (type.includes("loss")) evidenceCaption(ctx,"K前 36 J → K後 24 J｜耗散 12 J");
    else if (type.includes("stick")) evidenceCaption(ctx,calc?"總動量守恆｜共同速度 4 m/s":"黏合：動量守恆，動能轉換");
    else evidenceCaption(ctx,"總動量：事件前 = 事件後");
  }
}

function drawEnergyEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if(type.includes("work")) {
    const theta=type.includes("calc")?60:Number(value),rad=theta*Math.PI/180,tailX=400,tailY=340,len=165;
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(180,400);ctx.lineTo(820,400);ctx.stroke();ctx.fillStyle="#ffbf5c";ctx.fillRect(345,300,110,80);
    arrow(ctx,tailX,420,tailX+250,420,"#ffd36d","位移 d");forceArrow(ctx,tailX,tailY,tailX+Math.cos(rad)*len,tailY-Math.sin(rad)*len,"#65ded2","力 F");
    label(ctx,`θ = ${theta}°`,470,360,"#ffdc8b",19);if(revealed)evidenceCaption(ctx,type.includes("calc")?"W = Fd cos60° = 75 J":theta===180?"力與位移反向：功為負":"W = Fd cosθ；功的正負由夾角決定");return;
  }
  if(type.includes("height")||type.includes("speed")) {
    const height=type.includes("calc")?5:Number(value),topY=390-Math.min(230,height*48);ctx.strokeStyle="#f3d69b";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(170,410);ctx.lineTo(760,410);ctx.stroke();ctx.fillStyle="#ffbf5c";ctx.fillRect(430,topY,95,78);
    ctx.strokeStyle="#ffd36d";ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(570,410);ctx.lineTo(570,topY+78);ctx.stroke();ctx.setLineDash([]);label(ctx,`h = ${height}`,590,(410+topY)/2,"#ffdc8b",18);
    if(revealed)evidenceCaption(ctx,type.includes("speed")?"mgh = ½mv²｜落下 5.0 m 得 v ≈ 9.9 m/s":type.includes("calc")?"ΔUg = mgh = 98 J":"質量與 g 固定：高度增加，重力位能增加");return;
  }
  if(type.includes("friction")) {
    const rough=type.includes("calc")?2:Number(value),loss=Math.min(.82,.08+rough*.18),total=230;
    drawCart(ctx,300,300,"#ffbf5c",150);arrow(ctx,450,285,450+200*(1-loss),285,"#ffd36d","v");forceArrow(ctx,300,365,300-(55+rough*28),365,"#ff806b","摩擦力");ctx.fillStyle="#69d8cb";ctx.fillRect(650,410,55,-total*(1-loss));ctx.fillStyle="#ff806b";ctx.fillRect(740,410,55,-total*loss);label(ctx,"機械能",635,450,"#dce6f2",16);label(ctx,"內能",740,450,"#dce6f2",16);label(ctx,`粗糙 ${rough}｜轉為內能 ${Math.round(loss*100)}%`,345,185,"#ffdc8b",18);if(revealed)evidenceCaption(ctx,"摩擦把機械能轉為物體與地面的內能；總能量仍守恆");return;
  }
  const time=type.includes("calc")?2:Number(value),powerRatio=type.includes("calc")?1:Math.min(1,domain.energyFactor),powerHeight=70+220*powerRatio;
  ctx.fillStyle="#69d8cb";ctx.fillRect(330,410,110,-220);ctx.fillStyle="#ffbf5c";ctx.fillRect(600,410,110,-powerHeight);label(ctx,"相同做功 W",340,455,"#dce6f2",18);label(ctx,`完成時間 ${time} s`,575,455,"#ffdc8b",18);label(ctx,`功率 ∝ 1/${time}`,610,380-powerHeight,"#a1fff5",18);if(revealed)evidenceCaption(ctx,type.includes("calc")?"P = mgh/t = 147 W":"做功相同：所需時間越短，平均功率越大");
}

function drawElectricEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if (type.includes("series") || type.includes("parallel")) {
    ctx.strokeStyle="#84a7ff";ctx.lineWidth=7;
    if(type.includes("parallel")) {
      ctx.beginPath();ctx.moveTo(210,180);ctx.lineTo(790,180);ctx.moveTo(210,410);ctx.lineTo(790,410);ctx.moveTo(210,180);ctx.lineTo(210,260);ctx.moveTo(210,330);ctx.lineTo(210,410);ctx.stroke();
      ctx.fillStyle="#ffbf5c";ctx.fillRect(190,260,40,70);label(ctx,"12 V",150,365,"#ffdc8b",18);
      const branchCount=type.includes("calc")?2:Math.max(1,Math.min(3,domain.branchCount)),xs=branchCount===1?[500]:branchCount===2?[390,610]:[330,500,670];
      xs.forEach((x,index)=>{ctx.strokeStyle="#84a7ff";ctx.beginPath();ctx.moveTo(x,180);ctx.lineTo(x,245);ctx.moveTo(x,335);ctx.lineTo(x,410);ctx.stroke();ctx.fillStyle="#b99cff";ctx.fillRect(x-30,245,60,90);label(ctx,type.includes("calc")?(index?"3 Ω":"6 Ω"):"R",x-24,300,"white",16);});
      if(!type.includes("calc")){forceArrow(ctx,210,225,210,225-(55+branchCount*30),"#65ded2","I總");label(ctx,`${branchCount} 支路`,455,150,"#a1fff5",18);}
      if(revealed)evidenceCaption(ctx,type.includes("calc")?"並聯：Req = 2 Ω｜I總 = 6 A":"支路增加 → 等效電阻下降 → 電池總電流上升");
    } else {
      ctx.beginPath();ctx.rect(210,190,580,210);ctx.stroke();ctx.fillStyle="#ffbf5c";ctx.fillRect(190,260,40,70);label(ctx,"12 V",150,365,"#ffdc8b",18);
      const bulbCount=type.includes("calc")?2:Math.max(1,Math.min(2,Math.round(Number(value)))),bulbXs=bulbCount===1?[465]:[330,600];
      bulbXs.forEach((x,index)=>{ctx.fillStyle="#b99cff";ctx.fillRect(x,170,90,40);label(ctx,type.includes("calc")?(index?"6 Ω":"4 Ω"):"燈泡",x+12,197,"white",16);forceArrow(ctx,x+18,190,x+68,190,"#65ded2","I");});
      if(revealed)evidenceCaption(ctx,type.includes("calc")?"串聯：R總 = 10 Ω｜I = 1.2 A":"單一路徑：穩定時每個元件中的電流相同");
    }
    return;
  }
  if(type.includes("field")) {
    const cx=500,cy=300;dot(ctx,cx,cy,"#ff806b",42);label(ctx,"+",484,315,"white",40);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,tx=cx+Math.cos(a)*72,ty=cy+Math.sin(a)*72;arrow(ctx,tx,ty,cx+Math.cos(a)*180,cy+Math.sin(a)*180,"#84a7ff","");}
    if(!type.includes("calc")){const distance=Math.max(1,Number(value)),testX=cx+80+distance*55,forceLen=Math.max(18,115*domain.fieldFactor);dot(ctx,testX,300,"#ffdc8b",13);forceArrow(ctx,testX,300,testX+forceLen,300,"#65ded2","F/q");label(ctx,`r = ${distance} 格`,testX-30,355,"#ffdc8b",17);}
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"正電荷外 0.30 m：E = 4.0×10⁵ N/C，方向向外":"正試驗電荷受力方向定義為電場方向；正電荷的場向外");
    return;
  }
  const leftX=330,rightX=680,rightPositive=type.includes("force")||domain.chargeSign>0;
  dot(ctx,leftX,300,"#ff806b",42);label(ctx,"+",314,315,"white",40);dot(ctx,rightX,300,rightPositive?"#ff806b":"#84a7ff",42);label(ctx,rightPositive?"+":"−",664,315,"white",40);
  if(rightPositive){forceArrow(ctx,leftX,300,leftX-115,300,"#84a7ff","");forceArrow(ctx,rightX,300,rightX+115,300,"#84a7ff","");}
  else{forceArrow(ctx,leftX,300,leftX+115,300,"#84a7ff","");forceArrow(ctx,rightX,300,rightX-115,300,"#84a7ff","");}
  if(revealed)evidenceCaption(ctx,type.includes("force")?"同號電荷：兩力等大反向，大小 0.60 N":"兩力箭尾各在受力電荷上：同號相斥、異號相吸");
}

function drawMagneticEvidence(ctx, type, evidence, revealed) {
  const value = evidence.domainEvidence.observable.controlValue;
  const observed=evidence.observed;
  if (type.includes("poles")) {
    ctx.fillStyle="#ff806b";ctx.fillRect(220,260,220,90);ctx.fillStyle=Number(value)===2?"#ff806b":"#84a7ff";ctx.fillRect(560,260,220,90);label(ctx,"N",370,317,"white",30);label(ctx,Number(value)===2?"N":"S",580,317,"white",30);
    if(observed&&Number(value)===2){forceArrow(ctx,440,305,335,305,"#65ded2","");forceArrow(ctx,560,305,665,305,"#65ded2","");}
    else if(observed){forceArrow(ctx,440,305,500,305,"#65ded2","");forceArrow(ctx,560,305,500,305,"#65ded2","");}
    if(revealed)evidenceCaption(ctx,"箭尾在各磁柱受力處：同名磁極相斥、異名相吸");
    return;
  }
  if(type.includes("induction")||type.includes("emf")) {
    const speed=type.includes("calc")?3:Math.max(1,Number(value)),speedLength=65+speed*35;
    ctx.fillStyle="#ff806b";ctx.fillRect(180,250,150,100);label(ctx,"N",270,315,"white",28);if(observed)arrow(ctx,330,300,330+speedLength,300,"#ffd36d","磁石速度");
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=8;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(650,300,60+i*16,130,0,0,Math.PI*2);ctx.stroke();}
    if(observed&&!type.includes("calc")){ctx.fillStyle="#65ded2";ctx.fillRect(805,430,30,-speed*55);label(ctx,"感應電動勢",735,465,"#a1fff5",16);}
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"|ε| = N|ΔΦ|/Δt = 12 V":"相同磁通改變量用時越短，感應電動勢越大");
    return;
  }
  for(let y=170;y<=420;y+=55) for(let x=210;x<=790;x+=65) label(ctx,"×",x,y,"rgba(105,219,203,.65)",25);
  if (type.includes("wire")) {
    const direction=type.includes("calc")?1:Number(value),tailX=direction>=0?280:720,headX=direction>=0?720:280,forceUp=direction>=0;
    ctx.strokeStyle="#ffd36d";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(250,330);ctx.lineTo(750,330);ctx.stroke();arrow(ctx,tailX,330,headX,330,"#ffd36d","I");if(observed)forceArrow(ctx,500,330,500,forceUp?185:455,"#ff806b","F");
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"F = BIL = 0.60 N；箭尾在導線受力處":"I 反向時，I L×B 的方向也反向");
    return;
  }
  const px=300,py=360,answerKey=type.includes("radius")?"radius":"force",entered=evidence.values[answerKey],domain=evidence.magnetic,domainRadius=domain?.trajectory.radius,forceMagnitude=domain?.force,forceLength=Math.max(45,Math.min(160,type.includes("calc")?forceMagnitude*3000:forceMagnitude*10));dot(ctx,px,py,"#ffdc8b",15);arrow(ctx,px,py,px+170,py,"#ffbf5c","v");if(observed)forceArrow(ctx,px,py,px,domain?.trajectory.direction==="down"?py+forceLength:py-forceLength,"#ff806b","F_B");
  if(observed){const radiusPx=Math.max(90,Math.min(900,domainRadius*(type.includes("radius")?90:210)));ctx.strokeStyle="#73c8ff";ctx.lineWidth=7;ctx.beginPath();ctx.arc(px,domain?.trajectory.direction==="down"?py+radiusPx:py-radiusPx,radiusPx,domain?.trajectory.direction==="down"?-Math.PI/2:Math.PI/2,domain?.trajectory.direction==="down"?-.05:.05,domain?.trajectory.direction==="up");ctx.stroke();}
  if(revealed)evidenceCaption(ctx,type.includes("radius")?"磁力始終垂直速度並指向圓心：r = 3.0 m":type.includes("calc")?"q>0、v 向右、B 入紙面：F_B 向上，大小 0.030 N":"q>0、v 向右、B 入紙面：由 v×B 得磁力向上");
}

function drawOpticsEvidence(ctx, type, evidence, revealed) {
  const value = evidence.domainEvidence.observable.controlValue;
  const observed=evidence.observed;
  const interfaceY=315,normalX=500;
  const surface=()=>{ctx.strokeStyle="#d8e6f5";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(150,interfaceY);ctx.lineTo(850,interfaceY);ctx.stroke();ctx.setLineDash([10,8]);ctx.strokeStyle="#b8c5d5";ctx.beginPath();ctx.moveTo(normalX,135);ctx.lineTo(normalX,470);ctx.stroke();ctx.setLineDash([]);label(ctx,"法線",515,155,"#dce6f2",16);};
  if(type.includes("lens")||type.includes("magnify")) {
    const projection=evidence.domainEvidence.observable.opticsProjection;
    if(!projection)throw new Error("lens renderer requires domainEvidence.observable.opticsProjection");
    const lensX=500,axisY=315,scale=9,f=projection.focalLength*scale,objectDistance=projection.objectDistance,objectX=objectDistance==="infinite_distance"?170:lensX-objectDistance*scale,objectTop=205,parallelism=type==="optics-lens"?Number(value):1,spread=type==="optics-lens"?(3-parallelism)*18:0,imageX=lensX+projection.imageDistance*scale,imageY=axisY-(axisY-objectTop)*projection.magnification;
    ctx.strokeStyle="rgba(220,230,242,.5)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(140,axisY);ctx.lineTo(860,axisY);ctx.stroke();
    ctx.strokeStyle="#b99cff";ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(lensX,axisY,38,150,0,0,Math.PI*2);ctx.stroke();dot(ctx,lensX-f,axisY,"#ffdc8b",8);dot(ctx,lensX+f,axisY,"#ffdc8b",8);label(ctx,"F",lensX+f-6,axisY+35,"#ffdc8b",16);
    if(type!=="optics-lens")arrow(ctx,objectX,axisY,objectX,objectTop,"#ff806b","物體");
    if(observed&&projection.mode==="image"){arrow(ctx,objectX,objectTop,lensX,objectTop,"#ffd36d","");arrow(ctx,lensX,objectTop,imageX,imageY,"#ffd36d","");arrow(ctx,objectX,objectTop,lensX,axisY,"#65ded2","");arrow(ctx,lensX,axisY,imageX,imageY,"#65ded2","");arrow(ctx,imageX,axisY,imageX,imageY,"#ff806b","物理光路交會");if(Number.isFinite(evidence.optics.studentImageDistance)){const studentX=lensX+evidence.optics.studentImageDistance*scale;ctx.strokeStyle="#ff8f86";ctx.lineWidth=4;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(studentX,190);ctx.lineTo(studentX,430);ctx.stroke();ctx.setLineDash([]);label(ctx,"你刻的位置",studentX-45,180,"#ffb6ac",16);}}
    else if(observed&&projection.mode==="focus"){
      for(const offset of [-70,0,70]){const entryY=axisY+offset,entryStartY=entryY+spread*(offset/70||0);arrow(ctx,170,entryStartY,lensX,entryY,"#ffd36d","");arrow(ctx,lensX,entryY,imageX,axisY,"#65ded2","");}
      dot(ctx,imageX,axisY,"#ffdc8b",11);label(ctx,`平行度 ${parallelism} 級`,205,455,"#a1fff5",18);
    }
    if(revealed)evidenceCaption(ctx,physics.describeOpticsProjection(projection));return;
  }
  surface();
  const calc=type.includes("calc"),optics=evidence.optics,incidence=optics?.incidence ?? (type.includes("refraction")?45:Number(value));
  const theta1=Math.max(12,Math.min(75,incidence))*Math.PI/180,rayLen=235;
  arrow(ctx,normalX-Math.sin(theta1)*rayLen,interfaceY-Math.cos(theta1)*rayLen,normalX,interfaceY,"#ffbf5c","入射光");
  if(type.includes("reflection")) {
    if(observed)arrow(ctx,normalX,interfaceY,normalX+Math.sin(theta1)*rayLen,interfaceY-Math.cos(theta1)*rayLen,"#84a7ff","反射光");
    if(revealed)evidenceCaption(ctx,calc?"反射角等於入射角：30°":"角度都由法線量起；θr = θi");return;
  }
  const tir=type.includes("tir")||type.includes("critical");
  if(tir) {
    const critical=optics?.critical ?? physics.criticalAngle(1.5,1),isCritical=calc,isTir=!calc&&incidence>critical;
    if(observed&&isTir) arrow(ctx,normalX,interfaceY,normalX+Math.sin(theta1)*rayLen,interfaceY-Math.cos(theta1)*rayLen,"#84a7ff","全反射");
    else if(observed&&isCritical) arrow(ctx,normalX,interfaceY,820,interfaceY,"#84a7ff","臨界折射光");
    else if(observed) arrow(ctx,normalX,interfaceY,normalX+Math.sin(Math.asin(1.5*Math.sin(theta1)))*190,interfaceY+Math.cos(Math.asin(1.5*Math.sin(theta1)))*190,"#84a7ff","折射光");
    if(observed && isCritical && Number.isFinite(optics.studentAngle) && Math.abs(optics.studentAngle-critical)>.2){
      const studentTheta=Math.max(8,Math.min(82,optics.studentAngle))*Math.PI/180;
      ctx.save();ctx.setLineDash([10,8]);arrow(ctx,normalX-Math.sin(studentTheta)*rayLen,interfaceY-Math.cos(studentTheta)*rayLen,normalX,interfaceY,"#ff8f86","你刻的 θc");ctx.restore();
    }
    if(revealed)evidenceCaption(ctx,isCritical?"θc = sin⁻¹(1/1.5) ≈ 41.8°；折射角為 90°":"由高 n 射向低 n 且 θi > θc：只剩反射光");return;
  }
  const n2=calc?1.5:Number(value),theta2=(optics?.refraction ?? physics.snellAngle(1,n2,incidence))*Math.PI/180;
  if(observed)arrow(ctx,normalX,interfaceY,normalX+Math.sin(theta2)*rayLen,interfaceY+Math.cos(theta2)*rayLen,"#84a7ff","折射光");
  if(observed && calc && Number.isFinite(optics.studentRefraction) && Math.abs(optics.studentRefraction-(optics.refraction ?? 0))>.2){const studentTheta=Math.max(5,Math.min(85,optics.studentRefraction))*Math.PI/180;ctx.save();ctx.setLineDash([10,8]);arrow(ctx,normalX,interfaceY,normalX+Math.sin(studentTheta)*rayLen,interfaceY+Math.cos(studentTheta)*rayLen,"#ff8f86","你刻的角度");ctx.restore();}
  if(revealed)evidenceCaption(ctx,calc?"sinθ₂ = sin30°/1.5 → θ₂ ≈ 19.5°":"進入較高折射率介質：折射角變小、光線偏向法線");
}

function drawThermalEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if(type.includes("flow")){
    const fraction=Math.max(0,Math.min(1,Number(value)/5)),hotT=Math.round(80-30*fraction),coldT=Math.round(20+30*fraction),difference=hotT-coldT;
    ctx.strokeStyle="#d4dce8";ctx.lineWidth=6;ctx.strokeRect(180,190,260,210);ctx.strokeRect(560,190,260,210);
    for(let i=0;i<12;i++){dot(ctx,220+(i%4)*55,230+Math.floor(i/4)*60,`rgb(255,${Math.round(110+fraction*80)},${Math.round(95+fraction*90)})`,7+hotT/22);dot(ctx,600+(i%4)*55,230+Math.floor(i/4)*60,`rgb(${Math.round(100+fraction*120)},${Math.round(150+fraction*45)},255)`,7+coldT/25);}
    label(ctx,`熱石 ${hotT}°`,245,445,"#ffb6ac",18);label(ctx,`冷石 ${coldT}°`,630,445,"#b7ccff",18);if(difference>0)arrow(ctx,445,295,445+Math.max(35,difference*1.8),295,"#ffdc8b","淨熱流");
  } else if(type.includes("capacity")){
    const capacity=Math.max(1,Number(value)),deltaA=100,deltaB=Math.round(100/capacity),baseY=410;
    ctx.fillStyle="#ff806b";ctx.fillRect(290,baseY,100,-40-deltaA*1.6);ctx.fillStyle="#84a7ff";ctx.fillRect(610,baseY,100,-40-deltaB*1.6);label(ctx,"A：C = 1",290,455,"#ffb6ac",17);label(ctx,`B：C = ${capacity}`,605,455,"#b7ccff",17);label(ctx,`ΔT_A = ${deltaA}`,275,185,"#ffb6ac",18);label(ctx,`ΔT_B = ${deltaB}`,600,185,"#b7ccff",18);
  } else if(type.includes("gas")){
    const temp=Math.max(1,Number(value)),speed=28*Math.sqrt(domain.pressureFactor),pressure=domain.pressureFactor;
    ctx.strokeStyle="#d4dce8";ctx.lineWidth=6;ctx.strokeRect(250,170,500,260);for(let i=0;i<18;i++){const x=285+(i%6)*82,y=215+Math.floor(i/6)*88;dot(ctx,x,y,"#84a7ff",8);arrow(ctx,x,y,x+speed*((i%3)-1),y+speed*(i%2?-.7:.7),"rgba(255,220,139,.75)","");}label(ctx,`T = ${temp} K`,300,465,"#a1fff5",19);label(ctx,`P/P₀ = ${pressure.toFixed(1)}`,590,465,"#ffdc8b",19);
  } else if(type.includes("compress")){
    const compression=Math.max(1,Number(value)),pistonY=150+compression*48,gasTop=pistonY+24;
    ctx.strokeStyle="#d4dce8";ctx.lineWidth=6;ctx.strokeRect(250,140,500,300);ctx.fillStyle="#ffbf5c";ctx.fillRect(240,pistonY,520,28);arrow(ctx,500,115,500,pistonY-10,"#ffbf5c","外界做功");for(let i=0;i<20;i++){const x=285+(i%5)*105,y=gasTop+12+Math.floor(i/5)*Math.max(8,(410-gasTop)/4);dot(ctx,x,y,"#ff806b",7+compression*.8);}label(ctx,`壓縮 ${compression} 級｜溫度 ↑`,355,475,"#ffb6ac",19);
  } else {
    ctx.strokeStyle="#d4dce8";ctx.lineWidth=6;ctx.strokeRect(250,170,500,260);for(let i=0;i<24;i++){const x=285+(i%8)*60,y=210+Math.floor(i/8)*75;dot(ctx,x,y,i<12?"#ff806b":"#84a7ff",7);}
  }
  if (revealed) evidenceCaption(ctx,type.includes("flow")?"熱由高溫物體傳向低溫物體，直到熱平衡":type.includes("capacity")?"相同吸熱量 Q：熱容量較小者 ΔT 較大":type.includes("gas")?"定容：P ∝ 絕對溫度 T（使用 K）":type.includes("firstlaw")?"採 Wby 為氣體對外做功：ΔU = Q − Wby = 300 J":"能量帳目：熱、功與內能");
}

function drawCelestialEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if(type.includes("gravity")) {
    const calc=type.includes("calc"),ratio=calc?1:domain.radiusFactor,leftX=calc?320:500-95*ratio,rightX=calc?680:500+95*ratio,len=calc?100:Math.max(28,150*domain.gravityFactor);
    dot(ctx,leftX,300,"#ffbf5c",46);dot(ctx,rightX,300,"#91a8ff",34);forceArrow(ctx,leftX,300,leftX+len,300,"#ff806b","Fg");forceArrow(ctx,rightX,300,rightX-len,300,"#ff806b","Fg");
    if(revealed)evidenceCaption(ctx,calc?"萬有引力大小 3.34×10⁻⁷ N；兩物體受力等大反向":"距離增為 2 倍：同一比例尺下，引力箭長變為 1/4");return;
  }
  if(type.includes("weight")) {
    const g=Number(value),groundY=390;ctx.fillStyle=g<5?"#8a93aa":"#527ec7";ctx.beginPath();ctx.arc(500,560,230,Math.PI,Math.PI*2);ctx.fill();dot(ctx,500,250,"#d9c79d",34);forceArrow(ctx,500,250,500,250+g*18,"#ff806b","重力 mg");label(ctx,g<5?"月球 g ≈ 1.6 N/kg":"地球 g ≈ 9.8 N/kg",395,445,"#dce6f2",18);if(revealed)evidenceCaption(ctx,"質量不變；月球表面重量約為地球的 1/6");return;
  }
  const cx=500,cy=300,calc=type.includes("calc"),radius=type.includes("kepler")?230:type.includes("period")?100+Number(value)*28:185;
  dot(ctx,cx,cy,"#ffbf5c",55);ctx.strokeStyle="rgba(145,168,255,.7)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
  const quadrant=!calc&&type.includes("circular")?Number(value):1,a=(quadrant-1)*Math.PI/2,sx=cx+radius*Math.cos(a),sy=cy-radius*Math.sin(a);dot(ctx,sx,sy,"#91a8ff",20);
  const radialX=(cx-sx)/radius,radialY=(cy-sy)/radius,orbitScale=!calc&&type.includes("period")?Math.max(1,domain.radiusFactor):1,velocityLength=120*(type.includes("period")?domain.orbitalSpeedFactor:1),forceLength=125/(orbitScale*orbitScale);
  const tangentX=Math.sin(a),tangentY=Math.cos(a);arrow(ctx,sx,sy,sx+tangentX*velocityLength,sy-tangentY*velocityLength,"#65ded2","v");forceArrow(ctx,sx,sy,sx+radialX*Math.max(32,forceLength),sy+radialY*Math.max(32,forceLength),"#ff806b","Fg / a");
  if(revealed&&type.includes("period"))label(ctx,"半徑增大：軌道速率與引力同步下降",295,485,"#a1fff5",18);
  if(revealed)evidenceCaption(ctx,type.includes("kepler")?"T² ∝ r³：半徑 4 倍，週期 8 倍":type.includes("speed")?"GMm/r² = mv²/r → v ≈ 7.9 km/s":type.includes("calc-period")?"T = 2πr/v ≈ 5.83×10³ s":"速度切向、引力與向心加速度都指向圓心");
}

function drawNewtonEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if (type.includes("incline")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(170,410);ctx.lineTo(760,185);ctx.stroke();
    ctx.save();ctx.translate(500,285);ctx.rotate(-.36);ctx.fillStyle="#73c8ff";ctx.fillRect(-55,-40,110,80);ctx.restore();
    forceArrow(ctx,500,285,500,445,"#ff806b","mg");forceArrow(ctx,500,285,355,340,"#65ded2","mg sinθ");forceArrow(ctx,500,285,445,140,"#8e8bff","N");
    if(revealed) evidenceCaption(ctx,"沿斜面向下的分量 mg sin30° 使 a = 4.9 m/s²");
    return;
  }
  if (type.includes("projectile")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(165,190);ctx.lineTo(165,430);ctx.lineTo(820,430);ctx.stroke();
    ctx.strokeStyle="#73c8ff";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(210,210);ctx.quadraticCurveTo(480,220,760,420);ctx.stroke();
    const time=type.includes("calc")?3:Math.max(1,Number(value)),fraction=Math.min(1,time/4),px=210+(760-210)*fraction,py=210+(420-210)*fraction*fraction;
    dot(ctx,px,py,"#ffdc8b",13);arrow(ctx,px,py,px+145*domain.horizontalVelocity,py,"#65ded2","vₓ");arrow(ctx,px,py,px,py+35+domain.verticalVelocityFactor*25,"#ff806b","vᵧ");forceArrow(ctx,px,py,px,py+65,"#ffd36d","mg");label(ctx,`t = ${time} 級`,390,175,"#a1fff5",18);
    if(revealed) evidenceCaption(ctx,type.includes("calc")?"t = 3 s｜水平距離 60 m":"水平等速・鉛直等加速｜共享同一時間");
    return;
  }
  drawCart(ctx,360,305,"#73c8ff",190);
  if(type.includes("inertia")) {
    const net=Math.max(0,Number(value));arrow(ctx,455,280,690,280,"#ffd36d","速度 v");if(net>0)forceArrow(ctx,550,332,550+50+net*35,332,"#65ded2","水平合力");else label(ctx,"ΣF = 0｜速度不會因此歸零",330,430,"#a1fff5",18);
  } else if(type.includes("friction") && !type.includes("calc")) {
    const len=75+Number(value)*24;forceArrow(ctx,550,332,550+len,332,"#65ded2","推力");forceArrow(ctx,360,385,360-len,385,"#ff806b","靜摩擦");
  } else if(type.includes("friction")) {
    forceArrow(ctx,550,332,700,332,"#65ded2","50 N");forceArrow(ctx,360,385,301,385,"#ff806b","19.6 N");
  } else if(type.includes("calc")) {
    forceArrow(ctx,550,332,746,332,"#65ded2","28 N");forceArrow(ctx,360,385,304,385,"#ff806b","8 N");
  } else {
    const netLength=55+Number(value)*36;forceArrow(ctx,455,332,455+netLength,332,"#65ded2","水平合力 ΣF");
  }
  if(revealed) evidenceCaption(ctx,type.includes("inertia")?"ΣF = 0｜速度向量保持不變":type.includes("friction")&&type.includes("calc")?"fk = μkmg｜a = 3.04 m/s²":type.includes("friction")?"未滑動：靜摩擦配合推力；滑動後 fk=μkN":type.includes("calc")?"ΣF = ma｜合力 20 N，加速度 4.0 m/s²":"加速度方向與合力相同");
}

function drawResonanceEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  const x0=165,x1=835,mid=300;
  ctx.strokeStyle="rgba(220,230,242,.5)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,mid);ctx.lineTo(x1,mid);ctx.stroke();
  if(type.includes("tube")) {
    const closed=type.includes("calc")||Number(value)>=2;ctx.strokeStyle="#dce6f2";ctx.lineWidth=10;ctx.beginPath();if(closed){ctx.moveTo(260,180);ctx.lineTo(260,400);}ctx.moveTo(260,400);ctx.lineTo(760,400);ctx.stroke();
    ctx.strokeStyle="#58e0d3";ctx.lineWidth=7;ctx.beginPath();if(closed){ctx.moveTo(260,300);ctx.bezierCurveTo(410,300,590,150,760,150);}else{ctx.moveTo(260,150);ctx.bezierCurveTo(410,300,610,300,760,150);}ctx.stroke();
    label(ctx,closed?"閉口：節":"開口：腹",220,440,closed?"#ffdc8b":"#a1fff5",18);label(ctx,"開口：腹",725,135,"#a1fff5",18);
    if(revealed) evidenceCaption(ctx,type.includes("calc")?"閉管基音：f₁ = v/(4L) = 200 Hz":"閉端為位移節點・開端為位移腹點");
    return;
  }
  const harmonics=type.includes("harmonic")?3:type.includes("pitch")?domain.harmonic:type.includes("standing")?2:type.includes("string")?1:type.includes("wave")?2:1;
  ctx.strokeStyle="#58e0d3";ctx.lineWidth=8;ctx.beginPath();
  for(let i=0;i<=240;i++){const t=i/240;const x=x0+(x1-x0)*t;const y=mid-120*Math.sin(harmonics*Math.PI*t);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  for(let n=0;n<=harmonics;n++) dot(ctx,x0+(x1-x0)*n/harmonics,mid,"#ffdc8b",9);
  if(type.includes("standing")){
    const position=Math.max(0,Math.min(4,Number(value))),t=position/4,probeX=x0+(x1-x0)*t,probeY=mid-120*Math.sin(2*Math.PI*t),amplitude=Math.abs(Math.sin(2*Math.PI*t));
    ctx.strokeStyle="rgba(255,220,139,.7)";ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(probeX,150);ctx.lineTo(probeX,440);ctx.stroke();ctx.setLineDash([]);dot(ctx,probeX,probeY,"#ff806b",13);label(ctx,amplitude<.08?"節點：振幅 0":`此處相對振幅 ${Math.round(amplitude*100)}%`,Math.min(probeX+15,620),180,"#ffdc8b",17);
  }
  if(type.includes("pitch")){label(ctx,`頻率等級 ${value}`,420,175,"#a1fff5",18);}
  if(type.includes("match")){
    graphAxes(ctx,220,445,560,240,"驅動頻率","振幅");ctx.strokeStyle="#b58cff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(230,430);ctx.bezierCurveTo(380,425,420,180,500,170);ctx.bezierCurveTo(580,180,620,425,770,430);ctx.stroke();dot(ctx,500,170,"#ffdc8b",10);label(ctx,"固有頻率",510,160,"#ffdc8b",16);
    const frequency=Math.max(1,Math.min(5,Number(value))),px=230+(frequency-1)*135,amplitude=domain.relativeAmplitude,py=430-amplitude*260;dot(ctx,px,py,"#ff806b",13);ctx.strokeStyle="rgba(255,128,107,.55)";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px,430);ctx.lineTo(px,py);ctx.stroke();label(ctx,`驅動 ${frequency} 級`,px-45,465,"#ffb6ac",16);
  }
  if(revealed) evidenceCaption(ctx,type.includes("pitch")?"頻率增加：相同時間內振動次數增加，音高上升":type.includes("match")?"驅動頻率接近固有頻率時，穩態振幅達到峰值":type.includes("harmonic")?"第三諧波：f₃ = 3f₁ = 600 Hz":type.includes("string")?"兩端固定基音：f₁ = v/(2L) = 200 Hz":type.includes("calc")?"v = fλ｜波長 0.80 m":"節點不動・腹點振幅最大");
}

function drawEMWaveEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if(type.includes("transformer")||type.includes("voltage")||type.includes("current")) {
    ctx.fillStyle="#695f58";ctx.fillRect(430,170,140,250);
    const foundation=type === "emwave-transformer",primaryTurns=foundation?4:6,secondaryTurns=foundation?Math.max(3,2+Number(value)*2):3;
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=8;
    for(let i=0;i<primaryTurns;i++){ctx.beginPath();ctx.arc(380,205+i*(190/Math.max(1,primaryTurns-1)),45,-Math.PI/2,Math.PI/2);ctx.stroke();}
    ctx.strokeStyle="#58e0d3";
    for(let i=0;i<secondaryTurns;i++){ctx.beginPath();ctx.arc(620,205+i*(190/Math.max(1,secondaryTurns-1)),45,Math.PI/2,Math.PI*1.5);ctx.stroke();}
    label(ctx,"初級",300,455,"#dce6f2",18);label(ctx,"次級",630,455,"#dce6f2",18);
    if(revealed) evidenceCaption(ctx,foundation?"次級匝數多於初級：|Vs|>|Vp|（理想變壓器）":type.includes("current")?"理想功率守恆：120 V×1 A = 24 V×5 A":"電壓比 = 匝數比｜1000:200 → 120:24");
    return;
  }
  if(type.includes("generator")||type.includes("faraday")) {
    const speed=type.includes("calc")?3:Math.max(0,Number(value));
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=10;ctx.strokeRect(350,190,300,220);
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=5;for(let x=190;x<=810;x+=70)arrow(ctx,x,405,x,185,"#8e8bff","");
    ctx.strokeStyle="#58e0d3";ctx.lineWidth=7;ctx.beginPath();ctx.arc(500,300,105,-2.3,.35);ctx.stroke();arrow(ctx,596,336,610+speed*14,300,"#58e0d3","旋轉");
    if(!type.includes("calc")){label(ctx,`轉速等級 ${value}`,385,455,"#a1fff5",17);ctx.fillStyle="#ffbf5c";ctx.fillRect(780,430,30,-Math.max(5,speed*55));label(ctx,"ε",790,465,"#ffdc8b",18);}
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"|ε| = N|ΔΦ|/Δt = 30 V":"磁通量改變越快，感應電動勢越大");
    return;
  }
  const start=150,end=850,cy=300;
  if(type.includes("polarization")) {
    const angle=Number(value)*Math.PI/180,amp=domain.polarizedIntensity;ctx.strokeStyle="#b58cff";ctx.lineWidth=10;ctx.beginPath();ctx.arc(350,300,105,0,Math.PI*2);ctx.arc(650,300,105,0,Math.PI*2);ctx.stroke();
    arrow(ctx,350-Math.cos(angle)*75,300+Math.sin(angle)*75,350+Math.cos(angle)*75,300-Math.sin(angle)*75,"#ffdc8b","偏振軸");ctx.fillStyle="#58e0d3";ctx.fillRect(700,405,Math.max(4,amp*150),28);label(ctx,`I/I₀ = cos²${value}°`,650,460,"#a1fff5",18);if(revealed)evidenceCaption(ctx,"兩偏振軸互相垂直時，理想透射強度降為 0");return;
  }
  ctx.strokeStyle="#8e8bff";ctx.lineWidth=7;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180,x=start+(end-start)*t,y=cy-100*Math.sin(t*Math.PI*4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  ctx.strokeStyle="#58e0d3";ctx.lineWidth=5;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180,x=start+(end-start)*t,y=cy-75*Math.cos(t*Math.PI*4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  arrow(ctx,250,440,760,440,"#ffdc8b","傳播方向");
  if(type.includes("ac")){const phase=Math.max(0,Math.min(4,Number(value))),current=Math.cos(phase*Math.PI/4),currentLength=Math.max(12,115*Math.abs(current));label(ctx,`半週相位 ${phase}/4`,400,180,"#a1fff5",18);arrow(ctx,500,300,500,300-currentLength*Math.sign(current||1),"#ff806b","瞬時電流");}
  if(revealed)evidenceCaption(ctx,type.includes("wavelength")?"f = 100 MHz：λ = c/f = 3.0 m":"交流電流每半週反向；電磁波的 E、B 與傳播方向互相垂直");
}

function drawQuantumEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  if(type.includes("electron")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=8;ctx.strokeRect(180,185,640,235);
    ctx.fillStyle="#8e8bff";ctx.fillRect(215,220,22,165);ctx.fillStyle="#ff806b";ctx.fillRect(763,220,22,165);
    label(ctx,"陰極 −",190,165,"#d8c8ff",18);label(ctx,"陽極 +",735,165,"#ffb6ac",18);
    const bend=domain.deflectionFactor*30;ctx.strokeStyle="#73c8ff";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(240,305);ctx.quadraticCurveTo(500,305-bend,755,305-bend);ctx.stroke();
    arrow(ctx,470,305-bend*.55,650,305-bend,"#73c8ff","電子速度");forceArrow(ctx,500,305-bend*.7,500,245-bend*.7,"#ff806b","電力 qE");
    if(revealed)evidenceCaption(ctx,"箭尾在電子受力位置；帶負電電子的受力方向與電場方向相反");
    return;
  }
  if(type.includes("charge")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(210,165);ctx.lineTo(790,165);ctx.moveTo(210,420);ctx.lineTo(790,420);ctx.stroke();
    label(ctx,"＋極板",215,145,"#ffb6ac",18);label(ctx,"−極板",215,455,"#d8c8ff",18);
    const charges=[1,2,3,4],selected=type.includes("calc")?0:Math.max(1,Math.min(4,Math.round(Number(value))));
    charges.forEach((n,i)=>{const x=300+i*135,y=230+(i%2)*90,active=i+1===selected;dot(ctx,x,y,active?"#55e2db":"#ffdc8b",active?25:18);label(ctx,`${n}e`,x-16,y+45,active?"#a1fff5":"#dce6f2",17);if(active)label(ctx,`第 ${selected} 顆`,x-28,y-38,"#a1fff5",16);});
    if(revealed)evidenceCaption(ctx,"所有油滴電量皆為 e 的整數倍：q = ne");
    return;
  }
  if(type.includes("matter")) {
    arrow(ctx,180,300,810,300,"#73c8ff","粒子動量 p");
    ctx.strokeStyle="#b58cff";ctx.lineWidth=7;ctx.beginPath();
    for(let i=0;i<=180;i++){const t=i/180,x=180+630*t,y=300-82*Math.sin(t*Math.PI*8);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    if(revealed)evidenceCaption(ctx,"德布羅意物質波：λ = h/p = 0.100 nm");
    return;
  }
  if(type.includes("xray")) {
    graphAxes(ctx,190,425,620,245,"λ","X 光強度");
    ctx.strokeStyle="#b58cff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(300,425);ctx.lineTo(300,365);ctx.bezierCurveTo(385,180,600,245,790,360);ctx.stroke();
    ctx.setLineDash([10,8]);ctx.strokeStyle="#ffdc8b";ctx.beginPath();ctx.moveTo(300,425);ctx.lineTo(300,170);ctx.stroke();ctx.setLineDash([]);label(ctx,"λmin",270,455,"#ffdc8b",18);
    if(revealed)evidenceCaption(ctx,"12.4 keV 電子束 → 最短波長 0.100 nm");
    return;
  }
  const levels=[410,335,260,185];
  ctx.strokeStyle="rgba(181,140,255,.78)";ctx.lineWidth=6;levels.forEach((y,i)=>{ctx.beginPath();ctx.moveTo(235,y);ctx.lineTo(765,y);ctx.stroke();label(ctx,`n=${i+1}`,780,y+6,"#d8c8ff",16);});
  if(type.includes("atom")) {
    const generation=type.includes("calc")?3:Math.max(1,Math.min(3,Math.round(Number(value))));dot(ctx,500,300,"#ff7396",30);
    if(generation===1){ctx.strokeStyle="#b58cff";ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(500,300,190,80,-.3,0,Math.PI*2);ctx.stroke();dot(ctx,680,245,"#73c8ff",12);label(ctx,"第 1 代：核式模型",370,150,"#ffdc8b",18);}
    else if(generation===2){for(const r of [85,145,205]){ctx.strokeStyle="rgba(181,140,255,.65)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(500,300,r,0,Math.PI*2);ctx.stroke();}dot(ctx,645,300,"#73c8ff",12);label(ctx,"第 2 代：量子化能階",345,150,"#ffdc8b",18);}
    else{for(let i=0;i<70;i++){const a=i*2.4,r=45+(i%9)*13;dot(ctx,500+Math.cos(a)*r,300+Math.sin(a)*r*.62,"rgba(181,140,255,.32)",5);}label(ctx,"第 3 代：機率分布",365,150,"#a1fff5",18);}
  } else if(type.includes("spectrum")) {
    dot(ctx,500,levels[2],"#73c8ff",13);arrow(ctx,500,levels[2],500,levels[1],"#ffdc8b","放出光子 ΔE₃₂");
  } else {
    const n=Math.max(1,Math.min(4,Math.round(Number(value))));dot(ctx,500,levels[n-1],"#73c8ff",13);label(ctx,`能量份額：n = ${n}`,365,150,"#a1fff5",18);
  }
  if(revealed)evidenceCaption(ctx,type.includes("spectrum")?"n=3 → 2｜1.89 eV｜656 nm":type.includes("atom")?"現代原子：離散能階 + 機率分布":"能量以 hf 的離散份額交換");
}

function drawNuclearEvidence(ctx, type, evidence, revealed) {
  const domain = evidence.domainEvidence.observable;
  const value = domain.controlValue;
  const cx=500,cy=290,foundation=!type.includes("calc");
  if(type.includes("core")&&foundation){
    const spacing=Math.max(1,Number(value)),points=[];for(let i=0;i<12;i++){const a=i*2.4,r=(18+(i%4)*22)*spacing*.72;points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}
    ctx.strokeStyle=`rgba(85,226,219,${Math.max(.12,1-spacing*.22)})`;ctx.lineWidth=Math.max(2,8-spacing*1.5);for(let i=0;i<points.length-1;i++){ctx.beginPath();ctx.moveTo(...points[i]);ctx.lineTo(...points[i+1]);ctx.stroke();}points.forEach((p,i)=>dot(ctx,p[0],p[1],i%2?"#ff7396":"#73c8ff",15));label(ctx,`核子間距 ${spacing} 級｜強作用是短程力`,300,460,"#a1fff5",18);
    if(revealed)evidenceCaption(ctx,"核子尺度由強作用提供束縛；距離拉開後作用迅速減弱");return;
  } else {
    for(let i=0;i<18;i++){const a=i*2.4,r=18+(i%4)*22;dot(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r,i%2?"#ff7396":"#73c8ff",15);}
  }
  if(type.includes("alpha")) {
    arrow(ctx,585,270,800,200,"#ff7396","α 粒子（⁴₂He）");
  } else if(type.includes("beta")) {
    arrow(ctx,585,285,810,260,"#73c8ff","β⁻ 電子");arrow(ctx,585,315,790,390,"#ffdc8b","反微中子");
  } else if(type.includes("radiation")) {
    const decay=Math.max(1,Math.min(3,Math.round(Number(value))));if(decay===1)arrow(ctx,585,260,800,190,"#ff7396","α：A−4、Z−2");if(decay===2)arrow(ctx,585,300,810,300,"#73c8ff","β⁻：A不變、Z+1");if(decay===3)arrow(ctx,580,335,790,410,"#ffdc8b","γ：只降低能量");label(ctx,["","α 衰變","β⁻ 衰變","γ 衰變"][decay],390,150,"#a1fff5",19);
  } else if(type.includes("half")) {
    const initial=type.includes("calc")?800:Math.max(1,Number(value))*100;graphAxes(ctx,580,430,280,230,"t","N");ctx.strokeStyle="#b58cff";ctx.lineWidth=7;ctx.beginPath();for(let i=0;i<=80;i++){const t=i/80*3,x=600+t*80,y=410-210*Math.pow(.5,t);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();label(ctx,`N₀=${initial} → 一個半衰期後 ${initial/2}`,560,475,"#d8c8ff",19);
  } else if(type.includes("forces")&&foundation){
    const phenomenon=Math.max(1,Math.min(4,Math.round(Number(value)))),names=["","天體軌道：重力","電荷與光：電磁作用","核子束縛：強作用","β 衰變：弱作用"];
    ctx.fillStyle=["","#91a8ff","#ffbf5c","#55e2db","#b58cff"][phenomenon];ctx.fillRect(275,205,450,165);label(ctx,names[phenomenon],325,300,"#071018",24);label(ctx,`現象 ${phenomenon}/4`,430,420,"#a1fff5",18);
  } else {
    for(let r=120;r<=210;r+=45){ctx.strokeStyle=`rgba(181,140,255,${.75-r/400})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
  }
  if(revealed)evidenceCaption(ctx,type.includes("half")?"三個半衰期：800×(1/2)³ = 100":type.includes("mass")?"E = Δmc² = 1.86 MeV":type.includes("alpha")?"α：A−4、Z−2｜子核為 A=234、Z=90":type.includes("beta")?"β⁻：A 不變、Z+1｜弱作用":"強作用束縛核子・弱作用參與 β 衰變");
}

window.addEventListener("popstate", render);
render();
