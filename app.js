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
      <div class="slider-head"><label for="level-control">${level.control.label}</label><output data-readout>${level.control.base} ${level.control.unit}</output></div>
      <input id="level-control" type="range" min="${level.control.min}" max="${level.control.max}" step="${level.control.step}" value="${level.control.base}" data-control>
      <p class="target-note">把控制調到 <strong>${level.control.target} ${level.control.unit}</strong>，再啟動機關。</p>
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
    main.querySelector("[data-readout]").textContent = `${controlInput.value} ${level.control.unit}`;
    if (evidenceValid) {
      evidenceValid = false;
      reasonStep.classList.remove("visible");
      selectedReason = null;
      feedback.className = "feedback";
      feedback.textContent = "設定已改變，舊證據已失效。請重新啟動機關。";
    }
    drawVisual(level, { value: Number(controlInput.value), revealed: false });
  });
  main.querySelector("[data-run]").addEventListener("click", () => {
    const value = Number(controlInput.value);
    attempts += 1;
    updateAttempts("已啟動", attempts);
    if (!physics.nearly(value, level.control.target, Math.max(Number(level.control.step) / 2, .001))) {
      feedback.className = "feedback bad";
      feedback.textContent = `控制值還不是目標 ${level.control.target} ${level.control.unit}；先調整再啟動。`;
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

function arrow(ctx, x1, y1, x2, y2, color, label) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 20 * Math.cos(angle - .5), y2 - 20 * Math.sin(angle - .5)); ctx.lineTo(x2 - 20 * Math.cos(angle + .5), y2 - 20 * Math.sin(angle + .5)); ctx.closePath(); ctx.fill();
  if (label) { ctx.font = "800 21px system-ui"; ctx.fillStyle = "white"; ctx.fillText(label, x2 + 12, y2 - 8); }
}

function dot(ctx, x, y, color, radius = 10) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
function label(ctx, text, x, y, color = "white", size = 20) { ctx.fillStyle = color; ctx.font = `800 ${size}px system-ui`; ctx.fillText(text, x, y); }

function drawTitanVisual(ctx, type, value, revealed) {
  const pivotX = 350, pivotY = 385;
  if (type === "triceps") {
    const ballX = 460, ballY = 195;
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(pivotX,pivotY); ctx.lineTo(ballX,ballY); ctx.stroke();
    dot(ctx,pivotX,pivotY,"#ffd86f",13); dot(ctx,ballX,ballY,"#d9c79d",22);
    arrow(ctx,ballX,ballY,ballX,ballY+175,"#ff766c","石球 W");
    arrow(ctx,pivotX-20,pivotY+15,pivotX-150,pivotY+75,"#55e2db","三頭肌 300 N");
    ctx.strokeStyle="#ffd86f";ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(pivotX,pivotY,86,-Math.PI/3,Math.PI/2);ctx.stroke();ctx.setLineDash([]);
    label(ctx,"θ = 150°",420,365,"#ffdc8b",22);
  } else if (["pivot","lever-distance","force-direction","posture","biceps","deadlift","achilles"].includes(type)) {
    ctx.strokeStyle="rgba(255,255,255,.72)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(250,360);ctx.lineTo(720,360);ctx.stroke();
    dot(ctx,300,360,"#ffd86f",14); label(ctx,"支點",260,405,"#ffdc8b",18);
    const distance = type === "lever-distance" ? (revealed ? 360 : 130) : type === "posture" ? (revealed ? 150 : 400) : 300;
    const loadX = 300 + distance;
    dot(ctx,loadX,360,"#d8c5a0",18); arrow(ctx,loadX,345,loadX,455,"#ff766c",type.includes("deadlift")?"外力矩":"重力");
    const angle = type === "force-direction" ? (revealed ? Math.PI/2 : .25) : -Math.PI/2;
    arrow(ctx,430,360,430+Math.cos(angle)*120,360-Math.sin(angle)*120,"#55e2db",type === "biceps"?"肌力":"施力");
    if (revealed) {
      ctx.strokeStyle="#ffd86f";ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(300,360,Math.min(distance,250),-.1,.2);ctx.stroke();ctx.setLineDash([]);
      label(ctx,type === "posture"?"力臂縮短 → 負擔較小":type === "force-direction"?"接近垂直 → 轉動效果較大":"力矩平衡證據",470,505,"#9fffea",20);
    }
  }
}

function graphAxes(ctx, x, y, w, h, xLabel, yLabel) {
  ctx.strokeStyle="rgba(235,242,252,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();
  label(ctx,xLabel,x+w-20,y+35,"#dbe3ef",16); label(ctx,yLabel,x-20,y-h-12,"#dbe3ef",16);
}

function drawChronoVisual(ctx, type, value, revealed) {
  const x=130,y=460,gw=720,gh=320;graphAxes(ctx,x,y,gw,gh,"t","位置 / 速度");
  ctx.strokeStyle="#ffb454";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x+620,y-220);ctx.stroke();
  ctx.strokeStyle="#55e2db";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y-10);
  if (type === "xt-meet") ctx.lineTo(x+620,y-300);
  else if (type === "brake" || type === "chrono-stop") {ctx.moveTo(x,y-290);ctx.lineTo(x+Math.max(180,520-value*80),y);}
  else if (type === "chrono-accel") {ctx.bezierCurveTo(x+180,y-20,x+300,y-130,x+620,y-310);}
  else ctx.lineTo(x+620,y-(revealed?300:120));ctx.stroke();
  if (revealed) {
    dot(ctx,x+385,y-152,"#ffd86f",11); label(ctx,type === "xt-meet"?"交點：同時同地":type === "brake"||type === "chrono-stop"?"較早到 v=0":"斜率／運動模型已驗證",500,130,"#9fffea",20);
  }
}

function drawPhotoVisual(ctx, type, value, revealed) {
  const baseX=150,baseY=390;
  ctx.fillStyle="rgba(16,30,52,.84)";ctx.fillRect(110,130,780,300);
  label(ctx,"光子能量",145,175,"#b7ccff",18);label(ctx,"金屬門檻",650,175,"#ffdc8b",18);
  const energy = revealed ? Math.min(360,80+value*55) : 110;
  ctx.fillStyle="#70a7ff";ctx.fillRect(baseX,220,energy,64);
  ctx.fillStyle="#f6bd4a";ctx.fillRect(650,205,10,110);
  arrow(ctx,baseX+energy+20,252,610,252,"#8db6ff","");
  if (type === "photo-intensity" && revealed) {
    for(let i=0;i<8;i++) dot(ctx,170+i*45,360,"#8db6ff",8);
    label(ctx,"光子變多，但每顆仍低於門檻",350,400,"#ffb2ad",20);
  } else if (type === "photo-metal" && revealed) {
    label(ctx,"A 門檻",600,350,"#9fffea",18);label(ctx,"B 門檻",735,350,"#ffb2ad",18);
  } else if (revealed) label(ctx,energy>460?"跨越門檻：放出電子":"能量證據已顯示",375,380,"#9fffea",21);
}

function drawWaveVisual(ctx, type, value, revealed, w, h) {
  const cx=w/2,cy=h/2+30;
  if (type === "wave-two-source" || type === "wave-separation" || type === "wave-phase" || type === "wave-lines" || type === "wave-inverse") {
    const sep = type === "wave-separation" ? (revealed ? value*25 : 100) : 180;
    const x1=cx-sep/2,x2=cx+sep/2;dot(ctx,x1,cy,"#78f5ec",10);dot(ctx,x2,cy,"#78f5ec",10);
    if (revealed) {
      const count = type === "wave-lines" ? 6 : Math.max(3,Math.round(sep/55));
      ctx.strokeStyle="rgba(130,255,243,.7)";ctx.lineWidth=4;
      for(let i=-count;i<=count;i++) {ctx.beginPath();ctx.moveTo(cx+i*28,cy-260);ctx.quadraticCurveTo(cx+i*10,cy,cx+i*28,cy+240);ctx.stroke();}
      label(ctx,type === "wave-lines"?"d = 3.2λ｜腹線 7、節線 6":"加強區與削弱區形成穩定骨架",350,505,"#a1fff5",20);
    } else label(ctx,"兩個波源｜干涉證據尚未顯示",340,500,"#d6deea",19);
  } else {
    dot(ctx,cx,cy,"#78f5ec",11);
    const gap = type === "wave-frequency" ? (revealed ? 25 : 55) : 45;
    const alpha = type === "wave-amplitude" && revealed ? .95 : .48;
    ctx.strokeStyle=`rgba(116,245,235,${alpha})`;ctx.lineWidth=type === "wave-amplitude"&&revealed?7:3;
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
  } else {
    ctx.strokeStyle="#b99cff";ctx.lineWidth=4;ctx.strokeRect(260,205,460,150);
    for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(260+i*46,355);ctx.lineTo(260+i*46,335-(i%5===0?18:0));ctx.stroke();}
    if(revealed) label(ctx,type.includes("density")?"ρ = 2.70 ± 0.045 g/cm³":type.includes("perimeter")?"獨立來源以平方和組合":"解析度與報告位數必須一致",270,415,"#e2d6ff",21);
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
  drawCart(ctx, 210, 300, "#ff806b");
  drawCart(ctx, 650, 300, "#7fa5c9");
  arrow(ctx, 350, 328, 500, 328, "#ffd36d", calc ? "p₁" : "運動");
  if (type.includes("recoil")) arrow(ctx, 650, 390, 520, 390, "#65ded2", "反衝");
  if (type.includes("cushion")) { ctx.fillStyle="#6ce7a8"; ctx.fillRect(560,260,35,130); label(ctx,"緩衝區",535,235,"#bfffe0",18); }
  if (revealed) {
    if (type.includes("impulse")) evidenceCaption(ctx, calc ? "J = FΔt = 30 N·s" : "作用時間 ↑　動量改變 ↑");
    else if (type.includes("loss")) evidenceCaption(ctx,"K前 36 J → K後 24 J｜耗散 12 J");
    else if (type.includes("stick")) evidenceCaption(ctx,calc?"總動量守恆｜共同速度 4 m/s":"黏合：動量守恆，動能轉換");
    else evidenceCaption(ctx,"總動量：事件前 = 事件後");
  }
}

function drawEnergyEvidence(ctx, type, value, revealed) {
  ctx.strokeStyle="#f3d69b";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(170,390);ctx.lineTo(600,210);ctx.stroke();
  ctx.fillStyle="#ffbf5c";ctx.fillRect(330,290,95,78);
  arrow(ctx,375,290,520,230,"#65ded2","施力");
  const before = type.includes("friction") ? 280 : 210;
  ctx.fillStyle="#69d8cb";ctx.fillRect(690,410,42,-before);
  ctx.fillStyle="#ffbf5c";ctx.fillRect(750,410,42,revealed? -Math.min(180,80+Math.abs(value)*15):-70);
  label(ctx,"K / U",678,448,"#dce6f2",16);
  if (revealed) evidenceCaption(ctx,type.includes("power")?"同功：時間 ↓　功率 ↑":type.includes("friction")?"機械能 → 內能（總能量守恆）":type.includes("speed")?"mgh = ½mv²｜v ≈ 9.9 m/s":"功與能量模型已平衡");
}

function drawElectricEvidence(ctx, type, value, revealed) {
  if (type.includes("series") || type.includes("parallel")) {
    ctx.strokeStyle="#84a7ff";ctx.lineWidth=7;ctx.beginPath();ctx.rect(190,190,620,210);ctx.stroke();
    if (type.includes("parallel")) {ctx.beginPath();ctx.moveTo(350,190);ctx.lineTo(350,400);ctx.moveTo(650,190);ctx.lineTo(650,400);ctx.stroke();}
    ctx.fillStyle="#ffbf5c";ctx.fillRect(480,380,45,40);label(ctx,"12 V",460,455,"#ffdc8b",18);
    ctx.fillStyle="#b99cff";ctx.fillRect(330,170,90,40);ctx.fillRect(600,170,90,40);
    if (revealed) evidenceCaption(ctx,type.includes("parallel")?"Req = 2 Ω｜I總 = 6 A":"R總 = 10 Ω｜I = 1.2 A");
    return;
  }
  dot(ctx,330,300,"#ff806b",42); label(ctx,"+",314,315,"white",40);
  dot(ctx,680,300,type.includes("charge")&&value<0?"#84a7ff":"#ff806b",42);label(ctx,type.includes("charge")&&value<0?"−":"+",664,315,"white",40);
  for(let i=-2;i<=2;i++) arrow(ctx,385,300+i*24,620,300+i*24,"#84a7ff","");
  if (revealed) evidenceCaption(ctx,type.includes("field")?"正試驗電荷受力方向 = 電場方向":type.includes("force")?"F = k|q₁q₂|/r² = 0.60 N":"同號相斥・異號相吸");
}

function drawMagneticEvidence(ctx, type, value, revealed) {
  for(let y=170;y<=400;y+=55) for(let x=210;x<=790;x+=65) { label(ctx,"×",x,y,"rgba(105,219,203,.72)",25); }
  if (type.includes("poles")) {
    ctx.fillStyle="#ff806b";ctx.fillRect(230,270,210,80);ctx.fillStyle="#84a7ff";ctx.fillRect(560,270,210,80);label(ctx,"N",310,325,"white",30);label(ctx,"N",640,325,"white",30);
  } else if (type.includes("wire")) {
    ctx.strokeStyle="#ffd36d";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(220,340);ctx.lineTo(760,230);ctx.stroke();arrow(ctx,490,280,490,155,"#ff806b","F");
  } else {
    arrow(ctx,250,330,470,330,"#ffbf5c","v");
    ctx.strokeStyle="#ff806b";ctx.lineWidth=8;ctx.beginPath();ctx.arc(470,210,120,Math.PI/2,Math.PI*1.9);ctx.stroke();
  }
  if (revealed) evidenceCaption(ctx,type.includes("induction")||type.includes("emf")?"|ε| = N|ΔΦ|/Δt｜變化越快，感應越強":type.includes("radius")?"qvB = mv²/r｜r = 3.0 m":"磁力垂直運動／電流方向");
}

function drawOpticsEvidence(ctx, type, value, revealed) {
  const interfaceY=315, normalX=500;
  ctx.strokeStyle="#d8e6f5";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(150,interfaceY);ctx.lineTo(850,interfaceY);ctx.stroke();
  ctx.setLineDash([10,8]);ctx.strokeStyle="#b8c5d5";ctx.beginPath();ctx.moveTo(normalX,140);ctx.lineTo(normalX,470);ctx.stroke();ctx.setLineDash([]);
  arrow(ctx,250,145,normalX,interfaceY,"#ffbf5c","入射光");
  if(type.includes("reflection")) arrow(ctx,normalX,interfaceY,750,145,"#84a7ff","反射光");
  else if(type.includes("lens")) {ctx.strokeStyle="#b99cff";ctx.lineWidth=12;ctx.beginPath();ctx.arc(570,315,95,-Math.PI/2,Math.PI/2);ctx.arc(430,315,95,Math.PI/2,Math.PI*1.5);ctx.stroke();arrow(ctx,normalX,interfaceY,760,400,"#84a7ff","折射光");}
  else arrow(ctx,normalX,interfaceY,625,455,"#84a7ff","折射光");
  if(revealed) evidenceCaption(ctx,type.includes("critical")||type.includes("tir")?"高 n → 低 n 且 θ > θc：全反射":type.includes("lens")||type.includes("magnify")?"1/f = 1/do + 1/di｜光線幾何已驗證":"角度由法線量起｜n₁sinθ₁=n₂sinθ₂");
}

function drawThermalEvidence(ctx, type, value, revealed) {
  ctx.strokeStyle="#d4dce8";ctx.lineWidth=6;ctx.strokeRect(250,170,500,260);
  const hot = type.includes("flow") ? 70 : 35;
  for(let i=0;i<24;i++) { const x=285+(i%8)*60, y=210+Math.floor(i/8)*75; dot(ctx,x,y,i<12?"#ff806b":"#84a7ff",revealed&&i<12?hot/8:7); }
  if(type.includes("compress")){ctx.fillStyle="#ffbf5c";ctx.fillRect(240,revealed?230:150,520,28);arrow(ctx,500,125,500,revealed?220:145,"#ffbf5c","外界做功");}
  if (revealed) evidenceCaption(ctx,type.includes("flow")?"高溫 → 低溫，直到熱平衡":type.includes("gas")?"定容：P ∝ T（使用 K）":type.includes("firstlaw")?"ΔU = Q − Wby = 300 J":"能量帳目：熱、功與內能");
}

function drawCelestialEvidence(ctx, type, value, revealed) {
  const cx=500,cy=300;dot(ctx,cx,cy,"#ffbf5c",55);
  ctx.strokeStyle="rgba(145,168,255,.7)";ctx.lineWidth=4;
  const radius = type.includes("period")&&revealed?220:170;
  ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
  const sx=cx+radius,sy=cy;dot(ctx,sx,sy,"#91a8ff",20);
  arrow(ctx,sx,sy,sx,sy-120,"#65ded2","v");arrow(ctx,sx-8,sy,cx+75,cy,"#ff806b","a / Fg");
  if (revealed) evidenceCaption(ctx,type.includes("gravity")?"F ∝ 1/r²｜距離 2 倍，引力 1/4":type.includes("kepler")?"T² ∝ r³｜半徑 4 倍，週期 8 倍":"引力提供向心力｜軌道模型已驗證");
}

function drawNewtonEvidence(ctx, type, value, revealed) {
  if (type.includes("incline")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(170,410);ctx.lineTo(760,185);ctx.stroke();
    ctx.save();ctx.translate(500,285);ctx.rotate(-.36);ctx.fillStyle="#73c8ff";ctx.fillRect(-55,-40,110,80);ctx.restore();
    arrow(ctx,500,285,500,445,"#ff806b","mg");arrow(ctx,500,285,650,225,"#65ded2","mg sinθ");
    if(revealed) evidenceCaption(ctx,type.includes("calc")?"沿斜面：a = g sin30° = 4.9 m/s²":"沿斜面分量改變速度；正向力垂直斜面");
    return;
  }
  if (type.includes("projectile")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(165,190);ctx.lineTo(165,430);ctx.lineTo(820,430);ctx.stroke();
    ctx.strokeStyle="#73c8ff";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(210,210);ctx.quadraticCurveTo(480,220,760,420);ctx.stroke();
    arrow(ctx,215,210,385,210,"#65ded2","vx");arrow(ctx,565,320,565,430,"#ff806b","vy");
    if(revealed) evidenceCaption(ctx,type.includes("calc")?"t = 3 s｜水平距離 60 m":"水平等速・鉛直等加速｜共享同一時間");
    return;
  }
  drawCart(ctx,360,305,"#73c8ff",190);
  if(type.includes("inertia")) {
    arrow(ctx,360,250,690,250,"#ffd36d","速度 v");
  } else {
    arrow(ctx,550,332,760,332,"#65ded2","向右力");
    arrow(ctx,360,385,210,385,"#ff806b",type.includes("friction")?"摩擦":"反向力");
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
  const harmonics=type.includes("harmonic")?3:1;
  ctx.strokeStyle="#58e0d3";ctx.lineWidth=8;ctx.beginPath();
  for(let i=0;i<=240;i++){const t=i/240;const x=x0+(x1-x0)*t;const y=mid-120*Math.sin(harmonics*Math.PI*t);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  for(let n=0;n<=harmonics;n++) dot(ctx,x0+(x1-x0)*n/harmonics,mid,"#ffdc8b",9);
  if(type.includes("match")&&revealed){ctx.strokeStyle="rgba(181,140,255,.7)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(500,300,165,0,Math.PI*2);ctx.stroke();}
  if(revealed) evidenceCaption(ctx,type.includes("pitch")?"頻率決定音高・振幅主要影響響度":type.includes("match")?"驅動頻率 ≈ 固有頻率｜振幅達峰值":type.includes("harmonic")?"第三諧波：f₃ = 3f₁ = 600 Hz":type.includes("string")?"兩端固定基音：f₁ = v/(2L) = 200 Hz":type.includes("calc")?"v = fλ｜波長 0.80 m":"節點不動・腹點振幅最大");
}

function drawEMWaveEvidence(ctx, type, value, revealed) {
  if(type.includes("transformer")||type.includes("voltage")||type.includes("current")) {
    ctx.fillStyle="#695f58";ctx.fillRect(430,170,140,250);
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=8;
    for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(380,210+i*32,45,-Math.PI/2,Math.PI/2);ctx.stroke();}
    ctx.strokeStyle="#58e0d3";
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(620,250+i*55,45,Math.PI/2,Math.PI*1.5);ctx.stroke();}
    label(ctx,"初級",300,455,"#dce6f2",18);label(ctx,"次級",630,455,"#dce6f2",18);
    if(revealed) evidenceCaption(ctx,type.includes("current")?"理想功率守恆：120 V×1 A = 24 V×5 A":"電壓比 = 匝數比｜1000:200 → 120:24");
    return;
  }
  if(type.includes("generator")||type.includes("faraday")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=10;ctx.strokeRect(350,190,300,220);
    ctx.strokeStyle="#8e8bff";ctx.lineWidth=5;for(let x=190;x<=810;x+=70)arrow(ctx,x,405,x,185,"#8e8bff","");
    arrow(ctx,500,300,690,250,"#58e0d3","旋轉");
    if(revealed)evidenceCaption(ctx,type.includes("calc")?"|ε| = N|ΔΦ|/Δt = 30 V":"磁通量改變越快，感應電動勢越大");
    return;
  }
  const start=150,end=850,cy=300;
  ctx.strokeStyle="#8e8bff";ctx.lineWidth=7;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180,x=start+(end-start)*t,y=cy-100*Math.sin(t*Math.PI*4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  ctx.strokeStyle="#58e0d3";ctx.lineWidth=5;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180,x=start+(end-start)*t,y=cy-75*Math.cos(t*Math.PI*4);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  arrow(ctx,250,440,760,440,"#ffdc8b","傳播方向");
  if(revealed)evidenceCaption(ctx,type.includes("polarization")?"偏振片選擇電場振動方向":type.includes("wavelength")?"λ = c/f = 3.0 m":"交流週期反向｜電場、磁場與傳播方向互相垂直");
}

function drawQuantumEvidence(ctx, type, value, revealed) {
  if(type.includes("electron")) {
    ctx.strokeStyle="#dce6f2";ctx.lineWidth=8;ctx.strokeRect(180,185,640,235);
    ctx.fillStyle="#8e8bff";ctx.fillRect(215,220,22,165);ctx.fillStyle="#ff806b";ctx.fillRect(763,220,22,165);
    label(ctx,"陰極 −",190,165,"#d8c8ff",18);label(ctx,"陽極 +",735,165,"#ffb6ac",18);
    ctx.strokeStyle="#73c8ff";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(240,305);ctx.quadraticCurveTo(500,revealed?205:305,755,305);ctx.stroke();
    arrow(ctx,470,305,650,revealed?250:305,"#73c8ff","電子束");
    if(revealed)evidenceCaption(ctx,"外加場 ↑｜帶負電的電子束偏轉更明顯");
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
  } else {
    dot(ctx,500,levels[2],"#73c8ff",13);arrow(ctx,500,levels[2],500,levels[0],"#ffdc8b","ΔE");
  }
  if(revealed)evidenceCaption(ctx,type.includes("spectrum")?"n=3 → 2｜1.89 eV｜656 nm":type.includes("atom")?"現代原子：離散能階 + 機率分布":"能量以 hf 的離散份額交換");
}

function drawNuclearEvidence(ctx, type, value, revealed) {
  const cx=500,cy=290;
  for(let i=0;i<18;i++){const a=i*2.4,r=18+(i%4)*22;dot(ctx,cx+Math.cos(a)*r,cy+Math.sin(a)*r,i%2?"#ff7396":"#73c8ff",15);}
  if(type.includes("radiation")||type.includes("alpha")||type.includes("beta")) {
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
