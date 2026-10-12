// ============================================================
// painter.js —— 全部画面元素的手绘函数（纯 Canvas 路径，无图片资源）
// ITEM_DRAWERS：15 个目标物品小图标，键名对应 levels.js 的 draw 字段
// SCENE_DRAWERS：3 个关卡场景背景（各含 15+ 个装饰物）
// ============================================================

// 圆角矩形路径（只建路径，填充/描边由调用方决定）
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// 椭圆（用缩放模拟，兼容老基础库；路径在变换时定型，restore 后填充仍正确）
function ell(ctx, cx, cy, rx, ry) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(rx / ry, 1)
  ctx.beginPath()
  ctx.arc(0, 0, ry, 0, Math.PI * 2)
  ctx.restore()
}

// 五角星路径
function star(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const px = cx + Math.cos(a) * rad
    const py = cy + Math.sin(a) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// ------------------------------------------------------------
// 目标物品图标：统一签名 (ctx, x, y, r)，r 为图标半径（约 22-32）
// ------------------------------------------------------------
export const ITEM_DRAWERS = {
  // 搪瓷杯（菜市场）
  teacup(ctx, x, y, r) {
    // 把手（蓝边白芯）
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#31567A'
    ctx.lineWidth = r * 0.24
    ctx.beginPath(); ctx.arc(x + r * 0.68, y, r * 0.42, -Math.PI / 2, Math.PI / 2); ctx.stroke()
    ctx.strokeStyle = '#F4F1E6'
    ctx.lineWidth = r * 0.12
    ctx.beginPath(); ctx.arc(x + r * 0.68, y, r * 0.42, -Math.PI / 2, Math.PI / 2); ctx.stroke()
    // 杯身
    rr(ctx, x - r * 0.7, y - r * 0.75, r * 1.4, r * 1.5, r * 0.16)
    ctx.fillStyle = '#F4F1E6'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#31567A'; ctx.stroke()
    // 蓝边
    rr(ctx, x - r * 0.7, y - r * 0.75, r * 1.4, r * 0.26, r * 0.1)
    ctx.fillStyle = '#31567A'; ctx.fill()
    // 红五星
    star(ctx, x, y + r * 0.15, r * 0.34)
    ctx.fillStyle = '#B3382C'; ctx.fill()
  },

  // 算盘（菜市场）
  abacus(ctx, x, y, r) {
    rr(ctx, x - r, y - r * 0.72, r * 2, r * 1.44, 4)
    ctx.fillStyle = '#7A4A21'; ctx.fill()
    rr(ctx, x - r * 0.86, y - r * 0.58, r * 1.72, r * 1.16, 2)
    ctx.fillStyle = '#E9D8A6'; ctx.fill()
    // 横梁
    ctx.fillStyle = '#7A4A21'
    ctx.fillRect(x - r * 0.86, y - r * 0.06, r * 1.72, r * 0.12)
    // 四档杆与算珠
    for (let i = 0; i < 4; i++) {
      const rx = x - r * 0.6 + i * r * 0.4
      ctx.strokeStyle = '#5E3A17'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(rx, y - r * 0.58); ctx.lineTo(rx, y + r * 0.58); ctx.stroke()
      ctx.fillStyle = '#A63A2E'
      for (let j = 0; j < 2; j++) { // 上二珠
        ctx.beginPath(); ctx.arc(rx, y - r * 0.42 + j * r * 0.17, r * 0.08, 0, Math.PI * 2); ctx.fill()
      }
      for (let j = 0; j < 4; j++) { // 下四珠
        ctx.beginPath(); ctx.arc(rx, y + r * 0.14 + j * r * 0.13, r * 0.08, 0, Math.PI * 2); ctx.fill()
      }
    }
  },

  // 辣椒串（菜市场）
  chiliString(ctx, x, y, r) {
    // 挂绳
    ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r * 0.5); ctx.stroke()
    // 左右交错的红辣椒
    for (let i = 0; i < 6; i++) {
      const cy = y - r * 0.45 + i * r * 0.3
      const cx = x + (i % 2 === 0 ? -1 : 1) * r * 0.22
      ctx.beginPath()
      ctx.moveTo(cx, cy - r * 0.16)
      ctx.quadraticCurveTo(cx + r * 0.34, cy + r * 0.05, cx + r * 0.1, cy + r * 0.4)
      ctx.quadraticCurveTo(cx - r * 0.2, cy + r * 0.1, cx, cy - r * 0.16)
      ctx.fillStyle = '#B3382C'; ctx.fill()
      ctx.fillStyle = '#3E5C4B' // 绿蒂
      ctx.fillRect(cx - r * 0.06, cy - r * 0.26, r * 0.12, r * 0.12)
    }
  },

  // 擀面杖（菜市场）
  rollingPin(ctx, x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.45)
    rr(ctx, -r * 1.35, -r * 0.13, r * 0.32, r * 0.26, r * 0.1); ctx.fillStyle = '#8A5A2B'; ctx.fill()
    rr(ctx, r * 1.03, -r * 0.13, r * 0.32, r * 0.26, r * 0.1); ctx.fill()
    rr(ctx, -r * 1.05, -r * 0.28, r * 2.1, r * 0.56, r * 0.28)
    ctx.fillStyle = '#C89B5E'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#8A5A2B'; ctx.stroke()
    ctx.restore()
  },

  // 老式杆秤（菜市场）
  oldScale(ctx, x, y, r) {
    ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.4); ctx.lineTo(x + r, y - r * 0.55); ctx.stroke() // 秤杆
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r * 0.46); ctx.stroke() // 提绳
    // 秤盘三根绳
    const px = x - r * 0.62, py = y + r * 0.5
    ctx.beginPath()
    ctx.moveTo(px, y - r * 0.42); ctx.lineTo(px - r * 0.26, py)
    ctx.moveTo(px, y - r * 0.42); ctx.lineTo(px + r * 0.26, py)
    ctx.moveTo(px, y - r * 0.42); ctx.lineTo(px, py - r * 0.02)
    ctx.stroke()
    // 秤盘
    ctx.beginPath(); ctx.arc(px, py, r * 0.3, 0, Math.PI); ctx.closePath()
    ctx.fillStyle = '#B58A4A'; ctx.fill()
    ctx.strokeStyle = '#7A5A1F'; ctx.lineWidth = 2; ctx.stroke()
    // 秤砣
    ctx.strokeStyle = '#3A3A3A'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x + r * 0.45, y - r * 0.52); ctx.lineTo(x + r * 0.45, y + r * 0.1); ctx.stroke()
    ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.25, r * 0.14, 0, Math.PI * 2)
    ctx.fillStyle = '#3A3A3A'; ctx.fill()
  },

  // 怀表（修表铺）
  pocketWatch(ctx, x, y, r) {
    ctx.fillStyle = '#C9A227'
    ctx.fillRect(x - r * 0.1, y - r * 1.28, r * 0.2, r * 0.3) // 表冠
    ctx.strokeStyle = '#C9A227'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(x, y - r * 1.05, r * 0.16, 0, Math.PI * 2); ctx.stroke() // 吊环
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = '#D9A441'; ctx.fill()
    ctx.lineWidth = 3; ctx.strokeStyle = '#8A6A1F'; ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2)
    ctx.fillStyle = '#F6EFDD'; ctx.fill()
    // 刻度
    ctx.strokeStyle = '#5A4028'; ctx.lineWidth = 2
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62)
      ctx.lineTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72)
      ctx.stroke()
    }
    // 指针
    ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.42); ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.35, y + r * 0.18); ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y, r * 0.06, 0, Math.PI * 2)
    ctx.fillStyle = '#5A4028'; ctx.fill()
  },

  // 齿轮（修表铺）
  gear(ctx, x, y, r) {
    ctx.save(); ctx.translate(x, y)
    ctx.fillStyle = '#8A8F94'
    for (let i = 0; i < 8; i++) { // 八齿
      ctx.save(); ctx.rotate((i * Math.PI) / 4)
      ctx.fillRect(-r * 0.13, -r * 1.02, r * 0.26, r * 0.3)
      ctx.restore()
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2)
    ctx.fillStyle = '#A9AEB4'; ctx.fill()
    ctx.lineWidth = 3; ctx.strokeStyle = '#5F646A'; ctx.stroke()
    ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#5F646A'; ctx.fill()
    ctx.restore()
  },

  // 镊子（修表铺）
  tweezers(ctx, x, y, r) {
    ctx.strokeStyle = '#9AA0A6'; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.13
    ctx.beginPath(); ctx.moveTo(x - r * 0.22, y - r * 0.9); ctx.lineTo(x - r * 0.04, y + r * 0.75); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + r * 0.22, y - r * 0.9); ctx.lineTo(x + r * 0.04, y + r * 0.75); ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y - r * 0.9, r * 0.22, Math.PI, 0); ctx.stroke() // 顶部连接
    ctx.strokeStyle = '#5F646A'; ctx.lineWidth = r * 0.09
    ctx.beginPath(); ctx.moveTo(x - r * 0.04, y + r * 0.75); ctx.lineTo(x, y + r * 0.95); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + r * 0.04, y + r * 0.75); ctx.lineTo(x, y + r * 0.95); ctx.stroke()
  },

  // 放大镜（修表铺）
  magnifier(ctx, x, y, r) {
    ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = r * 0.2; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x + r * 0.42, y + r * 0.42); ctx.lineTo(x + r * 0.95, y + r * 0.95); ctx.stroke() // 手柄
    ctx.beginPath(); ctx.arc(x, y, r * 0.58, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(178, 216, 228, 0.6)'; ctx.fill() // 镜片
    ctx.lineWidth = r * 0.14; ctx.strokeStyle = '#8A5A2B'; ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = r * 0.08
    ctx.beginPath(); ctx.arc(x, y, r * 0.4, Math.PI * 0.9, Math.PI * 1.4); ctx.stroke() // 高光
  },

  // 发条钥匙（修表铺）
  windKey(ctx, x, y, r) {
    ctx.strokeStyle = '#C9A227'; ctx.lineWidth = r * 0.13; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(x - r * 0.34, y - r * 0.42, r * 0.3, 0, Math.PI * 2); ctx.stroke() // 蝶形双耳
    ctx.beginPath(); ctx.arc(x + r * 0.34, y - r * 0.42, r * 0.3, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - r * 0.34, y - r * 0.42); ctx.lineTo(x + r * 0.34, y - r * 0.42); ctx.stroke()
    ctx.fillStyle = '#B58A4A'
    ctx.fillRect(x - r * 0.09, y - r * 0.42, r * 0.18, r * 1.05) // 立杆
    ctx.beginPath(); ctx.arc(x, y + r * 0.82, r * 0.24, 0, Math.PI * 2); ctx.stroke() // 钥匙环
  },

  // 药罐（中药房）
  medicineJar(ctx, x, y, r) {
    rr(ctx, x - r * 0.75, y - r * 0.5, r * 1.5, r * 1.3, r * 0.35)
    ctx.fillStyle = '#4A2E1B'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#2E1B0E'; ctx.stroke()
    rr(ctx, x - r * 0.45, y - r * 0.78, r * 0.9, r * 0.32, r * 0.14) // 盖子
    ctx.fillStyle = '#6B4226'; ctx.fill()
    ctx.beginPath(); ctx.arc(x, y - r * 0.85, r * 0.13, 0, Math.PI * 2); ctx.fill() // 盖纽
    rr(ctx, x - r * 0.3, y - r * 0.14, r * 0.6, r * 0.62, 3) // 标签
    ctx.fillStyle = '#E8D3A1'; ctx.fill()
    ctx.fillStyle = '#8A3B22'
    ctx.font = `${Math.round(r * 0.45)}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('药', x, y + r * 0.17)
  },

  // 戥子（中药房，小号杆秤）
  dengzi(ctx, x, y, r) {
    ctx.strokeStyle = '#6B4A2F'; ctx.lineCap = 'round'
    ctx.lineWidth = 3.5
    ctx.beginPath(); ctx.moveTo(x - r * 0.9, y - r * 0.5); ctx.lineTo(x + r * 0.9, y - r * 0.62); ctx.stroke() // 秤杆
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.56); ctx.lineTo(x, y - r * 0.15); ctx.stroke() // 提纽
    const px = x - r * 0.55, py = y + r * 0.35
    ctx.beginPath()
    ctx.moveTo(px, y - r * 0.52); ctx.lineTo(px - r * 0.2, py)
    ctx.moveTo(px, y - r * 0.52); ctx.lineTo(px + r * 0.2, py)
    ctx.stroke() // 盘绳
    ell(ctx, px, py + r * 0.1, r * 0.32, r * 0.14) // 黄铜戥盘
    ctx.fillStyle = '#C9A227'; ctx.fill()
    ctx.strokeStyle = '#8A6A1F'; ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + r * 0.4, y - r * 0.6); ctx.lineTo(x + r * 0.4, y + r * 0.05); ctx.stroke()
    ctx.beginPath(); ctx.arc(x + r * 0.4, y + r * 0.2, r * 0.13, 0, Math.PI * 2)
    ctx.fillStyle = '#3A3A3A'; ctx.fill() // 秤砣
  },

  // 药臼（中药房）
  mortar(ctx, x, y, r) {
    ctx.beginPath() // 钵身（梯形）
    ctx.moveTo(x - r * 0.72, y - r * 0.2)
    ctx.lineTo(x + r * 0.72, y - r * 0.2)
    ctx.lineTo(x + r * 0.42, y + r * 0.72)
    ctx.lineTo(x - r * 0.42, y + r * 0.72)
    ctx.closePath()
    ctx.fillStyle = '#7A7D82'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#54575C'; ctx.stroke()
    ell(ctx, x, y - r * 0.2, r * 0.72, r * 0.18) // 钵口沿
    ctx.fillStyle = '#9AA0A6'; ctx.fill()
    ctx.strokeStyle = '#54575C'; ctx.stroke()
    ctx.save(); ctx.translate(x + r * 0.3, y - r * 0.1); ctx.rotate(0.6) // 研杵
    rr(ctx, -r * 0.11, -r * 0.95, r * 0.22, r * 0.95, r * 0.11)
    ctx.fillStyle = '#B9BEC4'; ctx.fill()
    ctx.restore()
  },

  // 人参包（中药房）
  ginsengPack(ctx, x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4)
    rr(ctx, -r * 0.62, -r * 0.62, r * 1.24, r * 1.24, 4)
    ctx.fillStyle = '#D9B77C'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#A8834A'; ctx.stroke()
    ctx.strokeStyle = '#8A3B22'; ctx.lineWidth = 2.5 // 十字捆绳
    ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(r * 0.62, 0); ctx.moveTo(0, -r * 0.62); ctx.lineTo(0, r * 0.62); ctx.stroke()
    ctx.restore()
    rr(ctx, x - r * 0.22, y - r * 0.22, r * 0.44, r * 0.44, 2) // 红签
    ctx.fillStyle = '#B3382C'; ctx.fill()
    ctx.fillStyle = '#F5E9D0'
    ctx.font = `${Math.round(r * 0.32)}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('参', x, y + 1)
  },

  // 脉枕（中药房）
  pulsePillow(ctx, x, y, r) {
    rr(ctx, x - r, y - r * 0.5, r * 2, r, r * 0.5)
    ctx.fillStyle = '#A63A2E'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#7A2A20'; ctx.stroke()
    ctx.fillStyle = '#7A2A20' // 两端收口
    ctx.beginPath(); ctx.arc(x - r * 0.72, y, r * 0.32, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + r * 0.72, y, r * 0.32, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#3E5C4B' // 中间织带
    ctx.fillRect(x - r * 0.18, y - r * 0.5, r * 0.36, r)
    ctx.strokeStyle = '#E2B34C'; ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - r * 0.18, y - r * 0.3); ctx.lineTo(x + r * 0.18, y - r * 0.3)
    ctx.moveTo(x - r * 0.18, y + r * 0.3); ctx.lineTo(x + r * 0.18, y + r * 0.3)
    ctx.stroke()
  }
}

// ------------------------------------------------------------
// 场景绘制：每关 15-25 个装饰物（注释内编号），配色取自 levels.js
// ------------------------------------------------------------
export const SCENE_DRAWERS = {
  // ---------------- 菜市场 ----------------
  market(ctx, P) {
    // 1-2 墙面、地面与踢脚线
    ctx.fillStyle = P.wall; ctx.fillRect(0, 0, 750, 1334)
    ctx.fillStyle = P.floor; ctx.fillRect(0, 1080, 750, 254)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 1080, 750, 10)
    // 3 红白条纹雨棚（10 片帆布）
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? P.awningB : P.awningA
      const ax = i * 75
      ctx.beginPath()
      ctx.moveTo(ax, 190); ctx.lineTo(ax + 75, 190); ctx.lineTo(ax + 75, 238)
      ctx.arc(ax + 37.5, 238, 37.5, 0, Math.PI)
      ctx.closePath(); ctx.fill()
    }
    // 4 招牌
    rr(ctx, 64, 286, 196, 66, 8); ctx.fillStyle = P.wood; ctx.fill()
    ctx.fillStyle = '#F5E9D0'; ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('老李菜摊', 162, 320)
    // 5 挂腊肉两条
    for (const [mx, mh] of [[596, 84], [628, 62]]) {
      ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(mx + 12, 240); ctx.lineTo(mx + 12, 258); ctx.stroke()
      rr(ctx, mx, 258, 24, mh, 10); ctx.fillStyle = '#8A3B22'; ctx.fill()
      ctx.strokeStyle = '#5E2415'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(mx, 258 + mh * 0.4); ctx.lineTo(mx + 24, 258 + mh * 0.4); ctx.stroke()
    }
    // 6 挂蒜辫
    ctx.strokeStyle = '#8A7A4A'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(716, 240); ctx.lineTo(716, 350); ctx.stroke()
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(716 + (i % 2 ? 6 : -6), 268 + i * 26, 11, 0, Math.PI * 2)
      ctx.fillStyle = '#EFE8D5'; ctx.fill()
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#C9BC9A'; ctx.stroke()
    }
    // 7 老式秤挂绳（与目标物 m5 位置呼应）
    ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(375, 240); ctx.lineTo(375, 390); ctx.stroke()
    // 8 左侧菜摊台面与摊腿
    rr(ctx, 50, 620, 300, 34, 6); ctx.fillStyle = P.wood; ctx.fill()
    ctx.fillRect(70, 654, 18, 150); ctx.fillRect(330, 654, 18, 150)
    // 9 台下一筐鸡蛋
    rr(ctx, 96, 700, 110, 80, 10); ctx.fillStyle = P.basket; ctx.fill()
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc(116 + (i % 3) * 30, 722 + Math.floor(i / 3) * 28, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#F0E3C0'; ctx.fill()
    }
    // 10-11 台上两只菜筐与菜
    const baskets = [[196, 556, '#5C8A3A'], [278, 560, '#D0792E']]
    for (const [bx, by, pc] of baskets) {
      rr(ctx, bx, by, 78, 58, 12); ctx.fillStyle = P.basket; ctx.fill()
      for (let j = 0; j < 4; j++) {
        ctx.beginPath(); ctx.arc(bx + 18 + (j % 2) * 40, by + 14 + Math.floor(j / 2) * 22, 9, 0, Math.PI * 2)
        ctx.fillStyle = pc; ctx.fill()
      }
    }
    // 12 右侧货架与三只陶罐
    rr(ctx, 420, 430, 262, 14, 4); ctx.fillStyle = P.wood; ctx.fill()
    for (const [jx, jw, jh] of [[438, 46, 54], [512, 52, 48], [592, 44, 58]]) {
      rr(ctx, jx, 430 - jh, jw, jh, 8); ctx.fillStyle = P.jar; ctx.fill()
      rr(ctx, jx + 6, 430 - jh - 8, jw - 12, 12, 4); ctx.fillStyle = '#5E6B54'; ctx.fill()
    }
    // 13 右侧杂货摊台面与摊腿
    rr(ctx, 400, 700, 300, 34, 6); ctx.fillStyle = P.wood; ctx.fill()
    ctx.fillRect(420, 734, 18, 140); ctx.fillRect(664, 734, 18, 140)
    // 14 台上两条鱼
    for (const fx of [446, 528]) {
      ell(ctx, fx, 682, 34, 13); ctx.fillStyle = '#8A9BA8'; ctx.fill()
      ctx.beginPath(); ctx.moveTo(fx + 30, 682); ctx.lineTo(fx + 48, 670); ctx.lineTo(fx + 48, 694); ctx.closePath()
      ctx.fillStyle = '#7A8B98'; ctx.fill()
      ctx.beginPath(); ctx.arc(fx - 20, 678, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#2B2B2B'; ctx.fill()
    }
    // 15 木箱两只
    rr(ctx, 56, 1096, 128, 96, 4); ctx.fillStyle = '#A9835A'; ctx.fill()
    ctx.lineWidth = 2; ctx.strokeStyle = '#7A5A34'; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(56, 1144); ctx.lineTo(184, 1144); ctx.stroke()
    rr(ctx, 84, 1026, 108, 70, 4); ctx.fillStyle = '#B08D55'; ctx.fill(); ctx.stroke()
    // 16 地面白菜堆
    for (const [cx, cy, cr] of [[540, 1150, 26], [602, 1164, 30], [486, 1170, 22]]) {
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fillStyle = '#7BA05B'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx, cy, cr * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#A9C48A'; ctx.fill()
    }
    // 17 竹凳
    rr(ctx, 300, 1188, 96, 22, 8); ctx.fillStyle = P.basket; ctx.fill()
    ctx.fillStyle = '#8A6A3A'
    ctx.fillRect(312, 1210, 12, 60); ctx.fillRect(372, 1210, 12, 60)
  },

  // ---------------- 修表铺 ----------------
  watch(ctx, P) {
    // 1 墙面 + 2 护墙板与板缝
    ctx.fillStyle = P.wall; ctx.fillRect(0, 0, 750, 1334)
    ctx.fillStyle = P.panel; ctx.fillRect(0, 900, 750, 434)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2
    for (let x = 20; x < 750; x += 90) {
      ctx.beginPath(); ctx.moveTo(x, 900); ctx.lineTo(x, 1334); ctx.stroke()
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 900, 750, 8)
    // 3 招牌
    rr(ctx, 272, 214, 206, 60, 6); ctx.fillStyle = '#3A2E22'; ctx.fill()
    ctx.fillStyle = '#D9A441'; ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('陈记修表', 375, 245)
    // 4 大挂钟与钟摆
    ctx.beginPath(); ctx.arc(610, 330, 54, 0, Math.PI * 2); ctx.fillStyle = '#F6EFDD'; ctx.fill()
    ctx.lineWidth = 6; ctx.strokeStyle = P.wood; ctx.stroke()
    ctx.strokeStyle = '#5A4028'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(610, 330); ctx.lineTo(610, 300); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(610, 330); ctx.lineTo(634, 344); ctx.stroke()
    ctx.strokeStyle = P.wood; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(610, 384); ctx.lineTo(610, 452); ctx.stroke()
    ctx.beginPath(); ctx.arc(610, 460, 12, 0, Math.PI * 2); ctx.fillStyle = '#C9A227'; ctx.fill()
    // 5-7 三层搁板
    const shelves = [[60, 400, 480], [60, 560, 480], [60, 720, 360]]
    for (const [sx, sy, sw] of shelves) {
      rr(ctx, sx, sy, sw, 14, 4); ctx.fillStyle = P.shelf; ctx.fill()
    }
    // 8 第一层：两只小座钟 + 表盒 + 油罐
    for (const [cx, col] of [[112, '#D9A441'], [170, '#8A8F94']]) {
      ctx.beginPath(); ctx.arc(cx, 378, 19, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill()
      ctx.beginPath(); ctx.arc(cx, 378, 13, 0, Math.PI * 2); ctx.fillStyle = '#F6EFDD'; ctx.fill()
      ctx.strokeStyle = '#5A4028'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx, 378); ctx.lineTo(cx, 368); ctx.stroke()
    }
    rr(ctx, 230, 356, 48, 44, 4); ctx.fillStyle = '#6B4A2F'; ctx.fill()
    rr(ctx, 236, 366, 36, 8, 2); ctx.fillStyle = '#A63A2E'; ctx.fill()
    rr(ctx, 320, 362, 36, 38, 6); ctx.fillStyle = '#7A8B6F'; ctx.fill()
    // 9 第二层：两只怀表摆件 + 木盒 + 工具筒
    for (const cx of [104, 158]) {
      ctx.beginPath(); ctx.arc(cx, 538, 17, 0, Math.PI * 2); ctx.fillStyle = '#C9A227'; ctx.fill()
      ctx.beginPath(); ctx.arc(cx, 538, 11, 0, Math.PI * 2); ctx.fillStyle = '#F6EFDD'; ctx.fill()
      ctx.fillStyle = '#C9A227'; ctx.fillRect(cx - 3, 516, 6, 8)
    }
    rr(ctx, 220, 522, 56, 38, 4); ctx.fillStyle = '#7A5230'; ctx.fill()
    rr(ctx, 316, 520, 44, 40, 4); ctx.fillStyle = '#8A5F38'; ctx.fill()
    for (const tx of [328, 338, 348]) {
      ctx.strokeStyle = '#5F646A'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(tx, 520); ctx.lineTo(tx - 4, 494); ctx.stroke()
    }
    // 10 第三层：工具盒两叠 + 小瓶
    rr(ctx, 96, 684, 60, 36, 4); ctx.fillStyle = '#6B4A2F'; ctx.fill()
    rr(ctx, 104, 664, 44, 20, 3); ctx.fillStyle = '#8A5F38'; ctx.fill()
    rr(ctx, 300, 680, 34, 40, 6); ctx.fillStyle = '#7A8B6F'; ctx.fill()
    // 11 放大镜挂钉（与目标物 w4 位置呼应）
    ctx.fillStyle = '#3A2E22'
    ctx.beginPath(); ctx.arc(690, 478, 4, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(690, 478); ctx.lineTo(690, 494); ctx.stroke()
    // 12 工作台（台面 + 挡板）
    rr(ctx, 80, 960, 590, 26, 6); ctx.fillStyle = '#8A6A45'; ctx.fill()
    rr(ctx, 90, 986, 570, 140, 4); ctx.fillStyle = '#6B4A2F'; ctx.fill()
    // 13 三只抽屉
    for (const dx of [120, 300, 480]) {
      rr(ctx, dx, 1016, 150, 52, 4); ctx.fillStyle = '#7A5230'; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = '#4A3018'; ctx.stroke()
      ctx.beginPath(); ctx.arc(dx + 75, 1042, 6, 0, Math.PI * 2); ctx.fillStyle = '#2E1B0E'; ctx.fill()
    }
    // 14 台灯（灯座、灯杆、灯罩、光晕）
    ctx.beginPath(); ctx.arc(150, 950, 16, 0, Math.PI * 2); ctx.fillStyle = '#3A2E22'; ctx.fill()
    ctx.strokeStyle = '#3A2E22'; ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(150, 950); ctx.lineTo(178, 872); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(156, 872); ctx.lineTo(200, 872); ctx.lineTo(186, 838); ctx.lineTo(170, 838); ctx.closePath()
    ctx.fillStyle = '#2F4A42'; ctx.fill()
    ctx.beginPath(); ctx.arc(178, 880, 20, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,224,150,0.25)'; ctx.fill()
    // 15 螺丝刀
    ctx.save(); ctx.translate(360, 948); ctx.rotate(0.35)
    ctx.fillStyle = '#A63A2E'; ctx.fillRect(-20, -5, 24, 10)
    ctx.fillStyle = '#9AA0A6'; ctx.fillRect(4, -2.5, 30, 5)
    ctx.restore()
    // 16 油壶
    ctx.beginPath(); ctx.arc(440, 950, 11, 0, Math.PI * 2); ctx.fillStyle = '#B58A4A'; ctx.fill()
    ctx.fillStyle = '#8A6A1F'; ctx.fillRect(437, 930, 6, 12)
    // 17 板凳
    rr(ctx, 600, 1160, 104, 24, 10); ctx.fillStyle = '#8A6A45'; ctx.fill()
    ctx.fillStyle = '#6B4A2F'
    ctx.fillRect(612, 1184, 14, 96); ctx.fillRect(678, 1184, 14, 96)
  },

  // ---------------- 中药房 ----------------
  pharmacy(ctx, P) {
    // 1 墙面 + 2 木地板与踢脚线
    ctx.fillStyle = P.wall; ctx.fillRect(0, 0, 750, 1334)
    ctx.fillStyle = P.floor; ctx.fillRect(0, 1120, 750, 214)
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 1120, 750, 10)
    // 3 牌匾
    rr(ctx, 262, 196, 226, 58, 6); ctx.fillStyle = '#3A2E22'; ctx.fill()
    ctx.fillStyle = '#E8D3A1'; ctx.font = '34px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('仁心堂', 375, 226)
    // 4-5 对联两副
    for (const [cx, txt] of [[34, '药香满室'], [716, '妙手回春']]) {
      rr(ctx, cx - 18, 280, 36, 260, 4); ctx.fillStyle = '#9E3B2B'; ctx.fill()
      ctx.fillStyle = '#E8D3A1'; ctx.font = '24px sans-serif'
      txt.split('').forEach((ch, i) => ctx.fillText(ch, cx, 320 + i * 52))
    }
    // 6 柜顶陶罐三只
    for (const [jx, jw, jh] of [[108, 44, 52], [168, 40, 44], [560, 42, 50]]) {
      rr(ctx, jx, 262 - jh, jw, jh, 7); ctx.fillStyle = '#4A2E1B'; ctx.fill()
      rr(ctx, jx + 6, 262 - jh - 8, jw - 12, 12, 4); ctx.fillStyle = '#6B4226'; ctx.fill()
    }
    // 7 挂艾草两束
    for (const hx of [640, 90]) {
      ctx.strokeStyle = '#6B4A2F'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(hx, 190); ctx.lineTo(hx, 214); ctx.stroke()
      ctx.fillStyle = '#5C7A4A'
      for (let i = 0; i < 5; i++) {
        ell(ctx, hx + (i - 2) * 6, 230 + Math.abs(i - 2) * 4, 5, 16)
        ctx.fill()
      }
    }
    // 8 大药柜 + 24 只抽屉（含标签与铜拉手）
    rr(ctx, 70, 268, 610, 520, 6); ctx.fillStyle = P.cabinet; ctx.fill()
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const dx = 82 + col * 100, dy = 280 + row * 126
        rr(ctx, dx, dy, 96, 114, 3); ctx.fillStyle = P.drawer; ctx.fill()
        ctx.lineWidth = 2; ctx.strokeStyle = '#5E3E22'; ctx.stroke()
        rr(ctx, dx + 24, dy + 16, 48, 20, 2); ctx.fillStyle = '#E8D3A1'; ctx.fill()
        ctx.beginPath(); ctx.arc(dx + 48, dy + 74, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#3A2E22'; ctx.fill()
      }
    }
    // 9 柜台（台面 + 挡板 + 雕花线）
    rr(ctx, 90, 980, 570, 30, 6); ctx.fillStyle = '#8A5F38'; ctx.fill()
    rr(ctx, 100, 1010, 550, 148, 4); ctx.fillStyle = P.cabinet; ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(100, 1060); ctx.lineTo(650, 1060); ctx.stroke()
    // 10 柜台药碗
    ctx.beginPath(); ctx.arc(618, 962, 15, 0, Math.PI * 2); ctx.fillStyle = '#4A2E1B'; ctx.fill()
    ctx.beginPath(); ctx.arc(618, 960, 10, 0, Math.PI * 2); ctx.fillStyle = '#2E1B0E'; ctx.fill()
    // 11 长凳
    rr(ctx, 190, 1180, 120, 22, 8); ctx.fillStyle = '#8A5F38'; ctx.fill()
    ctx.fillStyle = '#6B4226'
    ctx.fillRect(204, 1202, 14, 80); ctx.fillRect(282, 1202, 14, 80)
    // 12 地面麻袋
    rr(ctx, 420, 1150, 90, 100, 20); ctx.fillStyle = '#B99B6E'; ctx.fill()
    ctx.strokeStyle = '#8A6A3A'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(420, 1180); ctx.lineTo(510, 1180); ctx.stroke()
  }
}
