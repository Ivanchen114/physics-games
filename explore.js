(() => {
  "use strict";

  const world = window.TempleExploration;
  const data = window.TempleData;
  const canvas = document.querySelector("[data-maze-canvas]");
  const ctx = canvas.getContext("2d");
  const prompt = document.querySelector("[data-maze-prompt]");
  const action = document.querySelector("[data-gate-action]");
  const compass = document.querySelector("[data-compass-status]");
  const ledger = document.querySelector("[data-gate-ledger]");
  const count = document.querySelector("[data-explore-count]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EXPLORED_KEY = "law-temple-v5-explored-forecourt";
  const PLAYER_KEY = "law-temple-v5-maze-player";
  const FOUND_KEY = "law-temple-v5-found-gates";
  const rows = world.map.length;
  const columns = world.map[0].length;
  const gateAt = new Map();
  let start = { x: 1, y: 1 };

  world.map.forEach((row, y) => [...row].forEach((tile, x) => {
    if (tile === "S") start = { x, y };
    if (world.gates[tile]) gateAt.set(`${x},${y}`, tile);
  }));

  const explored = readSet(EXPLORED_KEY);
  const found = readSet(FOUND_KEY);
  let player = readPlayer();
  let nearbyGate = null;
  let lastMove = "down";
  let frameId = 0;

  window.TempleAudio?.setTheme("home");
  revealAroundPlayer();
  updateGateState(true);
  renderLedger();
  draw(performance.now());

  function readSet(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return new Set(Array.isArray(value) ? value : []);
    } catch { return new Set(); }
  }

  function saveSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify([...value])); } catch { /* Exploration still works for this visit. */ }
  }

  function readPlayer() {
    try {
      const saved = JSON.parse(localStorage.getItem(PLAYER_KEY) || "null");
      if (saved && isWalkable(saved.x, saved.y)) return { x: saved.x, y: saved.y };
    } catch { /* Use start. */ }
    return { ...start };
  }

  function savePlayer() {
    try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); } catch { /* Position persistence is optional. */ }
  }

  function isWalkable(x, y) {
    return Boolean(world.map[y]?.[x] && world.map[y][x] !== "#");
  }

  function revealAroundPlayer() {
    const radius = world.fogRadius;
    for (let y = player.y - radius; y <= player.y + radius; y += 1) {
      for (let x = player.x - radius; x <= player.x + radius; x += 1) {
        if (Math.hypot(x - player.x, y - player.y) <= radius + .35 && world.map[y]?.[x]) explored.add(`${x},${y}`);
      }
    }
    saveSet(EXPLORED_KEY, explored);
  }

  function visibleNow(x, y) {
    return Math.hypot(x - player.x, y - player.y) <= world.fogRadius + .35;
  }

  function move(direction) {
    const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = vectors[direction] || [0, 0];
    lastMove = direction;
    if (!isWalkable(player.x + dx, player.y + dy)) {
      prompt.textContent = "石牆阻斷了這條路；換一個方向尋找回聲。";
      window.TempleAudio?.play("damage");
      draw(performance.now());
      return;
    }
    player = { x: player.x + dx, y: player.y + dy };
    savePlayer();
    revealAroundPlayer();
    updateGateState();
    window.TempleAudio?.play("select");
    draw(performance.now());
  }

  function nearestGate() {
    let result = null;
    for (const [position, symbol] of gateAt) {
      const [x, y] = position.split(",").map(Number);
      const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
      if (distance <= 1 && (!result || distance < result.distance)) result = { symbol, x, y, distance };
    }
    return result;
  }

  function updateGateState(initial = false) {
    nearbyGate = nearestGate();
    for (const [position, symbol] of gateAt) {
      const [x, y] = position.split(",").map(Number);
      if (visibleNow(x, y) && !found.has(symbol)) {
        found.add(symbol);
        saveSet(FOUND_KEY, found);
        if (!initial) window.TempleAudio?.play("evidence");
      }
    }
    if (!nearbyGate) {
      action.disabled = true;
      action.textContent = "尚未靠近神殿門";
      compass.innerHTML = `<span>目前回聲</span><strong>探索中</strong><p>已踏查 ${explored.size} 格；發光石門會在三格內穿透迷霧。</p>`;
      prompt.textContent = "循著牆面與回聲前進；走過的道路會留下微光。";
    } else {
      const gate = world.gates[nearbyGate.symbol];
      const temple = data.temples.find(item => item.id === gate.templeId);
      const mission = nextMission(temple);
      action.disabled = false;
      action.textContent = `進入${gate.label}・${mission.label}`;
      action.dataset.href = mission.href;
      compass.innerHTML = `<span>法則回聲已鎖定</span><strong style="color:${gate.color}">${gate.label}</strong><p>${gate.topic}</p><small>${mission.copy}</small>`;
      prompt.textContent = `已抵達${gate.label}。按 Enter 或「進入神殿」開始試煉。`;
    }
    renderLedger();
  }

  function progress(track) {
    try {
      const value = JSON.parse(localStorage.getItem(`law-temple-v3-${track}-completed`) || "[]");
      return new Set(Array.isArray(value) ? value : []);
    } catch { return new Set(); }
  }

  function nextMission(temple) {
    const foundation = progress("foundation");
    const advanced = progress("advanced");
    const foundationLevel = temple.tracks.foundation.find(level => !foundation.has(level.code));
    if (foundationLevel) return {
      label: "初階殿", copy: `高一概念任務：${foundationLevel.title}`,
      href: `temple.html?temple=${temple.id}&track=foundation&level=${foundationLevel.code}`
    };
    const advancedLevel = temple.tracks.advanced.find(level => !advanced.has(level.code));
    if (advancedLevel) return {
      label: "進階殿", copy: `高二、高三模型任務：${advancedLevel.title}`,
      href: `temple.html?temple=${temple.id}&track=advanced&level=${advancedLevel.code}`
    };
    return { label: "回顧試煉", copy: "雙印已完成，可重新建立證據。", href: `temple.html?temple=${temple.id}&track=foundation` };
  }

  function renderLedger() {
    count.textContent = `已發現 ${found.size} / ${Object.keys(world.gates).length}`;
    ledger.innerHTML = Object.entries(world.gates).map(([symbol, gate]) => {
      const discovered = found.has(symbol);
      const temple = data.temples.find(item => item.id === gate.templeId);
      const f = progress("foundation");
      const a = progress("advanced");
      const done = temple.tracks.foundation.filter(level => f.has(level.code)).length + temple.tracks.advanced.filter(level => a.has(level.code)).length;
      const total = temple.tracks.foundation.length + temple.tracks.advanced.length;
      return `<article class="gate-entry ${discovered ? "found" : "hidden"}">
        <i style="--gate-color:${gate.color}" aria-hidden="true"></i>
        <div><strong>${discovered ? gate.label : "迷霧中的入口"}</strong><small>${discovered ? `${gate.topic}・${done}/${total} 關` : "尚未發現"}</small></div>
      </article>`;
    }).join("");
  }

  function enterGate() {
    if (!nearbyGate || !action.dataset.href) return;
    window.TempleAudio?.play("enter");
    window.location.href = action.dataset.href;
  }

  function draw(time) {
    cancelAnimationFrame(frameId);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(320, Math.round(rect.width || 900));
    const cssHeight = Math.round(cssWidth * rows / columns * .9);
    if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const cell = Math.min(width / columns, height / rows);
    const ox = (width - columns * cell) / 2;
    const oy = (height - rows * cell) / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05080d";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const tile = world.map[y][x];
        const px = ox + x * cell;
        const py = oy + y * cell;
        const isWall = tile === "#";
        ctx.fillStyle = isWall ? ((x + y) % 2 ? "#2a241e" : "#332a21") : ((x + y) % 2 ? "#141821" : "#171c26");
        ctx.fillRect(px, py, cell + .5, cell + .5);
        if (isWall) {
          ctx.strokeStyle = "rgba(246,189,74,.12)";
          ctx.strokeRect(px + 2, py + 2, cell - 4, cell - 4);
          ctx.fillStyle = "rgba(255,220,139,.035)";
          ctx.fillRect(px + 5, py + cell * .28, cell - 10, 2);
        } else {
          ctx.strokeStyle = "rgba(132,151,180,.055)";
          ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
        }
        if (world.gates[tile]) drawGate(px, py, cell, tile, time);
      }
    }

    drawPlayer(ox + (player.x + .5) * cell, oy + (player.y + .5) * cell, cell, time);
    drawFog(ox, oy, cell, width, height, time);
    drawDirection(ox + (player.x + .5) * cell, oy + (player.y + .5) * cell, cell);
    if (!reducedMotion) frameId = requestAnimationFrame(draw);
  }

  function drawGate(px, py, cell, symbol, time) {
    const gate = world.gates[symbol];
    const pulse = reducedMotion ? 1 : .82 + Math.sin(time / 420) * .12;
    ctx.save();
    ctx.shadowBlur = 18 * pulse;
    ctx.shadowColor = gate.color;
    ctx.strokeStyle = gate.color;
    ctx.lineWidth = Math.max(2, cell * .08);
    ctx.strokeRect(px + cell * .2, py + cell * .13, cell * .6, cell * .74);
    ctx.fillStyle = `${gate.color}33`;
    ctx.fillRect(px + cell * .27, py + cell * .22, cell * .46, cell * .58);
    ctx.fillStyle = gate.color;
    ctx.font = `900 ${cell * .34}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, px + cell / 2, py + cell * .51);
    ctx.restore();
  }

  function drawPlayer(x, y, cell, time) {
    const bob = reducedMotion ? 0 : Math.sin(time / 230) * cell * .035;
    const radius = cell * .22;
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 0, x, y, cell * 1.35);
    halo.addColorStop(0, "rgba(255,220,139,.5)");
    halo.addColorStop(.35, "rgba(246,189,74,.13)");
    halo.addColorStop(1, "rgba(246,189,74,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - cell * 1.4, y - cell * 1.4, cell * 2.8, cell * 2.8);
    ctx.translate(x, y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#fff4c7";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#f6bd4a";
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.fillStyle = "#7b4f1e";
    ctx.fillRect(-radius * .42, -radius * .42, radius * .84, radius * .84);
    ctx.restore();
  }

  function drawDirection(x, y, cell) {
    const direction = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[lastMove];
    ctx.save();
    ctx.translate(x + direction[0] * cell * .37, y + direction[1] * cell * .37);
    ctx.fillStyle = "#55e2db";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, cell * .055), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFog(ox, oy, cell, width, height, time) {
    const fog = ctx.createRadialGradient(
      ox + (player.x + .5) * cell, oy + (player.y + .5) * cell, cell * .7,
      ox + (player.x + .5) * cell, oy + (player.y + .5) * cell, cell * (world.fogRadius + .8)
    );
    fog.addColorStop(0, "rgba(2,5,9,0)");
    fog.addColorStop(.72, "rgba(2,5,9,.12)");
    fog.addColorStop(1, "rgba(2,5,9,.9)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        if (visibleNow(x, y)) continue;
        const discovered = explored.has(`${x},${y}`);
        const drift = reducedMotion ? 0 : Math.sin((x * 1.7 + y * 2.1) + time / 900) * .025;
        ctx.fillStyle = discovered ? `rgba(3,7,12,${.64 + drift})` : `rgba(1,3,6,${.965 + drift / 2})`;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell + 1, cell + 1);
      }
    }
  }

  document.querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", () => {
    move(button.dataset.move);
    canvas.focus({ preventScroll: true });
  }));
  action.addEventListener("click", enterGate);
  document.querySelector("[data-reset-exploration]").addEventListener("click", () => {
    explored.clear();
    found.clear();
    player = { ...start };
    nearbyGate = null;
    try {
      localStorage.removeItem(EXPLORED_KEY);
      localStorage.removeItem(FOUND_KEY);
      localStorage.removeItem(PLAYER_KEY);
    } catch { /* Reset current visit anyway. */ }
    revealAroundPlayer();
    updateGateState(true);
    prompt.textContent = "迷霧已重新展開；從前庭入口再次出發。";
    canvas.focus({ preventScroll: true });
    draw(performance.now());
  });
  document.addEventListener("keydown", event => {
    if (event.target.matches("input, textarea, select")) return;
    const keys = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
    if (keys[event.key]) {
      event.preventDefault();
      move(keys[event.key]);
    } else if (event.key === "Enter" && nearbyGate) {
      event.preventDefault();
      enterGate();
    }
  });
  window.addEventListener("resize", () => draw(performance.now()));
})();
