const data = window.TempleData;
const foundationCompleted = readProgress("foundation");
const advancedCompleted = readProgress("advanced");

function readProgress(track) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`law-temple-v3-${track}-completed`) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

document.querySelector("[data-foundation-total]").textContent = `${foundationCompleted.size} / ${data.totals.foundation}`;
document.querySelector("[data-advanced-total]").textContent = `${advancedCompleted.size} / ${data.totals.advanced}`;

document.querySelector("[data-temple-grid]").innerHTML = data.temples.map(temple => {
  const foundation = temple.tracks.foundation.filter(level => foundationCompleted.has(level.code)).length;
  const advanced = temple.tracks.advanced.filter(level => advancedCompleted.has(level.code)).length;
  return `<article class="temple-card" style="--card-image:url('${temple.heroImage}')">
    <span class="temple-number">TEMPLE ${temple.number} · ${temple.eyebrow}</span>
    <h2>${temple.name}</h2>
    <p class="theme">${temple.description}</p>
    <div class="track-doors">
      <a class="track-door foundation" href="temple.html?temple=${temple.id}&track=foundation">
        <strong>初階殿｜高一必修</strong><small>${foundation} / ${temple.tracks.foundation.length}・觀念與質性判斷</small><span>→</span>
      </a>
      <a class="track-door advanced" href="temple.html?temple=${temple.id}&track=advanced">
        <strong>進階殿｜高二、高三</strong><small>${advanced} / ${temple.tracks.advanced.length}・模型與計算</small><span>→</span>
      </a>
    </div>
  </article>`;
}).join("");
