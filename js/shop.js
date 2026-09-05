const PRODUCTS = [
  {
    id: "guilty-choker",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "FLAGSHIP EXOSKELETON // 旗艦外骨骼項圈",
    price: 2480,
    desc: "以航太級尼龍結合高韌性醫療 TPU 內襯，精密計算前喉結避空壓點，提供兼具絕對控制與舒適度的神經防護。",
    note: "附贈專屬高強度不鏽鋼戰術扣具與防拆雷射標籤。",
    img: "./images/image_choker.jpg",
    images: ["./images/image_choker.jpg", "./images/image_choker_detail.jpg", "./icons/icon-512.png"],
    specs: [],
    // ✦ 修復 3：項圈選項只要尺寸
    chokerSizes: ["S 碼 (29 – 33 cm)", "M 碼 (34 – 38 cm)"]
  },
  {
    id: "guilty-whip",
    brand: "guilty",
    brandName: "欲室｜共犯 義體",
    title: "SYNAPSE TACTICAL WHIP // 神經突觸戰術長鞭",
    price: 1500, // ✦ 修復 4：鞭子改成 1500
    desc: "12 股重磅手工編織戰術纖維，尾端導入高回彈微型配重。破空聲清脆冷冽，落點精確無偏差。",
    note: "總長度約 1.3 公尺，握柄採高抓地力霧面防滑橡膠。",
    img: "./images/image_whip.jpg",
    images: ["./images/image_whip.jpg", "./icons/icon-512.png"],
    specs: ["標準暗黑黑化版", "神經霓虹綠特仕版"]
  },
  {
    id: "shushi-rope",
    brand: "shushi",
    brandName: "束室特選繩藝",
    title: "束室特選・職人手工精煉麻繩【單條裝】",
    price: 350, // ✦ 修復 5：麻繩改為一條一條賣
    desc: "13 道古法脫漿、深層天然植物油浸潤與蜂蠟烘烤。手感細膩溫潤，極度親膚且抗拉緊實。",
    note: "單條裝（長度 7.5 公尺，直徑 6mm）",
    img: "./images/image_rope.jpg",
    images: ["./images/image_rope.jpg", "./icons/icon-512.png"],
    specs: ["深褐色 (黑胡桃油淬)", "天然原麻色 (白蜂蠟輕潤)"]
  }
];
