const data = window.TempleData;
const foundationCompleted = readProgress("foundation");
const advancedCompleted = readProgress("advanced");
const profile = readProfile();

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

document.querySelector("[data-temple-grid]").innerHTML = data.temples.map(temple => {
  const foundation = temple.tracks.foundation.filter(level => foundationCompleted.has(level.code)).length;
  const advanced = temple.tracks.advanced.filter(level => advancedCompleted.has(level.code)).length;
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
