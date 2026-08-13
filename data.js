(function (root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.TempleData = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const option = (value, label) => ({ value, label });
  const prediction = (question, labels) => ({ question, options: labels.map(([value, label]) => option(value, label)) });
  const reason = (question, labels) => ({ question, options: labels.map(([value, label]) => option(value, label)) });
  const control = (label, base, target, min, max, step, unit, kind = "variable") => ({ label, base, target, min, max, step, unit, kind });
  const input = (id, label, unit, tolerance) => ({ id, label, unit, tolerance });
  const previewGeometryFor = level => {
    if (level.code === "G-F2") return ["stone-door", "door-hinge", "door-candidates", "selected-force"];
    if (level.code === "O-F3") return ["optical-boundary", "surface-normal", "incident-ray"];
    if (level.code === "NWT-F4") return ["launch-platform", "time-dial"];
    if (level.code === "S-F3") return ["central-body", "radius-dial"];
    return level.control?.kind === "reveal" ? ["apparatus-silhouette"] : ["control-dial"];
  };

  const temples = [
    {
      id: "titans", number: "01", eyebrow: "BIOMECHANICS", name: "巨人神殿", short: "生物力學",
      description: "從支點與姿勢建立人體力矩直覺，再以靜力平衡解開巨人的肌肉負荷。",
      heroImage: "assets/titans/biceps.webp", color: "#f6bd4a",
      tracks: {
        foundation: [
          { code: "G-F1", title: "支點之眼", summary: "辨認肘關節、二頭肌拉力與石球重力。", mission: "先確認肘關節在前臂槓桿中的角色，再喚醒機關，觀察石臂的轉動情況。", skill: "辨認常見作用力", prerequisites: "讀圖", time: "30–60 秒", image: "assets/titans/biceps.webp", visual: "pivot", known: ["前臂托住石球", "肘關節是前臂轉動中心", "二頭肌在肘部附近斜向上拉前臂", "石球重力由球心鉛直向下"], control: control("喚醒肘關節轉動", 0, 1, 0, 1, 1, "", "reveal"), prediction: prediction("當石臂開始轉動，你認為肘關節在其中扮演哪一種角色？",[["pivot","支點"],["effort","施力點"],["load","阻力點"]]), reason: reason("為什麼肘關節是支點？",[["rotate","前臂繞它轉動"],["heavy","它最重"],["muscle","它會產生肌力"]]), explanation: "支點是物體轉動所繞的固定位置；在這個模型中，前臂繞肘關節轉動。", hint: "先找出姿勢改變時，哪個位置是旋轉中心。" },
          { code: "G-F2", title: "距離之力", summary: "同樣的力離支點越遠，轉動效果越明顯。", mission: "你必須獨自推開厚重的巨人石門；你該推靠近門軸的內側，還是遠離門軸的邊緣？", skill: "比較力臂", prerequisites: "距離比較", time: "30–60 秒", image: "assets/titans/triceps.webp", visual: "lever-distance", known: ["兩次推力大小相同", "推力方向相同", "只改變施力點到支點的距離"], control: control("施力點距離", 10, 30, 10, 30, 20, "cm"), prediction: prediction("假設你用一樣大小的力氣去推，把手放在遠離門軸的邊緣 (30 cm)，比起靠近門軸處 (10 cm)，石門的轉動情形會...？",[["increase","更容易被轉開"],["same","一樣難推轉"],["decrease","更難被轉開"]]), reason: reason("為什麼邊緣比較好推開？",[["farther","推力離門軸更遠，產生的轉動效果更強"],["mass","因為門邊緣的石頭比較輕"],["friction","因為推邊緣時門軸的摩擦力比較小"]]), explanation: "力的大小與方向不變時，作用位置離支點越遠，產生的力矩越大，轉動效果越明顯。", hint: "想像推門時，你會推門把還是靠近鉸鏈的位置？" },
          { code: "G-F3", title: "方向之門", summary: "比較沿骨骼與接近垂直的施力方向。", mission: "古代肌索可以改變拉力方向；你要找出最能讓前臂轉動的方向。", skill: "判斷力的方向", prerequisites: "辨認夾角", time: "45–75 秒", image: "assets/titans/triceps.webp", visual: "force-direction", known: ["力的大小固定", "施力點固定", "只改變拉力方向"], control: control("拉力與前臂夾角", 15, 90, 15, 90, 15, "°"), prediction: prediction("夾角由 15° 接近 90°，轉動效果通常如何？",[["increase","變大"],["same","不變"],["decrease","變小"]]), reason: reason("關鍵原因是什麼？",[["perpendicular","垂直於骨骼的分量變大"],["bone","骨骼會變長"],["weight","石球重量變小"]]), explanation: "同樣大小的力越接近垂直於力臂，越能造成轉動；沿著骨骼拉時多半只造成拉伸或壓縮。", hint: "把力想成可分成沿骨骼與垂直骨骼兩部分。" },
          { code: "G-F4", title: "省力姿勢", summary: "從距離與方向選出較省力的持物姿勢。", mission: "巨人必須搬運石球穿越長廊；選錯姿勢會讓肌肉過早疲勞。", skill: "整合距離與方向", prerequisites: "支點、力的方向", time: "45–90 秒", image: "assets/titans/deadlift.webp", visual: "posture", known: ["石球重量相同", "比較石球靠近與遠離身體", "臀大肌等髖伸肌群抵抗石球造成的轉動", "簡化模型取髖伸肌群等效力臂固定為 5 cm"], control: control("石球離身體距離", 45, 15, 15, 45, 5, "cm"), prediction: prediction("把石球由離身體 45 cm 收近到 15 cm，肌肉負擔通常如何？",[["decrease","減少"],["same","不變"],["increase","增加"]]), reason: reason("最直接的理由是什麼？",[["shorter","重力到支點的距離縮短"],["lighter","石球質量變小"],["gravity","重力方向改變"]]), explanation: "把負重靠近支點可縮短重力力臂；在等效肌肉力臂固定的模型中，髖伸肌群所需拉力會同步減少。", hint: "負重沒有變輕，真正改變的是它到髖關節的距離。" }
        ],
        advanced: [
          { code: "G-A1", title: "二頭肌之力", summary: "以第三級槓桿求肌肉需要的拉力。", mission: "石球力矩必須由靠近肘部附著的二頭肌平衡。", skill: "力矩平衡", prerequisites: "代數、力矩", time: "60–120 秒", image: "assets/titans/biceps.webp", visual: "biceps", known: ["石球重力 50 N，距肘 30 cm", "二頭肌力臂 5.0 cm", "前臂靜止"], models: [option("balance","F肌 × 5 = 50 × 30"),option("force","F肌 = 50 N"),option("inverse","F肌 × 30 = 50 × 5")], inputs: [input("force","二頭肌拉力","N",1)], explanation: "力矩平衡給出 F肌×5 = 50×30，因此二頭肌需提供 300 N。", hint: "支點取在肘關節，先比較肌肉與石球的力臂。" },
          { code: "G-A2", title: "三頭肌之謎", summary: "使用 150° 夾角計算石球重力。", mission: "過頭托球的封印採用畫面幾何：力臂向量與向下重力夾角為 150°。", skill: "τ = rF sinθ", prerequisites: "三角函數、力矩", time: "75–150 秒", image: "assets/titans/triceps.webp", visual: "triceps", known: ["三頭肌拉力 300 N", "三頭肌等效力臂 5.0 cm", "石球距肘 30 cm", "力臂向量與重力夾角 150°"], models: [option("sine","300×5 = W×30×sin150°"),option("cosine","300×5 = W×30×cos150°"),option("noangle","300×5 = W×30")], inputs: [input("weight","石球重力","N",1)], explanation: "sin150°=0.5；300×5 = W×30×0.5，所以 W=100 N。", hint: "力矩使用力臂向量與力的夾角；sin150° 等於 sin30°。" },
          { code: "G-A3", title: "硬舉之重", summary: "整合上半身、石球與髖伸肌的多力矩平衡。", mission: "髖關節封印同時承受軀幹與石輪兩個外力矩。", skill: "多力矩平衡", prerequisites: "代數、力矩加總", time: "90–180 秒", image: "assets/titans/deadlift.webp", visual: "deadlift", known: ["上半身重力 300 N，力臂 40 cm", "石球重力 W，力臂 60 cm", "髖肌力 2250 N，力臂 8 cm"], models: [option("sum","2250×8 = 300×40 + W×60"),option("single","2250×8 = W×60"),option("subtract","2250×8 + 300×40 = W×60")], inputs: [input("weight","石球重力","N",1)], explanation: "髖肌力矩 18000 N·cm 必須同時平衡軀幹 12000 N·cm 與石球力矩，因此 W=100 N。", hint: "不要漏掉上半身重量，它與石球對髖部造成同方向力矩。" },
          { code: "G-A4", title: "阿基里斯之踵", summary: "以踝關節為支點完成足部靜力平衡。", mission: "踮腳機關要求你辨認阿基里斯腱與地面正向力對踝關節造成的反向力矩。", skill: "人體足部的力矩平衡", prerequisites: "力矩、靜力平衡", time: "90–180 秒", image: "assets/titans/achilles.webp", visual: "achilles", known: ["阿基里斯腱張力 3000 N，等效力臂 5.0 cm", "前腳掌正向力 N，力臂 15 cm", "踝關節力通過支點，不產生力矩", "足部保持靜止"], models: [option("ankle","3000×5 = N×15"),option("same","N=3000"),option("inverse","3000×15 = N×5")], inputs: [input("normal","前腳掌正向力","N",5)], explanation: "以踝關節為支點，阿基里斯腱與前腳掌正向力造成反向力矩：3000×5=N×15，所以 N=1000 N。", hint: "踝關節的接觸力通過支點；只比較支點兩側兩條鉛直作用線的力矩。" }
        ]
      }
    },
    {
      id: "chrono", number: "02", eyebrow: "MOTION & GRAPHS", name: "時空軌跡修復者", short: "運動學",
      description: "從位置—時間圖判斷速度與相遇，再以運動方程修復追擊與煞車事件。",
      heroImage: "assets/chrono/time-1.webp", color: "#64d9ff",
      tracks: {
        foundation: [
          { code:"C-F1",title:"誰跑得快",summary:"位置—時間圖越陡，物體運動越快。",mission:"兩列時空列車留下不同斜率的軌跡；比較兩列的速度大小。",skill:"判讀位置—時間圖",prerequisites:"座標圖",time:"30–60 秒",image:"assets/chrono/time-1.webp",visual:"xt-slope",known:["橫軸為時間","縱軸為位置","比較相同時間內位置改變"],control:control("青色軌跡陡峭度",1,3,1,3,1,"級"),prediction:prediction("青色軌跡變得更陡時，青色列車的速度如何？",[["increase","變快"],["same","不變"],["decrease","變慢"]]),reason:reason("圖像中留下了什麼線索？",[["more-position","相同時間內位置改變更多"],["higher","線畫得比較高所以質量大"],["color","青色代表高速"]]),explanation:"位置—時間圖的斜率代表速度；相同時間內位置改變越多，線越陡、速度越大。",hint:"固定一段相同的時間，比較兩條線上升多少。"},
          { code:"C-F2",title:"相遇之兆",summary:"兩條位置—時間軌跡的交點代表同時同地。",mission:"找出兩列車在時空圖上真正會合的訊號。",skill:"辨認圖線交點",prerequisites:"座標圖",time:"30–60 秒",image:"assets/chrono/time-2.webp",visual:"xt-meet",known:["兩條線描述兩列車的位置","同一橫座標代表同一時間","同一縱座標代表同一位置"],control:control("觀察時間",0,6,0,6,1,"s"),prediction:prediction("觀察時間移到兩條線交點時，兩列車發生什麼事？",[["meet","同時到達同一位置"],["speed","速度一定相同"],["stop","同時停止"]]),reason:reason("為什麼交點表示相遇？",[["same-coordinates","時間與位置座標都相同"],["same-slope","兩線斜率永遠相同"],["same-color","兩線顏色接近"]]),explanation:"圖線交點的橫、縱座標同時相同，代表兩物體在同一時刻位於同一位置。",hint:"相遇需要同時滿足『同一時間』與『同一位置』。"},
          { code:"C-F3",title:"追擊預言",summary:"後車速度必須較大，才可能縮短領先距離。",mission:"橙車已先行，青車必須選擇能逐漸追近的速度狀態。",skill:"相對運動概念",prerequisites:"快慢比較",time:"45–75 秒",image:"assets/chrono/time-3.webp",visual:"chase",known:["橙車在前方","兩車同方向","青車從後方追趕"],control:control("青車相對速度",0,2,0,2,1,"級"),prediction:prediction("當青車比橙車更快時，兩車距離如何變化？",[["decrease","逐漸縮短"],["same","保持不變"],["increase","逐漸增加"]]),reason:reason("關鍵原因是什麼？",[["relative","後車每秒前進得更多"],["front","前車一定會停下"],["mass","後車質量較大"]]),explanation:"同方向運動時，後車速度較大才具有正的追近速度，兩車間距會逐漸縮短。",hint:"每經過一秒，比較兩車各自前進的距離。"},
          { code:"C-F4",title:"煞車曲線",summary:"辨認速度下降、停止與越過星門的圖像特徵。",mission:"列車必須在星門前讓速度降到零；選出正確的速度—時間軌跡。",skill:"判讀速度—時間圖",prerequisites:"圖形趨勢",time:"45–90 秒",image:"assets/chrono/time-4.webp",visual:"brake",known:["橫軸為時間","縱軸為速度","速度降到 0 代表停止"],control:control("煞車強度",1,3,1,3,1,"級"),prediction:prediction("煞車變強時，速度降到 0 所需時間如何？",[["decrease","縮短"],["same","不變"],["increase","拉長"]]),reason:reason("在速度—時間圖上會看到什麼？",[["steeper-down","下降線更陡並較早碰到 0"],["up","線向上升"],["flat","線保持水平"]]),explanation:"較強煞車使速度下降更快，因此速度—時間線向下更陡，也更早到達零。",hint:"先找出圖上代表停止的 v=0 水平軸。"}
        ],
        advanced: [
          { code:"C-A1",title:"等速會合",summary:"由距離與時間求維持會合所需速度。",mission:"青車必須在 20 秒後抵達 120 公尺外的事件點。",skill:"等速運動",prerequisites:"v=Δx/Δt",time:"60–100 秒",image:"assets/chrono/time-1.webp",visual:"chrono-uniform",known:["位移 120 m","允許時間 20 s","等速直線運動"],models:[option("uniform","v = Δx / Δt"),option("accel","Δx = ½at²"),option("momentum","p = mv")],inputs:[input("speed","列車速度","m/s",.05)],explanation:"v=120/20=6 m/s。",hint:"題目沒有加速資訊，使用等速位移關係。"},
          { code:"C-A2",title:"加速會合",summary:"由靜止出發的位移與時間求加速度。",mission:"青車由靜止穿越 100 公尺長的加速環廊，必須在 10 秒抵達。",skill:"等加速度",prerequisites:"x=v₀t+½at²",time:"75–130 秒",image:"assets/chrono/time-2.webp",visual:"chrono-accel",known:["初速 0 m/s","位移 100 m","時間 10 s","加速度固定"],models:[option("accel","x = ½at²"),option("uniform","x = vt"),option("energy","v² = 2ax，直接令 v=10")],inputs:[input("acceleration","加速度","m/s²",.03)],explanation:"100=½×a×10²，所以 a=2 m/s²。",hint:"由靜止出發，初速項為零。"},
          { code:"C-A3",title:"延遲追擊",summary:"使用相對速度處理先行與延遲。",mission:"橙車以 4 m/s 先行 10 秒，青車再以 8 m/s 出發。",skill:"相對速度",prerequisites:"等速、代數",time:"75–140 秒",image:"assets/chrono/time-3.webp",visual:"chrono-delay",known:["橙車速度 4 m/s","橙車先行 10 s","青車速度 8 m/s"],models:[option("relative","t = 先行距離 / (8−4)"),option("sum","t = 先行距離 / (8+4)"),option("ignore","t = 先行距離 / 8")],inputs:[input("time","青車出發後追上時間","s",.1)],explanation:"橙車先行 40 m，追近速度為 4 m/s，所以需 10 s。",hint:"先算領先距離，再用兩車速度差求追近時間。"},
          { code:"C-A4",title:"煞車收束",summary:"承接上游入站速度，以固定減速度求停止距離。",mission:"列車承接「延遲追擊」留下的入站速度與星門前可用距離；固定減速度為 4 m/s²。",skill:"等加速度煞停",prerequisites:"v²=v₀²+2aΔx、上游痕跡",time:"75–140 秒",image:"assets/chrono/time-4.webp",visual:"chrono-stop",known:["初速由延遲追擊的可追溯版本提供","可用距離由同一條上游軌跡提供","末速 0 m/s","加速度 −4 m/s²"],models:[option("v2","0 = v₀² + 2(−4)Δx"),option("linear","0 = v₀ − 4Δx"),option("uniform","Δx = v₀×4")],inputs:[input("distance","煞停距離","m",.2)],explanation:"從上游版本讀取 v₀ 與可用距離，再以 0=v₀²+2aΔx 求停止距離。",hint:"先確認上游版本有效；時間未知，可選不含時間的等加速度公式。"}
        ]
      }
    },
    {
      id:"photo",number:"03",eyebrow:"PHOTOELECTRIC EFFECT",name:"古光神殿",short:"近代物理",description:"先破解頻率門檻與亮度迷思，再計算光子能量、截止電壓與粒子數。",heroImage:"assets/photo/light-1.webp",color:"#76a9ff",
      tracks:{
        foundation:[
          {code:"P-F1",title:"頻率門檻",summary:"頻率增加，單一光子能量增加。",mission:"調高光的頻率，判斷何時能越過金屬功函數門檻。",skill:"E 與 f 的比例",prerequisites:"比例概念",time:"30–60 秒",image:"assets/photo/light-1.webp",visual:"photo-threshold",known:["同一金屬的門檻固定","光子能量隨頻率增加","先不計算數值"],control:control("光的頻率",2,4,2,4,1,"級"),prediction:prediction("把頻率由低調高，單一光子能量如何？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("能打出電子的必要條件是什麼？",[["threshold","單一光子能量超過功函數"],["bright","光只要夠亮"],["time","照射時間夠久一定可以"]]),explanation:"光電效應有頻率門檻；單一光子能量不足時，增加等待時間也不能把能量累積給同一電子。",hint:"關鍵是『每一顆光子』的能量，而不是總共有多少光。"},
          {code:"P-F2",title:"亮度迷霧",summary:"頻率不足時，再強的光也不能打出電子。",mission:"古光祭壇故意以極亮紅光誤導闖關者。",skill:"區分頻率與強度",prerequisites:"光子概念",time:"45–75 秒",image:"assets/photo/light-2.webp",visual:"photo-intensity",known:["光的頻率低於金屬門檻","只提高光強度","金屬種類不變"],control:control("光強度",1,5,1,5,1,"級"),prediction:prediction("頻率仍低於門檻，只把光變強，會打出電子嗎？",[["no","不會"],["yes","一定會"],["faster","只會讓電子更快"]]),reason:reason("為什麼？",[["per-photon","每顆光子的能量仍不足"],["metal","金屬突然變重"],["voltage","電壓自動抵消"]]),explanation:"強度增加代表光子數增加，但每顆光子的能量由頻率決定；低於門檻仍無法逸出。",hint:"把強度想成光子『數量』，頻率想成每顆光子的『能量』。"},
          {code:"P-F3",title:"金屬之別",summary:"不同金屬具有不同的光電門檻。",mission:"用同一束光照射兩塊金屬，從機關的回應判斷哪一塊功函數較小。",skill:"由現象比較門檻",prerequisites:"固定其他條件",time:"45–75 秒",image:"assets/photo/light-3.webp",visual:"photo-metal",known:["照射頻率相同","A 金屬放出電子","B 金屬沒有放出電子"],control:control("照射測試",1,2,1,2,1,"次"),prediction:prediction("根據結果，哪一塊金屬較容易放出電子？",[["A","A 金屬"],["B","B 金屬"],["same","無法區分"]]),reason:reason("可以做出什麼判斷？",[["lower","A 的功函數較小"],["higher","A 的功函數較大"],["mass","A 的質量較小"]]),explanation:"同頻率光下，能放出電子的 A 金屬門檻不高於該光子能量，因此相較 B 更容易放出電子。",hint:"控制相同照射條件，比較哪個金屬先產生反應。"},
          {code:"P-F4",title:"有限光能",summary:"選擇剛好越過門檻的頻率並合理分配強度。",mission:"三道光門共享有限能量；過低頻率無效，過高設定又浪費資源。",skill:"基本策略",prerequisites:"頻率門檻、強度",time:"60–90 秒",image:"assets/photo/light-4.webp",visual:"photo-budget",known:["三座金屬門檻不同","頻率必須先超過門檻","門檻已通過後，提高強度可增加電子數"],control:control("頻率設定",2,4,2,5,1,"級"),prediction:prediction("有限資源下，合理的第一步是什麼？",[["threshold-first","先選剛能越過門檻的頻率"],["intensity-only","全部能量只加強度"],["max","頻率與強度永遠都開最大"]]),reason:reason("越過門檻後，若需要更多電子應優先調整什麼？",[["intensity","增加光強度"],["lower-frequency","把頻率降回門檻以下"],["wait","只增加等待時間"]]),explanation:"策略是先確保單一光子能量足夠，再用強度控制有效光子數；這能把頻率與強度的角色分開。",hint:"先問『能不能打出』，再問『能打出多少』。"}
        ],
        advanced:[
          {code:"P-A1",title:"光子換算",summary:"由波長求單一光子能量。",mission:"藍光封印給定波長 400 nm，需換算成電子伏特。",skill:"E=hc/λ",prerequisites:"科學記號、單位換算",time:"60–120 秒",image:"assets/photo/light-1.webp",visual:"photo-energy",known:["λ=400 nm","可用 hc≈1240 eV·nm"],models:[option("lambda","E=1240/λ"),option("multiply","E=1240λ"),option("intensity","E=P×t")],inputs:[input("energy","光子能量","eV",.03)],explanation:"E≈1240/400=3.10 eV。",hint:"波長越短，單一光子能量越高。"},
          {code:"P-A2",title:"最大動能",summary:"由光子能量扣除金屬功函數。",mission:"能量 3.5 eV 的光子照射功函數 2.3 eV 的鈉。",skill:"光電方程",prerequisites:"能量守恆",time:"60–120 秒",image:"assets/photo/light-2.webp",visual:"photo-kmax",known:["Eγ=3.5 eV","Φ=2.3 eV","忽略其他損失"],models:[option("subtract","Kmax=Eγ−Φ"),option("add","Kmax=Eγ+Φ"),option("ratio","Kmax=Eγ/Φ")],inputs:[input("kmax","最大動能","eV",.02)],explanation:"Kmax=3.5−2.3=1.2 eV。",hint:"功函數是電子離開金屬表面必須支付的能量。"},
          {code:"P-A3",title:"截止電壓",summary:"由最大動能求停止光電子的電壓。",mission:"光電子最大動能為 1.4 eV，調整反向電壓剛好讓光電流歸零。",skill:"eVₛ=Kmax",prerequisites:"電位能、光電方程",time:"60–120 秒",image:"assets/photo/light-3.webp",visual:"photo-voltage",known:["Kmax=1.4 eV","1 eV 對應電子通過 1 V 的能量"],models:[option("stopping","eVₛ=Kmax"),option("square","eVₛ²=Kmax"),option("power","Vₛ=Kmax×光強")],inputs:[input("voltage","截止電壓","V",.02)],explanation:"以 eV 為能量單位時，1.4 eV 對應 1.4 V 的截止電壓。",hint:"截止電壓與最大動能有關，不由光強度決定。"},
          {code:"P-A4",title:"光束配給",summary:"計算光子流率、量子效率與有效電子數。",mission:"20 W 光束照射 2 秒；古光殿的光門記載：每瓦每秒放出 10 顆光子，其中四分之一能穿門。",skill:"率與效率",prerequisites:"比例、百分率",time:"75–150 秒",image:"assets/photo/light-4.webp",visual:"photo-flux",known:["20 W","每 W 每秒 10 顆光子","照射 2 s","量子效率 25%"],models:[option("flux","Ne=P×10×t×η"),option("divide","Ne=P/(10tη)"),option("energy","Ne=光子能量−功函數")],inputs:[input("electrons","有效電子數","顆",1)],explanation:"20×10×2×0.25=100 顆有效電子。",hint:"先求入射光子總數，再乘量子效率。"}
        ]
      }
    },
    {
      id:"ripple",number:"04",eyebrow:"WAVES & INTERFERENCE",name:"水之神殿",short:"波動",description:"透過撥動水面建立頻率、波長與振幅直覺，再進入相位、程差與節腹線計算。",heroImage:"assets/ripple/water-1.webp",color:"#55e2db",
      tracks:{
        foundation:[
          {code:"W-F1",title:"水之節奏",summary:"頻率變大時，波長變短、條紋變窄。",mission:"加快水眼的振動節奏，觀察池中的同心波紋會發生什麼變化。",skill:"頻率與波長趨勢",prerequisites:"讀圖、反比趨勢",time:"30–60 秒",image:"assets/ripple/water-1.webp",visual:"wave-frequency",known:["水波速度固定","單一波源","頻率由 2 Hz 調到 4 Hz"],control:control("頻率",2,4,1,5,.5,"Hz"),prediction:prediction("當你將水眼的振動節奏（頻率由 2 Hz 增加到 4 Hz）加快時，池面的同心波紋會怎麼改變？",[["narrow","變窄、變密"],["same","不變"],["wide","變寬、變疏"]]),reason:reason("哪一個因果鏈正確？",[["inverse","波速固定，f 增加所以 λ 減少"],["amplitude","頻率增加所以振幅必定增加"],["speed","頻率增加所以水波速度必定增加"]]),explanation:"在同一介質且波速固定時，v=fλ；頻率增加，波長縮短，所以條紋變密。",hint:"固定波速，把 f 與 λ 看成互相補償的兩個量。"},
          {code:"W-F2",title:"振幅幻象",summary:"振幅增大會加強起伏與對比，但不改變波長。",mission:"提高水眼振幅，分辨『看起來更強』與『條紋間距改變』。",skill:"區分振幅與波長",prerequisites:"波形判讀",time:"30–60 秒",image:"assets/ripple/water-2.webp",visual:"wave-amplitude",known:["頻率固定","水波速度固定","振幅由 1 級增至 3 級"],control:control("振幅",1,3,1,3,.5,"級"),prediction:prediction("提高水眼的起伏振幅後，池面的波紋主要會有什麼改變？",[["contrast","起伏與明暗對比變強"],["narrow","波長變短"],["faster","傳播速度必定增加"]]),reason:reason("為什麼條紋間距不變？",[["frequency","頻率與波速都沒改變"],["source","波源消失了"],["mass","水的質量變成零"]]),explanation:"振幅描述偏離平衡位置的程度；只改振幅不會改變由波速與頻率決定的波長。",hint:"把『波有多高』與『相鄰波峰隔多遠』分開看。"},
          {code:"W-F3",title:"雙源初醒",summary:"兩個同頻波源產生穩定的加強區與削弱區。",mission:"喚醒第二座水眼，觀察兩組波疊加後出現的新結構。",skill:"辨認干涉現象",prerequisites:"波的疊加概念",time:"45–75 秒",image:"assets/ripple/water-3.webp",visual:"wave-two-source",known:["兩波源頻率相同","兩波源持續振動","不計算相位差"],control:control("波源數量",1,2,1,2,1,"個"),prediction:prediction("喚醒第二座水眼，當兩座水眼以相同頻率振動時，水面會浮現什麼現象？",[["bands","穩定的加強與削弱區"],["nothing","完全沒有變化"],["stop","所有水波都消失"]]),reason:reason("這些區域形成的原因是什麼？",[["superpose","兩列波在各處疊加"],["gravity","重力忽然改變"],["boil","水溫升高"]]),explanation:"兩列同頻波重疊後，在不同位置持續加強或削弱，形成穩定干涉圖樣。",hint:"觀察哪些位置總是明顯起伏，哪些位置長期接近平靜。"},
          {code:"W-F4",title:"雙源之謎",summary:"波源間距增加時，節線與腹線分布通常變密。",mission:"頻率固定，只拉開兩座水眼，匹配更密集的干涉骨架。",skill:"波源間距與圖樣",prerequisites:"干涉現象",time:"45–90 秒",image:"assets/ripple/water-4.webp",visual:"wave-separation",known:["頻率固定","兩波源同頻","間距由 4 格增至 8 格"],control:control("波源間距",4,8,3,10,.5,"格"),prediction:prediction("當你將兩座水眼的距離拉得更開，交織出的節線與腹線分布會怎麼改變？",[["denser","變得較密"],["same","完全不變"],["none","全部消失"]]),reason:reason("同時有哪一項保持不變？",[["wavelength","單一波源的波長"],["geometry","干涉圖幾何"],["source-distance","波源距離"]]),explanation:"頻率與介質不變，所以單一波源波長不變；增加波源間距則讓可出現的程差範圍變大，干涉線數通常增加。",hint:"分開觀察『每一圈的間距』與『兩組圓相交形成的骨架』。"}
        ],
        advanced:[
          {code:"W-A1",title:"波速石碑",summary:"使用 v=fλ 求波速。",mission:"水眼頻率為 6 Hz，相鄰波峰距離為 0.50 m。",skill:"v=fλ",prerequisites:"代數、單位",time:"60–100 秒",image:"assets/ripple/water-1.webp",visual:"wave-calc",known:["f=6 Hz","λ=0.50 m"],models:[option("wave","v=fλ"),option("divide","v=f/λ"),option("square","v=fλ²")],inputs:[input("speed","波速","m/s",.03)],explanation:"v=6×0.50=3.0 m/s。",hint:"Hz 是每秒振動次數，乘上一個波長就是每秒傳播距離。"},
          {code:"W-A2",title:"相位與程差之門",summary:"由程差判斷相對相位與破壞性干涉。",mission:"某觀測點到兩個同相波源的程差為 1.5λ。",skill:"程差與相位",prerequisites:"相位、波的疊加",time:"75–140 秒",image:"assets/ripple/water-2.webp",visual:"wave-phase",known:["兩波源同相","Δr=1.5λ","相位差以 360° 為一週期"],models:[option("phase","Δφ=360°×Δr/λ"),option("linear","Δφ=180°×Δr/λ"),option("none","程差不影響相位")],inputs:[input("phase","等效相位差","°",1)],explanation:"1.5λ 對應 540°，扣除一個 360° 週期後為 180°，因此為破壞性干涉。",hint:"相位差可相差整數個 360°；最後取等效角。"},
          {code:"W-A3",title:"節腹線計數",summary:"由 d/λ 計算完整平面的節線與腹線。",mission:"兩個同相點波源間距 d=3.2λ；計算左右兩側都包含的完整圖樣。",skill:"干涉線階數",prerequisites:"程差、取整數",time:"90–160 秒",image:"assets/ripple/water-3.webp",visual:"wave-lines",known:["d/λ=3.2","波源同相","計完整平面、左右對稱線都算","非整數與半整數邊界"],models:[option("count","腹線 2⌊d/λ⌋+1；節線 2⌊d/λ+1/2⌋"),option("swap","腹線 2⌊d/λ+1/2⌋；節線 2⌊d/λ⌋+1"),option("round","兩者都取最接近整數")],inputs:[input("antinodes","腹線條數","條",0),input("nodes","節線條數","條",0)],explanation:"腹線階數 m=0,±1,±2,±3，共 7 條；節線程差 0.5λ、1.5λ、2.5λ，各有左右兩側，共 6 條。",hint:"先列出允許的程差階數，再把中央線與左右對稱分開計數。"},
          {code:"W-A4",title:"干涉核心",summary:"從圖形殘影反推頻率與中央相位。",mission:"水波速度 12 cm/s，圖上相鄰波峰距離 4 cm，中央線為節線。",skill:"從圖樣反推兩個條件",prerequisites:"v=fλ、相位",time:"90–180 秒",image:"assets/ripple/water-4.webp",visual:"wave-inverse",known:["v=12 cm/s","λ=4 cm","兩波源振幅相同","中央線為節線"],models:[option("inverse","f=v/λ，中央節線代表兩源反相"),option("multiply","f=vλ，中央節線代表同相"),option("amplitude","f 由振幅決定")],inputs:[input("frequency","頻率","Hz",.03),input("phase","兩源相位差","°",1)],explanation:"f=12/4=3 Hz；中央點到兩源等距，卻是節線，表示兩源相差 180°。",hint:"中央線程差為零；若仍相消，差異只能來自波源初相位。"}
        ]
      }
    },
    {
      id:"uncertainty",number:"05",eyebrow:"MEASUREMENT & EVIDENCE",name:"無刻神殿",short:"量測不確定度",description:"從刻度、散布與誠實紀錄建立量測素養，再完成組合不確定度與導出量推論鏈。",heroImage:"assets/uncertainty/measure-1.webp",color:"#c3a6ff",
      tracks:{
        foundation:[
          {code:"U-F1",title:"刻度之眼",summary:"讀取儀器數值、單位與最小刻度。",mission:"電子秤穩定顯示 63 g；不要宣稱儀器沒有提供的位數。",skill:"儀器判讀",prerequisites:"單位",time:"30–60 秒",image:"assets/uncertainty/measure-1.webp",visual:"measure-scale",known:["電子秤顯示 63 g","最小顯示單位 1 g","多次讀值相同"],control:control("顯示位數",0,1,0,2,1,"級"),prediction:prediction("哪一筆直接讀值最恰當？",[["63g","63 g"],["63.000g","63.000 g"],["about","約 60 g"]]),reason:reason("為什麼不能寫成 63.000 g？",[["digits","儀器沒有提供那些小數位"],["mass","木塊太輕"],["unit","g 不是單位"]]),explanation:"紀錄應保留儀器實際提供的位數與單位；多寫小數會過度宣稱精度。",hint:"螢幕上實際出現了幾位數？"},
          {code:"U-F2",title:"重複回聲",summary:"量測散布不等於做壞了。",mission:"比較兩組重複量測，判斷哪一組的重複性較好。",skill:"辨認散布",prerequisites:"大小比較",time:"30–60 秒",image:"assets/uncertainty/measure-2.webp",visual:"measure-scatter",known:["A 組：25.6、25.6、25.7、25.6","B 組：25.1、25.8、25.4、26.0","使用同一單位"],control:control("顯示資料組",1,2,1,2,1,"組"),prediction:prediction("哪一組量測結果較集中？",[["A","A 組"],["B","B 組"],["same","兩組完全相同"]]),reason:reason("較集中的結果代表什麼？",[["repeatability","重複性較好"],["truth","一定等於真值"],["zero","不確定度必定為零"]]),explanation:"散布較小表示在相同條件下重複性較好，但仍不能單憑集中就保證沒有系統誤差。",hint:"比較每組最大值與最小值相差多少。"},
          {code:"U-F3",title:"哪把尺更適合",summary:"依任務需求選擇合適的最小刻度。",mission:"要量測約 25.6 mm 的小銅柱，選擇公分尺或 0.1 mm 游標尺。",skill:"選擇量具",prerequisites:"刻度與單位",time:"30–60 秒",image:"assets/uncertainty/measure-3.webp",visual:"measure-tool",known:["需要分辨約 0.1 mm 的差異","公分尺最小刻度 1 mm","游標尺可讀到 0.1 mm"],control:control("所需解析度",1,2,1,2,1,"級"),prediction:prediction("哪一件量具較符合任務？",[["caliper","0.1 mm 游標尺"],["ruler","1 mm 公分尺"],["either","兩者完全相同"]]),reason:reason("選擇依據是什麼？",[["resolution","最小刻度能分辨所需差異"],["color","量具顏色較深"],["length","量具本身較重"]]),explanation:"量具解析度必須足以分辨任務關心的差異；更細刻度不代表永遠更好，但此任務確實需要 0.1 mm。",hint:"先問你希望分辨到多小，再比較儀器刻度。"},
          {code:"U-F4",title:"誠實的數字",summary:"選出不過度宣稱精度的量測報告。",mission:"平均高度約 25.625 mm，估計不確定度約 0.09 mm；選出位數一致的表達。",skill:"量測結果表達",prerequisites:"小數位",time:"45–75 秒",image:"assets/uncertainty/measure-4.webp",visual:"measure-report",known:["平均值計算結果 25.625 mm","不確定度約 0.09 mm","數值與不確定度小數位應一致"],control:control("報告格式",1,2,1,2,1,"式"),prediction:prediction("哪一種寫法最合適？",[["honest","(25.63 ± 0.09) mm"],["precise","(25.625000 ± 0.09) mm"],["rough","(26 ± 0.0001) mm"]]),reason:reason("為什麼平均值寫到小數點後兩位？",[["place","與不確定度的末位對齊"],["pretty","看起來比較整齊"],["unit","因為 mm 只能有兩位"]]),explanation:"測量值與不確定度的末位應對齊，避免保留沒有意義的額外數字。",hint:"先看不確定度最後一位落在哪個小數位。"}
        ],
        advanced:[
          {code:"U-A1",title:"質量的密碼",summary:"由電子秤最小顯示單位估計 B 類標準不確定度。",mission:"電子秤顯示 63 g，最小顯示單位為 1 g，採均勻分布模型。",skill:"B 類不確定度",prerequisites:"有效數字、平方根",time:"75–130 秒",image:"assets/uncertainty/measure-1.webp",visual:"uncertainty-mass",known:["讀值 63 g","最小顯示單位 1 g","uB=LC/√12"],models:[option("rect","uB=1/√12"),option("half","uB=1/2"),option("zero","重複相同所以 u=0")],inputs:[input("uncertainty","標準不確定度","g",.015)],explanation:"uB=1/√12≈0.29 g；重複顯示相同不代表儀器解析度造成的不確定度為零。",hint:"數位顯示採寬度為一個最小顯示單位的均勻分布。"},
          {code:"U-A2",title:"三維尺寸",summary:"把尺的解析度轉成長度標準不確定度。",mission:"以最小刻度 0.1 cm 的量具量得長度 10.0 cm。",skill:"儀器不確定度",prerequisites:"B 類不確定度",time:"60–120 秒",image:"assets/uncertainty/measure-2.webp",visual:"uncertainty-dimension",known:["L=10.0 cm","最小刻度 0.1 cm","採均勻分布"],models:[option("rect","uL=0.1/√12"),option("full","uL=0.1"),option("percent","uL=10%")],inputs:[input("uncertainty","長度標準不確定度","cm",.002)],explanation:"uL=0.1/√12≈0.029 cm。",hint:"先確認公式中的 LC 使用和答案相同的 cm 單位。"},
          {code:"U-A3",title:"周長迴廊",summary:"處理加減與常數倍的不確定度傳遞。",mission:"矩形長 10.0±0.03 cm、寬 5.0±0.03 cm，求 P=2(L+W) 的標準不確定度。",skill:"加減法傳遞",prerequisites:"平方和開根號",time:"90–160 秒",image:"assets/uncertainty/measure-3.webp",visual:"uncertainty-perimeter",known:["uL=0.03 cm","uW=0.03 cm","L、W 獨立","P=2(L+W)"],models:[option("rss","uP=2√(uL²+uW²)"),option("linear","uP=2(uL+uW)"),option("relative","uP/P=uL/L+uW/W")],inputs:[input("uncertainty","周長標準不確定度","cm",.004)],explanation:"uP=2√(0.03²+0.03²)≈0.085 cm。",hint:"獨立不確定度先平方相加，再開根號；外面的常數 2 一起乘上。"},
          {code:"U-A4",title:"體積與密度核心",summary:"使用相對不確定度傳遞處理乘除。",mission:"木塊 10.0×5.0×2.0 cm，各邊 u=0.03 cm；質量 270 g，um=0.29 g。",skill:"導出量不確定度",prerequisites:"相對不確定度、平方和",time:"120–180 秒",image:"assets/uncertainty/measure-4.webp",visual:"uncertainty-density",known:["V=LWH","ρ=m/V","各來源獨立","標準不確定度以平方和組合"],models:[option("relative","(uρ/ρ)²=(um/m)²+(uV/V)²"),option("absolute","uρ=um−uV"),option("linear","uρ/ρ=um/m+uL/L+uW/W+uH/H")],inputs:[input("density","密度","g/cm³",.015),input("uncertainty","密度標準不確定度","g/cm³",.004)],explanation:"V=100 cm³，ρ=2.70 g/cm³；組合各相對不確定度後 uρ≈0.045 g/cm³。",hint:"乘除問題先把每個來源換成相對不確定度，再用平方和組合。"},
          {code:"U-A5",title:"銅柱回聲",summary:"組合重複量測 A 類與儀器 B 類不確定度。",mission:"四次高度為 25.40、25.70、25.80、25.60 mm；儀器最小顯示單位 0.1 mm。",skill:"A、B 類組合",prerequisites:"平均、樣本標準差",time:"120–180 秒",image:"assets/uncertainty/measure-5.webp",visual:"uncertainty-repeat",known:["平均值 25.625 mm","uA=s/√n","uB=0.1/√12 mm","uc=√(uA²+uB²)"],models:[option("combine","uc=√(uA²+uB²)"),option("add","uc=uA+uB"),option("onlyB","uc=uB")],inputs:[input("mean","報告平均值","mm",.015),input("uncertainty","組合標準不確定度","mm",.012)],explanation:"uA≈0.085 mm、uB≈0.029 mm，組合後 uc≈0.090 mm；報告為 (25.63±0.09) mm。",hint:"A、B 類都不可漏掉，且最終平均值小數位要與不確定度對齊。"}
        ]
      }
    },
    {
      id:"momentum",number:"06",eyebrow:"MOMENTUM & COLLISIONS",name:"動量神殿",short:"碰撞與衝量",description:"從碰撞時間、反衝與安全設計建立動量直覺，再以守恆律修復古代石車。",heroImage:"assets/momentum/momentum-temple.png",color:"#ff806b",
      tracks:{
        foundation:[
          {code:"M-F1",title:"衝量之門",summary:"同樣的力作用越久，動量改變越大。",mission:"若延長守門槌推擠石車的時間，石車的衝刺狀態會產生什麼變化？",skill:"力與作用時間",prerequisites:"比較、因果",time:"30–60 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-impulse",known:["平均力大小固定","只改變作用時間","石車初始狀態相同"],control:control("作用時間",1,3,1,3,.5,"級"),prediction:prediction("平均力相同，作用時間增加時，石車的動量改變如何？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("最直接的關係是什麼？",[["impulse","衝量等於平均力乘作用時間"],["mass","石車質量自動增加"],["gravity","重力消失"]]),explanation:"衝量 J=FΔt 會造成動量改變；同樣的平均力作用越久，動量改變越大。",hint:"把『推多大力』與『推多久』一起看。"},
          {code:"M-F2",title:"反衝石舟",summary:"封閉系統的總動量保持不變。",mission:"巨人從靜止石舟向右丟出石塊，判斷石舟的反應。",skill:"動量守恆判斷",prerequisites:"方向",time:"30–60 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-recoil",known:["人、石塊與舟原本都靜止","水平方向外力可忽略","石塊向右飛出"],control:control("拋出速度",1,3,1,3,.5,"級"),prediction:prediction("石塊向右飛出後，石舟會如何？",[["left","向左反衝"],["right","跟著向右"],["still","保持不動"]]),reason:reason("為什麼？",[["total","總動量仍須維持原本的零"],["wind","石塊製造向左的風"],["weight","石舟突然變輕"]]),explanation:"系統原總動量為零；石塊獲得向右動量時，人舟必須取得向左動量。",hint:"先寫下事件前整個系統的總動量方向。"},
          {code:"M-F3",title:"緩衝結界",summary:"同樣動量變化下，延長碰撞時間可降低平均力。",mission:"替墜落石像選擇厚軟墊或薄石板，避免瞬間破裂。",skill:"安全設計與衝量",prerequisites:"衝量概念",time:"45–75 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-cushion",known:["石像落下速度相同","最後都停止","動量改變相同"],control:control("緩衝時間",1,4,1,4,.5,"級"),prediction:prediction("使用厚軟墊延長停止時間，平均撞擊力如何？",[["decrease","減少"],["same","不變"],["increase","增加"]]),reason:reason("背後的原因是什麼？",[["same-impulse","相同衝量分散在較長時間"],["momentum-zero","動量變化變成零"],["gravity","重力方向改變"]]),explanation:"在相同動量改變下，延長碰撞時間可降低平均力，這也是安全氣囊與護墊的核心。",hint:"J=F平均Δt；J 固定時，F 與 Δt 如何互補？"},
          {code:"M-F4",title:"黏合碰撞",summary:"黏在一起時動量可守恆，但動能通常不守恆。",mission:"兩台石車碰撞後扣在一起，判斷哪些量仍受守恆律約束。",skill:"區分動量與動能",prerequisites:"碰撞現象",time:"45–90 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-stick",known:["水平方向外力可忽略","兩車碰後黏在一起","碰撞伴隨聲音與形變"],control:control("黏合程度",1,3,1,3,1,"級"),prediction:prediction("此碰撞中，哪個判斷最合理？",[["p-only","總動量守恆，動能通常減少"],["both","動量與動能一定都守恆"],["neither","兩者一定都不守恆"]]),reason:reason("動能減少的能量去了哪裡？",[["other","轉為聲音、熱與形變等能量"],["gone","完全消失"],["mass","只變成質量"]]),explanation:"孤立碰撞的總動量守恆；黏合屬完全非彈性碰撞，部分動能轉為內能、聲音與形變。",hint:"『能量守恆』不等於『動能一定守恆』。"}
        ],
        advanced:[
          {code:"M-A1",title:"神槌衝量",summary:"由平均力與作用時間求動量改變。",mission:"神槌以 120 N 的平均力推石車 0.25 s。",skill:"J=FΔt",prerequisites:"乘法、單位",time:"60–100 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-calc-impulse",known:["F平均=120 N","Δt=0.25 s","力方向固定"],models:[option("impulse","J=FΔt"),option("divide","J=F/Δt"),option("energy","J=½FΔt²")],inputs:[input("impulse","衝量","N·s",.2)],explanation:"J=120×0.25=30 N·s，亦即動量改變 30 kg·m/s。",hint:"N·s 與 kg·m/s 是等價單位。"},
          {code:"M-A2",title:"投石反衝",summary:"以總動量守恆求人的反衝速度。",mission:"60 kg 的守衛在靜止舟上向右丟出 3 kg 石塊，石塊速率 8 m/s。",skill:"一維動量守恆",prerequisites:"正負方向、代數",time:"75–130 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-calc-recoil",known:["初總動量為 0","守衛與舟等效質量 60 kg","石塊質量 3 kg、向右 8 m/s"],models:[option("conserve","60v+3×8=0"),option("same","v=8"),option("energy","½60v²=3×8")],inputs:[input("speed","向左反衝速率","m/s",.02)],explanation:"60v+24=0，v=−0.40 m/s；題目問速率，所以填 0.40。",hint:"先選向右為正，反衝答案自然會出現負號。"},
          {code:"M-A3",title:"合體石車",summary:"求完全非彈性碰撞後的共同速度。",mission:"2 kg 石車以 6 m/s 撞上靜止的 1 kg 石車，碰後黏合。",skill:"完全非彈性碰撞",prerequisites:"動量守恆",time:"75–140 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-calc-stick",known:["m₁=2 kg，v₁=6 m/s","m₂=1 kg，v₂=0","碰後共同速度 v"],models:[option("stick","2×6+1×0=(2+1)v"),option("average","v=(6+0)/2"),option("energy","½2×6²=½3v²")],inputs:[input("speed","共同速度","m/s",.05)],explanation:"初動量 12 kg·m/s，總質量 3 kg，所以共同速度為 4 m/s。",hint:"黏在一起後，末態質量要相加。"},
          {code:"M-A4",title:"耗散封印",summary:"比較碰撞前後動能並求損失。",mission:"承接上一關：2 kg 石車以 6 m/s 撞上靜止 1 kg 石車，碰後共同速度 4 m/s。",skill:"碰撞後能量的去向",prerequisites:"動能、動量守恆",time:"90–160 秒",image:"assets/momentum/momentum-temple.png",visual:"momentum-calc-loss",known:["碰前動能 36 J","碰後總質量 3 kg","共同速度 4 m/s"],models:[option("loss","損失=K前−K後"),option("gain","損失=K後−K前"),option("momentum","損失=p前−p後")],inputs:[input("energy","動能損失","J",.1)],explanation:"碰後動能為 ½×3×4²=24 J，碰前為 ½×2×6²=36 J，因此 12 J 轉為內能、聲音與形變。",hint:"先分別計算碰撞前後的總動能，再取差值。"}
        ]
      }
    },
    {
      id:"energy",number:"07",eyebrow:"WORK & ENERGY",name:"能量神殿",short:"功與能量",description:"從功、位能與功率的基本趨勢出發，再用守恆律穿越熔爐與升降機關。",heroImage:"assets/energy/energy-temple.png",color:"#ffbf5c",
      tracks:{
        foundation:[
          {code:"E-F1",title:"功的方向",summary:"力與位移同向做正功，反向做負功。",mission:"拖動石門時改變施力方向，判斷能量傳遞的正負。",skill:"功的正負",prerequisites:"方向判斷",time:"30–60 秒",image:"assets/energy/energy-temple.png",visual:"energy-work",known:["石門向右移動","施力大小不變","只改變力的方向"],control:control("力與位移夾角",0,180,0,180,30,"°"),prediction:prediction("力由同向轉為反向時，力對石門所做的功如何？",[["negative","由正變負"],["positive","永遠為正"],["zero","永遠為零"]]),reason:reason("判斷依據是什麼？",[["dot","看力在位移方向上的分量"],["time","只看花多少時間"],["mass","只看物體質量"]]),explanation:"功 W=Fd cosθ；同向為正、垂直為零、反向為負。",hint:"比較 θ=0°、90°、180° 時 cosθ 的正負。"},
          {code:"E-F2",title:"高度封印",summary:"同一物體升得越高，重力位能增加越多。",mission:"把同一顆石球送上不同高度的祭壇。",skill:"重力位能趨勢",prerequisites:"比例",time:"30–60 秒",image:"assets/energy/energy-temple.png",visual:"energy-height",known:["石球質量固定","重力場近似固定","只改變高度"],control:control("祭壇高度",1,4,1,4,.5,"級"),prediction:prediction("高度增加時，石球的重力位能如何？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("最合適的關係是什麼？",[["mgh","ΔUg 與 mgh 成正比"],["speed","只由速度決定"],["color","由石球顏色決定"]]),explanation:"在近地面，重力位能變化 ΔUg=mgh；質量與 g 固定時，高度越高，位能越多。",hint:"這一關沒有改變石球質量。"},
          {code:"E-F3",title:"摩擦熔爐",summary:"摩擦使機械能轉為內能，但總能量仍守恆。",mission:"石車滑過粗糙地面後變慢，追蹤消失的機械能。",skill:"能量轉換",prerequisites:"動能概念",time:"45–75 秒",image:"assets/energy/energy-temple.png",visual:"energy-friction",known:["地面變粗糙","石車速度下降","石車與地面溫度略升"],control:control("粗糙程度",1,4,1,4,.5,"級"),prediction:prediction("粗糙程度增加時，石車的機械能損失如何？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("能量主要轉到哪裡？",[["thermal","石車與地面的內能"],["gone","能量完全消失"],["mass","全部變成質量"]]),explanation:"摩擦會把有組織的機械能轉為較分散的內能；總能量並未消失。",hint:"溫度上升是能量轉換的明顯特徵。"},
          {code:"E-F4",title:"功率競技",summary:"完成同樣工作，所需時間越短，平均功率越大。",mission:"兩座升降台把相同石塊升到同一高度，只改變完成時間。",skill:"功率大小比較",prerequisites:"比率",time:"45–75 秒",image:"assets/energy/energy-temple.png",visual:"energy-power",known:["兩台做功相同","甲台用時較短","忽略能量損失"],control:control("完成時間",8,2,2,8,1,"s"),prediction:prediction("做功相同，完成時間縮短時平均功率如何？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("依據哪個定義？",[["work-time","功率等於功除以時間"],["force-only","功率只等於力"],["mass-time","功率等於質量乘時間"]]),explanation:"平均功率 P=W/Δt；做相同的功，花越少時間代表功率越大。",hint:"功率描述能量轉換的快慢。"}
        ],
        advanced:[
          {code:"E-A1",title:"斜拉石門",summary:"計算斜向力所做的功。",mission:"以 50 N 拉力使石門水平移動 3.0 m，力與位移夾角 60°。",skill:"W=Fd cosθ",prerequisites:"三角函數",time:"60–120 秒",image:"assets/energy/energy-temple.png",visual:"energy-calc-work",known:["F=50 N","d=3.0 m","θ=60°"],models:[option("dot","W=Fd cosθ"),option("sine","W=Fd sinθ"),option("power","W=F/d")],inputs:[input("work","拉力做功","J",.5)],explanation:"W=50×3×cos60°=75 J。",hint:"只有沿位移方向的力分量做功。"},
          {code:"E-A2",title:"升高石印",summary:"求提升物體增加的重力位能。",mission:"2.0 kg 石印被緩慢升高 5.0 m，取 g=9.8 m/s²。",skill:"ΔUg=mgh",prerequisites:"乘法、單位",time:"60–100 秒",image:"assets/energy/energy-temple.png",visual:"energy-calc-height",known:["m=2.0 kg","h=5.0 m","g=9.8 m/s²"],models:[option("mgh","ΔUg=mgh"),option("kinetic","ΔUg=½mv²"),option("divide","ΔUg=mg/h")],inputs:[input("energy","位能增加","J",.5)],explanation:"ΔUg=2.0×9.8×5.0=98 J。",hint:"緩慢提升表示動能變化可忽略。"},
          {code:"E-A3",title:"落差之速",summary:"以機械能守恆求落下速度。",mission:"石球由靜止從 5.0 m 高處無摩擦滑下，取 g=9.8 m/s²。",skill:"機械能守恆",prerequisites:"平方根",time:"75–140 秒",image:"assets/energy/energy-temple.png",visual:"energy-calc-speed",known:["初速 0","高度差 5.0 m","忽略摩擦"],models:[option("conserve","mgh=½mv²"),option("linear","v=gh"),option("momentum","mgh=mv")],inputs:[input("speed","底端速率","m/s",.1)],explanation:"v=√(2gh)=√98≈9.9 m/s；質量在等式中消去。",hint:"比較頂端的重力位能與底端動能。"},
          {code:"E-A4",title:"升降功率",summary:"由位能變化與時間求平均功率。",mission:"升降台在 4.0 s 內把 30 kg 石像升高 2.0 m，取 g=9.8 m/s²。",skill:"P=W/t",prerequisites:"重力位能",time:"75–130 秒",image:"assets/energy/energy-temple.png",visual:"energy-calc-power",known:["m=30 kg","h=2.0 m","t=4.0 s","忽略損失"],models:[option("power","P=mgh/t"),option("energy","P=mgh"),option("inverse","P=t/mgh")],inputs:[input("power","平均功率","W",1)],explanation:"P=30×9.8×2/4=147 W。",hint:"先求提升石像所需做功，再除以時間。"}
        ]
      }
    },
    {
      id:"electric",number:"08",eyebrow:"ELECTRIC FIELDS & CIRCUITS",name:"雷霆神殿",short:"電場與電路",description:"先辨認電荷、電場與電路的基本規律，再以庫侖定律與歐姆定律啟動雷霆核心。",heroImage:"assets/electric/electric-temple.png",color:"#84a7ff",
      tracks:{
        foundation:[
          {code:"Q-F1",title:"電荷雙像",summary:"同號相斥、異號相吸。",mission:"改變電荷石柱的屬性，觀察兩顆帶電球會相互吸引還是排斥。",skill:"電荷交互作用",prerequisites:"方向",time:"30–60 秒",image:"assets/electric/electric-temple.png",visual:"electric-charge",known:["兩球距離固定","只改變其中一球電性","忽略其他作用"],control:control("右球電性",-1,1,-1,1,2,"號"),prediction:prediction("兩球都帶正電時會如何？",[["repel","互相排斥"],["attract","互相吸引"],["none","沒有作用"]]),reason:reason("判斷依據是什麼？",[["same","同號電荷互斥"],["mass","同質量互斥"],["color","同顏色互斥"]]),explanation:"靜電力遵循同號相斥、異號相吸；力在兩電荷連線方向上。",hint:"先辨認正負號，不要用球的大小判斷。"},
          {code:"Q-F2",title:"場線羅盤",summary:"電場方向定義為正試驗電荷受力方向。",mission:"把小正試驗電荷放到正電石柱旁，判斷指針方向。",skill:"電場方向",prerequisites:"正電荷受力",time:"30–60 秒",image:"assets/electric/electric-temple.png",visual:"electric-field",known:["中央為正電荷","試驗電荷為微小正電","不改變原電場"],control:control("觀測距離",1,4,1,4,.5,"格"),prediction:prediction("這根正電石柱周圍的電場線，是指向哪一個方向？",[["out","由正電荷向外"],["in","朝正電荷向內"],["circle","繞成圓圈"]]),reason:reason("電場方向如何定義？",[["positive-test","正試驗電荷受力方向"],["electron","電子速度方向"],["magnet","指南針方向"]]),explanation:"電場方向以正試驗電荷所受電力方向定義，因此正點電荷的場線向外。",hint:"若放一顆很小的正電荷，它會被推向哪裡？"},
          {code:"Q-F3",title:"串聯回廊",summary:"單一路徑的串聯電路中，各處電流相同。",mission:"兩盞神燈串聯在同一條回路，判斷通過兩燈的電流。",skill:"串聯電流",prerequisites:"封閉電路",time:"45–75 秒",image:"assets/electric/electric-temple.png",visual:"electric-series",known:["電路只有一條路徑","電荷不在燈泡中持續累積","電路達穩定狀態"],control:control("燈泡數",1,2,1,2,1,"顆"),prediction:prediction("串聯兩燈時，通過兩燈的電流如何比較？",[["same","相同"],["first","第一顆較大"],["second","第二顆較大"]]),reason:reason("為什麼？",[["one-path","同一時間通過各截面的電荷量相同"],["used","電流被第一顆用掉"],["voltage","兩燈電壓一定相同"]]),explanation:"串聯只有一條電荷流動路徑，穩定時各處電流相同；被轉換的是電能，不是電流被用完。",hint:"想像同一條水管各截面每秒通過多少水。"},
          {code:"Q-F4",title:"並聯分流",summary:"並聯支路兩端電壓相同，總電流分流。",mission:"開啟第二條神燈支路，觀察電池端的總電流。",skill:"並聯電路判斷",prerequisites:"電壓與電流",time:"45–90 秒",image:"assets/electric/electric-temple.png",visual:"electric-parallel",known:["理想電池電壓固定","新增相同電阻支路","兩支路並聯"],control:control("並聯支路",1,3,1,3,1,"條"),prediction:prediction("增加並聯支路時，電池提供的總電流如何？",[["increase","增加"],["same","不變"],["zero","變成零"]]),reason:reason("等效電阻如何變化？",[["decrease","並聯路徑增加使等效電阻下降"],["increase","支路越多等效電阻越大"],["none","電阻與路徑無關"]]),explanation:"理想電壓源下，增加並聯支路會降低等效電阻，因此總電流增加；各支路兩端電壓相同。",hint:"新增一條路不是把原路堵住，而是增加電荷可走的路徑。"}
        ],
        advanced:[
          {code:"Q-A1",title:"庫侖封印",summary:"由電量與距離求兩點電荷作用力。",mission:"2.0 μC 與 3.0 μC 同號電荷相距 0.30 m，取 k=9.0×10⁹。",skill:"庫侖定律",prerequisites:"科學記號",time:"75–140 秒",image:"assets/electric/electric-temple.png",visual:"electric-calc-force",known:["q₁=2.0 μC","q₂=3.0 μC","r=0.30 m","同號"],models:[option("coulomb","F=k|q₁q₂|/r²"),option("linear","F=k|q₁q₂|/r"),option("add","F=k(q₁+q₂)/r²")],inputs:[input("force","電力大小","N",.02)],explanation:"F=9.0×10⁹×(2×10⁻⁶)(3×10⁻⁶)/0.30²=0.60 N，方向互斥。",hint:"μC 要先換成 10⁻⁶ C，距離要平方。"},
          {code:"Q-A2",title:"電場刻度",summary:"求點電荷在指定位置的電場強度。",mission:"4.0 μC 正電荷外 0.30 m，取 k=9.0×10⁹。",skill:"E=kQ/r²",prerequisites:"庫侖定律",time:"75–130 秒",image:"assets/electric/electric-temple.png",visual:"electric-calc-field",known:["Q=4.0 μC","r=0.30 m","場源為正電荷"],models:[option("field","E=kQ/r²"),option("force","E=kQ²/r²"),option("potential","E=kQ/r")],inputs:[input("field","電場強度","N/C",3000)],explanation:"E=9.0×10⁹×4.0×10⁻⁶/0.30²=4.0×10⁵ N/C，方向向外。",hint:"電場是每單位正電荷所受的力，不必再乘試驗電荷。"},
          {code:"Q-A3",title:"串聯電流",summary:"由總電阻與電壓求電流。",mission:"4 Ω 與 6 Ω 電阻串聯接上 12 V 理想電池。",skill:"歐姆定律與串聯",prerequisites:"R串=R₁+R₂",time:"60–120 秒",image:"assets/electric/electric-temple.png",visual:"electric-calc-series",known:["R₁=4 Ω","R₂=6 Ω","V=12 V"],models:[option("series","I=V/(R₁+R₂)"),option("parallel","I=V(1/R₁+1/R₂)"),option("multiply","I=V(R₁+R₂)")],inputs:[input("current","電流","A",.02)],explanation:"總電阻 10 Ω，I=12/10=1.2 A。",hint:"串聯電阻先直接相加。"},
          {code:"Q-A4",title:"並聯核心",summary:"求並聯電阻與電源總電流。",mission:"6 Ω 與 3 Ω 電阻並聯接上 12 V 理想電池。",skill:"並聯等效電阻",prerequisites:"倒數、歐姆定律",time:"75–140 秒",image:"assets/electric/electric-temple.png",visual:"electric-calc-parallel",known:["R₁=6 Ω","R₂=3 Ω","V=12 V"],models:[option("parallel","1/Req=1/R₁+1/R₂"),option("series","Req=R₁+R₂"),option("average","Req=(R₁+R₂)/2")],inputs:[input("resistance","等效電阻","Ω",.03),input("current","總電流","A",.05)],explanation:"1/Req=1/6+1/3=1/2，所以 Req=2 Ω；總電流 I=12/2=6 A。",hint:"並聯等效電阻一定小於最小的支路電阻。"}
        ]
      }
    },
    {
      id:"magnetic",number:"09",eyebrow:"MAGNETISM & INDUCTION",name:"磁序神殿",short:"磁場與感應",description:"從磁極、洛倫茲力與磁通量變化建立方向感，再計算帶電粒子與感應電動勢。",heroImage:"assets/magnetic/magnetic-temple.png",color:"#69dbcb",
      tracks:{
        foundation:[
          {code:"B-F1",title:"磁極之門",summary:"同名磁極相斥，異名磁極相吸。",mission:"轉動磁柱的極性，看看這對神門究竟會緊緊閉合，還是猛烈彈開。",skill:"磁極交互作用",prerequisites:"方向",time:"30–60 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-poles",known:["兩磁柱距離固定","只改變右柱朝向","忽略其他力"],control:control("右柱朝向",1,2,1,2,1,"式"),prediction:prediction("把兩根磁柱都轉成 N 極相對時，兩根磁柱之間會怎樣？",[["repel","互相排斥"],["attract","互相吸引"],["none","沒有作用"]]),reason:reason("正確規則是什麼？",[["pole-rule","同名相斥、異名相吸"],["charge-rule","N 極必定帶正電"],["mass-rule","磁力只看質量"]]),explanation:"磁極遵循同名相斥、異名相吸；但 N、S 極不是可單獨分離的正負電荷。",hint:"不要把磁極與電荷直接畫上等號。"},
          {code:"B-F2",title:"洛倫茲羅盤",summary:"磁力同時垂直於速度與磁場。",mission:"讓正電粒子水平進入垂直紙面的磁場，判斷路徑。",skill:"磁力方向判斷",prerequisites:"三維方向",time:"45–75 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-lorentz",known:["粒子帶正電","速度向右","磁場垂直紙面向內"],control:control("磁場強度",1,4,1,4,.5,"級"),prediction:prediction("正電粒子剛進入時受力方向為何？",[["up","向上"],["right","向右"],["into","向紙面內"]]),reason:reason("磁力與速度的關係是什麼？",[["perpendicular","磁力垂直速度，因此改方向不直接改速率"],["parallel","磁力永遠沿速度"],["zero","運動電荷永遠不受磁力"]]),explanation:"正電荷的磁力方向由 q v×B 決定；此例向上，且磁力垂直速度。",hint:"先用右手判斷 v×B；若是負電荷再反向。"},
          {code:"B-F3",title:"載流石橋",summary:"電流方向改變時，導線所受磁力方向反轉。",mission:"讓載流導線穿過固定磁場，切換電流方向觀察石橋偏轉。",skill:"載流導線磁力",prerequisites:"方向判斷",time:"45–75 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-wire",known:["磁場方向固定","導線與磁場垂直","只反轉電流"],control:control("電流方向",-1,1,-1,1,2,"向"),prediction:prediction("電流反向後，導線受磁力方向如何？",[["reverse","反轉"],["same","不變"],["zero","必定變零"]]),reason:reason("為什麼？",[["cross","F=IL×B，L 反向使叉積反向"],["heat","導線溫度下降"],["charge","電流反向使導線不帶電"]]),explanation:"載流導線磁力由 I L×B 決定；磁場不變、電流反向時，磁力方向也反轉。",hint:"把電流方向當作 L 向量方向。"},
          {code:"B-F4",title:"感應封印",summary:"磁通量變化越快，感應電動勢越大。",mission:"改變磁石推入線圈的速度，看看神燈的亮度會如何回應你的動作。",skill:"法拉第定律判斷",prerequisites:"變化率",time:"45–90 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-induction",known:["磁石、線圈相同","進入的總磁通量改變相同","只改變完成時間"],control:control("磁石移動速度",1,4,1,4,.5,"級"),prediction:prediction("磁石更快推入線圈時，瞬間感應電動勢如何？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("關鍵是什麼？",[["rate","單位時間磁通量改變更大"],["flux-only","只看最後磁通量"],["magnet-mass","磁石質量變大"]]),explanation:"法拉第定律看的是磁通量變化率；同樣的改變在更短時間完成，感應電動勢較大。",hint:"比較 ΔΦ/Δt，不只比較 ΔΦ。"}
        ],
        advanced:[
          {code:"B-A1",title:"粒子受力",summary:"計算垂直入射帶電粒子的磁力。",mission:"2.0 μC 正電粒子以 3.0×10⁴ m/s 垂直進入 0.50 T 磁場。",skill:"F=qvB sinθ",prerequisites:"科學記號",time:"75–130 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-calc-force",known:["q=2.0 μC","v=3.0×10⁴ m/s","B=0.50 T","θ=90°"],models:[option("lorentz","F=qvB sinθ"),option("electric","F=qB/v"),option("square","F=qv²B")],inputs:[input("force","磁力大小","N",.002)],explanation:"F=2.0×10⁻⁶×3.0×10⁴×0.50=0.030 N。",hint:"垂直入射時 sin90°=1。"},
          {code:"B-A2",title:"圓軌半徑",summary:"由向心力等於磁力求圓周半徑。",mission:"質量 0.004 kg、電量 0.002 C 的帶電珠以 3.0 m/s 垂直進入 2.0 T 磁場。",skill:"r=mv/qB",prerequisites:"圓周運動",time:"90–160 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-calc-radius",known:["m=0.004 kg","q=0.002 C","v=3.0 m/s","B=2.0 T"],models:[option("radius","qvB=mv²/r"),option("energy","qB=½mv²"),option("period","r=qB/mv")],inputs:[input("radius","軌道半徑","m",.05)],explanation:"r=mv/qB=(0.004×3)/(0.002×2)=3.0 m。",hint:"磁力提供向心力，先消去等式兩邊共同的 v。"},
          {code:"B-A3",title:"石橋磁力",summary:"求垂直磁場中載流導線受力。",mission:"0.50 m 導線通 3.0 A 電流，垂直放入 0.40 T 磁場。",skill:"F=BIL",prerequisites:"乘法",time:"60–110 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-calc-wire",known:["B=0.40 T","I=3.0 A","L=0.50 m","θ=90°"],models:[option("wire","F=BIL sinθ"),option("ohm","F=V/R"),option("square","F=BI²L")],inputs:[input("force","磁力大小","N",.02)],explanation:"F=0.40×3.0×0.50=0.60 N。",hint:"導線與磁場垂直，角度因子為 1。"},
          {code:"B-A4",title:"法拉第核心",summary:"由磁通量變化率求平均感應電動勢。",mission:"200 匝線圈的每匝磁通量在 0.50 s 內改變 0.030 Wb。",skill:"|ε|=N|ΔΦ|/Δt",prerequisites:"變化率",time:"75–140 秒",image:"assets/magnetic/magnetic-temple.png",visual:"magnetic-calc-emf",known:["N=200","|ΔΦ|=0.030 Wb","Δt=0.50 s"],models:[option("faraday","|ε|=N|ΔΦ|/Δt"),option("single","|ε|=|ΔΦ|/(NΔt)"),option("product","|ε|=N|ΔΦ|Δt")],inputs:[input("emf","平均感應電動勢","V",.1)],explanation:"|ε|=200×0.030/0.50=12 V；負號只描述楞次定律方向。",hint:"題目問大小，先處理 N 倍磁通鏈結的變化率。"}
        ]
      }
    },
    {
      id:"optics",number:"10",eyebrow:"GEOMETRIC OPTICS",name:"鏡光神殿",short:"折射與成像",description:"從反射、折射與透鏡光線建立圖像直覺，再用司乃耳定律與薄透鏡公式解鎖光門。",heroImage:"assets/optics/optics-temple.png",color:"#b99cff",
      tracks:{
        foundation:[
          {code:"O-F1",title:"反射之鏡",summary:"入射角等於反射角，角度都由法線量起。",mission:"轉動入射光束的角度，看看反射光會往哪個方向偏折。",skill:"反射定律",prerequisites:"角度、法線",time:"30–60 秒",image:"assets/optics/optics-temple.png",visual:"optics-reflection",known:["鏡面平坦","法線垂直鏡面","角度由法線量起"],control:control("入射角",15,60,0,75,5,"°"),prediction:prediction("入射角增加時，反射角如何？",[["increase","等量增加"],["same","保持不變"],["opposite","變成其餘角"]]),reason:reason("正確關係是什麼？",[["equal","入射角等於反射角"],["surface","兩角都由鏡面量起"],["speed","反射角由光速決定"]]),explanation:"反射定律為 θi=θr，且兩角都以法線為基準。",hint:"先畫法線，再量光線與法線的夾角。"},
          {code:"O-F2",title:"折射之泉",summary:"光進入折射率較大介質時向法線偏折。",mission:"讓光從空氣斜射入水晶，看看光束前進的軌跡會如何彎折。",skill:"折射判斷",prerequisites:"法線",time:"30–60 秒",image:"assets/optics/optics-temple.png",visual:"optics-refraction",known:["光由空氣進入水晶","水晶折射率較大","入射角不為零"],control:control("水晶折射率",1.2,1.8,1.1,2,.1,""),prediction:prediction("進入折射率較大介質時，光線如何偏折？",[["toward","向法線"],["away","離開法線"],["none","一定不偏折"]]),reason:reason("同時哪一項會變小？",[["speed","光在介質中的速率"],["frequency","光的頻率"],["color","光源的顏色一定消失"]]),explanation:"光進入折射率較大、速率較小的介質時向法線偏折；跨界面時頻率保持不變。",hint:"n 越大表示介質中光速越小。"},
          {code:"O-F3",title:"全反射密道",summary:"全反射只能由高折射率射向低折射率且角度夠大。",mission:"調整水晶內光線角度，找出光不再穿出界面的條件。",skill:"全反射條件",prerequisites:"折射方向",time:"45–75 秒",image:"assets/optics/optics-temple.png",visual:"optics-tir",known:["光由水晶射向空氣","水晶折射率較大","逐漸增加入射角"],control:control("入射角",20,60,10,80,5,"°"),prediction:prediction("入射角超過臨界角後會出現什麼？",[["tir","全反射"],["normal","折射光沿法線"],["stop","光能完全消失"]]),reason:reason("必要條件是哪一項？",[["high-low","由高折射率射向低折射率"],["low-high","只能由低射向高"],["any","任何界面都一定全反射"]]),explanation:"全反射需同時滿足由高 n 射向低 n，以及入射角大於臨界角。",hint:"光纖把光留在核心，就是利用這兩個條件。"},
          {code:"O-F4",title:"透鏡之眼",summary:"凸透鏡可讓平行光會聚到焦點。",mission:"移動光源到很遠處，觀察凸透鏡後的光線。",skill:"凸透鏡基本光線",prerequisites:"平行線",time:"45–75 秒",image:"assets/optics/optics-temple.png",visual:"optics-lens",known:["薄凸透鏡","入射光近似平行主軸","忽略像差"],control:control("光束平行度",1,3,1,3,.5,"級"),prediction:prediction("平行主軸光經凸透鏡後通過何處？",[["focus","像側焦點"],["center","永遠停在透鏡中心"],["parallel","仍完全平行"]]),reason:reason("這條規則可用來做什麼？",[["ray","建立成像光線圖"],["energy","判斷光子能量"],["charge","求電荷量"]]),explanation:"平行主軸的近軸光經凸透鏡後會通過像側焦點，是幾何光學作圖的基本光線。",hint:"焦點不是物體所在位置，而是折射後光線會聚的位置。"}
        ],
        advanced:[
          {code:"O-A1",title:"司乃耳之門",summary:"由折射率與入射角求折射角。",mission:"光由空氣 n₁=1.00 以 30° 入射玻璃 n₂=1.50。",skill:"n₁sinθ₁=n₂sinθ₂",prerequisites:"反三角函數",time:"75–140 秒",image:"assets/optics/optics-temple.png",visual:"optics-calc-snell",known:["n₁=1.00","n₂=1.50","θ₁=30°","角度由法線量起"],models:[option("snell","n₁sinθ₁=n₂sinθ₂"),option("linear","n₁θ₁=n₂θ₂"),option("cos","n₁cosθ₁=n₂cosθ₂")],inputs:[input("angle","折射角","°",.3)],explanation:"sinθ₂=(1/1.5)sin30°=1/3，所以 θ₂≈19.5°。",hint:"折射角應小於 30°，可先用直覺判斷檢核。"},
          {code:"O-A2",title:"臨界角封印",summary:"計算玻璃射向空氣的臨界角。",mission:"玻璃折射率 1.50，外界空氣折射率 1.00。",skill:"sinθc=n₂/n₁",prerequisites:"全反射、反三角函數",time:"75–140 秒",image:"assets/optics/optics-temple.png",visual:"optics-calc-critical",known:["n高=1.50","n低=1.00","臨界時折射角 90°"],models:[option("critical","sinθc=n低/n高"),option("reverse","sinθc=n高/n低"),option("difference","θc=90°(n高−n低)")],inputs:[input("angle","臨界角","°",.3)],explanation:"θc=sin⁻¹(1/1.5)≈41.8°。",hint:"sinθc 不可能大於 1，可用來排除倒置的比值。"},
          {code:"O-A3",title:"薄透鏡密碼",summary:"由焦距與物距求像距。",mission:"焦距 10 cm 的凸透鏡前方 30 cm 放置物體。",skill:"1/f=1/do+1/di",prerequisites:"分數方程",time:"75–140 秒",image:"assets/optics/optics-temple.png",visual:"optics-calc-lens",known:["f=+10 cm","do=30 cm","薄透鏡近軸近似"],models:[option("lens","1/f=1/do+1/di"),option("sum","di=do+f"),option("product","di=dof")],inputs:[input("distance","像距","cm",.2)],explanation:"1/di=1/10−1/30=1/15，所以 di=15 cm，形成實像。",hint:"物距大於焦距，像應在透鏡另一側。"},
          {code:"O-A4",title:"成像倍率",summary:"由像距與物距求像高與方向。",mission:"承接上一關：do=30 cm、di=15 cm，物高 4.0 cm。",skill:"m=hi/ho=−di/do",prerequisites:"符號與比例",time:"60–120 秒",image:"assets/optics/optics-temple.png",visual:"optics-calc-magnify",known:["do=30 cm","di=15 cm","ho=+4.0 cm"],models:[option("magnify","hi/ho=−di/do"),option("positive","hi/ho=di/do"),option("sum","hi=ho+di/do")],inputs:[input("height","像高（含正負）","cm",.05)],explanation:"hi=4.0×(−15/30)=−2.0 cm；負號表示倒立。",hint:"先算倍率 −di/do，再乘物高。"}
        ]
      }
    },
    {
      id:"thermal",number:"11",eyebrow:"THERMAL PHYSICS",name:"熾熱神殿",short:"熱學與氣體",description:"從熱平衡、熱容量與氣體狀態建立直覺，再以熱量、理想氣體與第一定律穿越熔爐。",heroImage:"assets/thermal/thermal-temple.png",color:"#ff8b61",
      tracks:{
        foundation:[
          {code:"H-F1",title:"熱流之向",summary:"能量自高溫物體傳向低溫物體，直到熱平衡。",mission:"讓滾燙的熱石與冷石緊密接觸，觀察它們的溫度最終會如何平衡。",skill:"熱傳方向",prerequisites:"溫度比較",time:"30–60 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-flow",known:["熱石溫度較高","冷石溫度較低","兩者可交換能量"],control:control("接觸時間",0,5,0,5,1,"級"),prediction:prediction("熱石與冷石緊密接觸後，淨熱傳遞的方向為何？",[["hot-cold","由熱石到冷石"],["cold-hot","由冷石到熱石"],["none","只要接觸就沒有熱傳"]]),reason:reason("何時停止淨熱傳？",[["equal-temp","兩者達到相同溫度"],["same-mass","兩者質量相同"],["zero-energy","兩者能量都變零"]]),explanation:"溫差驅動淨熱傳；達熱平衡時溫度相同，但兩物體仍具有內能。",hint:"不要把『沒有淨熱傳』誤認為『沒有能量』。"},
          {code:"H-F2",title:"升溫競賽",summary:"吸收同樣熱量時，熱容量較小者溫升較大。",mission:"對兩顆不同材質的石球注入相同的熱量，看看誰的溫度上升得更劇烈。",skill:"熱容量趨勢",prerequisites:"反比趨勢",time:"30–60 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-capacity",known:["吸收熱量相同","初溫相同","甲的熱容量較小"],control:control("熱容量",1,4,1,4,.5,"級"),prediction:prediction("注入相同的熱量後，熱容量較小的那顆石球，溫度變化會比起另一顆如何？",[["larger","較大"],["same","相同"],["smaller","較小"]]),reason:reason("依據哪個關係？",[["q-over-c","ΔT=Q/C"],["mass-only","溫升只由質量決定"],["time-only","溫升只由時間決定"]]),explanation:"熱容量 C 描述物體升高一度所需能量；同樣 Q 下，C 越小，ΔT 越大。",hint:"把熱容量想成物體吸收熱量的『緩衝能力』。"},
          {code:"H-F3",title:"定容氣室",summary:"定容加熱理想氣體時，壓力隨絕對溫度增加。",mission:"將剛性氣室完全封死並持續加熱，注意牆上的壓力指針會如何跳動。",skill:"氣體狀態趨勢",prerequisites:"溫度、壓力",time:"45–75 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-gas",known:["氣體量固定","容器體積固定","使用絕對溫度"],control:control("絕對溫度",300,600,300,600,50,"K"),prediction:prediction("在氣室完全封死、維持定容的情況下持續加熱，牆上的壓力指針會如何改變？",[["increase","增加"],["same","不變"],["decrease","減少"]]),reason:reason("微觀上發生什麼？",[["collisions","分子撞壁更頻繁且動量改變更大"],["molecules","分子數自動減少"],["volume","容器體積必定增加"]]),explanation:"固定 n、V 時，理想氣體 P∝T；升溫使分子平均動能增加，撞壁效應增強。",hint:"攝氏溫度不能直接做倍數比較，要用 K。"},
          {code:"H-F4",title:"壓縮火種",summary:"快速絕熱壓縮會使氣體內能與溫度上升。",mission:"猛烈壓下密閉氣缸的活塞，看看缸內的氣體溫度會出現什麼驚人的變化。",skill:"功與內能關係",prerequisites:"能量轉換",time:"45–90 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-compress",known:["壓縮很快，熱交換可忽略","外界對氣體做功","氣體量不變"],control:control("壓縮程度",1,4,1,4,.5,"級"),prediction:prediction("快速壓縮時，氣體溫度如何？",[["increase","升高"],["same","不變"],["decrease","降低"]]),reason:reason("能量從哪裡來？",[["work-in","外界做功增加氣體內能"],["heat-in","一定由外界傳熱"],["mass","氣體質量增加"]]),explanation:"絕熱表示 Q≈0；外界對氣體做功使內能增加，因此溫度升高。",hint:"快速壓縮的關鍵是來不及與外界交換熱。"}
        ],
        advanced:[
          {code:"H-A1",title:"水之熱量",summary:"由質量、比熱與溫差求吸熱量。",mission:"0.50 kg 水升溫 10°C，取 c=4200 J/(kg·°C)。",skill:"Q=mcΔT",prerequisites:"乘法、單位",time:"60–110 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-calc-heat",known:["m=0.50 kg","c=4200 J/(kg·°C)","ΔT=10°C"],models:[option("heat","Q=mcΔT"),option("divide","Q=mΔT/c"),option("power","Q=mc/ΔT")],inputs:[input("heat","吸收熱量","J",100)],explanation:"Q=0.50×4200×10=2.1×10⁴ J。",hint:"溫差用 °C 或 K 數值相同。"},
          {code:"H-A2",title:"混合平衡",summary:"以能量守恆求兩份水的平衡溫度。",mission:"等質量、無熱損的 80°C 與 20°C 水混合。",skill:"熱平衡",prerequisites:"Q放=Q吸",time:"75–130 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-calc-mix",known:["兩份水質量相同","比熱相同","忽略容器與散熱"],models:[option("balance","mc(80−T)=mc(T−20)"),option("add","T=80+20"),option("geometric","T=√(80×20)")],inputs:[input("temperature","平衡溫度","°C",.3)],explanation:"相同熱容量下，平衡溫度為兩初溫平均值 50°C。",hint:"熱水降溫放出的能量等於冷水升溫吸收的能量。"},
          {code:"H-A3",title:"氣體石碑",summary:"使用理想氣體方程求壓力。",mission:"1.00 mol 理想氣體在 300 K、體積 0.0249 m³，取 R=8.31。",skill:"PV=nRT",prerequisites:"單位、科學記號",time:"75–140 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-calc-gas",known:["n=1.00 mol","T=300 K","V=0.0249 m³","R=8.31 J/(mol·K)"],models:[option("ideal","P=nRT/V"),option("multiply","P=nRTV"),option("inverse","P=V/nRT")],inputs:[input("pressure","壓力","kPa",.6)],explanation:"P=1×8.31×300/0.0249≈1.00×10⁵ Pa=100 kPa。",hint:"最後要把 Pa 除以 1000 轉為 kPa。"},
          {code:"H-A4",title:"第一定律核心",summary:"由吸熱與氣體對外做功求內能變化。",mission:"氣體吸收 500 J 熱量，同時對外做功 200 J。",skill:"ΔU=Q−Wby",prerequisites:"正負號",time:"60–120 秒",image:"assets/thermal/thermal-temple.png",visual:"thermal-calc-firstlaw",known:["Q=+500 J","氣體對外做功 Wby=+200 J","採 ΔU=Q−Wby 慣例"],models:[option("firstlaw","ΔU=Q−Wby"),option("add","ΔU=Q+Wby"),option("ratio","ΔU=Q/Wby")],inputs:[input("energy","內能增加","J",3)],explanation:"ΔU=500−200=300 J；吸收能量中有 200 J 已轉移為對外做功。",hint:"先確認題目明確採用的是『氣體對外做功為正』。"}
        ]
      }
    },
    {
      id:"celestial",number:"12",eyebrow:"GRAVITY & ORBITS",name:"星辰神殿",short:"萬有引力與軌道",description:"從距離、向心加速度與軌道週期建立天體直覺，再以萬有引力和克卜勒定律修復星圖。",heroImage:"assets/celestial/celestial-temple.png",color:"#91a8ff",
      tracks:{
        foundation:[
          {code:"S-F1",title:"距離之律",summary:"距離增加時，萬有引力快速減弱。",mission:"將兩顆星石的距離拉遠，觀察它們之間的引力拉扯會發生什麼變化。",skill:"反平方趨勢",prerequisites:"倍數",time:"30–60 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-gravity",known:["兩星石質量固定","只改變中心距離","忽略其他天體"],control:control("距離倍數",1,2,1,3,.5,"倍"),prediction:prediction("當你將兩顆星石的距離拉遠為 2 倍，它們之間的引力會變成原來的多少？",[["quarter","1/4"],["half","1/2"],["double","2 倍"]]),reason:reason("依據哪個關係？",[["inverse-square","F 與 1/r² 成正比"],["inverse","F 與 1/r 成正比"],["direct","F 與 r 成正比"]]),explanation:"萬有引力遵循反平方律；距離加倍，引力變為原來四分之一。",hint:"距離在公式分母中要平方。"},
          {code:"S-F2",title:"圓軌之心",summary:"等速圓周運動仍有指向圓心的加速度。",mission:"觀察繞行星石，判斷速度與加速度方向。",skill:"圓周運動方向",prerequisites:"速度向量",time:"30–60 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-circular",known:["軌道近似圓形","速率固定","引力提供向心力"],control:control("軌道位置",0,3,0,3,1,"象限"),prediction:prediction("衛星在圓軌道上，加速度指向何處？",[["center","圓心"],["tangent","沿切線前方"],["outside","背離圓心"]]),reason:reason("即使速率不變，為何仍有加速度？",[["direction-change","速度方向持續改變"],["speed-zero","衛星速度為零"],["mass-change","衛星質量持續變化"]]),explanation:"加速度描述速度向量的改變；等速圓周運動雖速率不變，方向持續改變，因此有向心加速度。",hint:"速度是有方向的向量。"},
          {code:"S-F3",title:"外軌節奏",summary:"同一中心天體下，較遠的圓軌道速率較小、週期較長。",mission:"將衛星推向更外層的深空軌道，看看它繞行母星一圈所需的時間會怎麼變。",skill:"軌道半徑與週期",prerequisites:"比較",time:"45–75 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-period",known:["中心天體相同","比較兩條圓軌道","衛星質量不影響理想軌道週期"],control:control("軌道半徑",1,4,1,4,.5,"級"),prediction:prediction("當衛星被推向更外層的深空軌道（軌道半徑變大），它繞行母星的公轉週期會怎麼變？",[["increase","變長"],["same","不變"],["decrease","變短"]]),reason:reason("哪個描述同時正確？",[["slower-longer","外軌道速率較小且路徑較長"],["faster","外軌道速率一定更大"],["mass","週期只由衛星質量決定"]]),explanation:"同一中心天體下，外軌道引力較弱、圓軌道速率較小，且路徑更長，因此週期更長。",hint:"不要只比較圓周長，也要比較軌道速率。"},
          {code:"S-F4",title:"質量與重量",summary:"質量描述物質多寡，重量取決於所在地重力場。",mission:"把同一位探險者從地球傳送到月球。",skill:"區分質量與重量",prerequisites:"重力",time:"30–60 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-weight",known:["探險者未失去物質","月球表面重力約 1.6 N/kg","使用同一台校準好的質量測量方式"],control:control("重力場強度",9.8,1.6,1.6,9.8,4.1,"N/kg"),prediction:prediction("到月球後，哪一項正確？",[["mass-same","質量不變，重量變小"],["both-small","質量與重量都等比例變小"],["weight-same","重量不變"]]),reason:reason("重量如何計算？",[["mg","W=mg，g 隨地點改變"],["m-over-g","W=m/g"],["m-only","W 只等於質量"]]),explanation:"質量不隨地點改變；重量 W=mg。月球表面 g 約 1.6 N/kg，因此同一人的重量約為地球上的六分之一。",hint:"問自己：人到月球後，原子數會突然變少嗎？"}
        ],
        advanced:[
          {code:"S-A1",title:"萬有引力",summary:"計算兩顆星石間的引力。",mission:"兩顆 1000 kg 星石中心相距 10 m，取 G=6.67×10⁻¹¹。",skill:"F=Gm₁m₂/r²",prerequisites:"科學記號",time:"75–140 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-calc-gravity",known:["m₁=m₂=1000 kg","r=10 m","G=6.67×10⁻¹¹ N·m²/kg²"],models:[option("gravity","F=Gm₁m₂/r²"),option("linear","F=Gm₁m₂/r"),option("add","F=G(m₁+m₂)/r²")],inputs:[input("force","引力大小","N",.00000002)],explanation:"F=6.67×10⁻¹¹×10⁶/10²=6.67×10⁻⁷ N。",hint:"兩個 1000 相乘是 10⁶，距離平方是 10²。"},
          {code:"S-A2",title:"近地軌速",summary:"由萬有引力提供向心力求圓軌道速率。",mission:"取地球 GM=3.986×10¹⁴ m³/s²，軌道半徑 r=6.37×10⁶ m。",skill:"v=√(GM/r)",prerequisites:"向心力、平方根",time:"90–160 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-calc-speed",known:["GM=3.986×10¹⁴ m³/s²","r=6.37×10⁶ m","圓軌道"],models:[option("orbit","v=√(GM/r)"),option("escape","v=√(2GM/r)"),option("linear","v=GM/r")],inputs:[input("speed","軌道速率","km/s",.08)],explanation:"v=√(3.986×10¹⁴/6.37×10⁶)≈7.91×10³ m/s=7.91 km/s。",hint:"這是圓軌道速率，不是逃逸速率。"},
          {code:"S-A3",title:"軌道週期",summary:"由圓周長與速率求繞行週期。",mission:"衛星軌道半徑 7.0×10⁶ m，速率 7.5×10³ m/s。",skill:"T=2πr/v",prerequisites:"圓周長",time:"75–140 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-calc-period",known:["r=7.0×10⁶ m","v=7.5×10³ m/s","圓軌道"],models:[option("period","T=2πr/v"),option("frequency","T=v/2πr"),option("area","T=πr²/v")],inputs:[input("period","週期","s",35)],explanation:"T=2π(7.0×10⁶)/(7.5×10³)≈5864 s，約 97.7 分鐘。",hint:"一圈路程是 2πr，再除以每秒前進距離。"},
          {code:"S-A4",title:"克卜勒比例",summary:"以第三定律比較兩條軌道週期。",mission:"兩衛星繞同一中心天體，外衛星軌道半徑是內衛星 4 倍。",skill:"T²∝r³",prerequisites:"指數律",time:"75–140 秒",image:"assets/celestial/celestial-temple.png",visual:"celestial-calc-kepler",known:["中心天體相同","r₂/r₁=4","T²/r³ 為常數"],models:[option("kepler","T₂/T₁=(r₂/r₁)^(3/2)"),option("linear","T₂/T₁=r₂/r₁"),option("inverse","T₂/T₁=(r₁/r₂)²")],inputs:[input("ratio","週期比 T₂/T₁","倍",.1)],explanation:"T₂/T₁=4^(3/2)=√(4³)=8。",hint:"先立方再開平方，或把 4 寫成 2²。"}
        ]
      }
    },
    {
      id:"newton",number:"13",eyebrow:"FORCES & NEWTON",name:"天衡神殿",short:"力與運動",description:"以受力圖破解慣性、合力、摩擦、斜面與拋體運動，再用牛頓定律完成計算。",heroImage:"assets/newton/newton-temple.png",color:"#73c8ff",
      tracks:{
        foundation:[
          {code:"NWT-F1",title:"零力王座",summary:"合力為零不代表物體一定靜止。",mission:"失序把『沒有合力』誤寫成『沒有速度』，修復者必須判定石舟真正的運動。",skill:"慣性定律",prerequisites:"速度概念",time:"30–60 秒",image:"assets/newton/newton-temple.png",visual:"newton-inertia",known:["石舟原本向右滑行","水平方向合力為 0","忽略阻力"],control:control("水平合力",2,0,0,4,1,"級"),prediction:prediction("水平合力降為 0 後，石舟會如何？",[["constant","維持等速直線運動"],["stop","立刻停止"],["faster","持續加速"]]),reason:reason("最直接的依據是什麼？",[["inertia","合力為零時速度向量保持不變"],["energy","物體沒有能量"],["mass","只有重物才會前進"]]),explanation:"牛頓第一定律指出：合力為零時，物體保持靜止或等速直線運動，而不是一定停下。",hint:"把『速度是否為零』和『速度是否改變』分開。"},
          {code:"NWT-F2",title:"合力裁決",summary:"加速度方向與合力方向相同。",mission:"多道拉索同時作用在石車上，只有合力能決定它的速度如何改變。",skill:"合力與加速度",prerequisites:"向量方向",time:"30–60 秒",image:"assets/newton/newton-temple.png",visual:"newton-net",known:["石車質量固定","只改變水平合力","忽略其他方向運動"],control:control("向右合力",1,4,1,4,1,"級"),prediction:prediction("當拉索向右的合力逐漸增加時，這輛石車的加速度會如何改變？",[["increase","向右加速度增加"],["same","加速度不變"],["left","改為向左加速"]]),reason:reason("哪個模型最合理？",[["fma","同質量下 a 與合力成正比"],["velocity","合力只決定當下位置"],["weight","合力一定等於重量"]]),explanation:"牛頓第二定律 ΣF=ma；質量固定時，合力越大，加速度越大且方向與合力相同。",hint:"加速度描述速度的改變，不等於物體當下速度方向。"},
          {code:"NWT-F3",title:"摩擦守門人",summary:"靜摩擦力會在上限內配合外力，而非永遠固定。",mission:"逐步推動仍未滑動的石門，判斷摩擦力如何回應。",skill:"靜摩擦判斷",prerequisites:"合力平衡",time:"45–75 秒",image:"assets/newton/newton-temple.png",visual:"newton-friction",known:["石門尚未滑動","水平推力逐漸增加","仍未超過最大靜摩擦力"],control:control("水平推力",1,4,1,5,1,"級"),prediction:prediction("在石門仍靜止時，推力增加，靜摩擦力如何？",[["match","隨推力增加以維持平衡"],["fixed","永遠固定不變"],["zero","立刻變成零"]]),reason:reason("為什麼石門仍能靜止？",[["balance","靜摩擦力與推力大小相等、方向相反"],["no-force","石門完全不受力"],["gravity","重力抵消水平推力"]]),explanation:"尚未滑動時，靜摩擦力會在上限內調整以維持平衡；超過最大值後才開始滑動。",hint:"先利用『仍靜止』判斷水平方向合力。"},
          {code:"NWT-F4",title:"墜星拋物線",summary:"拋體的水平與鉛直運動可以分開來看。",mission:"石球水平飛出高台，星門要求你辨認重力真正改變的速度分量。",skill:"拋體運動判斷",prerequisites:"速度分量",time:"45–90 秒",image:"assets/newton/newton-temple.png",visual:"newton-projectile",known:["忽略空氣阻力","石球水平飛出","重力鉛直向下"],control:control("飛行時間",1,4,1,4,.5,"級"),prediction:prediction("飛行過程中，哪個描述正確？",[["components","水平速度不變，鉛直向下速度增加"],["both","水平與鉛直速度都固定"],["horizontal","只有水平速度增加"]]),reason:reason("為什麼可以這樣判斷？",[["gravity-vertical","重力只提供鉛直加速度"],["path","拋物線代表沒有受力"],["mass","質量讓水平速度變大"]]),explanation:"忽略空氣阻力時，重力只改變鉛直速度；水平速度保持不變，兩方向共享同一飛行時間。",hint:"先把速度與加速度分成水平、鉛直兩個方向。"}
        ],
        advanced:[
          {code:"NWT-A1",title:"合力刻度",summary:"由多力合成求石車加速度。",mission:"5.0 kg 石車受 28 N 向右拉力與 8 N 向左阻力。",skill:"ΣF=ma",prerequisites:"正負方向、代數",time:"60–110 秒",image:"assets/newton/newton-temple.png",visual:"newton-calc-net",known:["m=5.0 kg","向右 28 N","向左 8 N"],models:[option("net","a=(28−8)/5"),option("sum","a=(28+8)/5"),option("force","a=28−8")],inputs:[input("acceleration","加速度","m/s²",.05)],explanation:"向右為正，合力 20 N；a=20/5=4.0 m/s²，方向向右。",hint:"先求有方向的合力，再除以質量。"},
          {code:"NWT-A2",title:"動摩擦長廊",summary:"整合摩擦力與牛頓第二定律。",mission:"10 kg 石箱在水平面受 50 N 拉力，動摩擦係數 0.20，取 g=9.8。",skill:"摩擦與加速度",prerequisites:"正向力、ΣF=ma",time:"75–140 秒",image:"assets/newton/newton-temple.png",visual:"newton-calc-friction",known:["m=10 kg","F=50 N","μk=0.20","水平拉動，g=9.8 m/s²"],models:[option("friction","a=(F−μkmg)/m"),option("ignore","a=F/m"),option("add","a=(F+μkmg)/m")],inputs:[input("acceleration","加速度","m/s²",.04)],explanation:"fk=μkmg=19.6 N，合力 30.4 N，因此 a=3.04 m/s²。",hint:"水平面且無鉛直加速度，所以正向力等於 mg。"},
          {code:"NWT-A3",title:"斜面分力",summary:"求無摩擦斜面上的下滑加速度。",mission:"石塊位於 30° 無摩擦斜面，取 g=9.8 m/s²。",skill:"重力分量",prerequisites:"三角函數、受力圖",time:"75–140 秒",image:"assets/newton/newton-temple.png",visual:"newton-calc-incline",known:["斜角 30°","忽略摩擦","沿斜面方向分析"],models:[option("parallel","a=g sin30°"),option("normal","a=g cos30°"),option("full","a=g")],inputs:[input("acceleration","下滑加速度","m/s²",.05)],explanation:"沿斜面的重力分量為 mg sin30°，所以 a=g sin30°=4.9 m/s²。",hint:"正向力抵消垂直斜面的重力分量。"},
          {code:"NWT-A4",title:"水平飛渡",summary:"由落下時間求水平拋射距離。",mission:"石球以 20 m/s 水平飛出 45 m 高台，取 g=10 m/s²。",skill:"水平拋射",prerequisites:"自由落體、等速運動",time:"90–160 秒",image:"assets/newton/newton-temple.png",visual:"newton-calc-projectile",known:["vx=20 m/s","高度 45 m","初始鉛直速度 0","g=10 m/s²"],models:[option("separate","45=½gt²，再以 x=vxt"),option("uniform","x=20×45"),option("diagonal","x=½gt²")],inputs:[input("time","飛行時間","s",.03),input("range","水平距離","m",.5)],explanation:"45=5t² 得 t=3 s；水平等速，因此 x=20×3=60 m。",hint:"先用鉛直落下決定共同時間，再處理水平位移。"}
        ]
      }
    },
    {
      id:"resonance",number:"14",eyebrow:"SOUND & RESONANCE",name:"諧鳴神殿",short:"聲波與共鳴",description:"辨認音高、駐波與共鳴的基本關係，再計算波長、基音與泛音。",heroImage:"assets/resonance/resonance-temple.png",color:"#58e0d3",
      tracks:{
        foundation:[
          {code:"RES-F1",title:"音色雙鑰",summary:"頻率主要決定音高，振幅主要影響響度。",mission:"兩根聲柱分別改變振動快慢與幅度，修復者要辨認聽覺效果。",skill:"音高與響度",prerequisites:"頻率、振幅",time:"30–60 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-pitch",known:["介質與波速固定","先只改變頻率","再只改變振幅"],control:control("聲源頻率",1,4,1,4,1,"級"),prediction:prediction("頻率增加、振幅不變時，聽到的聲音主要如何改變？",[["higher","音高升高"],["louder","只變得更大聲"],["slower","聲速變慢"]]),reason:reason("頻率增加時，為什麼音高會升高？",[["frequency-count","相同時間內的振動次數增加"],["loudness","因為振幅一定同時增加"],["speed","因為聲速一定增加"]]),explanation:"頻率是每秒振動次數，主要對應音高；振幅主要影響響度。在同一介質中，改變頻率或振幅都不會直接改變聲速。",hint:"先問：一秒內完成的振動次數是否改變。"},
          {code:"RES-F2",title:"節點長廊",summary:"駐波的節點幾乎不振動，腹點振幅最大。",mission:"兩道同頻反向行進的波在長廊疊加，形成不再向前移動的波形骨架。",skill:"辨認駐波",prerequisites:"波的疊加",time:"30–60 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-standing",known:["兩波頻率與振幅相同","方向相反","形成穩定駐波"],control:control("觀測位置",0,4,0,4,1,"段"),prediction:prediction("駐波節點上的介質如何運動？",[["still","振幅接近零"],["maximum","振幅最大"],["travel","隨波向前移動"]]),reason:reason("腹點有何特徵？",[["max","兩波在該處形成最大振幅"],["zero","永遠完全不動"],["speed","波速在此變成零"]]),explanation:"反向同頻波疊加形成駐波；節點振幅為零，腹點振幅最大，但能量分布不再像行波整體前進。",hint:"觀察哪些位置始終不動，哪些位置上下振得最明顯。"},
          {code:"RES-F3",title:"共鳴甦醒",summary:"外力頻率接近系統固有頻率時，振幅會顯著增加。",mission:"調整驅動祭壇的節奏，找出能讓巨型聲柱最強烈振動的頻率。",skill:"共鳴條件",prerequisites:"頻率比較",time:"45–75 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-match",known:["聲柱具有固定固有頻率","驅動力大小相同","只改變驅動頻率"],control:control("驅動頻率",1,5,1,5,.5,"級"),prediction:prediction("驅動頻率接近固有頻率時，振幅如何？",[["peak","顯著增大"],["zero","必定變成零"],["same","與頻率完全無關"]]),reason:reason("這個現象稱為什麼？",[["resonance","共鳴／共振"],["refraction","折射"],["decay","放射性衰變"]]),explanation:"週期性外力接近系統固有頻率時，能量傳遞最有效率，會出現明顯共鳴。",hint:"盪鞦韆時，在對的節奏推最容易把振幅放大。"},
          {code:"RES-F4",title:"氣柱封印",summary:"開口端近似腹點，閉口端近似節點。",mission:"比較兩端開管與一端閉管的最低共鳴形狀。",skill:"氣柱邊界條件",prerequisites:"節點、腹點",time:"45–90 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-tube",known:["觀察空氣位移駐波","開口端空氣較容易振動","閉口端空氣被管壁限制"],control:control("氣柱類型",1,2,1,2,1,"型"),prediction:prediction("一端閉管的閉口處應接近哪一種位置？",[["node","位移節點"],["antinode","位移腹點"],["source","必定是波源"]]),reason:reason("開口處又如何？",[["antinode","接近位移腹點"],["node","必定完全不動"],["none","沒有駐波"]]),explanation:"位移駐波中，閉口端空氣受限制形成節點，開口端較自由形成腹點；不同邊界決定允許的共鳴模態。",hint:"想像管口的空氣是否能自由來回位移。"}
        ],
        advanced:[
          {code:"RES-A1",title:"行波刻度",summary:"由波速與頻率求波長。",mission:"聲波在介質中速率 120 m/s，頻率 60 Hz。",skill:"v=fλ",prerequisites:"比例、單位",time:"60–100 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-calc-wave",known:["v=120 m/s","f=60 Hz","介質固定"],models:[option("wave","λ=v/f"),option("multiply","λ=vf"),option("inverse","λ=f/v")],inputs:[input("wavelength","波長","m",.03)],explanation:"λ=v/f=120/60=2.0 m。",hint:"Hz 是每秒週期數，m/s 除以 1/s 會留下 m。"},
          {code:"RES-A2",title:"琴弦基音",summary:"計算兩端固定弦的最低頻率。",mission:"弦長 0.85 m，弦波速 340 m/s，兩端固定。",skill:"f₁=v/(2L)",prerequisites:"駐波邊界",time:"75–130 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-calc-string",known:["L=0.85 m","v=340 m/s","兩端固定"],models:[option("half-wave","f₁=v/(2L)"),option("quarter","f₁=v/(4L)"),option("full","f₁=v/L")],inputs:[input("frequency","基音頻率","Hz",2)],explanation:"基音時弦長容納半個波長，λ=2L=1.70 m，因此 f=340/1.70=200 Hz。",hint:"兩端固定都是節點，最簡單模態只有一個波腹。"},
          {code:"RES-A3",title:"閉管低語",summary:"計算一端閉管的最低共鳴頻率。",mission:"一端閉管長 0.425 m，聲速 340 m/s。",skill:"f₁=v/(4L)",prerequisites:"氣柱邊界",time:"75–130 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-calc-tube",known:["L=0.425 m","v=340 m/s","一端閉、一端開"],models:[option("quarter","f₁=v/(4L)"),option("half","f₁=v/(2L)"),option("full","f₁=v/L")],inputs:[input("frequency","基音頻率","Hz",2)],explanation:"閉端為節點、開端為腹點，基音容納四分之一波長；f=340/(4×0.425)=200 Hz。",hint:"一端節、一端腹對應四分之一波長。"},
          {code:"RES-A4",title:"第三泛音門",summary:"由基音求兩端固定系統的第三諧波。",mission:"兩端固定弦的基音為 200 Hz，啟動第三諧波。",skill:"fn=nf₁",prerequisites:"整數諧波",time:"60–110 秒",image:"assets/resonance/resonance-temple.png",visual:"resonance-calc-harmonic",known:["f₁=200 Hz","兩端固定","目標為 n=3 模態"],models:[option("harmonic","f₃=3f₁"),option("divide","f₃=f₁/3"),option("square","f₃=3²f₁")],inputs:[input("frequency","第三諧波頻率","Hz",3)],explanation:"兩端固定弦允許整數諧波，f₃=3×200=600 Hz。",hint:"模態數增加時，弦長內能容納更多半波長。"}
        ]
      }
    },
    {
      id:"emwave",number:"15",eyebrow:"AC & ELECTROMAGNETIC WAVES",name:"星脈神殿",short:"交流與電磁波",description:"追蹤交變電流、發電與變壓器，理解電場與磁場如何交織成電磁波。",heroImage:"assets/emwave/emwave-temple.png",color:"#8e8bff",
      tracks:{
        foundation:[
          {code:"EMW-F1",title:"交變之潮",summary:"交流電的方向與大小會隨時間週期變化。",mission:"星脈塔的電流指針跨越零點並反向，辨認它和直流的差別。",skill:"交流與直流",prerequisites:"電流方向",time:"30–60 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-ac",known:["觀察同一段導線","電流隨時間改變","指針週期性反向"],control:control("觀測相位",0,4,0,4,.5,"段"),prediction:prediction("交流電完成半個週期後，電流方向通常如何？",[["reverse","反向"],["same","永遠不變"],["zero","永久變成零"]]),reason:reason("直流電的典型特徵是什麼？",[["one-direction","方向維持不變"],["reverse","每半週期反向"],["no-energy","不能傳遞能量"]]),explanation:"交流電的瞬時大小與方向週期變化；直流電則維持固定方向。",hint:"注意波形是否穿過零點並改變正負。"},
          {code:"EMW-F2",title:"轉動星輪",summary:"線圈中的磁通量改變才會產生感應電動勢。",mission:"轉動磁場中的線圈，判斷何時星輪能持續發電。",skill:"發電機基本原理",prerequisites:"磁通量、電磁感應",time:"45–75 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-generator",known:["線圈位於磁場中","轉動會改變穿過線圈的磁通量","閉合電路"],control:control("轉動速率",0,4,0,4,.5,"級"),prediction:prediction("線圈轉得更快時，感應電動勢通常如何？",[["increase","增加"],["same","完全不變"],["zero","必定歸零"]]),reason:reason("關鍵的線索是什麼？",[["flux-rate","磁通量變化率增加"],["magnet-mass","磁鐵質量增加"],["charge","線圈自動帶永久電荷"]]),explanation:"發電機利用轉動持續改變線圈磁通量；變化越快，感應電動勢通常越大。",hint:"法拉第定律關心的是磁通量改變得多快。"},
          {code:"EMW-F3",title:"雙環升降",summary:"理想變壓器次級匝數較多時，次級電壓較高。",mission:"調整星脈雙環的線圈匝數，選擇升壓或降壓模式。",skill:"變壓器判斷",prerequisites:"電磁感應、比例",time:"45–75 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-transformer",known:["理想變壓器","初級交流電壓固定","只改變次級與初級匝數比"],control:control("次級匝數比",1,3,1,3,.5,"倍"),prediction:prediction("次級匝數比初級多時，次級電壓如何？",[["higher","較高"],["same","永遠相同"],["dc","自動變成直流"]]),reason:reason("依據哪個關係？",[["turns","Vs/Vp=Ns/Np"],["resistance","電壓只由導線顏色決定"],["mass","線圈越重電壓越低"]]),explanation:"理想變壓器電壓比等於匝數比；次級匝數較多為升壓，較少為降壓。",hint:"比較每一側線圈繞了多少圈。"},
          {code:"EMW-F4",title:"偏振之窗",summary:"偏振片只通過電場在穿透軸方向的分量。",mission:"旋轉兩片偏振石窗，觀察光強如何隨相對方向改變。",skill:"電磁波偏振",prerequisites:"電場方向、光波",time:"45–90 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-polarization",known:["入射光已線偏振","分析片可旋轉","比較兩片穿透軸方向"],control:control("兩軸夾角",0,90,0,90,15,"°"),prediction:prediction("兩片偏振石窗的軸由平行轉到互相垂直時，透射光強度會怎麼變化？",[["decrease","逐漸減弱至理想零"],["increase","持續增強"],["same","完全不變"]]),reason:reason("偏振顯示光的哪一種特性？",[["transverse","電場振動具有橫向方向"],["longitudinal","光只沿傳播方向振動"],["charge","光一定帶淨電荷"]]),explanation:"偏振片選擇電場振動方向；互相垂直的理想偏振片不再有可通過的電場分量。",hint:"把偏振片想成只允許某一方向的振動穿過。"}
        ],
        advanced:[
          {code:"EMW-A1",title:"磁通脈衝",summary:"由磁通量變化率計算感應電動勢。",mission:"200 匝線圈的每匝磁通量在 0.10 s 內改變 0.015 Wb。",skill:"|ε|=N|ΔΦ|/Δt",prerequisites:"法拉第定律",time:"75–130 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-calc-faraday",known:["N=200","|ΔΦ|=0.015 Wb","Δt=0.10 s"],models:[option("faraday","|ε|=N|ΔΦ|/Δt"),option("no-turns","|ε|=|ΔΦ|/Δt"),option("multiply-time","|ε|=N|ΔΦ|Δt")],inputs:[input("voltage","感應電動勢大小","V",.3)],explanation:"|ε|=200×0.015/0.10=30 V。負號描述方向，本題只問大小。",hint:"不要漏掉線圈匝數 N。"},
          {code:"EMW-A2",title:"降壓之環",summary:"由匝數比求理想變壓器次級電壓。",mission:"初級 1000 匝接 120 V 交流，次級 200 匝。",skill:"Vs/Vp=Ns/Np",prerequisites:"比例",time:"60–120 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-calc-voltage",known:["Vp=120 V","Np=1000","Ns=200","理想變壓器"],models:[option("ratio","Vs=VpNs/Np"),option("inverse","Vs=VpNp/Ns"),option("add","Vs=Vp+Ns/Np")],inputs:[input("voltage","次級電壓","V",.2)],explanation:"Vs=120×200/1000=24 V，次級匝數較少，因此降壓。",hint:"先判斷答案應比 120 V 大還是小。"},
          {code:"EMW-A3",title:"功率守門",summary:"以理想變壓器功率守恆求次級電流。",mission:"承接上一關：120 V、1.0 A 的初級降為 24 V 次級。",skill:"VpIp≈VsIs",prerequisites:"電功率、變壓器",time:"75–130 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-calc-current",known:["Vp=120 V","Ip=1.0 A","Vs=24 V","忽略損耗"],models:[option("power","Is=VpIp/Vs"),option("same","Is=Ip"),option("direct","Is=IpVs/Vp")],inputs:[input("current","次級電流","A",.05)],explanation:"理想輸入輸出功率相等：120×1.0=24×Is，所以 Is=5.0 A。",hint:"降壓時，在理想模型中電流會相應升高。"},
          {code:"EMW-A4",title:"百兆星訊",summary:"由頻率求真空中的電磁波波長。",mission:"星脈塔接收 100 MHz 電磁波，取 c=3.0×10⁸ m/s。",skill:"c=fλ",prerequisites:"科學記號、單位",time:"60–120 秒",image:"assets/emwave/emwave-temple.png",visual:"emwave-calc-wavelength",known:["f=100 MHz=1.0×10⁸ Hz","c=3.0×10⁸ m/s","真空"],models:[option("wave","λ=c/f"),option("multiply","λ=cf"),option("inverse","λ=f/c")],inputs:[input("wavelength","波長","m",.03)],explanation:"λ=(3.0×10⁸)/(1.0×10⁸)=3.0 m；真空中不同頻率電磁波速度相同。",hint:"MHz 要先換成 10⁶ Hz。"}
        ]
      }
    },
    {
      id:"quantum",number:"16",eyebrow:"QUANTUM & ATOMS",name:"離散神殿",short:"量子與原子",description:"從電子與能量量子化出發，破解 X 射線、物質波、原子模型與光譜。",heroImage:"assets/quantum/quantum-temple.png",color:"#b58cff",
      tracks:{
        foundation:[
          {code:"QTM-F1",title:"陰極之影",summary:"陰極射線受電場與磁場偏轉，顯示它由帶電粒子組成。",mission:"操控古老放電管的場，判斷陰極射線究竟是中性光束還是帶電粒子。",skill:"電子的發現",prerequisites:"電場、磁場",time:"45–75 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-electron",known:["射線可在真空管中前進","施加電場或磁場會偏轉","不同陰極材料得到相同性質"],control:control("外加場強",0,4,0,4,.5,"級"),prediction:prediction("外加場增強時，陰極射線軌跡如何？",[["bend","偏轉更明顯"],["same","完全不受影響"],["vanish","質量立刻消失"]]),reason:reason("這支持哪個結論？",[["charged-particle","陰極射線含帶電粒子"],["neutral-wave","它一定是完全中性的聲波"],["material","只由特定金屬原子構成"]]),explanation:"陰極射線在電、磁場中偏轉且與陰極材料無關，支持電子是普遍存在的帶負電粒子。",hint:"若完全不帶電，電場不會改變它的路徑。"},
          {code:"QTM-F2",title:"油滴密碼",summary:"油滴電量呈現基本電量的整數倍。",mission:"比較多顆懸浮油滴的電量，找出失序無法拆散的最小電荷單位。",skill:"電荷量子化",prerequisites:"倍數",time:"45–75 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-charge",known:["各油滴電量不同","量測值可寫成同一小量的整數倍","忽略量測誤差"],control:control("油滴編號",1,4,1,4,1,"顆"),prediction:prediction("若基本電量為 e，油滴電量最合理的形式是？",[["integer","ne，n 為整數"],["any","任意連續小數倍 e"],["zero","所有油滴都必為 0"]]),reason:reason("密立坎實驗支持什麼？",[["quantized","電荷具有基本單位"],["massless","電子沒有質量"],["gravity","重力不作用於油滴"]]),explanation:"密立坎油滴實驗顯示電量以基本電量 e 的整數倍出現，電荷並非可任意連續分割。",hint:"找出所有觀測電量的共同最小單位。"},
          {code:"QTM-F3",title:"黑體階梯",summary:"普朗克以離散能量份額解釋黑體輻射。",mission:"連續能量模型讓高頻輻射失控，必須改用一階一階的能量石階。",skill:"量子論的發現",prerequisites:"頻率、能量",time:"45–75 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-planck",known:["振盪頻率為 f","能量以 hf 為基本份額","n 為非負整數"],control:control("能階序號 n",0,4,0,4,1,"階"),prediction:prediction("這座黑體階梯所允許的能量，最合理的形式是？",[["nhf","E=nhf"],["continuous","E 可任取任意值且與 f 無關"],["zero","所有振盪只能有零能量"]]),reason:reason("『量子化』代表什麼？",[["packets","能量以離散份額交換"],["random","任何結果都無法事先斷言"],["small","物體一定非常小"]]),explanation:"普朗克提出能量以 hf 的整數份額交換，開啟量子論並解決古典黑體輻射困境。",hint:"量子化的重點是允許值不連續，不只是數值很小。"},
          {code:"QTM-F4",title:"無軌迷霧",summary:"現代量子模型以機率分布描述電子，而非固定古典軌道。",mission:"依序比較拉塞福、波耳與量子機率雲，選出最符合現代觀點的描述。",skill:"原子模型演進",prerequisites:"原子核、能階",time:"60–90 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-atom",known:["正電荷與大部分質量集中於原子核","原子光譜呈離散線","現代量子力學使用機率分布"],control:control("模型年代",1,3,1,3,1,"代"),prediction:prediction("現代量子模型如何描述原子內電子？",[["probability","以機率分布描述，沒有固定古典軌道"],["planet","沿確定行星軌道運行"],["nucleus","靜止堆在原子核內"]]),reason:reason("波耳模型的重要貢獻是什麼？",[["levels","以量子化能階說明氫原子光譜"],["no-nucleus","否定原子核存在"],["continuous","主張能量完全連續"]]),explanation:"拉塞福建立核式模型，波耳以量子化能階闡述氫光譜；現代量子力學則以機率分布取代固定古典軌道。",hint:"區分『能階是離散的』與『電子有固定圓形路線』。"}
        ],
        advanced:[
          {code:"QTM-A1",title:"X 光截界",summary:"由加速電壓求 X 射線最短波長。",mission:"電子經 12.4 kV 加速後撞擊靶材，取 hc=1240 eV·nm。",skill:"eV=hc/λmin",prerequisites:"電子伏特、單位換算",time:"90–160 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-calc-xray",known:["V=12.4 kV=12400 V","最大光子能量 12400 eV","hc=1240 eV·nm"],models:[option("cutoff","λmin=hc/(eV)"),option("multiply","λmin=hc·eV"),option("visible","λmin=1240/12.4")],inputs:[input("wavelength","最短波長","nm",.002)],explanation:"λmin=1240/12400=0.100 nm；實際光譜還包含較長波長。",hint:"12.4 kV 對單一電子等於 12.4 keV。"},
          {code:"QTM-A2",title:"普朗克刻度",summary:"由頻率計算單一光子能量。",mission:"頻率 6.0×10¹⁴ Hz 的光通過離散石階，取 h=4.14×10⁻¹⁵ eV·s。",skill:"E=hf",prerequisites:"科學記號",time:"75–130 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-calc-photon",known:["f=6.0×10¹⁴ Hz","h=4.14×10⁻¹⁵ eV·s"],models:[option("planck","E=hf"),option("inverse","E=h/f"),option("square","E=hf²")],inputs:[input("energy","光子能量","eV",.03)],explanation:"E=(4.14×10⁻¹⁵)(6.0×10¹⁴)=2.484 eV，報為 2.48 eV。",hint:"10⁻¹⁵×10¹⁴ 會留下 10⁻¹。"},
          {code:"QTM-A3",title:"物質波紋",summary:"由動量求德布羅意波長。",mission:"粒子動量為 6.63×10⁻²⁴ kg·m/s，取 h=6.63×10⁻³⁴ J·s。",skill:"λ=h/p",prerequisites:"科學記號、動量",time:"90–160 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-calc-matter",known:["p=6.63×10⁻²⁴ kg·m/s","h=6.63×10⁻³⁴ J·s","1 nm=10⁻⁹ m"],models:[option("debroglie","λ=h/p"),option("product","λ=hp"),option("photon","λ=pc")],inputs:[input("wavelength","物質波波長","nm",.002)],explanation:"λ=(6.63×10⁻³⁴)/(6.63×10⁻²⁴)=1.0×10⁻¹⁰ m=0.100 nm。",hint:"J·s 可以化成 kg·m²/s，再除以 kg·m/s。"},
          {code:"QTM-A4",title:"紅線躍遷",summary:"由氫原子能階差求發射光波長。",mission:"氫原子電子由 n=3 躍遷到 n=2，En=−13.6/n² eV，取 hc=1240 eV·nm。",skill:"ΔE=hf=hc/λ",prerequisites:"能階、光子能量",time:"120–180 秒",image:"assets/quantum/quantum-temple.png",visual:"quantum-calc-spectrum",known:["E3=−13.6/9 eV","E2=−13.6/4 eV","發射光子能量為能階差"],models:[option("transition","Eγ=E3−E2 的大小，λ=hc/Eγ"),option("sum","Eγ=|E3|+|E2|"),option("ratio","λ=Eγ/hc")],inputs:[input("energy","光子能量","eV",.03),input("wavelength","波長","nm",5)],explanation:"能階差約 1.89 eV，λ≈1240/1.89≈656 nm，對應氫光譜的紅色 Hα 線。",hint:"發射能量是初、末能階之差的正值。"}
        ]
      }
    },
    {
      id:"nuclear",number:"17",eyebrow:"NUCLEI & CONSERVATION",name:"幽核神殿",short:"原子核與衰變",description:"辨認原子核、放射性與基本作用，進階運用半衰期、質能與守恆律。",heroImage:"assets/nuclear/nuclear-temple.png",color:"#ff7396",
      tracks:{
        foundation:[
          {code:"NUC-F1",title:"核心束縛",summary:"強作用力在極短距離內協助束縛核子。",mission:"帶正電的質子彼此排斥，神殿要求找出原子核仍能存在的關鍵作用。",skill:"原子核與強作用",prerequisites:"庫侖力、原子結構",time:"45–75 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-core",known:["原子核由質子與中子組成","質子間有電磁斥力","核子距離非常小"],control:control("核子間距",1,3,1,3,.5,"級"),prediction:prediction("在核子尺度協助束縛原子核的是哪種作用？",[["strong","強作用"],["gravity","重力"],["friction","摩擦力"]]),reason:reason("中子在核內的重要性之一是什麼？",[["strong-no-charge","參與強作用但不增加質子間電斥力"],["negative","帶負電抵消所有質子"],["massless","完全沒有質量"]]),explanation:"質子與中子都參與短程強作用；中子不帶電，可增加核內束縛而不增加質子間電斥力。",hint:"比較電磁力與強作用在原子核尺度扮演的角色。"},
          {code:"NUC-F2",title:"三種幽光",summary:"α、β、γ 衰變對原子核的改變不同。",mission:"辨認從幽核深井逸出的三種訊號，判斷哪一種會直接改變質量數。",skill:"放射性衰變種類",prerequisites:"質子、中子",time:"45–75 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-radiation",known:["α 粒子含 2 質子與 2 中子","β⁻ 衰變把中子轉成質子並放出電子等粒子","γ 是高能光子"],control:control("衰變類型",1,3,1,3,1,"種"),prediction:prediction("當幽核深井中的原子核發生 α 衰變時，它的質量數會如何改變？",[["minus4","減少 4"],["same","完全不變"],["plus1","增加 1"]]),reason:reason("γ 衰變主要改變什麼？",[["energy","核的能量狀態，不改變質量數與原子序"],["protons","一定減少兩個質子"],["neutrons","一定增加四個中子"]]),explanation:"α 衰變使 A 減 4、Z 減 2；β⁻ 使 Z 加 1、A 不變；γ 只釋放能量，不改變 A、Z。",hint:"用放出粒子帶走的核子數與電荷逐項守恆。"},
          {code:"NUC-F3",title:"半生之鐘",summary:"半衰期是統計規律，通常不由樣品多少或一般環境條件決定。",mission:"改變樣品數量與溫度，判斷幽核之鐘是否改變自身節奏。",skill:"半衰期判斷",prerequisites:"比例",time:"30–60 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-halflife",known:["同一放射性核種","比較不同初始數量","一般溫度與壓力變化"],control:control("初始核數",1,4,1,4,1,"倍"),prediction:prediction("初始核數加倍時，半衰期如何？",[["same","不變"],["double","加倍"],["half","減半"]]),reason:reason("經過一個半衰期後，剩餘比例是多少？",[["half","原來的 1/2"],["zero","必定歸零"],["quarter","原來的 1/4"]]),explanation:"半衰期是同一核種的統計特徵；增加樣品只會增加初始核數與活動度，不改變半衰期。",hint:"半衰期描述剩餘『比例』，不是固定少掉幾顆。"},
          {code:"NUC-F4",title:"四力議會",summary:"不同尺度的現象由不同基本交互作用主導。",mission:"把重力、電磁力、強作用與弱作用送回正確的法則席位。",skill:"四種基本交互作用",prerequisites:"重力、電磁力、原子核",time:"45–90 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-forces",known:["天體軌道由重力主導","電荷與光涉及電磁作用","核子束縛涉及強作用","β 衰變涉及弱作用"],control:control("現象編號",1,4,1,4,1,"項"),prediction:prediction("β 衰變主要與哪種基本作用有關？",[["weak","弱作用"],["gravity","重力"],["friction","摩擦力"]]),reason:reason("原子核內核子主要由哪種作用束縛？",[["strong","強作用"],["magnetic-only","只有磁力"],["normal","正向力"]]),explanation:"四種基本交互作用各有主場：重力統御大尺度質量，電磁作用處理電荷與光，強作用束縛核子，弱作用參與 β 衰變。",hint:"摩擦力與正向力不是新的基本作用，本質上源自電磁作用。"}
        ],
        advanced:[
          {code:"NUC-A1",title:"三響半生",summary:"由半衰期計算剩餘核數。",mission:"初始有 800 個放射性核，半衰期 2.0 h，經過 6.0 h。",skill:"N=N₀(1/2)^(t/T)",prerequisites:"指數",time:"75–130 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-calc-half",known:["N₀=800","T₁/₂=2.0 h","t=6.0 h"],models:[option("half-life","N=N₀(1/2)^(t/T₁/₂)"),option("linear","N=N₀(1−t/T₁/₂)"),option("double","N=N₀2^(t/T₁/₂)")],inputs:[input("nuclei","剩餘核數","個",1)],explanation:"6.0 h 是三個半衰期，N=800×(1/2)³=100。",hint:"先算經過幾個半衰期，再連續除以 2。"},
          {code:"NUC-A2",title:"質量虧損",summary:"把質量虧損換算為束縛能。",mission:"某核反應的質量虧損為 0.0020 u，取 1 u c²=931.5 MeV。",skill:"E=Δmc²",prerequisites:"比例、質能",time:"75–130 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-calc-mass",known:["Δm=0.0020 u","1 u c²=931.5 MeV"],models:[option("mass-energy","E=Δm×931.5 MeV/u"),option("divide","E=931.5/Δm"),option("classical","E=½Δmv²")],inputs:[input("energy","能量","MeV",.03)],explanation:"E=0.0020×931.5≈1.863 MeV，報為 1.86 MeV。",hint:"題目已把 c² 包含在每原子質量單位的能量換算中。"},
          {code:"NUC-A3",title:"阿爾法封印",summary:"以質量數與原子序守恆辨認 α 衰變子核。",mission:"鈾-238（Z=92）放出一顆 α 粒子。",skill:"核反應守恆",prerequisites:"α 粒子組成",time:"75–130 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-calc-alpha",known:["母核 A=238、Z=92","α 粒子 A=4、Z=2","A 與電荷守恆"],models:[option("subtract","A子=238−4，Z子=92−2"),option("add","A子=238+4，Z子=92+2"),option("mass-only","A子=234，Z子仍 92")],inputs:[input("massNumber","子核質量數 A","",.1),input("atomicNumber","子核原子序 Z","",.1)],explanation:"子核 A=234、Z=90，為釷-234；α 粒子帶走 4 個核子與 2 個正電荷。",hint:"把反應式左右的 A 與 Z 分別加總。"},
          {code:"NUC-A4",title:"貝塔轉生",summary:"以弱作用與電荷守恆判斷 β⁻ 衰變。",mission:"碳-14（Z=6）發生 β⁻ 衰變，形成氮-14。",skill:"β⁻ 衰變守恆",prerequisites:"中子、質子與電子",time:"75–140 秒",image:"assets/nuclear/nuclear-temple.png",visual:"nuclear-calc-beta",known:["一個中子轉為質子","放出電子與反微中子","質量數保持 14"],models:[option("beta-minus","A不變，Z增加1"),option("alpha","A減4，Z減2"),option("beta-plus","A不變，Z減1")],inputs:[input("atomicNumber","子核原子序 Z","",.1)],explanation:"β⁻ 衰變使一個中子轉為質子，所以 A 仍為 14、Z 由 6 增為 7；電子與反微中子協助滿足守恆。",hint:"核內核子總數不變，但質子數增加一個。"}
        ]
      }
    }
  ];

  const lore = {
    titans:{act:"第一幕｜甦醒",region:"巨像荒原",guardian:"銅臂守望者・塔洛斯",relic:"力矩刻印",crisis:"失序讓所有關節的支點與施力線錯位，巨像正被自己的力量撕裂。",oath:"真正的力量，不只取決於力有多大，也取決於它從哪裡、往哪裡作用。"},
    chrono:{act:"第一幕｜甦醒",region:"斷時長廊",guardian:"軌跡記錄官・刻羅",relic:"時序刻印",crisis:"事件先後與運動軌跡互相錯置，列車被困在永不相遇的時間迴圈。",oath:"不必追逐時間；讀懂軌跡，時間會自己說明發生了什麼。"},
    photo:{act:"第一幕｜甦醒",region:"古光銀河",guardian:"光門祭司・赫利亞",relic:"光子刻印",crisis:"古光封印混淆了亮度與頻率，使再強的光也無法找到正確門檻。",oath:"世界並非只由連續光流構成；有時，能量是一份一份抵達。"},
    ripple:{act:"第一幕｜甦醒",region:"沉眠水庭",guardian:"雙泉吟遊者・涅瑞伊",relic:"波紋刻印",crisis:"兩座聖泉失去共同節奏，節線與腹線交織成封住水門的迷宮。",oath:"每一道波都保有自己的聲音，而世界在它們重疊時寫出新的圖樣。"},
    uncertainty:{act:"第二幕｜裂隙",region:"真理量室",guardian:"無刻度者・梅特拉",relic:"實證刻印",crisis:"失序把數字偽裝成絕對真理；量測者忘了每個答案都帶著解析度與散布。",oath:"誠實的數字承認自己的界線；不確定不是無知，而是真實世界的形狀。"},
    momentum:{act:"第二幕｜裂隙",region:"碰撞聖所",guardian:"赤輪裁決者・伊姆佩圖斯",relic:"動量刻印",crisis:"石車戰陣失去碰撞法則，衝擊沿城市無限放大，連守護者也無法停下。",oath:"力量也許只出現一瞬，但它留下的動量會被整個系統記住。"},
    energy:{act:"第二幕｜裂隙",region:"守恆熔爐",guardian:"熔爐司秤・厄爾貢",relic:"能量刻印",crisis:"機械能似乎在摩擦中消失，熔爐因無人追蹤能量去向而逐漸熄滅。",oath:"能量不會憑空消失；它只是換了比較難被看見的形式。"},
    electric:{act:"第二幕｜裂隙",region:"雷霆迴廊",guardian:"雙極執政官・伏爾塔",relic:"電場刻印",crisis:"電荷與電流失去路徑，雷霆在神殿內盲目分流，核心即將過載。",oath:"看不見的場為每個位置留下方向；閉合的路徑讓能量得以流動。"},
    magnetic:{act:"第三幕｜統一",region:"磁序迷宮",guardian:"北冕羅盤・洛倫茲",relic:"磁序刻印",crisis:"電與磁被失序硬生生拆開，帶電粒子在迷宮裡失去彎曲與感應的方向。",oath:"磁力不推你更快，它改變你面向的道路；變動的磁通則喚醒電。"},
    optics:{act:"第三幕｜統一",region:"折光鏡城",guardian:"稜鏡鑄師・斯涅爾",relic:"鏡光刻印",crisis:"鏡城的法線全部傾倒，反射、折射與成像再也找不到共同的幾何秩序。",oath:"光線選擇的不是神祕捷徑，而是可以被幾何與比例讀懂的道路。"},
    thermal:{act:"第三幕｜統一",region:"熾熱氣室",guardian:"焰心記錄官・卡諾",relic:"熱力刻印",crisis:"熱流與功的帳目被抹除，氣室一面結霜、一面失控膨脹。",oath:"熱與功是跨越系統邊界的兩種能量傳遞；內能記錄了它們留下的結果。"},
    celestial:{act:"第四幕｜天穹",region:"十二環天文台",guardian:"星圖守望者・克卜勒",relic:"軌道刻印",crisis:"可見世界的法則失去共鳴，天穹軌道逐圈偏離，並露出藏在星圖背後的五座根源神殿。",oath:"落下與繞行原來屬於同一條法則；讀懂天空，才能看見更深的世界。"},
    newton:{act:"第五幕｜根源",region:"零力審判庭",guardian:"慣性裁決官・紐頓",relic:"合力刻印",crisis:"所有物體仍在移動，受力原因卻被失序拆散；沒有合力的石舟被迫停下，有合力的石車反而拒絕加速。",oath:"運動不需要力來維持；力真正改變的，是速度。"},
    resonance:{act:"第五幕｜根源",region:"無聲穹廳",guardian:"諧振吟者・赫茲",relic:"諧鳴刻印",crisis:"穹廳的節點與腹點不斷漂移，錯誤的頻率正在把整座城市推向失控共振。",oath:"每個系統都有自己的節奏；在正確頻率上，一次微小推動也能喚醒巨大的回聲。"},
    emwave:{act:"第五幕｜根源",region:"星脈塔陣",guardian:"場域織者・馬克士威",relic:"星脈刻印",crisis:"交變電流、磁通與光被切成三種互不相識的法則，星際訊號正逐一熄滅。",oath:"變動的電場喚醒磁場，變動的磁場回應電場；光就是它們共同前進的方式。"},
    quantum:{act:"終幕｜微界",region:"離散階庭",guardian:"量子守門人・普朗克",relic:"離散刻印",crisis:"失序強迫微觀世界遵守連續軌道，原子光譜因而崩散，所有能階之門同時關閉。",oath:"微觀世界不是縮小版的古典世界；它以離散答案與機率留下可驗證的痕跡。"},
    nuclear:{act:"終幕｜微界",region:"寂核深井",guardian:"核心見證者・居禮",relic:"幽核刻印",crisis:"原子核的強弱作用與守恆帳目被抹去，放射性時間之鐘開始逆轉，失序終核即將甦醒。",oath:"衰變不是無法無天的消失；即使核心改變，法則仍守住電荷、能量與動量。"}
  };
  temples.forEach(temple => Object.assign(temple, lore[temple.id]));

  const histories = {
    titans:"「別被巨人的肌肉騙了。」塔洛斯敲響肘部銅環。「博雷利把骨骼看成槓桿、關節看成支點；肌肉明明很強，卻常因力臂短而必須付出數倍拉力。人體不是完美機械，而是用力量換速度與活動範圍的設計。」",
    chrono:"「亞里斯多德曾斷言重物落得快，但他錯了。」刻羅推動斜面銅球。「伽利略用斜面『稀釋』重力，讓時間慢到能逐次記錄；再把輕重兩球綁在思想實驗裡，逼出舊說的矛盾。運動從此不再只是印象，而是可比較的軌跡。」",
    photo:"「愛因斯坦大膽宣稱光是一份一份抵達的量子。」赫利亞撥動光閘。「密立坎花了近十年想推翻它，最後卻用最嚴格的數據支持了光電方程。想反駁而反駁不了，常比附和更有力量。」",
    ripple:"「波面上的每一點，都像新的源頭。」涅瑞伊指向交錯水紋。「惠更斯給了我們傳播的幾何；楊氏讓兩道光重疊，明暗條紋便替波動留下簽名。水庭的節線與腹線，說的是同一種疊加。」",
    uncertainty:"「他們以為少數大角度偏折只是雜訊。」梅特拉把金箔舉向火光。「拉塞福沒有抹去那幾筆異常，反而追問什麼結構能把粒子猛然彈回。誠實留下散布與異常，才可能看見原子深處的核心。」",
    momentum:"「撞擊只是一瞬，帳卻不會消失。」伊姆佩圖斯讓兩台石車相碰。「惠更斯在碰撞中比較前後運動，後人把這份系統帳目寫成動量。別只盯著單一物體；守恆往往藏在你選定的整個系統裡。」",
    energy:"「焦耳不是用一句口號證明守恆。」厄爾貢轉動槳輪。「下落砝碼做的功，一次次變成水的升溫。當機械功與熱能用同一把尺比較，『消失』的能量才被找回另一種形態。」",
    electric:"「庫侖用扭秤量出微弱的平方反比靜電力。」伏爾塔疊起金屬片。「而我的電堆讓電不再只是一閃即逝的火花，而能持續流動。從力的測量到穩定電源，看不見的電終於成為可操控的東西。」",
    magnetic:"「靜止的磁鐵不會讓線圈一直發電。」洛倫茲轉動羅盤。「法拉第在 1831 年抓住的不是磁場本身，而是磁通的變動；變得越快，感應越強。原因藏在變化率，不在磁鐵看起來有多強大。」",
    optics:"「我先留下折射角的規律，卻沒能看見它公開流傳。」斯涅爾扶正法線。「我曾在時光長河中看見後世的牛頓與惠更斯：一人主張光微粒進水會加速，一人主張波在水中變慢。折射成了裁決兩種說法的實驗戰場。」",
    thermal:"「功可以完全變成熱，熱卻不能全數回到功。」卡諾注視蒸氣機。「我在熱質說仍盛行時看見效率上限：這不是工匠不夠聰明，而是自然對熱機設下的邊界。能量守恆，轉換的可用性卻不對稱。」",
    celestial:"「你以為八弧分只是眼睛的錯覺嗎？」克卜勒按住第谷二十年的火星資料。「我拒絕把那小小殘差擦掉；正是它逼我放棄千年的完美圓軌道。最微小的不合，有時足以改寫整片天空。」",
    newton:"「人們總以為石頭需要推力才會繼續滾。」紐頓望向對接斜面。「伽利略指出：若沒有摩擦，球不必被持續推動。運動不需要力維持；真正需要力的，是速度的改變。」",
    resonance:"「接近的聲源會把波峰擠密，音調因而拔高。」赫茲敲響火花隙。「馬克士威預言的另一種波在紙上沉睡二十多年，直到我的接收環產生火花。沒有實測的預言仍待裁決，實驗才讓數學幽靈發出回聲。」",
    emwave:"「光是什麼？答案竟藏在方程式裡。」馬克士威展開交變場紋。「我算出的電磁擾動速度與光速一致，於是知道光就是電磁場共同前進的漣漪。從既有法則推出尚未見過的波，是理論最冒險也最迷人的力量。」",
    quantum:"「你在天衡神殿學到的偉大定律，到這裡不夠用了。」普朗克凝視斷續紅光。「為了讓黑體輻射不再失控，我只好假設能量一份一份交換。後來的原子光譜提醒我們：微界不是縮小版的古典世界。」",
    nuclear:"「瀝青鈾礦的輻射竟比純鈾更強。」居禮指著發光礦石。「那不是測量失準，而是未知元素留下的呼喊。當可靠結果違反常識，別急著懷疑儀器；先問我們以為完整的世界，是否其實少了一塊。」"
  };
  temples.forEach(temple => { temple.history = histories[temple.id]; });

  const curriculum = {
    titans:{foundation:"必修 PEb-Ⅴc-5",advanced:"加深加廣選修 PEb-Ⅴa-15"},
    chrono:{foundation:"必修 PEb-Ⅴc-1～4",advanced:"加深加廣選修 PEb-Ⅴa"},
    photo:{foundation:"必修 PKd-Ⅴc-1～2",advanced:"加深加廣選修 PKd-Ⅴa-8"},
    ripple:{foundation:"必修 PKa-Ⅴc-1、5",advanced:"必修 PKa-Ⅴc-6＋加深加廣選修"},
    uncertainty:{foundation:"必修 PEa-Ⅴc-1～3",advanced:"加深加廣選修 PEa-Ⅴa-1"},
    momentum:{foundation:"加深加廣選修 PEb-Ⅴa-10～12",advanced:"加深加廣選修 PEb-Ⅴa-10～12"},
    energy:{foundation:"必修 PBa-Ⅴc-2",advanced:"加深加廣選修 PBa-Ⅴa"},
    electric:{foundation:"必修 PKc-Ⅴc-1～2",advanced:"加深加廣選修 PKc-Ⅴa"},
    magnetic:{foundation:"必修 PKc-Ⅴc-3",advanced:"加深加廣選修 PKc-Ⅴa-9"},
    optics:{foundation:"必修 PKa-Ⅴc-3～4",advanced:"加深加廣選修 PKa-Ⅴa-13"},
    thermal:{foundation:"必修 PBb-Ⅴc-1～2",advanced:"加深加廣選修 PBb-Ⅴa-3"},
    celestial:{foundation:"必修 PEb-Ⅴc-3、PKb-Ⅴc-1～2",advanced:"加深加廣選修 PKb-Ⅴa"},
    newton:{foundation:"必修 PEb-Ⅴc-2、4～5",advanced:"加深加廣選修 PEb-Ⅴa"},
    resonance:{foundation:"必修 PKa-Ⅴc-1～2",advanced:"加深加廣選修 PKa-Ⅴa-7、9、13"},
    emwave:{foundation:"必修 PKa-Ⅴc-7、PKc-Ⅴc-4～6",advanced:"加深加廣選修 PKc-Ⅴa-15"},
    quantum:{foundation:"必修 PKd-Ⅴc-3～7",advanced:"加深加廣選修 PKd-Ⅴa-8"},
    nuclear:{foundation:"必修 PKe-Ⅴc-1～3、PBa-Ⅴc-3～4",advanced:"加深加廣選修 PKe-Ⅴa-3；半衰期為跨科銜接"}
  };
  temples.forEach(temple => {
    temple.curriculum = curriculum[temple.id];
    for (const level of temple.tracks.foundation) {
      const contractExplanation = level.explanation;
      level.assessedClaim = level.prediction.question;
      level.modelId = `qualitative:${level.visual}`;
      level.observableSchema = {
        knownInputs: level.known,
        manipulableInputs: [level.control.label],
        previewOutputs: ["裝置狀態", "控制值"],
        runObservables: ["本次機關的物理圖像"],
        derivedAggregates: [level.reason.question],
        conclusionLabels: level.prediction.options.map(item => item.value)
      };
      level.disclosureContract = {
        prePlan: ["情境", "可直接觀察的原始資料", "可操控量"],
        afterPlan: ["即時裝置預覽"],
        afterRun: ["正式觀察結果", "因果理由"],
        afterEvaluation: ["結論", "完整緣由"]
      };
      level.disclosureContract.previewGeometry = previewGeometryFor(level);
      level.stateContract = {
        contractId: `${temple.id}.${level.code.toLowerCase()}`,
        assessedClaim: level.assessedClaim,
        modelId: level.modelId,
        explanation: contractExplanation
      };
      delete level.explanation;
      level.storyTeaser = level.mission;
      level.storyProblem = `${temple.guardian}正被「${level.title}」的失序困住：${level.mission} 先押下一種可能，再親手改變${level.control.label}，讓本次機關回應決定${temple.relic}能否復原。`;
      level.prePlanKnown = [...level.known];
    }
    for (const level of temple.tracks.advanced) {
      const outputSchema = level.inputs.map(field => ({ id: field.id, tolerance: field.tolerance }));
      const contractExplanation = level.explanation;
      level.assessedClaim = `${level.summary}｜${level.inputs.map(field => field.label).join("、")}`;
      level.modelId = `domain:${level.visual}`;
      level.observableSchema = {
        knownInputs: level.known,
        manipulableInputs: level.inputs.map(field => field.label),
        previewOutputs: ["裝置與已知量"],
        runObservables: ["依玩家模型與輸入產生的圖像"],
        derivedAggregates: level.inputs.map(field => field.label),
        conclusionLabels: ["supported", "contradicted", "inconclusive"]
      };
      level.disclosureContract = {
        prePlan: ["情境", "已知量", "候選模型"],
        afterPlan: ["玩家選定的模型", "數值輸入"],
        afterRun: ["由玩家模型與輸入導出的結果"],
        afterEvaluation: ["模型判定", "完整推導"]
      };
      level.stateContract = {
        contractId: `${temple.id}.${level.code.toLowerCase()}`,
        assessedClaim: level.assessedClaim,
        modelId: level.modelId,
        outputSchema,
        explanation: contractExplanation
      };
      delete level.explanation;
      level.inputs.forEach(field => { delete field.tolerance; });
      level.storyTeaser = level.mission;
      level.storyProblem = `${temple.guardian}必須解開「${level.title}」：${level.mission} 從碑文中選出能連起已知量的法則，再刻入${level.inputs.map(field => field.label).join("與")}，讓${temple.relic}恢復穩定。`;
      level.prePlanKnown = [...level.known];
    }
  });

  // 這些欄位只負責第一次進關前的揭露層。結論、實驗結果與因果語句
  // 必須等 comparisonPlan 鎖定並完成 evidenceRun 後才可出現。
  const prePlanNarratives = {
    "G-F1": ["石臂的三個關鍵位置被失序交換。", "守衛只認得三種槓桿角色；錯置任何一處，石臂都不會甦醒。", ["前臂托住石球", "圖中標出肘部、肌腱附著處與石球位置", "三個位置分別對應一種槓桿角色"]],
    "G-F2": ["同一股推力必須選擇兩個位置之一。", "這扇石門有兩個施力位置；你必須先選擇要推哪裡，再觀察轉動痕跡。", ["兩次推力大小相同", "推力方向相同", "施力點距門軸分別為 10 cm 與 30 cm"]],
    "G-F3": ["古代肌索能從不同方向拉動同一根前臂。", "力的大小與附著位置都被鎖定，只有拉力方向仍可調整。", ["力的大小固定", "施力點固定", "候選夾角為 15° 到 90°"]],
    "G-F4": ["搬運長廊只允許巨人選一次持物距離。", "石球重量不變；你要在遠近兩種姿勢中選一種，避免神火過早耗盡。", ["石球重量相同", "石球可放在離髖 45 cm 或 15 cm 處", "髖伸肌群等效力臂固定為 5 cm"]],
    "P-F1": ["金屬門前的光源可以改變節奏。", "門上的電子出口仍然沉睡；你只能改變光的頻率，再觀察能量刻度。", ["金屬種類固定", "光強度固定", "只改變照射頻率"]],
    "P-F2": ["祭壇把紅光調得刺眼，出口仍沒有回應。", "頻率保持在門檻下方；你要判斷繼續增加光強是否值得。", ["金屬種類固定", "光的頻率低於已知門檻", "只提高光強度"]],
    "P-F3": ["兩塊未知金屬等待同一束古光。", "先判斷哪種機關回應能比較門檻，再啟動照射留下兩塊金屬的反應。", ["A、B 金屬接受相同頻率與強度", "兩塊金屬的反應尚未顯示", "只比較本次照射後是否逸出電子"]],
    "P-F4": ["三道光門要共享一枚有限能源核心。", "每道門都有自己的門檻；你要先決定調整順序，再查看能源是否被有效使用。", ["三座金屬門檻不同", "可調整頻率與強度", "總能源有限"]],
    "W-F1": ["水眼節奏失控，同心波紋正在重排。", "水速保持不變；你要先猜頻率改變後的紋路，再讓水眼留下新波形。", ["單一波源", "水波速度固定", "頻率可由 2 Hz 調到 4 Hz"]],
    "W-F2": ["水眼的起伏力量可以獨立調整。", "頻率與水速都被鎖住；你只能改變振幅，觀察波形哪些特徵隨之改變。", ["單一波源", "頻率固定", "振幅可由 1 級調到 3 級"]],
    "W-F3": ["第二座水眼將在你的判斷後甦醒。", "兩座水眼會以相同節奏持續振動；先選擇你預期看到的水面結構。", ["兩個波源同頻", "兩波源持續振動", "水面結果尚未顯示"]],
    "W-F4": ["兩座水眼之間的距離可以被拉開。", "頻率保持固定；你要先押注干涉骨架如何改變，再移動水眼比對。", ["兩個波源同頻", "波速與頻率固定", "波源間距可由 4 格調到 8 格"]],
    "U-F3": ["一根微小銅柱卡住了量室的門縫。", "兩把刻度不同的量具放在桌上；先決定哪一把能分辨任務要求的細節，再讓量室檢查你的選擇。", ["需要分辨約 0.1 mm 的差異", "公分尺最小刻度 1 mm", "另一把量具可讀到 0.1 mm"]],
    "B-F1": ["兩根磁柱的朝向被失序打亂。", "距離固定，只能翻轉右側磁柱；先判斷石門會靠近還是分開。", ["兩磁柱距離固定", "只改變右柱朝向", "其他力忽略不計"]],
    "B-F2": ["正電粒子即將穿過一片看不見的磁場。", "速度與磁場已知；先選擇路徑偏折方向，再讓粒子進場。", ["粒子帶正電", "初速度向右", "磁場垂直紙面向內"]],
    "B-F3": ["載流石橋只允許切換一次電流方向。", "磁場與導線位置固定；先判斷切換後橋面如何回應。", ["導線與磁場垂直", "磁場方向固定", "只切換電流的流向"]],
    "B-F4": ["磁石要在兩種速度中選一種穿入線圈。", "路徑與磁石都相同；先判斷完成時間不同會怎樣改變神燈回應。", ["磁石、線圈與路徑相同", "總磁通量改變相同", "只改變穿入所需時間"]],
    "O-F1": ["鏡城的法線仍在，反射通道卻沒有亮起。", "你可以改變入射角；先選擇反射方向如何跟著改變，再開啟光束。", ["鏡面平坦", "法線垂直鏡面", "所有角度都從法線量起"]],
    "O-F2": ["一道光將從空氣斜射進入水晶。", "兩側介質與入射方向已固定；先選擇光進入後偏向哪一側。", ["光由空氣進入水晶", "水晶折射率較大", "入射角不為零"]],
    "O-F3": ["水晶內的光正在逼近邊界。", "介質不變，只能逐步增加入射角；先判斷哪種現象可能封住出口。", ["光由水晶射向空氣", "水晶折射率較大", "可逐步增加入射角"]],
    "O-F4": ["遠方燈塔送來近似平行的光束。", "凸透鏡已固定；先選擇光穿過後會抵達哪個區域。", ["使用薄凸透鏡", "入射光近似平行主軸", "忽略像差"]]
    ,"EMW-F1": ["交變星輪的節拍與方向刻痕錯開了。", "觀察同一段導線跨過半個週期；先押下指針接下來的行為，再讓星輪留下完整週期。", ["觀察同一段導線", "電流隨時間改變", "方向指示器尚未留下完整週期痕跡"]]
    ,"NUC-F4": ["四個法則席位被失序調換。", "β 衰變與核子束縛的守護符文同時熄滅；先替第一個現象選席位，再讓議會比對兩種核內變化。", ["自然界有四種基本交互作用", "β 衰變會改變核內中子與質子的身分", "需由機關判定主導此轉變的作用"]]
  };
  for (const temple of temples) {
    for (const level of temple.tracks.foundation) {
      const narrative = prePlanNarratives[level.code];
      if (!narrative) continue;
      [level.storyTeaser, level.storyProblem, level.prePlanKnown] = narrative;
      level.observableSchema.knownInputs = level.prePlanKnown;
    }
  }

  const chrono = temples.find(temple => temple.id === "chrono");
  for (const level of chrono.tracks.foundation) {
    const braking = level.code === "C-F4";
    Object.assign(level.stateContract, {
      contractId: braking ? "chrono.brake" : "chrono.meet",
      episode: braking ? "braking_gate" : "relative_meeting",
      modelId: braking ? "constant_acceleration_stop" : "uniform_relative_motion",
      knownInputs: braking ? ["initialSpeed", "gatePosition"] : ["x0", "v0", "trackGeometry"],
      manipulableInputs: braking ? ["decelerationSetting"] : ["launchDelay", "relativeSpeed"],
      runObservables: braking ? ["v(t)", "x(t)", "stopPosition"] : ["x1(t)", "x2(t)", "gap(t)"],
      conclusionLabels: braking ? ["safe_stop", "overshoot"] : ["safe_pass", "collision"],
      causalMutation: braking ? "decelerationSetting" : "relativeSpeed"
    });
    level.modelId = level.stateContract.modelId;
  }
  for (const level of chrono.tracks.advanced) {
    const braking = level.code === "C-A4";
    Object.assign(level.stateContract, {
      contractId: braking ? "chrono.brake" : "chrono.meet",
      episode: braking ? "braking_gate" : "relative_meeting",
      modelId: braking ? "constant_acceleration_stop" : level.code === "C-A2" ? "relative_accelerated_motion" : "uniform_relative_motion",
      stateValues: braking ? ["v0", "deceleration", "stopPosition"] : ["x1(t)", "x2(t)", "gap(t)", "meetingTime"],
      dependencyManifest: braking ? [
        { valueRef: "chrono.meet.entrySpeed", provenance: "upstream_evidence", contractVersion: "chrono-meet-v2" },
        { valueRef: "chrono.meet.availableDistance", provenance: "upstream_evidence", contractVersion: "chrono-meet-v2" },
        { valueRef: "chrono.brake.deceleration", provenance: "scenario_constraint" }
      ] : []
    });
    level.modelId = level.stateContract.modelId;
  }
  chrono.crisis = "兩隊巡守即將從狹道兩端同時闖入；排程完成後，進站列車還必須在星門前煞停。任何一段誤判，都會讓整條斷時長廊封鎖。";
  chrono.description = "先排定兩隊通過單線狹道的時刻，再以同一條軌跡資料完成星門煞停。";
  const chronoStories = {
    "C-F1":["斜率辨速","兩隊巡守都宣稱自己能先穿過狹道。先比較時空刻痕的斜率，找出真正較快的一隊。"],
    "C-F2":["狹道會合","兩隊從不同位置逼近單線狹道。移動時刻指針，找出兩條軌跡是否在同一時空點重合。"],
    "C-F3":["追近缺口","橙隊已先行；調整青隊相對速度，觀察兩隊間距是否真的逐秒縮短。"],
    "C-F4":["星門試煞","巡守車進站前只能調整煞車強度。讓速度刻痕降到零，判斷哪種設定能較早停下。"],
    "C-A1":["定時抵達","狹道入口在 120 m 外，二十秒後開門。刻入等速值，讓巡守車準時抵達而不是憑空瞬移。"],
    "C-A2":["加速入廊","巡守車由靜止出發，十秒內必須走完 100 m。選定加速法則，讓完整軌跡落在入口時窗。"],
    "C-A3":["延遲追擊","橙隊已取得四十公尺領先。算出青隊出發後的追及時刻，避免兩隊在狹道內相撞。"],
    "C-A4":["星門煞停","承接上一段狹道留下的入站速度與可用距離；若版本仍有效，算出停止位置並確認巡守車能否停在安全窗內。"]
  };
  for (const level of [...chrono.tracks.foundation, ...chrono.tracks.advanced]) [level.storyTeaser, level.storyProblem] = chronoStories[level.code];
  const rawEvidenceExceptions = {
    "U-F1":"63 g 是儀器原始讀值；本關 assessedClaim 評量的是讀值的正確記錄格式，不是猜測秤面數值。",
    "U-F2":"A、B 組都是比較散布所必需的原始資料；本關 assessedClaim 評量的是由資料判斷穩定度。"
  };
  for (const temple of temples) {
    for (const level of temple.tracks.foundation) {
      if (level.code === "EMW-F1") level.prePlanKnown = ["觀察同一段導線", "電流隨時間改變", "方向指示器尚未留下完整週期痕跡"];
      if (level.code === "NUC-F4") level.prePlanKnown = ["自然界有四種基本交互作用", "β 衰變會改變核內中子與質子的身分", "需由機關判定主導此轉變的作用"];
      if (rawEvidenceExceptions[level.code]) level.disclosureContract.prePlanConclusionException = rawEvidenceExceptions[level.code];
      level.observableSchema.knownInputs = level.prePlanKnown;
    }
  }

  const totals = temples.reduce((acc, temple) => {
    acc.foundation += temple.tracks.foundation.length;
    acc.advanced += temple.tracks.advanced.length;
    return acc;
  }, { foundation: 0, advanced: 0 });

  return {
    version: "5.1.0",
    world: {
      title: "法則神殿：失序紀元",
      role: "你是最後一位法則修復者。",
      premise: "世界由十七座神殿共同維持：十二座可見神殿管理日常現象，五座根源神殿守護力、聲、場、量子與原子核。如今「失序」竄入法則網，使現象仍在發生，原因卻彼此錯接。",
      mission: "進入每座神殿，先對眼前的麻煩作出判斷，再親手啟動機關留下刻痕；取得初階的觀測印與進階的演算印，喚醒十七位守護者，重建天穹中央的法則核心。",
      finale: "集齊十七組雙印後，幽核神殿將開啟微界終門。真正的勝利不是背出公式，而是能用模型解釋現象；當證據不支持原先的判斷時，也願意修正自己的解釋。"
    },
    tracks: {
      foundation: { label: "初階殿", grade: "高一基礎／必修概念適合", task: "觀念、讀圖與現象判斷", ability: "讀圖、比較、簡單比例", duration: "30–90 秒" },
      advanced: { label: "進階殿", grade: "高二／高三加深加廣適合", task: "模型・計算挑戰", ability: "代數、向量、三角函數或有效數字", duration: "60–180 秒" }
    },
    totals,
    temples
  };
});
