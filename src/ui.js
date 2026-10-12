// ============================================================
// ui.js —— 主菜单 / 关卡选择 / HUD / 结算弹层 / 新手引导层
// 所有坐标均为 750×1334 设计分辨率下的逻辑坐标
// ============================================================
import { rr, ITEM_DRAWERS, drawMenuScene, drawFinger } from './painter.js'

// 按钮热区（main.js 的点击分发也引用这些矩形）
export const HINT_BTN = { x: 520, y: 1246, w: 206, h: 62 }
export const WIN_BTNS = {
  next: { x: 155, y: 742, w: 200, h: 80 },
  share: { x: 395, y: 742, w: 200, h: 80 },
  back: { x: 275, y: 880, w: 200, h: 56 }
}
export const FAIL_BTNS = {
  retry: { x: 155, y: 662, w: 200, h: 80 },
  ad: { x: 395, y: 662, w: 200, h: 80 },
  back: { x: 275, y: 820, w: 200, h: 56 }
}
export const MENU_BTNS = {
  start: { x: 195, y: 760, w: 360, h: 96 },
  select: { x: 235, y: 896, w: 280, h: 72 }
}
export const MUTE_BTN = { x: 682, y: 24, w: 52, h: 52 }      // 主菜单/选关页右上角喇叭
export const BACK_BTN = { x: 24, y: 24, w: 52, h: 52 }       // 选关页左上角返回

// 关卡选择页 3×3 网格卡片热区（i 为 0-8 的关卡序号）
export function levelCardRect(i) {
  const col = i % 3
  const row = Math.floor(i / 3)
  return { x: 45 + col * 230, y: 300 + row * 270, w: 200, h: 240 }
}

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

// 按用时评级：S ≤ 45s，A ≤ 70s，其余 B（main.js 结算与选关页展示共用）
export function gradeOf(sec) {
  if (sec <= 45) return { letter: 'S', word: '火眼金睛' }
  if (sec <= 70) return { letter: 'A', word: '明察秋毫' }
  return { letter: 'B', word: '小有所成' }
}

// 通用按钮：label 传数组则两行显示（第一行主文案，第二行奖励说明）
function button(ctx, r, label, bg) {
  rr(ctx, r.x, r.y, r.w, r.h, 14)
  ctx.fillStyle = bg; ctx.fill()
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke()
  ctx.fillStyle = '#F7EFDD'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  if (Array.isArray(label)) {
    ctx.font = '26px sans-serif'
    ctx.fillText(label[0], r.x + r.w / 2, r.y + r.h / 2 - 14)
    ctx.font = '20px sans-serif'
    ctx.fillText(label[1], r.x + r.w / 2, r.y + r.h / 2 + 16)
  } else {
    ctx.font = '28px sans-serif'
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2)
  }
}

// 静音喇叭图标（muted 时画斜杠）
export function drawMuteIcon(ctx, muted) {
  const cx = MUTE_BTN.x + MUTE_BTN.w / 2
  const cy = MUTE_BTN.y + MUTE_BTN.h / 2
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(20,12,6,0.45)'; ctx.fill()
  // 喇叭本体
  ctx.fillStyle = '#F5E9D0'
  ctx.beginPath()
  ctx.moveTo(cx - 12, cy - 5); ctx.lineTo(cx - 4, cy - 5)
  ctx.lineTo(cx + 4, cy - 12); ctx.lineTo(cx + 4, cy + 12)
  ctx.lineTo(cx - 4, cy + 5); ctx.lineTo(cx - 12, cy + 5)
  ctx.closePath(); ctx.fill()
  if (muted) {
    // 斜杠表示静音
    ctx.strokeStyle = '#FF6B5E'; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(cx - 14, cy + 14); ctx.lineTo(cx + 14, cy - 14); ctx.stroke()
  } else {
    // 两道声波
    ctx.strokeStyle = '#F5E9D0'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(cx + 6, cy, 8, -Math.PI / 3, Math.PI / 3); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx + 6, cy, 14, -Math.PI / 3, Math.PI / 3); ctx.stroke()
  }
}

// 返回箭头图标（选关页左上角）
export function drawBackIcon(ctx) {
  const cx = BACK_BTN.x + BACK_BTN.w / 2
  const cy = BACK_BTN.y + BACK_BTN.h / 2
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(20,12,6,0.45)'; ctx.fill()
  ctx.strokeStyle = '#F5E9D0'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx + 8, cy - 10); ctx.lineTo(cx - 8, cy); ctx.lineTo(cx + 8, cy + 10)
  ctx.stroke()
}

// ------------------------------------------------------------
// 主菜单：怀旧老街背景 + 大标题 + 开始寻宝 / 关卡选择
// ------------------------------------------------------------
export function drawMenu(ctx, g) {
  drawMenuScene(ctx)

  // 大标题（描边金字）
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = 'bold 110px sans-serif'
  ctx.lineWidth = 10; ctx.strokeStyle = '#3A2412'; ctx.lineJoin = 'round'
  ctx.strokeText('老街寻宝', 375, 380)
  ctx.fillStyle = '#E2B34C'
  ctx.fillText('老街寻宝', 375, 380)
  // 副标题
  ctx.fillStyle = '#F5E9D0'; ctx.font = '28px sans-serif'
  ctx.fillText('市井老街藏宝贝，火眼金睛找出来', 375, 460)

  // 标题两侧装饰圆点（呼吸微光）
  const glow = 0.5 + 0.5 * Math.sin(g.clock * 2)
  ctx.fillStyle = `rgba(226,179,76,${(0.4 + 0.4 * glow).toFixed(3)})`
  for (const dx of [-260, 260]) {
    ctx.beginPath(); ctx.arc(375 + dx, 380, 8, 0, Math.PI * 2); ctx.fill()
  }

  // 按钮
  button(ctx, MENU_BTNS.start, '开始寻宝', '#A63A2E')
  button(ctx, MENU_BTNS.select, '关卡选择', '#3E5C4B')

  // 进度小结
  const passed = g.passedCount()
  ctx.fillStyle = 'rgba(245,233,208,0.75)'; ctx.font = '22px sans-serif'
  ctx.fillText(passed > 0 ? `已通关 ${passed} / ${g.levelCount} 关` : '共 9 关 · 3 条老街等你探索', 375, 1030)

  drawMuteIcon(ctx, g.muted)
}

// ------------------------------------------------------------
// 关卡选择：3 主题 × 3 难度九宫格，按顺序解锁
// ------------------------------------------------------------
export function drawLevelSelect(ctx, g, levels) {
  // 底色（与主菜单同调性的深木色）
  const bg = ctx.createLinearGradient(0, 0, 0, 1334)
  bg.addColorStop(0, '#41301E')
  bg.addColorStop(1, '#241A10')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 750, 1334)

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#E2B34C'; ctx.font = 'bold 52px sans-serif'
  ctx.fillText('选择关卡', 375, 150)
  ctx.fillStyle = 'rgba(245,233,208,0.6)'; ctx.font = '22px sans-serif'
  ctx.fillText('通过前一关即可解锁下一关', 375, 206)

  drawBackIcon(ctx)
  drawMuteIcon(ctx, g.muted)

  levels.forEach((lv, i) => {
    const r = levelCardRect(i)
    const unlocked = g.isUnlocked(i)
    const best = g.bestOfLevel(i)

    // 卡片底：未解锁压暗
    rr(ctx, r.x, r.y, r.w, r.h, 16)
    ctx.fillStyle = unlocked ? '#F7EFDD' : 'rgba(247,239,221,0.18)'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = unlocked ? '#8A5A2B' : 'rgba(138,90,43,0.4)'
    ctx.stroke()

    const ink = unlocked ? '#5A4028' : 'rgba(245,233,208,0.45)'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    // 关卡序号与名称
    ctx.fillStyle = ink; ctx.font = 'bold 30px sans-serif'
    ctx.fillText(`第${i + 1}关`, r.x + r.w / 2, r.y + 40)
    ctx.font = '26px sans-serif'
    ctx.fillText(lv.name, r.x + r.w / 2, r.y + 82)
    // 难度星星（实星=当前难度）
    ctx.font = '22px sans-serif'
    ctx.fillStyle = unlocked ? '#E2B34C' : 'rgba(226,179,76,0.35)'
    let stars = ''
    for (let s = 0; s < 3; s++) stars += s < lv.difficulty ? '★' : '☆'
    ctx.fillText(stars, r.x + r.w / 2, r.y + 122)

    if (!unlocked) {
      // 小锁图标
      const lx = r.x + r.w / 2, ly = r.y + 172
      rr(ctx, lx - 16, ly - 6, 32, 26, 4)
      ctx.fillStyle = 'rgba(245,233,208,0.5)'; ctx.fill()
      ctx.strokeStyle = 'rgba(245,233,208,0.5)'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(lx, ly - 8, 10, Math.PI, 0); ctx.stroke()
    } else if (best > 0) {
      // 最佳成绩与评级
      const grade = gradeOf(best)
      ctx.fillStyle = '#5A4028'; ctx.font = '22px sans-serif'
      ctx.fillText(`最佳 ${best} 秒`, r.x + r.w / 2, r.y + 164)
      ctx.fillStyle = grade.letter === 'S' ? '#C0392B' : grade.letter === 'A' ? '#B07A1F' : '#5C8A3A'
      ctx.font = 'bold 34px sans-serif'
      ctx.fillText(grade.letter, r.x + r.w / 2, r.y + 202)
    } else {
      ctx.fillStyle = 'rgba(90,64,40,0.55)'; ctx.font = '22px sans-serif'
      ctx.fillText('未通关', r.x + r.w / 2, r.y + 180)
    }
  })

  // 底部游戏名（备案截图需画面内出现游戏名）
  ctx.fillStyle = 'rgba(245,233,208,0.5)'; ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('老街寻宝', 375, 1300)
}

// ------------------------------------------------------------
// 顶部 HUD：游戏名、关卡名、剩余时间、时间进度条、5 个目标图标
// ------------------------------------------------------------
export function drawHUD(ctx, g, level) {
  // 顶栏底
  ctx.fillStyle = '#41301E'; ctx.fillRect(0, 0, 750, 178)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 172, 750, 6)

  // 游戏标题（备案截图需画面内出现游戏名）
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#F5E9D0'; ctx.font = 'bold 38px sans-serif'
  ctx.fillText('老街寻宝', 24, 48)
  ctx.fillStyle = '#E2B34C'; ctx.font = '24px sans-serif'
  ctx.fillText(`第${g.levelIndex + 1}关 · ${level.name}`, 196, 46)

  // 剩余时间文字
  ctx.textAlign = 'right'
  ctx.fillStyle = g.remaining <= 10 ? '#FF6B5E' : '#F5E9D0'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(`剩余 ${Math.ceil(g.remaining)} 秒`, 726, 47)

  // 时间进度条（最后 10 秒红色呼吸闪烁）
  rr(ctx, 24, 66, 702, 16, 8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill()
  const ratio = Math.max(0, Math.min(1, g.remaining / g.totalTime))
  if (ratio > 0) {
    let color = '#E2B34C'
    if (g.remaining <= 10) {
      const breathe = 0.55 + 0.45 * Math.sin(g.clock * 9) // 呼吸闪烁
      color = `rgba(192, 57, 43, ${breathe.toFixed(3)})`
    }
    rr(ctx, 24, 66, Math.max(16, 702 * ratio), 16, 8)
    ctx.fillStyle = color; ctx.fill()
  }

  // 目标栏：5 个待找物品小图标 + 名称，找到后变灰打勾
  level.targets.forEach((t, i) => {
    const cx = 87 + i * 144
    const cy = 116
    ITEM_DRAWERS[t.draw](ctx, cx, cy, 22)
    const done = g.found.has(t.id)
    if (done) {
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(65,48,30,0.62)'; ctx.fill() // 变灰
      ctx.beginPath(); ctx.arc(cx + 22, cy - 22, 12, 0, Math.PI * 2)
      ctx.fillStyle = '#5C8A3A'; ctx.fill() // 绿勾圆点
      ctx.strokeStyle = '#F5E9D0'; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx + 16, cy - 22); ctx.lineTo(cx + 21, cy - 16); ctx.lineTo(cx + 29, cy - 27)
      ctx.stroke()
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = done ? 'rgba(245,233,208,0.4)' : '#F5E9D0'
    ctx.font = '20px sans-serif'
    ctx.fillText(t.name, cx, 162)
  })

  // 提示按钮（激励视频占位，文案标明奖励）
  if (g.state === 'play') button(ctx, HINT_BTN, ['看视频', '→ 提示一个位置'], '#A63A2E')
}

// 胜利结算页：用时 / S·A·B 评价 / 历史最佳 / 下一关 / 分享 / 返回选关
export function drawWinPanel(ctx, g, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha // 淡入
  ctx.fillStyle = 'rgba(20,12,6,0.55)'; ctx.fillRect(0, 0, 750, 1334)
  rr(ctx, 95, 396, 560, 560, 24)
  ctx.fillStyle = '#F7EFDD'; ctx.fill()
  ctx.lineWidth = 5; ctx.strokeStyle = '#8A5A2B'; ctx.stroke()

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#8A3B22'; ctx.font = 'bold 44px sans-serif'
  ctx.fillText('恭喜找齐！', 375, 470)

  const grade = g.grade
  ctx.fillStyle = grade.letter === 'S' ? '#C0392B' : grade.letter === 'A' ? '#B07A1F' : '#5C8A3A'
  ctx.font = 'bold 84px sans-serif'
  ctx.fillText(grade.letter, 375, 568)
  ctx.fillStyle = '#5A4028'; ctx.font = '26px sans-serif'
  ctx.fillText(grade.word, 375, 626)
  ctx.fillText(`本关用时 ${g.resultSec} 秒`, 375, 676)
  ctx.fillText(g.isNewBest ? `历史最佳 ${g.best} 秒（新纪录！）` : `历史最佳 ${g.best} 秒`, 375, 716)

  // 已是最后一关时，"下一关"改为"返回选关"
  const hasNext = g.levelIndex + 1 < g.levelCount
  button(ctx, WIN_BTNS.next, hasNext ? '下一关' : '返回选关', '#3E5C4B')
  button(ctx, WIN_BTNS.share, '分享成绩', '#A63A2E')
  ctx.fillStyle = 'rgba(90,64,40,0.6)'; ctx.font = '20px sans-serif'
  ctx.fillText('分享给好友，比比谁眼尖', 375, 856)
  button(ctx, WIN_BTNS.back, '返回选关', '#6B4A2F')
  ctx.restore()
}

// 失败页：还差 N 个 / 重新开始 / 看广告加时 30 秒 / 返回选关
export function drawFailPanel(ctx, g, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha // 淡入
  ctx.fillStyle = 'rgba(20,12,6,0.55)'; ctx.fillRect(0, 0, 750, 1334)
  rr(ctx, 95, 420, 560, 500, 24)
  ctx.fillStyle = '#F7EFDD'; ctx.fill()
  ctx.lineWidth = 5; ctx.strokeStyle = '#8A5A2B'; ctx.stroke()

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#8A3B22'; ctx.font = 'bold 44px sans-serif'
  ctx.fillText('时间到！', 375, 500)
  ctx.fillStyle = '#5A4028'; ctx.font = '28px sans-serif'
  ctx.fillText(`还差 ${g.totalTargets - g.found.size} 个物品没找到`, 375, 566)

  button(ctx, FAIL_BTNS.retry, '重新开始', '#3E5C4B')
  button(ctx, FAIL_BTNS.ad, ['看视频', '加时 30 秒'], '#A63A2E')
  ctx.fillStyle = 'rgba(90,64,40,0.6)'; ctx.font = '20px sans-serif'
  ctx.fillText('广告位为演示占位，不影响正常游玩', 375, 788)
  button(ctx, FAIL_BTNS.back, '返回选关', '#6B4A2F')
  ctx.restore()
}

// ------------------------------------------------------------
// 新手引导层：半透明遮罩 + 手指图标 + 提示文案，任意点击消失
// ------------------------------------------------------------
export function drawGuide(ctx, g) {
  ctx.fillStyle = 'rgba(20,12,6,0.55)'; ctx.fillRect(0, 0, 750, 1334)

  // 手指图标带 1 秒周期的缩放脉动
  const pulse = 1 + 0.12 * Math.sin(g.clock * Math.PI * 2)
  drawFinger(ctx, 375, 700, pulse)

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = '#F5E9D0'; ctx.font = '32px sans-serif'
  ctx.fillText('根据顶部提示，点击找出藏在画面里的物品', 375, 860)
  ctx.fillStyle = 'rgba(245,233,208,0.7)'; ctx.font = '24px sans-serif'
  ctx.fillText('点击任意位置开始', 375, 916)
}
