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
let attempts = 0;
let hintOpen = false;
let flame = 3;
let mistakes = 0;
let usedHint = false;
let rewinds = 0;

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
        <h1>${temple.name}</h1>
        <p class="lead">${temple.description}</p>
        <nav class="track-switch" aria-label="切換學習路線">
          <a class="${track === "foundation" ? "current" : ""}" href="temple.html?temple=${temple.id}&track=foundation">初階殿</a>
          <a class="${track === "advanced" ? "current" : ""}" href="temple.html?temple=${temple.id}&track=advanced">進階殿</a>
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
      </section>
      <section class="level-grid" aria-label="${route.label}關卡">
        ${levels.map((level, index) => {
          const locked = !levelUnlocked(index);
          const done = completed.has(level.code);
          return `<button type="button" class="level-card" data-level="${level.code}" ${locked ? "disabled" : ""}>
            <span class="level-code">${level.code} · ${level.time}</span><h2>${level.title}</h2><p>${level.summary}</p>
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
  attempts = session?.attempts || 0;
  hintOpen = Boolean(session?.hintOpen);
  flame = session?.flame ?? 3;
  mistakes = session?.mistakes || 0;
  usedHint = Boolean(session?.usedHint);
  rewinds = session?.rewinds || 0;
  document.title = `${level.title}｜${temple.name} ${route.label}`;
  main.innerHTML = `<section class="stage-page">
    ${topbar(`${temple.name} · ${route.label}`, `${index + 1} / ${levels.length}`, "map")}
    <div class="shell stage-layout">
      <aside class="brief-panel">
        <div class="stage-badges"><span class="route-badge">${route.grade} · ${route.task}</span><span class="guardian-badge">${temple.guardian}</span></div>
        <section class="flame-panel" aria-label="神火狀態"><div><span>修復者神火</span><strong data-flame>${flameGlyphs()}</strong></div><small data-flame-note>錯誤會使神火衰減；歸零時守護者會啟動回溯，不會封鎖學習。</small></section>
        <h1>${level.title}</h1><p class="mission">${level.mission}</p>
        <div class="metadata"><div><span>任務類型</span><strong>${level.skill}</strong></div><div><span>需要能力</span><strong>${level.prerequisites}</strong></div><div><span>預估時間</span><strong>${level.time}</strong></div></div>
        <section class="known"><h2>已知條件</h2><ul>${level.known.map(item => `<li>${item}</li>`).join("")}</ul></section>
        <section class="hint-box"><button type="button" data-hint>${hintOpen ? "收起線索" : "查看一層線索"}</button><p data-hint-text aria-live="polite">${hintOpen ? level.hint : ""}</p></section>
      </aside>
      <div class="game-panel">
        <figure class="scene-frame"><img src="${level.image}" alt="${level.title}的神殿情境圖"><canvas class="evidence-canvas" width="1000" height="562" data-canvas aria-label="程式繪製的物理證據圖"></canvas><figcaption class="scene-caption">情境圖只提供故事；向量、圖線、刻度與數值由程式繪製。</figcaption></figure>
        ${track === "foundation" ? foundationChallenge(level, index) : advancedChallenge(level, index)}
      </div>
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
  else bindAdvanced(level, index);
  drawVisual(level, { value: level.control?.base, revealed: false });
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
  return { attempts, hintOpen, flame, mistakes, usedHint, rewinds };
}

function foundationChallenge(level) {
  return `<section class="challenge-card">
    <div class="prediction-step">
      <p class="step-label">第一步｜鎖定質性預測</p><p class="question">${level.prediction.question}</p>
      <div class="choices" data-predictions>${choiceButtons(level.prediction.options, "prediction")}</div>
      <div class="action-row"><span class="attempts" data-attempts>尚未啟動機關</span><button type="button" class="primary-button" data-lock disabled>鎖定預測</button></div>
    </div>
    <hr class="phase-divider">
    <div class="control-step" data-control-step>
      <p class="step-label">第二步｜操作變因並取得證據</p>
      <div class="slider-head"><span class="control-label">${level.control.label}</span><output data-readout>${formatControlValue(level.control.base)} ${level.control.unit}</output></div>
      ${controlMarkup(level.control)}
      <p class="target-note">把控制調到 <strong>${formatControlValue(level.control.target)} ${level.control.unit}</strong>，再啟動機關。</p>
      <button type="button" class="primary-button" data-run>啟動機關</button>
    </div>
    <div class="reason-step" data-reason-step>
      <hr class="phase-divider"><p class="step-label">第三步｜用證據選出理由</p><p class="question">${level.reason.question}</p>
      <div class="choices" data-reasons>${choiceButtons(level.reason.options, "reason")}</div>
      <button type="button" class="primary-button" data-submit-reason disabled>提交解釋</button>
    </div>
    <div class="feedback" data-feedback aria-live="polite">先鎖定預測；結果不會在預測前顯示。</div>
  </section>`;
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

function advancedChallenge(level) {
  return `<section class="challenge-card">
    <p class="step-label">第一步｜辨認物理模型</p><p class="question">哪一個模型適用於這道機關？</p>
    <div class="choices model-choices" data-models>${choiceButtons(level.models, "model")}</div>
    <div class="calculation-step" data-calculation-step>
      <hr class="phase-divider"><p class="step-label">第二步｜計算並啟動模擬</p>
      <div class="number-grid">${level.inputs.map(field => `<label class="number-field">${field.label}<div><input data-answer="${field.id}" type="number" inputmode="decimal" step="any" aria-label="${field.label}"><span>${field.unit}</span></div></label>`).join("")}</div>
      <div class="action-row"><span class="attempts" data-attempts>尚未驗證</span><button type="button" class="primary-button" data-verify>驗證模型</button></div>
    </div>
    <div class="feedback" data-feedback aria-live="polite">先選模型，數值輸入才會解鎖。</div>
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

  main.querySelectorAll("[data-prediction]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    selectedPrediction = button.dataset.prediction;
    selectOne("[data-prediction]", button);
    lock.disabled = false;
  }));
  lock.addEventListener("click", () => {
    sound("lock");
    lock.textContent = "預測已鎖定";
    lock.disabled = true;
    main.querySelectorAll("[data-prediction]").forEach(button => { button.disabled = true; });
    controlStep.classList.add("visible");
    feedback.textContent = `預測已鎖定。請把${level.control.label}調到目標值，再啟動機關。`;
  });
  controlInput.addEventListener("input", () => {
    main.querySelector("[data-readout]").textContent = `${formatControlValue(controlInput.value)} ${level.control.unit}`;
    if (evidenceValid) {
      evidenceValid = false;
      reasonStep.classList.remove("visible");
      selectedReason = null;
      feedback.className = "feedback";
      feedback.textContent = "設定已改變，舊證據已失效。請重新啟動機關。";
    }
    drawVisual(level, { value: Number(controlInput.value), revealed: false });
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
    updateAttempts("已啟動", attempts);
    if (!physics.nearly(value, level.control.target, Math.max(Number(level.control.step) / 2, .001))) {
      feedback.className = "feedback bad";
      feedback.textContent = `控制值還不是目標 ${formatControlValue(level.control.target)} ${level.control.unit}；先調整再啟動。`;
      return;
    }
    evidenceValid = true;
    sound("evidence");
    drawVisual(level, { value, revealed: true });
    reasonStep.classList.add("visible");
    feedback.className = "feedback";
    feedback.textContent = selectedPrediction === level.prediction.correct ? "證據已出現，而且與你的預測一致。現在選出因果理由。" : "證據已出現，但和你的預測不同。仍請先根據證據判斷原因。";
  });
  main.querySelectorAll("[data-reason]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    selectedReason = button.dataset.reason;
    selectOne("[data-reason]", button);
    main.querySelector("[data-submit-reason]").disabled = false;
  }));
  main.querySelector("[data-submit-reason]").addEventListener("click", () => {
    if (!evidenceValid) return;
    const predictionOK = selectedPrediction === level.prediction.correct;
    const reasonOK = selectedReason === level.reason.correct;
    markChoice("prediction", level.prediction.correct);
    markChoice("reason", level.reason.correct);
    if (predictionOK && reasonOK) completeLevel(level, index, feedback);
    else {
      const damage = loseFlame(level);
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>機關尚未接受這條解釋。</strong><br>${predictionOK ? "預測正確；再比較三個理由與畫面證據。" : "預測和證據不一致；請重新進入本關修正整條因果鏈。"}<br>${damage}<br><button type="button" class="secondary-button next-button" data-retry>重新預測</button>`;
      const session = stageSession();
      main.querySelector("[data-retry]").addEventListener("click", () => renderStage(level, index, session));
    }
  });
}

function bindAdvanced(level, index) {
  let selectedModel = null;
  let evidenceValid = false;
  const feedback = main.querySelector("[data-feedback]");
  const calculation = main.querySelector("[data-calculation-step]");
  main.querySelectorAll("[data-model]").forEach(button => button.addEventListener("click", () => {
    sound("select");
    selectedModel = button.dataset.model;
    selectOne("[data-model]", button);
    calculation.classList.add("visible");
    if (evidenceValid) invalidateAdvanced(level, feedback);
    feedback.className = "feedback";
    feedback.textContent = "模型已選擇。輸入數值後再啟動驗證；修改數值會讓舊證據失效。";
  }));
  main.querySelectorAll("[data-answer]").forEach(input => input.addEventListener("input", () => {
    if (evidenceValid) {
      evidenceValid = false;
      drawVisual(level, { revealed: false });
      feedback.className = "feedback";
      feedback.textContent = "數值已改變，舊證據已失效。請重新驗證模型。";
    }
  }));
  main.querySelector("[data-verify]").addEventListener("click", () => {
    attempts += 1;
    updateAttempts("已驗證", attempts);
    const values = Object.fromEntries([...main.querySelectorAll("[data-answer]")].map(input => [input.dataset.answer, input.value]));
    const results = physics.checkInputs(level, values);
    const modelOK = selectedModel === level.correctModel;
    const valuesOK = results.every(result => result.ok);
    evidenceValid = true;
    sound("evidence");
    drawVisual(level, { revealed: true, values, modelOK, valuesOK });
    markChoice("model", level.correctModel);
    if (modelOK && valuesOK) completeLevel(level, index, feedback);
    else {
      const wrongFields = results.filter(result => !result.ok).map(result => level.inputs.find(field => field.id === result.id).label);
      const damage = loseFlame(level);
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>模型或數值尚未平衡。</strong><br>${modelOK ? "模型正確；請重算：" + wrongFields.join("、") : "先回到已知條件，確認你選的物理關係。"}<br>${damage}`;
    }
  });
}

function invalidateAdvanced(level, feedback) {
  drawVisual(level, { revealed: false });
  feedback.className = "feedback";
  feedback.textContent = "模型已改變，舊證據已失效。";
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
  const firstClear = !completed.has(level.code);
  completed.add(level.code);
  saveProgress();
  let reward = 0;
  if (firstClear) {
    reward = 100 + Math.max(0, 60 - mistakes * 20) + (usedHint ? 0 : 20);
    profile.xp += reward;
    profile.streak = mistakes === 0 && !usedHint ? profile.streak + 1 : 0;
    profile.bestStreak = Math.max(profile.bestStreak, profile.streak);
    profile.levels[level.code] = { mistakes, usedHint, rewinds, reward };
    const foundationDone = temple.tracks.foundation.every(item => readProgress("foundation").has(item.code));
    const advancedDone = temple.tracks.advanced.every(item => readProgress("advanced").has(item.code));
    if (foundationDone && advancedDone && !profile.relics.includes(temple.id)) profile.relics.push(temple.id);
    saveProfile();
  }
  const trackEnding = index + 1 === levels.length ? `<br><strong>${route.label}完成：${track === "foundation" ? "觀測印" : "演算印"}已與 ${temple.relic} 共鳴。</strong>` : "";
  const rewardText = firstClear ? `<br><span class="reward-note">+${reward} 法則經驗・目前階級：${playerRank()}</span>` : `<br><span class="reward-note">重試完成，不重複計算經驗。</span>`;
  feedback.className = "feedback ok";
  feedback.innerHTML = `<strong>法則刻印已取得。</strong><br>${level.explanation}${rewardText}${trackEnding}<br><button type="button" class="primary-button next-button" data-next>${index + 1 < levels.length ? "前往下一關" : "返回關卡地圖"}</button>`;
  sound("success");
  if (firstClear) spawnSealBurst();
  main.querySelector("[data-next]").addEventListener("click", () => index + 1 < levels.length ? setLocation(levels[index + 1].code) : setLocation(null));
}

function drawVisual(level, state) {
  const canvas = main.querySelector("[data-canvas]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const value = Number(state.value ?? level.control?.base ?? 0);
  const revealed = Boolean(state.revealed);
  drawBasePlate(ctx, w, h, revealed ? "物理證據已啟動" : "證據鎖定中");
  const type = level.visual;
  if (type.startsWith("wave-")) drawWaveVisual(ctx, type, value, revealed, w, h);
  else if (type.startsWith("photo-")) drawPhotoVisual(ctx, type, value, revealed, w, h);
  else if (type.startsWith("measure-") || type.startsWith("uncertainty-")) drawMeasureVisual(ctx, type, value, revealed, w, h);
  else if (type.startsWith("xt-") || type.startsWith("chase") || type.startsWith("brake") || type.startsWith("chrono-")) drawChronoVisual(ctx, type, value, revealed, w, h);
  else if (["momentum-","energy-","electric-","magnetic-","optics-","thermal-","celestial-","newton-","resonance-","emwave-","quantum-","nuclear-"].some(prefix => type.startsWith(prefix))) drawExpansionVisual(ctx, type, value, revealed, w, h);
  else drawTitanVisual(ctx, type, value, revealed, w, h);
  ctx.restore();
}

function drawBasePlate(ctx, w, h, revealed) {
  ctx.fillStyle = "rgba(5,10,17,.52)";
  ctx.fillRect(26, 28, 300, 50);
  ctx.fillStyle = revealed === "物理證據已啟動" ? "#8fffd4" : "#d2d9e4";
  ctx.font = "800 20px system-ui";
  ctx.fillText(revealed, 46, 60);
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
  if (label) { ctx.font = "800 21px system-ui"; ctx.fillStyle = "white"; ctx.fillText(label, headX + 12, headY - 8); }
}

function dot(ctx, x, y, color, radius = 10) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function label(ctx, text, x, y, color = "white", size = 20) { ctx.fillStyle = color; ctx.font = `800 ${size}px system-ui`; ctx.fillText(text, x, y); }
function forceArrow(ctx, tailX, tailY, headX, headY, color, text) {
  dot(ctx, tailX, tailY, "rgba(248,251,255,.95)", 8);
  dot(ctx, tailX, tailY, color, 5);
  arrow(ctx, tailX, tailY, headX, headY, color, text);
}

function drawTitanVisual(ctx, type, value, revealed) {
  const pivotX = 350, pivotY = 385;
  if (type === "triceps") {
    const ballX = 460, ballY = 195;
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(pivotX,pivotY); ctx.lineTo(ballX,ballY); ctx.stroke();
    dot(ctx,pivotX,pivotY,"#ffd86f",13); dot(ctx,ballX,ballY,"#d9c79d",22);
    forceArrow(ctx,ballX,ballY,ballX,ballY+50,"#ff766c","石球 100 N");
    forceArrow(ctx,pivotX-20,pivotY+15,pivotX-155,pivotY+80,"#55e2db","三頭肌 300 N");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(pivotX,pivotY,86,-Math.PI/3,Math.PI/2);ctx.stroke();ctx.setLineDash([]);
    label(ctx,"θ = 150°",420,365,"#ffdc8b",22);
  } else if (type === "pivot") {
    const elbowX=300,elbowY=360,insertionX=390,insertionY=350,handX=720,handY=340,ballX=720,ballY=180;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(elbowX,elbowY);ctx.lineTo(handX,handY);ctx.stroke();
    ctx.fillStyle="#ffd86f";ctx.beginPath();ctx.moveTo(elbowX-24,elbowY+48);ctx.lineTo(elbowX+24,elbowY+48);ctx.lineTo(elbowX,elbowY+6);ctx.closePath();ctx.fill();
    forceArrow(ctx,insertionX,insertionY,330,215,"#55e2db","二頭肌拉力");
    forceArrow(ctx,ballX,ballY,ballX,430,"#ff766c","石球重力");
    const markers=[{x:handX,y:handY},{x:elbowX,y:elbowY}];
    markers.forEach((marker,index)=>{
      const active=Number(value)===index+1;
      ctx.fillStyle=active?"#ffffff":"rgba(220,228,239,.72)";ctx.strokeStyle=active?"#ffd86f":"rgba(255,255,255,.55)";ctx.lineWidth=active?8:4;
      ctx.beginPath();ctx.arc(marker.x,marker.y,active?22:17,0,Math.PI*2);ctx.fill();ctx.stroke();
      label(ctx,String(index+1),marker.x-7,marker.y+7,"#101722",18);
    });
    label(ctx,"1 號",handX+28,handY+8,"#dbe3ef",18);label(ctx,"2 號",elbowX-62,elbowY-25,"#ffdc8b",18);
    if(revealed){label(ctx,"支點",elbowX-30,elbowY+82,"#ffdc8b",21);evidenceCaption(ctx,"2 號位於肘關節：前臂繞此處轉動");}
  } else if (type === "lever-distance") {
    const px=250,py=355,tailX=px+Number(value)*12;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(780,py);ctx.stroke();
    dot(ctx,px,py,"#ffd86f",14);label(ctx,"支點",215,410,"#ffdc8b",18);
    forceArrow(ctx,tailX,py,tailX,py+125,"#55e2db","相同施力 F");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(px,py+75);ctx.lineTo(tailX,py+75);ctx.stroke();ctx.setLineDash([]);
    label(ctx,`作用距離 ${value} cm`,Math.min(tailX-55,610),py+112,"#ffdc8b",18);
    if(revealed)evidenceCaption(ctx,"同一個力：施力點離支點越遠，力矩越大");
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
    forceArrow(ctx,loadX,330,loadX,470,"#ff766c","石球重力（相同）");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(hipX,450);ctx.lineTo(loadX,450);ctx.stroke();ctx.setLineDash([]);
    label(ctx,`重力力臂 ${value} cm`,Math.min(loadX-55,610),490,"#ffdc8b",18);
    if(revealed)evidenceCaption(ctx,"把負重靠近髖關節，重力力臂縮短，肌肉負擔下降");
  } else if (type === "biceps") {
    const elbowX=280,elbowY=360,handX=720,handY=345;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(elbowX,elbowY);ctx.lineTo(handX,handY);ctx.stroke();
    dot(ctx,elbowX,elbowY,"#ffd86f",14);label(ctx,"肘支點",235,420,"#ffdc8b",18);dot(ctx,handX,handY-35,"#d9c79d",30);
    forceArrow(ctx,360,357,318,213,"#55e2db","二頭肌 300 N");
    forceArrow(ctx,handX,handY-35,handX,handY-10,"#ff766c","石球 50 N");
    label(ctx,"同圖箭長比例 300:50 = 6:1",520,485,"#dbe3ef",17);
    if(revealed)evidenceCaption(ctx,"箭尾在施力點；二頭肌小力臂需較大拉力才能平衡");
  } else if (type === "deadlift") {
    const hipX=260,hipY=400,torsoX=500,torsoY=285,loadX=760,loadY=350;
    ctx.strokeStyle="rgba(255,255,255,.78)";ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.lineTo(640,225);ctx.lineTo(loadX,loadY);ctx.stroke();
    dot(ctx,hipX,hipY,"#ffd86f",14);label(ctx,"髖支點",205,455,"#ffdc8b",18);
    forceArrow(ctx,torsoX,torsoY,torsoX,torsoY+24,"#ff9b79","上半身 300 N");
    forceArrow(ctx,loadX,loadY,loadX,loadY+10,"#ff766c","石球 100 N");
    forceArrow(ctx,305,376,160,250,"#55e2db","髖伸肌 2250 N");
    label(ctx,"箭長使用同一比例尺；肌肉力遠大於外力",450,485,"#dbe3ef",17);
    if(revealed)evidenceCaption(ctx,"髖伸肌力矩 = 上半身力矩 + 石球力矩");
  } else if (type === "achilles") {
    const heelX=300,ankleX=470,toeX=760,footY=365;
    ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(heelX,footY);ctx.lineTo(toeX,footY);ctx.stroke();
    dot(ctx,ankleX,footY,"#ffd86f",14);label(ctx,"踝關節支點",405,420,"#ffdc8b",18);
    forceArrow(ctx,heelX,footY,heelX,185,"#55e2db","阿基里斯腱 3000 N");
    forceArrow(ctx,toeX,footY,toeX,305,"#ff9b79","前腳掌正向力 1000 N");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=4;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(heelX,455);ctx.lineTo(ankleX,455);ctx.moveTo(ankleX,485);ctx.lineTo(toeX,485);ctx.stroke();ctx.setLineDash([]);
    label(ctx,"5 cm 等效力臂",315,450,"#ffdc8b",16);label(ctx,"15 cm",590,480,"#ffdc8b",16);
    if(revealed)evidenceCaption(ctx,"取踝關節力矩：3000×5 = N×15，所以 N = 1000 N");
  }
}

function graphAxes(ctx, x, y, w, h, xLabel, yLabel) {
  ctx.strokeStyle="rgba(235,242,252,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();
  label(ctx,xLabel,x+w-20,y+35,"#dbe3ef",16); label(ctx,yLabel,x-20,y-h-12,"#dbe3ef",16);
}

function drawChronoVisual(ctx, type, value, revealed) {
  const x=130,y=460,gw=720,gh=320;
  const velocityGraph=type === "brake" || type === "chrono-stop";
  graphAxes(ctx,x,y,gw,gh,"t",velocityGraph?"速度 v":"位置 x");
  const line=(color,x1,y1,x2,y2)=>{ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  if(type === "xt-slope") {
    line("#ffb454",x,y-35,x+620,y-185);
    line("#55e2db",x,y-15,x+620,y-(55+Number(value)*78));
    if(revealed)evidenceCaption(ctx,"位置—時間圖斜率越大，速度越大");
  } else if(type === "xt-meet") {
    line("#ffb454",x,y-220,x+620,y-120);
    line("#55e2db",x,y-20,x+620,y-120);
    const meetX=x+620,meetY=y-120;
    if(revealed){dot(ctx,meetX,meetY,"#ffd86f",12);ctx.setLineDash([8,7]);line("rgba(255,216,111,.7)",meetX,y,meetX,meetY);ctx.setLineDash([]);label(ctx,"t = 6 s：同時同地",meetX-205,meetY-20,"#9fffea",19);}
  } else if(type === "chase") {
    line("#ffb454",x,y-115,x+620,y-235);
    const cyanRise=80+Number(value)*90;line("#55e2db",x,y-15,x+620,y-cyanRise);
    if(revealed){dot(ctx,x+465,y-205,"#ffd86f",11);evidenceCaption(ctx,"後車斜率較大：領先距離逐漸縮短");}
  } else if(type === "brake") {
    const stopX=x+Math.max(180,600-Number(value)*120);line("#55e2db",x,y-285,stopX,y);
    if(revealed){dot(ctx,stopX,y,"#ffd86f",11);evidenceCaption(ctx,"煞車越強，v—t 線越陡且更早到 v=0");}
  } else if(type === "chrono-uniform") {
    line("#55e2db",x,y,x+620,y-300);if(revealed)evidenceCaption(ctx,"20 s 內位移 120 m：斜率 v = 6 m/s");
  } else if(type === "chrono-accel") {
    ctx.strokeStyle="#55e2db";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+260,y,x+430,y-80,x+620,y-310);ctx.stroke();if(revealed)evidenceCaption(ctx,"由靜止等加速：x—t 圖斜率持續增加");
  } else if(type === "chrono-delay") {
    line("#ffb454",x,y-85,x+620,y-245);line("#55e2db",x+150,y,x+620,y-245);if(revealed){dot(ctx,x+620,y-245,"#ffd86f",11);evidenceCaption(ctx,"橙車先行 40 m；速度差 4 m/s，10 s 後追上");}
  } else if(type === "chrono-stop") {
    line("#55e2db",x,y-285,x+500,y);if(revealed)evidenceCaption(ctx,"v²=v₀²+2aΔx：20 m/s 以 4 m/s² 煞停需 50 m");
  }
}

function drawPhotoVisual(ctx, type, value, revealed) {
  const left=160,right=835,axisY=345,scale=120;
  ctx.fillStyle="rgba(16,30,52,.84)";ctx.fillRect(110,120,780,340);
  ctx.strokeStyle="#dce6f2";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(left,axisY);ctx.lineTo(right,axisY);ctx.stroke();
  label(ctx,"能量（eV）→",left,395,"#b7ccff",18);
  const bar=(energy,color="#70a7ff")=>{ctx.fillStyle=color;ctx.fillRect(left,235,energy*scale,58);label(ctx,`Eγ = ${energy.toFixed(1)} eV`,left+10,272,"white",18);};
  const threshold=(energy,text,color="#f6bd4a")=>{const x=left+energy*scale;ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,190);ctx.lineTo(x,365);ctx.stroke();label(ctx,text,x-38,175,color,17);};
  if(type === "photo-threshold") {
    const energy=1.3*Number(value);bar(energy);threshold(3.5,"功函數 Φ");
    if(revealed)evidenceCaption(ctx,energy>=3.5?"Eγ ≥ Φ：單一光子已能放出電子":"Eγ < Φ：仍無光電子");
  } else if(type === "photo-intensity") {
    bar(2.2);threshold(3.5,"功函數 Φ");const count=Math.max(1,Math.round(Number(value)*2));for(let i=0;i<count;i++)dot(ctx,185+i*42,430,"#8db6ff",7);
    if(revealed)evidenceCaption(ctx,"強度只讓低能光子變多；每顆仍低於功函數");
  } else if(type === "photo-metal") {
    bar(3.2);threshold(2.4,"ΦA","#65ded2");threshold(4.0,"ΦB","#ff8f86");
    if(revealed)evidenceCaption(ctx,"ΦA < Eγ < ΦB：A 放出電子，B 不會");
  } else if(type === "photo-budget") {
    const energy=1.05*Number(value);bar(energy);threshold(2.2,"門 1");threshold(3.2,"門 2");threshold(4.2,"門 3");
    if(revealed)evidenceCaption(ctx,"先讓 Eγ 剛越過目標門檻，再以強度控制電子數");
  } else if(type === "photo-energy") {
    bar(3.1);if(revealed)evidenceCaption(ctx,"400 nm 光子：E = hc/λ ≈ 3.10 eV");
  } else if(type === "photo-kmax") {
    bar(3.5);threshold(2.3,"功函數 Φ");if(revealed)evidenceCaption(ctx,"剩餘能量成為最大動能：3.5 − 2.3 = 1.2 eV");
  } else if(type === "photo-voltage") {
    bar(1.4);if(revealed)evidenceCaption(ctx,"Kmax = 1.4 eV 對應截止電壓 1.4 V");
  } else {
    bar(2.5);for(let i=0;i<10;i++)dot(ctx,190+i*48,425,"#8db6ff",7);if(revealed)evidenceCaption(ctx,"光子數 × 量子效率：有效電子數 100 顆");
  }
}

function drawWaveVisual(ctx, type, value, revealed, w, h) {
  const cx=w/2,cy=h/2+30;
  if (type === "wave-two-source" || type === "wave-separation" || type === "wave-phase" || type === "wave-lines" || type === "wave-inverse") {
    if(type === "wave-two-source" && Number(value) === 1) {
      dot(ctx,cx,cy,"#78f5ec",10);ctx.strokeStyle="rgba(130,255,243,.55)";ctx.lineWidth=3;for(let r=35;r<245;r+=35){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
      if(revealed)evidenceCaption(ctx,"一個波源只有向外傳播的同心波紋");
      return;
    }
    const sep = type === "wave-separation" ? Number(value)*25 : 180;
    const x1=cx-sep/2,x2=cx+sep/2;dot(ctx,x1,cy,"#78f5ec",10);dot(ctx,x2,cy,"#78f5ec",10);
    ctx.strokeStyle="rgba(130,255,243,.25)";ctx.lineWidth=2;for(let r=35;r<230;r+=35){ctx.beginPath();ctx.arc(x1,cy,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x2,cy,r,0,Math.PI*2);ctx.stroke();}
    if (revealed) {
      if(type === "wave-lines") {
        for(let i=-3;i<=3;i++){ctx.strokeStyle="rgba(100,238,218,.86)";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx+i*48,cy-250);ctx.quadraticCurveTo(cx+i*18,cy,cx+i*48,cy+225);ctx.stroke();}
        for(let i=-3;i<=2;i++){ctx.strokeStyle="rgba(255,143,134,.78)";ctx.lineWidth=3;ctx.setLineDash([9,8]);const dx=(i+.5)*48;ctx.beginPath();ctx.moveTo(cx+dx,cy-245);ctx.quadraticCurveTo(cx+dx*.38,cy,cx+dx,cy+220);ctx.stroke();}ctx.setLineDash([]);
        evidenceCaption(ctx,"同相且 d=3.2λ：腹線 7 條（綠）、節線 6 條（紅虛線）");
      } else if(type === "wave-inverse") {
        ctx.strokeStyle="rgba(255,143,134,.85)";ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(cx,cy-250);ctx.lineTo(cx,cy+225);ctx.stroke();ctx.setLineDash([]);evidenceCaption(ctx,"中央等程差卻為節線：兩波源反相 180°");
      } else {
        const count=Math.max(2,Math.round(sep/60));ctx.strokeStyle="rgba(130,255,243,.75)";ctx.lineWidth=4;for(let i=-count;i<=count;i++){ctx.beginPath();ctx.moveTo(cx+i*34,cy-245);ctx.quadraticCurveTo(cx+i*12,cy,cx+i*34,cy+220);ctx.stroke();}
        evidenceCaption(ctx,type === "wave-phase"?"Δr=1.5λ → 相位差 540° ≡ 180°：破壞性干涉":"波源間距增加：可容納的節線／腹線階數增加");
      }
    } else label(ctx,"兩個波源｜干涉證據尚未顯示",340,500,"#d6deea",19);
  } else {
    dot(ctx,cx,cy,"#78f5ec",11);
    const gap = type === "wave-frequency" ? Math.max(24,100/Math.max(1,Number(value))) : 45;
    const alpha = type === "wave-amplitude" ? Math.min(.95,.3+Number(value)*.2) : .6;
    ctx.strokeStyle=`rgba(116,245,235,${alpha})`;ctx.lineWidth=type === "wave-amplitude"?Math.max(3,Number(value)*2):3;
    for(let r=gap;r<260;r+=gap){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
    if(revealed) label(ctx,type === "wave-frequency"?"頻率 ↑　波長 ↓　條紋變密":type === "wave-amplitude"?"振幅 ↑　對比增強，間距不變":"v = fλ 的圖像證據",330,510,"#a1fff5",21);
  }
}

function drawMeasureVisual(ctx, type, value, revealed) {
  ctx.fillStyle="rgba(17,15,35,.8)";ctx.fillRect(120,120,760,330);
  if(type === "measure-scale" || type === "uncertainty-mass") {
    ctx.fillStyle="#0c1922";ctx.fillRect(330,205,340,130);ctx.strokeStyle="#b99cff";ctx.lineWidth=5;ctx.strokeRect(330,205,340,130);label(ctx,"63 g",440,285,"#a1fff5",48);
    if(revealed) label(ctx,type === "uncertainty-mass"?"uB = 1/√12 ≈ 0.29 g":"只記錄儀器實際提供的位數",300,405,"#e2d6ff",21);
  } else if(type === "measure-scatter" || type === "uncertainty-repeat") {
    const a=[.2,.25,.29,.23], b=[.06,.62,.31,.78];
    const values=type === "measure-scatter" && value===2?b:a;
    ctx.strokeStyle="#d6ddec";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(190,340);ctx.lineTo(810,340);ctx.stroke();
    values.forEach((v,i)=>dot(ctx,230+v*650,240+i*24,i%2?"#b99cff":"#55e2db",9));
    if(revealed) label(ctx,type === "uncertainty-repeat"?"A 類散布 + B 類刻度 → 組合":"A 組範圍較小，重複性較好",300,410,"#e2d6ff",21);
  } else if(type === "measure-tool") {
    ctx.strokeStyle="#b99cff";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(180,320);ctx.lineTo(820,320);ctx.stroke();for(let i=0;i<=20;i++){ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(190+i*30,320);ctx.lineTo(190+i*30,295-(i%5===0?18:0));ctx.stroke();}
    ctx.fillStyle="#55e2db";ctx.fillRect(315,205,26,115);ctx.fillRect(650,205,26,115);label(ctx,"卡尺兩爪貼合木塊兩側",330,190,"#a1fff5",18);if(revealed)evidenceCaption(ctx,"量具最小刻度決定可直接讀出的位數");
  } else if(type === "measure-report") {
    label(ctx,"12.3 ± 0.2 cm",300,285,"#a1fff5",42);ctx.strokeStyle="#b99cff";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(295,320);ctx.lineTo(700,320);ctx.stroke();if(revealed)evidenceCaption(ctx,"量值與不確定度必須報到相同小數位");
  } else {
    ctx.strokeStyle="#b99cff";ctx.lineWidth=4;ctx.strokeRect(315,205,370,150);label(ctx,"L × W × H",410,290,"#d8c8ff",34);
    if(revealed) label(ctx,type.includes("density")?"ρ = 2.70 ± 0.045 g/cm³":type.includes("perimeter")?"獨立來源以平方和組合":type.includes("dimension")?"三個尺寸各自有量值與不確定度":"解析度與報告位數必須一致",235,415,"#e2d6ff",21);
  }
}

function drawExpansionVisual(ctx, type, value, revealed, w, h) {
  ctx.fillStyle = "rgba(7,14,24,.58)";
  ctx.fillRect(90, 105, w - 180, h - 155);
  const family = type.split("-")[0];
  if (family === "momentum") drawMomentumEvidence(ctx, type, value, revealed);
  else if (family === "energy") drawEnergyEvidence(ctx, type, value, revealed);
  else if (family === "electric") drawElectricEvidence(ctx, type, value, revealed);
  else if (family === "magnetic") drawMagneticEvidence(ctx, type, value, revealed);
  else if (family === "optics") drawOpticsEvidence(ctx, type, value, revealed);
  else if (family === "thermal") drawThermalEvidence(ctx, type, value, revealed);
  else if (family === "celestial") drawCelestialEvidence(ctx, type, value, revealed);
  else if (family === "newton") drawNewtonEvidence(ctx, type, value, revealed);
  else if (family === "resonance") drawResonanceEvidence(ctx, type, value, revealed);
  else if (family === "emwave") drawEMWaveEvidence(ctx, type, value, revealed);
  else if (family === "quantum") drawQuantumEvidence(ctx, type, value, revealed);
  else drawNuclearEvidence(ctx, type, value, revealed);
}

function evidenceCaption(ctx, text, color = "#a1fff5") {
  label(ctx, text, 145, 505, color, 20);
}

function drawCart(ctx, x, y, color, width = 130) {
  ctx.fillStyle = color; ctx.fillRect(x, y, width, 58);
  dot(ctx, x + 28, y + 66, "#202a37", 15); dot(ctx, x + width - 28, y + 66, "#202a37", 15);
}

function drawMomentumEvidence(ctx, type, value, revealed) {
  const calc = type.includes("calc");
  if(type.includes("impulse")) {
    drawCart(ctx, 370, 320, "#ff806b",180);
    const duration=calc?.25:Number(value),forceLength=calc?150:125;
    forceArrow(ctx,550,348,550+forceLength,348,"#ffd36d",calc?"F = 120 N":"相同平均力 F");
    ctx.strokeStyle="#65ded2";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(250,210);ctx.lineTo(250+(calc?150:duration*120),210);ctx.stroke();
    label(ctx,calc?"Δt = 0.25 s":`作用時間 ${duration} 級`,250,185,"#a1fff5",18);
  } else if(type.includes("recoil")) {
    drawCart(ctx, 230, 315, "#7fa5c9",180);dot(ctx,680,290,"#d9c79d",26);
    const stoneLen=calc?170:90+Number(value)*28;arrow(ctx,680,290,680+stoneLen,290,"#ffd36d",calc?"石塊 p = 24":"石塊動量");
    const cartLen=calc?68:Math.max(70,stoneLen*.55);arrow(ctx,320,300,320-cartLen,300,"#65ded2",calc?"人舟 p = −24":"人舟反衝");
  } else if(type.includes("cushion")) {
    drawCart(ctx, 360, 240, "#ff806b",180);arrow(ctx,450,220,450,340,"#ffd36d","入射動量");
    const time=Math.max(1,Number(value)),padHeight=25+time*22,forceLength=190/time;
    ctx.fillStyle="#6ce7a8";ctx.fillRect(300,400-padHeight,400,padHeight);label(ctx,"厚軟墊",455,440,"#bfffe0",18);
    forceArrow(ctx,450,385-padHeight,450,385-padHeight-forceLength,"#ff806b","平均撞擊力");
  } else {
    drawCart(ctx, 230, 300, "#ff806b");drawCart(ctx,650,300,"#7fa5c9");
    arrow(ctx,340,280,500,280,"#ffd36d",calc?"p₁":"碰前動量");
    if(type.includes("stick")){ctx.strokeStyle="#dce6f2";ctx.lineWidth=4;ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(565,190);ctx.lineTo(565,440);ctx.stroke();ctx.setLineDash([]);arrow(ctx,620,390,750,390,"#65ded2","碰後共同速度");}
  }
  if (revealed) {
    if (type.includes("impulse")) evidenceCaption(ctx, calc ? "J = FΔt = 30 N·s" : "作用時間 ↑　動量改變 ↑");
    else if (type.includes("loss")) evidenceCaption(ctx,"K前 36 J → K後 24 J｜耗散 12 J");
    else if (type.includes("stick")) evidenceCaption(ctx,calc?"總動量守恆｜共同速度 4 m/s":"黏合：動量守恆，動能轉換");
    else evidenceCaption(ctx,"總動量：事件前 = 事件後");
  }
}

function drawEnergyEvidence(ctx, type, value, revealed) {
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
    drawCart(ctx,300,300,"#ffbf5c",150);arrow(ctx,450,285,650,285,"#ffd36d","v");forceArrow(ctx,300,365,190,365,"#ff806b","摩擦力");ctx.fillStyle="#69d8cb";ctx.fillRect(670,410,45,-210);ctx.fillStyle="#ff806b";ctx.fillRect(740,410,45,revealed?-160:-45);label(ctx,"機械能",650,450,"#dce6f2",16);label(ctx,"內能",730,450,"#dce6f2",16);if(revealed)evidenceCaption(ctx,"摩擦把機械能轉為物體與地面的內能；總能量仍守恆");return;
  }
  ctx.fillStyle="#69d8cb";ctx.fillRect(300,410,90,-220);ctx.fillStyle="#69d8cb";ctx.fillRect(610,410,90,-220);label(ctx,"相同做功 W",405,455,"#dce6f2",18);label(ctx,"用時較短",270,175,"#a1fff5",18);label(ctx,"用時較長",585,175,"#ffdc8b",18);if(revealed)evidenceCaption(ctx,type.includes("calc")?"P = mgh/t = 147 W":"做功相同：所需時間越短，平均功率越大");
}

function drawElectricEvidence(ctx, type, value, revealed) {
  if (type.includes("series") || type.includes("parallel")) {
    ctx.strokeStyle="#84a7ff";ctx.lineWidth=7;
    if(type.includes("parallel")) {
      ctx.beginPath();ctx.moveTo(210,180);ctx.lineTo(790,180);ctx.moveTo(210,410);ctx.lineTo(790,410);ctx.moveTo(210,180);ctx.lineTo(210,260);ctx.moveTo(210,330);ctx.lineTo(210,410);ctx.stroke();
      ctx.fillStyle="#ffbf5c";ctx.fillRect(190,260,40,70);label(ctx,"12 V",150,365,"#ffdc8b",18);
      for(const [x,r] of [[420,"6 Ω"],[650,"3 Ω"]]){ctx.strokeStyle="#84a7ff";ctx.beginPath();ctx.moveTo(x,180);ctx.lineTo(x,245);ctx.moveTo(x,335);ctx.lineTo(x,410);ctx.stroke();ctx.fillStyle="#b99cff";ctx.fillRect(x-30,245,60,90);label(ctx,r,x-25,300,"white",16);}
      if(revealed)evidenceCaption(ctx,type.includes("calc")?"並聯：Req = 2 Ω｜I總 = 6 A":"支路增加 → 等效電阻下降 → 電池總電流上升");
    } else {
      ctx.beginPath();ctx.rect(210,190,580,210);ctx.stroke();ctx.fillStyle="#ffbf5c";ctx.fillRect(190,260,40,70);label(ctx,"12 V",150,365,"#ffdc8b",18);
      ctx.fillStyle="#b99cff";ctx.fillRect(330,170,90,40);ctx.fillRect(600,170,90,40);label(ctx,"4 Ω",350,197,"white",16);label(ctx,"6 Ω",620,197,"white",16);
      if(revealed)evidenceCaption(ctx,type.includes("calc")?"串聯：R總 = 10 Ω｜I = 1.2 A":"單一路徑：穩定時每個元件中的電流相同");
    }
    return;
  }
  if(type.includes("field")) {
    const cx=500,cy=300;dot(ctx,cx,cy,"#ff806b",42);label(ctx,"+",484,315,"white",40);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,tx=cx+Math.cos(a)*72,ty=cy+Math.sin(a)*72;arrow(ctx,tx,ty,cx+Math.cos(a)*180,cy+Math.sin(a)*180,"#84a7ff","");}
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"正電荷外 0.30 m：E = 4.0×10⁵ N/C，方向向外":"正試驗電荷受力方向定義為電場方向；正電荷的場向外");
    return;
  }
  const leftX=330,rightX=680,rightPositive=type.includes("force")||Number(value)>0;
  dot(ctx,leftX,300,"#ff806b",42);label(ctx,"+",314,315,"white",40);dot(ctx,rightX,300,rightPositive?"#ff806b":"#84a7ff",42);label(ctx,rightPositive?"+":"−",664,315,"white",40);
  if(rightPositive){forceArrow(ctx,leftX,300,leftX-115,300,"#84a7ff","");forceArrow(ctx,rightX,300,rightX+115,300,"#84a7ff","");}
  else{forceArrow(ctx,leftX,300,leftX+115,300,"#84a7ff","");forceArrow(ctx,rightX,300,rightX-115,300,"#84a7ff","");}
  if(revealed)evidenceCaption(ctx,type.includes("force")?"同號電荷：兩力等大反向，大小 0.60 N":"兩力箭尾各在受力電荷上：同號相斥、異號相吸");
}

function drawMagneticEvidence(ctx, type, value, revealed) {
  if (type.includes("poles")) {
    ctx.fillStyle="#ff806b";ctx.fillRect(220,260,220,90);ctx.fillStyle=Number(value)===2?"#ff806b":"#84a7ff";ctx.fillRect(560,260,220,90);label(ctx,"N",370,317,"white",30);label(ctx,Number(value)===2?"N":"S",580,317,"white",30);
    if(Number(value)===2){forceArrow(ctx,440,305,335,305,"#65ded2","");forceArrow(ctx,560,305,665,305,"#65ded2","");}
    else{forceArrow(ctx,440,305,500,305,"#65ded2","");forceArrow(ctx,560,305,500,305,"#65ded2","");}
    if(revealed)evidenceCaption(ctx,"箭尾在各磁柱受力處：同名磁極相斥、異名相吸");
    return;
  }
  if(type.includes("induction")||type.includes("emf")) {
    ctx.fillStyle="#ff806b";ctx.fillRect(180,250,150,100);label(ctx,"N",270,315,"white",28);arrow(ctx,330,300,500,300,"#ffd36d","磁石速度");
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=8;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(650,300,60+i*16,130,0,0,Math.PI*2);ctx.stroke();}
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"|ε| = N|ΔΦ|/Δt = 12 V":"相同磁通改變量用時越短，感應電動勢越大");
    return;
  }
  for(let y=170;y<=420;y+=55) for(let x=210;x<=790;x+=65) label(ctx,"×",x,y,"rgba(105,219,203,.65)",25);
  if (type.includes("wire")) {
    const direction=type.includes("calc")?1:Number(value),tailX=direction>=0?280:720,headX=direction>=0?720:280,forceUp=direction>=0;
    ctx.strokeStyle="#ffd36d";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(250,330);ctx.lineTo(750,330);ctx.stroke();arrow(ctx,tailX,330,headX,330,"#ffd36d","I");forceArrow(ctx,500,330,500,forceUp?185:455,"#ff806b","F");
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"F = BIL = 0.60 N；箭尾在導線受力處":"I 反向時，I L×B 的方向也反向");
    return;
  }
  const px=300,py=360,forceLength=type.includes("calc")||type.includes("radius")?130:55+Number(value)*22;dot(ctx,px,py,"#ffdc8b",15);arrow(ctx,px,py,px+170,py,"#ffbf5c","v");forceArrow(ctx,px,py,px,py-forceLength,"#ff806b","F_B");
  ctx.strokeStyle="#73c8ff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(560,py-forceLength*.18,760,285-forceLength*.72);ctx.stroke();
  if(revealed)evidenceCaption(ctx,type.includes("radius")?"磁力始終垂直速度並指向圓心：r = 3.0 m":type.includes("calc")?"q>0、v 向右、B 入紙面：F_B 向上，大小 0.030 N":"q>0、v 向右、B 入紙面：由 v×B 得磁力向上");
}

function drawOpticsEvidence(ctx, type, value, revealed) {
  const interfaceY=315,normalX=500;
  const surface=()=>{ctx.strokeStyle="#d8e6f5";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(150,interfaceY);ctx.lineTo(850,interfaceY);ctx.stroke();ctx.setLineDash([10,8]);ctx.strokeStyle="#b8c5d5";ctx.beginPath();ctx.moveTo(normalX,135);ctx.lineTo(normalX,470);ctx.stroke();ctx.setLineDash([]);label(ctx,"法線",515,155,"#dce6f2",16);};
  if(type.includes("lens")||type.includes("magnify")) {
    const lensX=500,axisY=315,f=type.includes("calc")?120:150,objectX=230,objectTop=205;
    ctx.strokeStyle="rgba(220,230,242,.5)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(140,axisY);ctx.lineTo(860,axisY);ctx.stroke();
    ctx.strokeStyle="#b99cff";ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(lensX,axisY,38,150,0,0,Math.PI*2);ctx.stroke();dot(ctx,lensX-f,axisY,"#ffdc8b",8);dot(ctx,lensX+f,axisY,"#ffdc8b",8);label(ctx,"F",lensX+f-6,axisY+35,"#ffdc8b",16);
    arrow(ctx,objectX,axisY,objectX,objectTop,"#ff806b","物體");
    arrow(ctx,objectX,objectTop,lensX,objectTop,"#ffd36d","");arrow(ctx,lensX,objectTop,lensX+250,axisY+(axisY-objectTop)*250/f,"#ffd36d","");
    arrow(ctx,objectX,objectTop,lensX,axisY,"#65ded2","");arrow(ctx,lensX,axisY,lensX+250,axisY+(axisY-objectTop)*250/(lensX-objectX),"#65ded2","");
    if(revealed)evidenceCaption(ctx,type.includes("magnify")?"m = −di/do = −2：倒立、放大 2 倍":"平行主軸光折射後通過焦點；中央光線近似直行");return;
  }
  surface();
  const calc=type.includes("calc"),incidence=calc?(type.includes("critical")?Math.asin(1/1.5)*180/Math.PI:30):Number(value);
  const theta1=Math.max(12,Math.min(75,incidence))*Math.PI/180,rayLen=235;
  arrow(ctx,normalX-Math.sin(theta1)*rayLen,interfaceY-Math.cos(theta1)*rayLen,normalX,interfaceY,"#ffbf5c","入射光");
  if(type.includes("reflection")) {
    arrow(ctx,normalX,interfaceY,normalX+Math.sin(theta1)*rayLen,interfaceY-Math.cos(theta1)*rayLen,"#84a7ff","反射光");
    if(revealed)evidenceCaption(ctx,calc?"反射角等於入射角：30°":"角度都由法線量起；θr = θi");return;
  }
  const tir=type.includes("tir")||type.includes("critical");
  if(tir) {
    const critical=Math.asin(1/1.5)*180/Math.PI,isCritical=calc,isTir=!calc&&incidence>critical;
    if(isTir) arrow(ctx,normalX,interfaceY,normalX+Math.sin(theta1)*rayLen,interfaceY-Math.cos(theta1)*rayLen,"#84a7ff","全反射");
    else if(isCritical) arrow(ctx,normalX,interfaceY,820,interfaceY,"#84a7ff","臨界折射光");
    else arrow(ctx,normalX,interfaceY,normalX+Math.sin(Math.asin(1.5*Math.sin(theta1)))*190,interfaceY+Math.cos(Math.asin(1.5*Math.sin(theta1)))*190,"#84a7ff","折射光");
    if(revealed)evidenceCaption(ctx,isCritical?"θc = sin⁻¹(1/1.5) ≈ 41.8°；折射角為 90°":"由高 n 射向低 n 且 θi > θc：只剩反射光");return;
  }
  const n2=calc?1.5:Number(value),theta2=Math.asin(Math.sin(theta1)/n2);
  arrow(ctx,normalX,interfaceY,normalX+Math.sin(theta2)*rayLen,interfaceY+Math.cos(theta2)*rayLen,"#84a7ff","折射光");
  if(revealed)evidenceCaption(ctx,calc?"sinθ₂ = sin30°/1.5 → θ₂ ≈ 19.5°":"進入較高折射率介質：折射角變小、光線偏向法線");
}

function drawThermalEvidence(ctx, type, value, revealed) {
  ctx.strokeStyle="#d4dce8";ctx.lineWidth=6;ctx.strokeRect(250,170,500,260);
  const hot = type.includes("flow") ? 70 : 35;
  for(let i=0;i<24;i++) { const x=285+(i%8)*60, y=210+Math.floor(i/8)*75; dot(ctx,x,y,i<12?"#ff806b":"#84a7ff",revealed&&i<12?hot/8:7); }
  if(type.includes("compress")){ctx.fillStyle="#ffbf5c";ctx.fillRect(240,revealed?230:150,520,28);arrow(ctx,500,125,500,revealed?220:145,"#ffbf5c","外界做功");}
  if(type.includes("capacity")){label(ctx,"A：小熱容量",285,465,"#ffb6ac",17);label(ctx,"B：大熱容量",600,465,"#b7ccff",17);}
  if (revealed) evidenceCaption(ctx,type.includes("flow")?"熱由高溫物體傳向低溫物體，直到熱平衡":type.includes("capacity")?"相同吸熱量 Q：熱容量較小者 ΔT 較大":type.includes("gas")?"定容：P ∝ 絕對溫度 T（使用 K）":type.includes("firstlaw")?"採 Wby 為氣體對外做功：ΔU = Q − Wby = 300 J":"能量帳目：熱、功與內能");
}

function drawCelestialEvidence(ctx, type, value, revealed) {
  if(type.includes("gravity")) {
    const calc=type.includes("calc"),ratio=calc?1:Number(value),leftX=calc?320:500-95*ratio,rightX=calc?680:500+95*ratio,len=calc?100:Math.max(28,150/(ratio*ratio));
    dot(ctx,leftX,300,"#ffbf5c",46);dot(ctx,rightX,300,"#91a8ff",34);forceArrow(ctx,leftX,300,leftX+len,300,"#ff806b","Fg");forceArrow(ctx,rightX,300,rightX-len,300,"#ff806b","Fg");
    if(revealed)evidenceCaption(ctx,calc?"萬有引力大小 3.34×10⁻⁷ N；兩物體受力等大反向":"距離增為 2 倍：同一比例尺下，引力箭長變為 1/4");return;
  }
  if(type.includes("weight")) {
    const g=Number(value),groundY=390;ctx.fillStyle=g<5?"#8a93aa":"#527ec7";ctx.beginPath();ctx.arc(500,560,230,Math.PI,Math.PI*2);ctx.fill();dot(ctx,500,250,"#d9c79d",34);forceArrow(ctx,500,250,500,250+g*18,"#ff806b","重力 mg");label(ctx,g<5?"月球 g ≈ 1.6 N/kg":"地球 g ≈ 9.8 N/kg",395,445,"#dce6f2",18);if(revealed)evidenceCaption(ctx,"質量不變；月球表面重量約為地球的 1/6");return;
  }
  const cx=500,cy=300,calc=type.includes("calc"),radius=type.includes("kepler")?230:type.includes("period")?100+Number(value)*28:185;
  dot(ctx,cx,cy,"#ffbf5c",55);ctx.strokeStyle="rgba(145,168,255,.7)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
  const quadrant=!calc&&type.includes("circular")?Number(value):1,a=(quadrant-1)*Math.PI/2,sx=cx+radius*Math.cos(a),sy=cy-radius*Math.sin(a);dot(ctx,sx,sy,"#91a8ff",20);
  const tangentX=Math.sin(a),tangentY=Math.cos(a);arrow(ctx,sx,sy,sx+tangentX*120,sy-tangentY*120,"#65ded2","v");forceArrow(ctx,sx,sy,sx+(cx-sx)*.62,sy+(cy-sy)*.62,"#ff806b","Fg / a");
  if(revealed)evidenceCaption(ctx,type.includes("kepler")?"T² ∝ r³：半徑 4 倍，週期 8 倍":type.includes("speed")?"GMm/r² = mv²/r → v ≈ 7.9 km/s":type.includes("calc-period")?"T = 2πr/v ≈ 5.83×10³ s":"速度切向、引力與向心加速度都指向圓心");
}

function drawNewtonEvidence(ctx, type, value, revealed) {
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
    arrow(ctx,215,210,385,210,"#65ded2","vₓ");arrow(ctx,565,320,565,430,"#ff806b","vᵧ");forceArrow(ctx,565,320,565,390,"#ffd36d","mg");
    if(revealed) evidenceCaption(ctx,type.includes("calc")?"t = 3 s｜水平距離 60 m":"水平等速・鉛直等加速｜共享同一時間");
    return;
  }
  drawCart(ctx,360,305,"#73c8ff",190);
  if(type.includes("inertia")) {
    arrow(ctx,455,280,690,280,"#ffd36d","速度 v");
  } else if(type.includes("friction") && !type.includes("calc")) {
    const len=75+Number(value)*24;forceArrow(ctx,550,332,550+len,332,"#65ded2","推力");forceArrow(ctx,360,385,360-len,385,"#ff806b","靜摩擦");
  } else if(type.includes("friction")) {
    forceArrow(ctx,550,332,700,332,"#65ded2","50 N");forceArrow(ctx,360,385,301,385,"#ff806b","19.6 N");
  } else if(type.includes("calc")) {
    forceArrow(ctx,550,332,746,332,"#65ded2","28 N");forceArrow(ctx,360,385,304,385,"#ff806b","8 N");
  } else {
    const rightLen=85+Number(value)*32;forceArrow(ctx,550,332,550+rightLen,332,"#65ded2","向右力");forceArrow(ctx,360,385,285,385,"#ff806b","反向力");
  }
  if(revealed) evidenceCaption(ctx,type.includes("inertia")?"ΣF = 0｜速度向量保持不變":type.includes("friction")&&type.includes("calc")?"fk = μkmg｜a = 3.04 m/s²":type.includes("friction")?"未滑動：靜摩擦配合推力；滑動後 fk=μkN":type.includes("calc")?"ΣF = ma｜合力 20 N，加速度 4.0 m/s²":"加速度方向與合力相同");
}

function drawResonanceEvidence(ctx, type, value, revealed) {
  const x0=165,x1=835,mid=300;
  ctx.strokeStyle="rgba(220,230,242,.5)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,mid);ctx.lineTo(x1,mid);ctx.stroke();
  if(type.includes("tube")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(260,180);ctx.lineTo(260,400);ctx.lineTo(760,400);ctx.stroke();
    ctx.strokeStyle="#58e0d3";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(260,300);ctx.bezierCurveTo(410,300,590,150,760,150);ctx.stroke();
    label(ctx,"節",240,440,"#ffdc8b",18);label(ctx,"腹",745,135,"#a1fff5",18);
    if(revealed) evidenceCaption(ctx,type.includes("calc")?"閉管基音：f₁ = v/(4L) = 200 Hz":"閉端為位移節點・開端為位移腹點");
    return;
  }
  const harmonics=type.includes("harmonic")?3:type.includes("pitch")?Math.max(1,Number(value)):type.includes("standing")?Math.max(1,Number(value)):type.includes("string")?1:type.includes("wave")?2:1;
  ctx.strokeStyle="#58e0d3";ctx.lineWidth=8;ctx.beginPath();
  for(let i=0;i<=240;i++){const t=i/240;const x=x0+(x1-x0)*t;const y=mid-120*Math.sin(harmonics*Math.PI*t);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  for(let n=0;n<=harmonics;n++) dot(ctx,x0+(x1-x0)*n/harmonics,mid,"#ffdc8b",9);
  if(type.includes("pitch")){label(ctx,`頻率等級 ${value}`,420,175,"#a1fff5",18);}
  if(type.includes("match")){
    graphAxes(ctx,220,445,560,240,"驅動頻率","振幅");ctx.strokeStyle="#b58cff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(230,430);ctx.bezierCurveTo(380,425,420,180,500,170);ctx.bezierCurveTo(580,180,620,425,770,430);ctx.stroke();dot(ctx,500,170,"#ffdc8b",10);label(ctx,"固有頻率",510,160,"#ffdc8b",16);
  }
  if(revealed) evidenceCaption(ctx,type.includes("pitch")?"頻率增加：相同時間內振動次數增加，音高上升":type.includes("match")?"驅動頻率接近固有頻率時，穩態振幅達到峰值":type.includes("harmonic")?"第三諧波：f₃ = 3f₁ = 600 Hz":type.includes("string")?"兩端固定基音：f₁ = v/(2L) = 200 Hz":type.includes("calc")?"v = fλ｜波長 0.80 m":"節點不動・腹點振幅最大");
}

function drawEMWaveEvidence(ctx, type, value, revealed) {
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
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=10;ctx.strokeRect(350,190,300,220);
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=5;for(let x=190;x<=810;x+=70)arrow(ctx,x,405,x,185,"#8e8bff","");
    ctx.strokeStyle="#58e0d3";ctx.lineWidth=7;ctx.beginPath();ctx.arc(500,300,105,-2.3,.35);ctx.stroke();arrow(ctx,596,336,610,300,"#58e0d3","旋轉");
    if(!type.includes("calc"))label(ctx,`轉速等級 ${value}`,425,455,"#a1fff5",17);
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"|ε| = N|ΔΦ|/Δt = 30 V":"磁通量改變越快，感應電動勢越大");
    return;
  }
  const start=150,end=850,cy=300;
  if(type.includes("polarization")) {
    const angle=Number(value)*Math.PI/180,amp=Math.cos(angle)**2;ctx.strokeStyle="#b58cff";ctx.lineWidth=10;ctx.beginPath();ctx.arc(350,300,105,0,Math.PI*2);ctx.arc(650,300,105,0,Math.PI*2);ctx.stroke();
    arrow(ctx,350-Math.cos(angle)*75,300+Math.sin(angle)*75,350+Math.cos(angle)*75,300-Math.sin(angle)*75,"#ffdc8b","偏振軸");ctx.fillStyle="#58e0d3";ctx.fillRect(700,405,Math.max(4,amp*150),28);label(ctx,`I/I₀ = cos²${value}°`,650,460,"#a1fff5",18);if(revealed)evidenceCaption(ctx,"兩偏振軸互相垂直時，理想透射強度降為 0");return;
  }
  ctx.strokeStyle="#8e8bff";ctx.lineWidth=7;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180,x=start+(end-start)*t,y=cy-100*Math.sin(t*Math.PI*4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  ctx.strokeStyle="#58e0d3";ctx.lineWidth=5;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180,x=start+(end-start)*t,y=cy-75*Math.cos(t*Math.PI*4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  arrow(ctx,250,440,760,440,"#ffdc8b","傳播方向");
  if(type.includes("ac")){label(ctx,`相位 ${value}`,420,180,"#a1fff5",18);arrow(ctx,500,300,500,Number(value)===2?415:185,"#ff806b","瞬時電流");}
  if(revealed)evidenceCaption(ctx,type.includes("wavelength")?"f = 100 MHz：λ = c/f = 3.0 m":"交流電流每半週反向；電磁波的 E、B 與傳播方向互相垂直");
}

function drawQuantumEvidence(ctx, type, value, revealed) {
  if(type.includes("electron")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=8;ctx.strokeRect(180,185,640,235);
    ctx.fillStyle="#8e8bff";ctx.fillRect(215,220,22,165);ctx.fillStyle="#ff806b";ctx.fillRect(763,220,22,165);
    label(ctx,"陰極 −",190,165,"#d8c8ff",18);label(ctx,"陽極 +",735,165,"#ffb6ac",18);
    const bend=Number(value)*30;ctx.strokeStyle="#73c8ff";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(240,305);ctx.quadraticCurveTo(500,305-bend,755,305-bend);ctx.stroke();
    arrow(ctx,470,305-bend*.55,650,305-bend,"#73c8ff","電子速度");forceArrow(ctx,500,305-bend*.7,500,245-bend*.7,"#ff806b","電力 qE");
    if(revealed)evidenceCaption(ctx,"箭尾在電子受力位置；帶負電電子的受力方向與電場方向相反");
    return;
  }
  if(type.includes("charge")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(210,165);ctx.lineTo(790,165);ctx.moveTo(210,420);ctx.lineTo(790,420);ctx.stroke();
    label(ctx,"＋極板",215,145,"#ffb6ac",18);label(ctx,"−極板",215,455,"#d8c8ff",18);
    const charges=[1,2,3,4];
    charges.forEach((n,i)=>{const x=300+i*135,y=230+(i%2)*90;dot(ctx,x,y,"#ffdc8b",18);label(ctx,`${n}e`,x-16,y+45,"#dce6f2",17);});
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
    dot(ctx,500,300,"#ff7396",30);for(let i=0;i<70;i++){const a=i*2.4,r=45+(i%9)*13;dot(ctx,500+Math.cos(a)*r,300+Math.sin(a)*r*.62,"rgba(181,140,255,.32)",5);}
  } else if(type.includes("spectrum")) {
    dot(ctx,500,levels[2],"#73c8ff",13);arrow(ctx,500,levels[2],500,levels[1],"#ffdc8b","放出光子 ΔE₃₂");
  } else {
    const n=Math.max(1,Math.min(4,Math.round(Number(value))));dot(ctx,500,levels[n-1],"#73c8ff",13);label(ctx,`能量份額：n = ${n}`,365,150,"#a1fff5",18);
  }
  if(revealed)evidenceCaption(ctx,type.includes("spectrum")?"n=3 → 2｜1.89 eV｜656 nm":type.includes("atom")?"現代原子：離散能階 + 機率分布":"能量以 hf 的離散份額交換");
}

function drawNuclearEvidence(ctx, type, value, revealed) {
  const cx=500,cy=290;
  for(let i=0;i<18;i++){const a=i*2.4,r=18+(i%4)*22;dot(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r,i%2?"#ff7396":"#73c8ff",15);}
  if(type.includes("alpha")) {
    arrow(ctx,585,270,800,200,"#ff7396","α 粒子（⁴₂He）");
  } else if(type.includes("beta")) {
    arrow(ctx,585,285,810,260,"#73c8ff","β⁻ 電子");arrow(ctx,585,315,790,390,"#ffdc8b","反微中子");
  } else if(type.includes("radiation")) {
    arrow(ctx,585,260,800,190,"#ff7396","α");arrow(ctx,585,300,810,300,"#73c8ff","β");arrow(ctx,580,335,790,410,"#ffdc8b","γ");
  } else if(type.includes("half")) {
    ctx.strokeStyle="#b58cff";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(620,165);ctx.bezierCurveTo(690,170,700,400,830,410);ctx.stroke();
    label(ctx,"800 → 400 → 200 → 100",570,475,"#d8c8ff",20);
  } else {
    for(let r=120;r<=210;r+=45){ctx.strokeStyle=`rgba(181,140,255,${.75-r/400})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
  }
  if(revealed)evidenceCaption(ctx,type.includes("half")?"三個半衰期：800×(1/2)³ = 100":type.includes("mass")?"E = Δmc² = 1.86 MeV":type.includes("alpha")?"α：A−4、Z−2｜子核為 A=234、Z=90":type.includes("beta")?"β⁻：A 不變、Z+1｜弱作用":"強作用束縛核子・弱作用參與 β 衰變");
}

window.addEventListener("popstate", render);
render();
