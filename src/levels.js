// ============================================================
// levels.js —— 关卡配置（v1.0：3 主题 × 3 难度 = 9 关）
// 每关：场景绘制函数名、配色、限时、5 个目标物品（坐标/半径/绘制函数名）、
//       干扰物 decoys（画进场景但点了算错，仅难度 2/3 配置）
// 坐标均为 750×1334 设计分辨率下的逻辑坐标，y ≥ 190 为场景可点击区
// 难度递进：目标半径 26~30 → 22 → 18，限时 90s → 75s → 60s，干扰物 0 → 3 → 5
// ============================================================

// 三套主题配色（同主题三关共用）
const PALETTES = {
  market: {
    wall: '#F1E6CF',    // 米白墙面
    floor: '#C9A97C',   // 暖黄地面
    awningA: '#A63A2E', // 砖红雨棚
    awningB: '#F5EDE0', // 米白雨棚
    wood: '#8A5F38',    // 赭石木架
    basket: '#B08D55',  // 竹筐
    jar: '#7A8B6F'      // 墨绿陶罐
  },
  watch: {
    wall: '#E9DEC8',  // 米白墙面
    panel: '#8A6A45', // 护墙板
    wood: '#6B4A2F',  // 深棕木
    shelf: '#7A5230'  // 搁板
  },
  pharmacy: {
    wall: '#F2E9DA',    // 米白墙面
    floor: '#B99B6E',   // 木地板
    cabinet: '#7A5230', // 药柜棕
    drawer: '#8A5F38'   // 抽屉面
  }
}

export const LEVELS = [
  // ---------------- 菜市场 ----------------
  {
    id: 'market1',
    name: '菜市场',
    difficulty: 1,
    timeLimit: 90,
    scene: 'market', // 对应 painter.js 中 SCENE_DRAWERS.market
    palette: PALETTES.market,
    targets: [
      { id: 'm1', name: '搪瓷杯', x: 110, y: 592, r: 26, draw: 'teacup' },
      { id: 'm2', name: '算盘', x: 616, y: 672, r: 30, draw: 'abacus' },
      { id: 'm3', name: '辣椒串', x: 666, y: 336, r: 26, draw: 'chiliString' },
      { id: 'm4', name: '擀面杖', x: 250, y: 1130, r: 30, draw: 'rollingPin' },
      { id: 'm5', name: '老式秤', x: 375, y: 428, r: 30, draw: 'oldScale' }
    ],
    decoys: []
  },
  {
    id: 'market2',
    name: '菜市场',
    difficulty: 2,
    timeLimit: 75,
    scene: 'market',
    palette: PALETTES.market,
    // 换一个目标子集：擀面杖 → 酱坛，坐标全部重排避开装饰
    targets: [
      { id: 'm1', name: '搪瓷杯', x: 480, y: 590, r: 22, draw: 'teacup' },
      { id: 'm2', name: '算盘', x: 140, y: 860, r: 22, draw: 'abacus' },
      { id: 'm3', name: '辣椒串', x: 80, y: 420, r: 22, draw: 'chiliString' },
      { id: 'm5', name: '老式秤', x: 310, y: 350, r: 22, draw: 'oldScale' },
      { id: 'm6', name: '酱坛', x: 620, y: 920, r: 22, draw: 'sauceJar' }
    ],
    decoys: [
      { x: 560, y: 480, r: 22, draw: 'teacup' },
      { x: 200, y: 470, r: 22, draw: 'abacus' },
      { x: 700, y: 560, r: 22, draw: 'chiliString' }
    ]
  },
  {
    id: 'market3',
    name: '菜市场',
    difficulty: 3,
    timeLimit: 60,
    scene: 'market',
    palette: PALETTES.market,
    targets: [
      { id: 'm1', name: '搪瓷杯', x: 640, y: 1010, r: 18, draw: 'teacup' },
      { id: 'm2', name: '算盘', x: 250, y: 470, r: 18, draw: 'abacus' },
      { id: 'm3', name: '辣椒串', x: 696, y: 430, r: 18, draw: 'chiliString' },
      { id: 'm4', name: '擀面杖', x: 620, y: 1240, r: 18, draw: 'rollingPin' },
      { id: 'm5', name: '老式秤', x: 430, y: 330, r: 18, draw: 'oldScale' }
    ],
    decoys: [
      { x: 330, y: 600, r: 18, draw: 'teacup' },
      { x: 640, y: 560, r: 18, draw: 'chiliString' },
      { x: 110, y: 480, r: 18, draw: 'abacus' },
      { x: 640, y: 660, r: 18, draw: 'oldScale' },
      { x: 180, y: 860, r: 18, draw: 'sauceJar' }
    ]
  },
  // ---------------- 修表铺 ----------------
  {
    id: 'watch1',
    name: '修表铺',
    difficulty: 1,
    timeLimit: 90,
    scene: 'watch', // 对应 painter.js 中 SCENE_DRAWERS.watch
    palette: PALETTES.watch,
    targets: [
      { id: 'w1', name: '怀表', x: 300, y: 934, r: 26, draw: 'pocketWatch' },
      { id: 'w2', name: '齿轮', x: 512, y: 372, r: 24, draw: 'gear' },
      { id: 'w3', name: '镊子', x: 520, y: 936, r: 26, draw: 'tweezers' },
      { id: 'w4', name: '放大镜', x: 690, y: 520, r: 26, draw: 'magnifier' },
      { id: 'w5', name: '发条钥匙', x: 220, y: 692, r: 24, draw: 'windKey' }
    ],
    decoys: []
  },
  {
    id: 'watch2',
    name: '修表铺',
    difficulty: 2,
    timeLimit: 75,
    scene: 'watch',
    palette: PALETTES.watch,
    // 换一个目标子集：发条钥匙 → 小闹钟
    targets: [
      { id: 'w1', name: '怀表', x: 620, y: 760, r: 22, draw: 'pocketWatch' },
      { id: 'w2', name: '齿轮', x: 180, y: 320, r: 22, draw: 'gear' },
      { id: 'w3', name: '镊子', x: 150, y: 800, r: 22, draw: 'tweezers' },
      { id: 'w4', name: '放大镜', x: 480, y: 880, r: 22, draw: 'magnifier' },
      { id: 'w6', name: '小闹钟', x: 640, y: 880, r: 22, draw: 'alarmClock' }
    ],
    decoys: [
      { x: 560, y: 520, r: 22, draw: 'gear' },
      { x: 260, y: 800, r: 22, draw: 'pocketWatch' },
      { x: 400, y: 470, r: 22, draw: 'windKey' }
    ]
  },
  {
    id: 'watch3',
    name: '修表铺',
    difficulty: 3,
    timeLimit: 60,
    scene: 'watch',
    palette: PALETTES.watch,
    targets: [
      { id: 'w1', name: '怀表', x: 700, y: 700, r: 18, draw: 'pocketWatch' },
      { id: 'w2', name: '齿轮', x: 330, y: 320, r: 18, draw: 'gear' },
      { id: 'w3', name: '镊子', x: 640, y: 940, r: 18, draw: 'tweezers' },
      { id: 'w5', name: '发条钥匙', x: 550, y: 640, r: 18, draw: 'windKey' },
      { id: 'w6', name: '小闹钟', x: 420, y: 800, r: 18, draw: 'alarmClock' }
    ],
    decoys: [
      { x: 130, y: 300, r: 18, draw: 'pocketWatch' },
      { x: 400, y: 660, r: 18, draw: 'gear' },
      { x: 520, y: 780, r: 18, draw: 'tweezers' },
      { x: 620, y: 880, r: 18, draw: 'magnifier' },
      { x: 240, y: 470, r: 18, draw: 'alarmClock' }
    ]
  },
  // ---------------- 中药房 ----------------
  {
    id: 'pharmacy1',
    name: '中药房',
    difficulty: 1,
    timeLimit: 90,
    scene: 'pharmacy', // 对应 painter.js 中 SCENE_DRAWERS.pharmacy
    palette: PALETTES.pharmacy,
    targets: [
      { id: 'p1', name: '药罐', x: 520, y: 948, r: 28, draw: 'medicineJar' },
      { id: 'p2', name: '戥子', x: 250, y: 952, r: 26, draw: 'dengzi' },
      { id: 'p3', name: '药臼', x: 600, y: 1150, r: 30, draw: 'mortar' },
      { id: 'p4', name: '人参包', x: 140, y: 952, r: 24, draw: 'ginsengPack' },
      { id: 'p5', name: '脉枕', x: 400, y: 954, r: 26, draw: 'pulsePillow' }
    ],
    decoys: []
  },
  {
    id: 'pharmacy2',
    name: '中药房',
    difficulty: 2,
    timeLimit: 75,
    scene: 'pharmacy',
    palette: PALETTES.pharmacy,
    // 换一个目标子集：脉枕 → 香炉
    targets: [
      { id: 'p1', name: '药罐', x: 620, y: 880, r: 22, draw: 'medicineJar' },
      { id: 'p2', name: '戥子', x: 180, y: 860, r: 22, draw: 'dengzi' },
      { id: 'p3', name: '药臼', x: 640, y: 1240, r: 22, draw: 'mortar' },
      { id: 'p4', name: '人参包', x: 450, y: 870, r: 22, draw: 'ginsengPack' },
      { id: 'p6', name: '香炉', x: 560, y: 1200, r: 22, draw: 'incenseBurner' }
    ],
    decoys: [
      { x: 330, y: 860, r: 22, draw: 'medicineJar' },
      { x: 80, y: 900, r: 22, draw: 'ginsengPack' },
      { x: 260, y: 1250, r: 22, draw: 'pulsePillow' }
    ]
  },
  {
    id: 'pharmacy3',
    name: '中药房',
    difficulty: 3,
    timeLimit: 60,
    scene: 'pharmacy',
    palette: PALETTES.pharmacy,
    targets: [
      { id: 'p1', name: '药罐', x: 700, y: 1080, r: 18, draw: 'medicineJar' },
      { id: 'p2', name: '戥子', x: 400, y: 860, r: 18, draw: 'dengzi' },
      { id: 'p3', name: '药臼', x: 100, y: 1260, r: 18, draw: 'mortar' },
      { id: 'p4', name: '人参包', x: 560, y: 860, r: 18, draw: 'ginsengPack' },
      { id: 'p5', name: '脉枕', x: 160, y: 880, r: 18, draw: 'pulsePillow' }
    ],
    decoys: [
      { x: 330, y: 1080, r: 18, draw: 'medicineJar' },
      { x: 560, y: 1250, r: 18, draw: 'pulsePillow' },
      { x: 480, y: 1245, r: 18, draw: 'ginsengPack' },
      { x: 600, y: 1060, r: 18, draw: 'dengzi' },
      { x: 240, y: 1250, r: 18, draw: 'incenseBurner' }
    ]
  }
]
