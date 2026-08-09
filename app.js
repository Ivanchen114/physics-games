const data = window.TempleData;
const physics = window.TemplePhysics;
const main = document.querySelector("#main");
const params = new URLSearchParams(location.search);
const temple = data.temples.find(item => item.id === params.get("temple")) || data.temples[0];
const track = params.get("track") === "advanced" ? "advanced" : "foundation";
const route = data.tracks[track];
const levels = temple.tracks[track];
const completed = readProgress(track);
let attempts = 0;
let hintOpen = false;

document.body.dataset.track = track;
document.documentElement.style.setProperty("--temple-color", temple.color);

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
  document.title = `${temple.name}・${route.label}｜法則神殿 v3`;
  const finished = levels.filter(level => completed.has(level.code)).length;
  main.innerHTML = `<section class="map-page">
    ${topbar(temple.name, `${finished} / ${levels.length}`, "home")}
    <header class="map-hero" style="--hero-image:url('${temple.heroImage}')">
      <div class="map-hero-content">
        <p class="eyebrow">TEMPLE ${temple.number} · ${temple.eyebrow}</p>
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
  main.querySelectorAll("[data-level]").forEach(button => button.addEventListener("click", () => setLocation(button.dataset.level)));
}

function renderStage(level, index) {
  attempts = 0;
  hintOpen = false;
  document.title = `${level.title}｜${temple.name} ${route.label}`;
  main.innerHTML = `<section class="stage-page">
    ${topbar(`${temple.name} · ${route.label}`, `${index + 1} / ${levels.length}`, "map")}
    <div class="shell stage-layout">
      <aside class="brief-panel">
        <span class="route-badge">${route.grade} · ${route.task}</span>
        <h1>${level.title}</h1><p class="mission">${level.mission}</p>
        <div class="metadata"><div><span>任務類型</span><strong>${level.skill}</strong></div><div><span>需要能力</span><strong>${level.prerequisites}</strong></div><div><span>預估時間</span><strong>${level.time}</strong></div></div>
        <section class="known"><h2>已知條件</h2><ul>${level.known.map(item => `<li>${item}</li>`).join("")}</ul></section>
        <section class="hint-box"><button type="button" data-hint>查看一層線索</button><p data-hint-text aria-live="polite"></p></section>
      </aside>
      <div class="game-panel">
        <figure class="scene-frame"><img src="${level.image}" alt="${level.title}的神殿情境圖"><canvas class="evidence-canvas" width="1000" height="562" data-canvas aria-label="程式繪製的物理證據圖"></canvas><figcaption class="scene-caption">情境圖只提供故事；向量、圖線、刻度與數值由程式繪製。</figcaption></figure>
        ${track === "foundation" ? foundationChallenge(level, index) : advancedChallenge(level, index)}
      </div>
    </div>
  </section>`;
  main.querySelector("[data-back]").addEventListener("click", () => setLocation(null));
  main.querySelector("[data-hint]").addEventListener("click", event => {
    hintOpen = !hintOpen;
    main.querySelector("[data-hint-text]").textContent = hintOpen ? level.hint : "";
    event.currentTarget.textContent = hintOpen ? "收起線索" : "查看一層線索";
  });
  if (track === "foundation") bindFoundation(level, index);
  else bindAdvanced(level, index);
  drawVisual(level, { value: level.control?.base, revealed: false });
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
    selectedPrediction = button.dataset.prediction;
    selectOne("[data-prediction]", button);
    lock.disabled = false;
  }));
  lock.addEventListener("click", () => {
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
    drawVisual(level, { value, revealed: true });
    reasonStep.classList.add("visible");
    feedback.className = "feedback";
    feedback.textContent = selectedPrediction === level.prediction.correct ? "證據已出現，而且與你的預測一致。現在選出因果理由。" : "證據已出現，但和你的預測不同。仍請先根據證據判斷原因。";
  });
  main.querySelectorAll("[data-reason]").forEach(button => button.addEventListener("click", () => {
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
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>機關尚未接受這條解釋。</strong><br>${predictionOK ? "預測正確；再比較三個理由與畫面證據。" : "預測和證據不一致；請重新進入本關修正整條因果鏈。"}<br><button type="button" class="secondary-button next-button" data-retry>重新預測</button>`;
      main.querySelector("[data-retry]").addEventListener("click", () => renderStage(level, index));
    }
  });
}

function bindAdvanced(level, index) {
  let selectedModel = null;
  let evidenceValid = false;
  const feedback = main.querySelector("[data-feedback]");
  const calculation = main.querySelector("[data-calculation-step]");
  main.querySelectorAll("[data-model]").forEach(button => button.addEventListener("click", () => {
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
    drawVisual(level, { revealed: true, values, modelOK, valuesOK });
    markChoice("model", level.correctModel);
    if (modelOK && valuesOK) completeLevel(level, index, feedback);
    else {
      const wrongFields = results.filter(result => !result.ok).map(result => level.inputs.find(field => field.id === result.id).label);
      feedback.className = "feedback bad";
      feedback.innerHTML = `<strong>模型或數值尚未平衡。</strong><br>${modelOK ? "模型正確；請重算：" + wrongFields.join("、") : "先回到已知條件，確認你選的物理關係。"}`;
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
  completed.add(level.code);
  saveProgress();
  feedback.className = "feedback ok";
  feedback.innerHTML = `<strong>法則刻印已取得。</strong><br>${level.explanation}<br><button type="button" class="primary-button next-button" data-next>${index + 1 < levels.length ? "前往下一關" : "返回關卡地圖"}</button>`;
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

window.addEventListener("popstate", render);
render();
