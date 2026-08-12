(function (root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.TempleExploration = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return {
    id: "lost-forecourt",
    title: "失序前庭",
    subtitle: "五座先遣門散落在迷霧中；循著法則回聲，找回通往神殿的路。",
    fogRadius: 3,
    map: [
      "#####################",
      "#S....#.......#....T#",
      "#.....#.......#.....#",
      "#.....#####.###.....#",
      "#...........#.......#",
      "###.#####...#...###.#",
      "#...#...#..C..#.....#",
      "#...#...#.....#.....#",
      "#...###.###.#####...#",
      "#.......#....W......#",
      "#..P....#...........#",
      "#.................U.#",
      "#####################"
    ],
    gates: {
      T: { templeId: "titans", label: "巨人神殿", topic: "支點、力矩與人體生物力學", color: "#f6bd4a" },
      C: { templeId: "chrono", label: "時軌神殿", topic: "運動圖像、速度與加速度", color: "#64d9ff" },
      P: { templeId: "photo", label: "古光神殿", topic: "光電效應與光子的能量", color: "#76a9ff" },
      W: { templeId: "ripple", label: "水之神殿", topic: "波形、干涉與節腹線", color: "#55e2db" },
      U: { templeId: "uncertainty", label: "無刻神殿", topic: "量測、不確定度與證據", color: "#c3a6ff" }
    }
  };
});
