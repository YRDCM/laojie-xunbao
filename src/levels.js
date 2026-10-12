// ============================================================
// levels.js —— 关卡配置
// 每关：场景绘制函数名、配色、5 个目标物品（坐标/半径/绘制函数名）
// 坐标均为 750×1334 设计分辨率下的逻辑坐标，y ≥ 190 为场景可点击区
// ============================================================

export const LEVELS = [
  {
    id: 'market',
    name: '菜市场',
    scene: 'market', // 对应 painter.js 中 SCENE_DRAWERS.market
    palette: {
      wall: '#F1E6CF',    // 米白墙面
      floor: '#C9A97C',   // 暖黄地面
      awningA: '#A63A2E', // 砖红雨棚
      awningB: '#F5EDE0', // 米白雨棚
      wood: '#8A5F38',    // 赭石木架
      basket: '#B08D55',  // 竹筐
      jar: '#7A8B6F'      // 墨绿陶罐
    },
    targets: [
      { id: 'm1', name: '搪瓷杯', x: 110, y: 592, r: 26, draw: 'teacup' },
      { id: 'm2', name: '算盘', x: 616, y: 672, r: 30, draw: 'abacus' },
      { id: 'm3', name: '辣椒串', x: 666, y: 336, r: 26, draw: 'chiliString' },
      { id: 'm4', name: '擀面杖', x: 250, y: 1130, r: 30, draw: 'rollingPin' },
      { id: 'm5', name: '老式秤', x: 375, y: 428, r: 30, draw: 'oldScale' }
    ]
  },
  {
    id: 'watch',
    name: '修表铺',
    scene: 'watch', // 对应 painter.js 中 SCENE_DRAWERS.watch
    palette: {
      wall: '#E9DEC8',  // 米白墙面
      panel: '#8A6A45', // 护墙板
      wood: '#6B4A2F',  // 深棕木
      shelf: '#7A5230'  // 搁板
    },
    targets: [
      { id: 'w1', name: '怀表', x: 300, y: 934, r: 26, draw: 'pocketWatch' },
      { id: 'w2', name: '齿轮', x: 512, y: 372, r: 24, draw: 'gear' },
      { id: 'w3', name: '镊子', x: 520, y: 936, r: 26, draw: 'tweezers' },
      { id: 'w4', name: '放大镜', x: 690, y: 520, r: 26, draw: 'magnifier' },
      { id: 'w5', name: '发条钥匙', x: 220, y: 692, r: 24, draw: 'windKey' }
    ]
  },
  {
    id: 'pharmacy',
    name: '中药房',
    scene: 'pharmacy', // 对应 painter.js 中 SCENE_DRAWERS.pharmacy
    palette: {
      wall: '#F2E9DA',    // 米白墙面
      floor: '#B99B6E',   // 木地板
      cabinet: '#7A5230', // 药柜棕
      drawer: '#8A5F38'   // 抽屉面
    },
    targets: [
      { id: 'p1', name: '药罐', x: 520, y: 948, r: 28, draw: 'medicineJar' },
      { id: 'p2', name: '戥子', x: 250, y: 952, r: 26, draw: 'dengzi' },
      { id: 'p3', name: '药臼', x: 600, y: 1150, r: 30, draw: 'mortar' },
      { id: 'p4', name: '人参包', x: 140, y: 952, r: 24, draw: 'ginsengPack' },
      { id: 'p5', name: '脉枕', x: 400, y: 954, r: 26, draw: 'pulsePillow' }
    ]
  }
]
