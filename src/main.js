// ============================================================
// main.js —— 游戏主控制器
// 职责：画布与分辨率适配、游戏状态机（play/win/fail）、
// 计时与惩罚、点击分发、渲染循环（requestAnimationFrame）
// ============================================================
import { LEVELS } from './levels.js'
import { drawScene, hitTarget } from './scene.js'
import { drawHUD, drawWinPanel, drawFailPanel, inRect, HINT_BTN, WIN_BTNS, FAIL_BTNS } from './ui.js'
import { setupShare, shareResult, showRewardedAd } from './share.js'

const DESIGN_W = 750    // 设计分辨率宽
const DESIGN_H = 1334   // 设计分辨率高
const TOTAL_TIME = 90   // 每关限时（秒）
const WRONG_PENALTY = 3 // 点错扣秒
const REVIVE_BONUS = 30 // 看广告复活加时（秒）
const SCENE_TOP = 190   // HUD 高度，以下才是可点击的场景区

// 按用时评级：S ≤ 45s，A ≤ 70s，其余 B
function gradeOf(sec) {
  if (sec <= 45) return { letter: 'S', word: '火眼金睛' }
  if (sec <= 70) return { letter: 'A', word: '明察秋毫' }
  return { letter: 'B', word: '小有所成' }
}

export class Game {
  constructor() {
    const sys = wx.getSystemInfoSync()
    this.dpr = sys.pixelRatio || 1
    const sw = sys.screenWidth || sys.windowWidth || 375
    const sh = sys.screenHeight || sys.windowHeight || 667

    this.canvas = wx.createCanvas()
    this.canvas.width = sw * this.dpr
    this.canvas.height = sh * this.dpr
    // 等比缩放适配：750×1334 设计分辨率完整放入屏幕，居中留边
    this.scale = Math.min(this.canvas.width / DESIGN_W, this.canvas.height / DESIGN_H)
    this.ox = (this.canvas.width - DESIGN_W * this.scale) / 2
    this.oy = (this.canvas.height - DESIGN_H * this.scale) / 2

    this.ctx = this.canvas.getContext('2d')
    this.levelIndex = 0
    this.resetLevel()

    setupShare(() => this.shareSeconds())
    wx.onTouchEnd(e => this.handleTap(e))

    // 调试截图钩子：仅浏览器预览生效，如 preview.html?shot=win / fail / level1
    if (typeof location !== 'undefined' && location.search) {
      const m = location.search.match(/shot=(\w+)/)
      if (m) this.debugShot(m[1])
    }
  }

  // 强制进入指定状态，用于备案/宣传截图
  debugShot(kind) {
    const lv = kind.match(/^level(\d)$/)
    if (lv) {
      this.levelIndex = Number(lv[1]) % LEVELS.length
      this.resetLevel()
      return
    }
    if (kind === 'win') {
      this.elapsed = 38
      this.remaining = TOTAL_TIME - 38 // 剩余时间与用时一致，截图更真实
      for (const t of this.level.targets) this.found.add(t.id)
      this.toWin()
      this.stateTime = 1
    } else if (kind === 'winA') {
      this.elapsed = 62
      this.remaining = TOTAL_TIME - 62
      for (const t of this.level.targets) this.found.add(t.id)
      this.toWin()
      this.stateTime = 1
    } else if (kind === 'winB') {
      this.elapsed = 85
      this.remaining = TOTAL_TIME - 85
      for (const t of this.level.targets) this.found.add(t.id)
      this.toWin()
      this.stateTime = 1
    } else if (kind === 'fail') {
      for (const t of this.level.targets.slice(0, 2)) this.found.add(t.id)
      this.toFail()
      this.stateTime = 1
    } else if (kind === 'mid') {
      // 对局中盘：已找到 2 个，剩余 60 秒
      for (const t of this.level.targets.slice(0, 2)) this.found.add(t.id)
      this.elapsed = 30
      this.remaining = TOTAL_TIME - 30
    } else if (kind === 'hint') {
      // 提示高亮状态：常亮显示一个未找物品的提示圈
      for (const t of this.level.targets.slice(0, 1)) this.found.add(t.id)
      const t = this.level.targets[1]
      this.hintId = t.id
      this.hintUntil = 1e18
      this.elapsed = 20
      this.remaining = TOTAL_TIME - 20
    } else if (kind === 'revive') {
      // 复活后状态：剩余时间超过初始 90 秒
      for (const t of this.level.targets.slice(0, 2)) this.found.add(t.id)
      this.elapsed = 95
      this.remaining = TOTAL_TIME + REVIVE_BONUS - 95
    }
  }

  get level() { return LEVELS[this.levelIndex] }
  get totalTargets() { return this.level.targets.length }

  resetLevel() {
    this.state = 'play'          // play | win | fail
    this.stateTime = 0           // 进入当前状态的时长（驱动淡入）
    this.clock = 0               // 本关累计时钟（驱动闪烁动画）
    this.totalTime = TOTAL_TIME
    this.remaining = TOTAL_TIME
    this.elapsed = 0
    this.found = new Set()
    this.ripples = []            // 点击涟漪 {x, y, r0, color, age}
    this.hintId = null           // 被提示高亮的物品 id
    this.hintUntil = 0           // 高亮截止时间（clock 秒）
    this.resultSec = 0
    this.grade = null
    this.best = 0
    this.isNewBest = false
  }

  start() {
    this.last = 0
    const loop = ts => {
      const dt = this.last ? Math.min((ts - this.last) / 1000, 0.1) : 0
      this.last = ts
      this.update(dt)
      this.render()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  update(dt) {
    this.stateTime += dt
    this.clock += dt
    if (this.state === 'play') {
      this.elapsed += dt
      this.remaining -= dt
      if (this.remaining <= 0) {
        this.remaining = 0
        this.toFail()
      }
    }
    // 涟漪动画 0.6 秒后消失
    for (const r of this.ripples) r.age += dt
    this.ripples = this.ripples.filter(r => r.age < 0.6)
  }

  toWin() {
    this.state = 'win'
    this.stateTime = 0
    this.resultSec = Math.max(1, Math.round(this.elapsed))
    this.grade = gradeOf(this.resultSec)
    // 历史最佳：wx.setStorageSync 持久化，每关独立记录
    const key = `best_${this.level.id}`
    let prev = 0
    try { prev = Number(wx.getStorageSync(key)) || 0 } catch (e) {}
    this.isNewBest = !prev || this.resultSec < prev
    this.best = this.isNewBest ? this.resultSec : prev
    if (this.isNewBest) {
      try { wx.setStorageSync(key, this.resultSec) } catch (e) {}
    }
  }

  toFail() {
    this.state = 'fail'
    this.stateTime = 0
  }

  // 分享标题用的秒数：结算页用成绩，对局中用当前用时
  shareSeconds() {
    if (this.state === 'win') return this.resultSec
    if (this.state === 'play' && this.elapsed > 1) return Math.round(this.elapsed)
    return 0
  }

  // 触点坐标换算：屏幕逻辑像素 → 750×1334 设计坐标
  handleTap(e) {
    const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
    if (!t) return
    const x = (t.clientX * this.dpr - this.ox) / this.scale
    const y = (t.clientY * this.dpr - this.oy) / this.scale

    if (this.state === 'play') {
      this.tapPlay(x, y)
    } else if (this.state === 'win') {
      if (inRect(WIN_BTNS.next, x, y)) {
        this.levelIndex = (this.levelIndex + 1) % LEVELS.length
        this.resetLevel()
      } else if (inRect(WIN_BTNS.share, x, y)) {
        shareResult(this.resultSec)
      }
    } else if (this.state === 'fail') {
      if (inRect(FAIL_BTNS.retry, x, y)) {
        this.resetLevel()
      } else if (inRect(FAIL_BTNS.ad, x, y)) {
        this.watchAd('revive')
      }
    }
  }

  tapPlay(x, y) {
    if (inRect(HINT_BTN, x, y)) {
      this.watchAd('hint')
      return
    }
    if (y < SCENE_TOP) return // HUD 区域不惩罚
    const t = hitTarget(this.level, x, y)
    if (t && !this.found.has(t.id)) {
      this.found.add(t.id)
      this.ripples.push({ x: t.x, y: t.y, r0: t.r, color: '#5C8A3A', age: 0 }) // 绿色扩散
      if (this.found.size >= this.totalTargets) this.toWin()
    } else if (!t) {
      // 点错：扣 3 秒 + 红色涟漪
      this.remaining = Math.max(0, this.remaining - WRONG_PENALTY)
      this.ripples.push({ x, y, r0: 12, color: '#C0392B', age: 0 })
    }
    // 点到已找到的物品：忽略，不惩罚
  }

  // 激励视频奖励：hint=高亮闪烁一个未找物品 2 秒；revive=加时 30 秒并继续
  watchAd(kind) {
    showRewardedAd(() => {
      if (kind === 'hint') {
        const left = this.level.targets.filter(t => !this.found.has(t.id))
        if (left.length) {
          const t = left[Math.floor(Math.random() * left.length)]
          this.hintId = t.id
          this.hintUntil = this.clock + 2
        }
      } else {
        this.remaining += REVIVE_BONUS
        this.state = 'play'
        this.stateTime = 0
      }
    })
  }

  render() {
    const ctx = this.ctx
    ctx.save()
    // 设计分辨率外的留边区域填深色
    ctx.fillStyle = '#241A10'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.translate(this.ox, this.oy)
    ctx.scale(this.scale, this.scale)

    drawScene(ctx, this.level)

    // 提示高亮：黄色描边 2 秒闪烁
    if (this.hintId && this.clock < this.hintUntil) {
      const t = this.level.targets.find(i => i.id === this.hintId)
      if (t && (Math.floor(this.clock * 5) % 2 === 0 || this.hintUntil > 1e17)) {
        ctx.strokeStyle = '#FFD54A'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(t.x, t.y, t.r + 14, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // 点击涟漪：圆圈扩散并淡出
    for (const r of this.ripples) {
      const p = r.age / 0.6
      ctx.globalAlpha = 1 - p
      ctx.strokeStyle = r.color
      ctx.lineWidth = 6 * (1 - p) + 2
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.r0 + p * 70, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    drawHUD(ctx, this, this.level)

    // 结算 / 失败弹层淡入
    if (this.state === 'win') drawWinPanel(ctx, this, Math.min(1, this.stateTime / 0.4))
    if (this.state === 'fail') drawFailPanel(ctx, this, Math.min(1, this.stateTime / 0.4))

    // 关卡开始淡入
    if (this.state === 'play' && this.stateTime < 0.35) {
      ctx.fillStyle = `rgba(20,12,6,${(0.5 * (1 - this.stateTime / 0.35)).toFixed(3)})`
      ctx.fillRect(0, 0, DESIGN_W, DESIGN_H)
    }

    ctx.restore()
  }
}
