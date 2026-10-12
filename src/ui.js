// ============================================================
// ui.js —— HUD（标题/时间条/目标栏/提示按钮）与结算弹层
// 所有坐标均为 750×1334 设计分辨率下的逻辑坐标
// ============================================================
import { rr, ITEM_DRAWERS } from './painter.js'

// 按钮热区（main.js 的点击分发也引用这些矩形）
export const HINT_BTN = { x: 520, y: 1246, w: 206, h: 62 }
export const WIN_BTNS = {
  next: { x: 155, y: 742, w: 200, h: 80 },
  share: { x: 395, y: 742, w: 200, h: 80 }
}
export const FAIL_BTNS = {
  retry: { x: 155, y: 662, w: 200, h: 80 },
  ad: { x: 395, y: 662, w: 200, h: 80 }
}

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
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

// 顶部 HUD：游戏名、关卡名、剩余时间、时间进度条、5 个目标图标
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

// 胜利结算页：用时 / S·A·B 评价 / 历史最佳 / 下一关 / 分享
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

  button(ctx, WIN_BTNS.next, '下一关', '#3E5C4B')
  button(ctx, WIN_BTNS.share, '分享成绩', '#A63A2E')
  ctx.fillStyle = 'rgba(90,64,40,0.6)'; ctx.font = '20px sans-serif'
  ctx.fillText('分享给好友，比比谁眼尖', 375, 872)
  ctx.restore()
}

// 失败页：还差 N 个 / 重新开始 / 看广告加时 30 秒
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
  ctx.fillText('广告位为演示占位，不影响正常游玩', 375, 806)
  ctx.restore()
}
