const assert = require("node:assert/strict");
const fs = require("node:fs");
const data = require("../data.js");

const codes = [];
for (const temple of data.temples) {
  assert.equal(temple.tracks.foundation.length, 4, `${temple.id} foundation count`);
  assert.ok(temple.tracks.advanced.length >= 4, `${temple.id} advanced count`);
  for (const level of temple.tracks.foundation) {
    codes.push(level.code);
    assert.ok(level.prediction && level.reason && level.control, `${level.code} foundation loop incomplete`);
    assert.equal(level.models, undefined, `${level.code} must not require advanced model selection`);
    assert.equal(level.inputs, undefined, `${level.code} must not require numeric calculation`);
    assert.ok(level.assessedClaim && level.observableSchema && level.modelId && level.stateContract, `${level.code} missing state contract`);
  }
  for (const level of temple.tracks.advanced) {
    codes.push(level.code);
    assert.ok(level.models.length >= 3, `${level.code} needs model alternatives`);
    assert.ok(level.inputs.length >= 1, `${level.code} needs calculable output`);
    assert.ok(level.stateContract.outputSchema.every(field => field.id && Number.isFinite(field.tolerance)), `${level.code} missing output schema`);
    assert.ok(level.assessedClaim && level.observableSchema && level.modelId && level.stateContract, `${level.code} missing state contract`);
  }
}
assert.equal(new Set(codes).size, 137);

const water = data.temples.find(t => t.id === "ripple");
assert.match(water.tracks.foundation[0].stateContract.explanation, /頻率增加，波長縮短/);
assert.match(water.tracks.foundation[1].stateContract.explanation, /只改振幅不會改變/);
assert.match(water.tracks.foundation[3].stateContract.explanation, /干涉線數通常增加/);
assert.match(water.tracks.advanced[2].known.join(" "), /完整平面/);

for (const temple of data.temples) {
  for (const field of ["act", "region", "guardian", "relic", "crisis", "oath"]) assert.ok(temple[field], `${temple.id} missing ${field}`);
}

const measurement = data.temples.find(t => t.id === "uncertainty");
assert.equal(measurement.name, "無刻神殿");
assert.match(measurement.short, /量測不確定度/);
const quantum = data.temples.find(t => t.id === "quantum");
assert.match(quantum.tracks.foundation.map(level => level.skill).join(" "), /電子的發現.*電荷量子化.*量子論的發現.*原子模型/);
assert.match(quantum.tracks.advanced.map(level => level.skill).join(" "), /eV=hc\/λmin.*E=hf.*λ=h\/p.*ΔE/);
const nuclear = data.temples.find(t => t.id === "nuclear");
assert.match(nuclear.tracks.foundation.map(level => level.skill).join(" "), /強作用.*衰變.*半衰期.*基本交互作用/);
assert.match(nuclear.curriculum.advanced, /跨科銜接/);
const momentum = data.temples.find(t => t.id === "momentum");
assert.match(momentum.curriculum.foundation, /加深加廣選修/);
assert.match(water.curriculum.advanced, /必修.*選修/);
const byCode = Object.fromEntries(data.temples.flatMap(temple => [...temple.tracks.foundation, ...temple.tracks.advanced]).map(level => [level.code, level]));
const finalQuestions = {
  "G-F1": "當石臂開始轉動，你認為肘關節在其中扮演哪一種角色？",
  "W-F1": "當你將水眼的振動節奏（頻率由 2 Hz 增加到 4 Hz）加快時，池面的同心波紋會怎麼改變？",
  "W-F2": "提高水眼的起伏振幅後，池面的波紋主要會有什麼改變？",
  "W-F3": "喚醒第二座水眼，當兩座水眼以相同頻率振動時，水面會浮現什麼現象？",
  "W-F4": "當你將兩座水眼的距離拉得更開，交織出的節線與腹線分布會怎麼改變？",
  "H-F1": "熱石與冷石緊密接觸後，淨熱傳遞的方向為何？",
  "H-F2": "注入相同的熱量後，熱容量較小的那顆石球，溫度變化會比起另一顆如何？",
  "H-F3": "在氣室完全封死、維持定容的情況下持續加熱，牆上的壓力指針會如何改變？",
  "S-F1": "當你將兩顆星石的距離拉遠為 2 倍，它們之間的引力會變成原來的多少？",
  "S-F3": "當衛星被推向更外層的深空軌道（軌道半徑變大），它繞行母星的公轉週期會怎麼變？",
  "B-F1": "把兩根磁柱都轉成 N 極相對時，兩根磁柱之間會怎樣？",
  "EMW-F4": "兩片偏振石窗的軸由平行轉到互相垂直時，透射光強度會怎麼變化？",
  "NUC-F2": "當幽核深井中的原子核發生 α 衰變時，它的質量數會如何改變？",
  "QTM-F3": "這座黑體階梯所允許的能量，最合理的形式是？",
  "Q-F2": "這根正電石柱周圍的電場線，是指向哪一個方向？",
  "NWT-F2": "當拉索向右的合力逐漸增加時，這輛石車的加速度會如何改變？"
};
for (const [code, question] of Object.entries(finalQuestions)) assert.equal(byCode[code].prediction.question, question, `${code}: finalized story-question bridge drifted`);
assert.equal(byCode["G-F2"].prediction.question, "假設你用一樣大小的力氣去推，把手放在遠離門軸的邊緣 (30 cm)，比起靠近門軸處 (10 cm)，石門的轉動情形會...？", "G-F2 finalized text must remain unchanged");
assert.equal(byCode["G-F2"].control.step, 20, "G-F2 must expose only the two story conditions");
assert.doesNotMatch([byCode["H-F2"].mission, byCode["H-F2"].storyTeaser, byCode["H-F2"].storyProblem].join(" "), /熱能/, "H-F2 story layers must consistently use 熱量");
assert.equal(data.tracks.foundation.task, "觀念、讀圖與現象判斷");
assert.match(data.world.finale, /模型解釋現象.*證據不支持原先的判斷.*修正自己的解釋/);
const homeSource = fs.readFileSync(require.resolve("../home.js"), "utf8");
const indexSource = fs.readFileSync(require.resolve("../index.html"), "utf8");
assert.doesNotMatch(homeSource, /觀念與質性判斷|觀念與趨勢判斷/, "home cards must use the finalized foundation task");
assert.match(homeSource, /data\.tracks\.foundation\.task/, "home cards must project the canonical foundation task");
assert.doesNotMatch(indexSource, /留下證據|觀念與質性判斷|觀念與趨勢判斷/, "static home fallback must follow the finalized action-layer wording");
assert.match(indexSource, /留下刻痕.*觀念、讀圖與現象判斷/s, "static home fallback must include the finalized wording");
for (const temple of data.temples) assert.ok(temple.history && temple.history.length > 35, `${temple.id}: science-history inscription missing`);
for (const temple of data.temples) {
  for (const track of ["foundation", "advanced"]) {
    for (const level of temple.tracks[track]) {
      assert.ok(level.storyTeaser && level.storyProblem && Array.isArray(level.prePlanKnown), `${level.code}: story-first disclosure entry missing`);
      assert.ok(level.disclosureContract?.prePlan && level.disclosureContract?.afterRun && level.disclosureContract?.afterEvaluation, `${level.code}: six-layer disclosure contract missing`);
      assert.doesNotMatch(level.storyProblem, /現在請預測|操作變因|取得證據|鎖定質性預測/, `${level.code}: academic workflow label leaked into story problem`);
    }
  }
}

console.log("V5 learning contracts: 68 qualitative and 69 model-calculation levels separated OK");
