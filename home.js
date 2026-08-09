const data = window.TempleData;
const foundationCompleted = readProgress("foundation");
const advancedCompleted = readProgress("advanced");
const profile = readProfile();
window.TempleAudio?.setTheme("home");

function readProgress(track) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`law-temple-v3-${track}-completed`) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function readProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem("law-temple-v4-player") || "{}");
    return { xp: Number(parsed.xp) || 0, streak: Number(parsed.streak) || 0, bestStreak: Number(parsed.bestStreak) || 0, relics: Array.isArray(parsed.relics) ? parsed.relics : [], levels: parsed.levels || {} };
  } catch {
    return { xp: 0, streak: 0, bestStreak: 0, relics: [], levels: {} };
  }
}

function playerRank(xp) {
  if (xp >= 8000) return "天穹法則師";
  if (xp >= 4500) return "十二殿巡禮者";
  if (xp >= 2200) return "證據鍛造者";
  if (xp >= 900) return "雙印解讀者";
  if (xp >= 300) return "神火行者";
  return "法則見習者";
}

function completedInTemple(temple, track) {
  const progress = track === "foundation" ? foundationCompleted : advancedCompleted;
  return temple.tracks[track].filter(level => progress.has(level.code)).length;
}

function nextMission() {
  for (const track of ["foundation", "advanced"]) {
    const progress = track === "foundation" ? foundationCompleted : advancedCompleted;
    for (const temple of data.temples) {
      const level = temple.tracks[track].find(item => !progress.has(item.code));
      if (level) return { temple, track, level };
    }
  }
  return null;
}

document.querySelector("[data-foundation-total]").textContent = `${foundationCompleted.size} / ${data.totals.foundation}`;
document.querySelector("[data-advanced-total]").textContent = `${advancedCompleted.size} / ${data.totals.advanced}`;
const perfect = Object.values(profile.levels).filter(result => result && result.mistakes === 0 && !result.usedHint).length;
document.querySelector("[data-player-profile]").innerHTML = `
  <div><span>修復者階級</span><strong>${playerRank(profile.xp)}</strong></div>
  <div><span>法則經驗</span><strong>${profile.xp} XP</strong></div>
  <div><span>無傷刻印</span><strong>${perfect}</strong></div>
  <div><span>最長連勝</span><strong>${profile.bestStreak}</strong></div>
  <div><span>雙印遺物</span><strong>${profile.relics.length} / ${data.temples.length}</strong></div>`;

document.querySelector("[data-world-story]").innerHTML = `
  <div><p class="eyebrow">WORLD PROLOGUE</p><h2 id="world-title">${data.world.title}</h2><strong>${data.world.role}</strong></div>
  <div><p>${data.world.premise}</p><p>${data.world.mission}</p><p class="finale-note">${data.world.finale}</p></div>`;

const mission = nextMission();
const totalCompleted = foundationCompleted.size + advancedCompleted.size;
const campaignHref = mission ? `temple.html?temple=${mission.temple.id}&track=${mission.track}&level=${mission.level.code}` : "temple.html?temple=celestial&track=advanced";
const campaignTitle = mission ? `${mission.temple.name}・${mission.level.title}` : "十二刻印已全數共鳴";
const campaignCopy = mission
  ? `${mission.track === "foundation" ? "初階殿" : "進階殿"}推薦任務；這只是遠征指引，你仍可自由選擇任何神殿。`
  : "你已完成失序紀元的全部試煉，仍可返回任一機關重建證據。";
const actOrder = [...new Set(data.temples.map(temple => temple.act))];
const actCards = actOrder.map(act => {
  const temples = data.temples.filter(temple => temple.act === act);
  const total = temples.reduce((sum, temple) => sum + temple.tracks.foundation.length + temple.tracks.advanced.length, 0);
  const done = temples.reduce((sum, temple) => sum + completedInTemple(temple, "foundation") + completedInTemple(temple, "advanced"), 0);
  const relics = temples.filter(temple => profile.relics.includes(temple.id)).length;
  const state = done === total ? "完成共鳴" : done > 0 ? "遠征中" : "等待探索";
  return `<article class="act-card ${done > 0 && done < total ? "current" : ""}">
    <div><span>${act}</span><strong>${state}</strong></div>
    <p>${temples.map(temple => temple.name.replace("神殿", "")).join("・")}</p>
    <div class="act-progress" role="progressbar" aria-label="${act}完成進度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${total ? done / total * 100 : 0}%"></span></div>
    <small>${done} / ${total} 關・${relics} / ${temples.length} 遺物</small>
  </article>`;
}).join("");

document.querySelector("[data-campaign]").innerHTML = `
  <div class="campaign-mission">
    <p class="eyebrow">NEXT EXPEDITION · ${totalCompleted} / ${data.totals.foundation + data.totals.advanced}</p>
    <h2>${campaignTitle}</h2><p>${campaignCopy}</p>
    <div class="campaign-actions"><a class="campaign-cta" href="${campaignHref}">${mission ? "繼續遠征" : "重訪終幕"}<span aria-hidden="true">→</span></a><a class="campaign-secondary" href="#temple-selection">自由選殿</a></div>
  </div>
  <ol class="game-loop" aria-label="每關三步循環">
    <li><span>01</span><div><strong>先預測</strong><small>在結果出現前，先押下自己的判斷。</small></div></li>
    <li><span>02</span><div><strong>操作取證</strong><small>改變變因，讓圖像與數值留下證據。</small></div></li>
    <li><span>03</span><div><strong>解釋修正</strong><small>用證據選模型；答錯也能回溯再試。</small></div></li>
  </ol>
  <div class="act-map" aria-label="四幕遠征地圖">${actCards}</div>`;

document.querySelector("[data-temple-grid]").innerHTML = data.temples.map(temple => {
  const foundation = completedInTemple(temple, "foundation");
  const advanced = completedInTemple(temple, "advanced");
  const relicFound = profile.relics.includes(temple.id);
  return `<article class="temple-card" style="--card-image:url('${temple.heroImage}')">
    <span class="temple-number">TEMPLE ${temple.number} · ${temple.eyebrow}</span>
    <span class="act-label">${temple.act}</span>
    <h2>${temple.name}</h2>
    <p class="theme">${temple.description}</p>
    <p class="guardian-line"><span>守護者</span>${temple.guardian}・<strong>${relicFound ? `${temple.relic} 已取得` : temple.relic}</strong></p>
    <div class="track-doors">
      <a class="track-door foundation" href="temple.html?temple=${temple.id}&track=foundation">
        <strong>初階殿｜高一基礎概念</strong><small>${foundation} / ${temple.tracks.foundation.length}・觀念與質性判斷</small><span>→</span>
      </a>
      <a class="track-door advanced" href="temple.html?temple=${temple.id}&track=advanced">
        <strong>進階殿｜高二、高三</strong><small>${advanced} / ${temple.tracks.advanced.length}・加深加廣計算</small><span>→</span>
      </a>
    </div>
  </article>`;
}).join("");
