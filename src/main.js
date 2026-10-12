// ============================================================
// main.js —— 游戏主控制器
// 职责：画布与分辨率适配、游戏状态机（menu/levelselect/play/win/fail）、
// 计时与惩罚、点击分发、新手引导、音效触发、渲染循环（requestAnimationFrame）
// ============================================================
import { LEVELS } from './levels.js'
import { drawScene, hitTarget } from './scene.js'
import {
  drawHUD, drawWinPanel, drawFailPanel, drawMenu, drawLevelSelect, drawGuide,
  inRect, gradeOf,
  HINT_BTN, WIN_BTNS, FAIL_BTNS, MENU_BTNS, MUTE_BTN, BACK_BTN, levelCardRect
} from './ui.js'
import { setupShare, shareResult, showRewardedAd, showInterstitialAd } from './share.js'
import { initAudio, isMuted, toggleMute, playSound } from './audio.js'

const DESIGN_W = 750    // 设计分辨率宽
const DESIGN_H = 1334   // 设计分辨率高
const WRONG_PENALTY = 3 // 点错扣秒
const REVIVE_BONUS = 30 // 看广告复活加时（秒）
const SCENE_TOP = 190   // HUD 高度，以下才是可点击的场景区
const GUIDE_SEC = 3     // 新手引导层自动消失时间（秒）

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

    initAudio()                  // 读取静音存档
    this.muted = isMuted()

    // 初始进入主菜单
    this.state = 'menu'          // menu | levelselect | play | win | fail
    this.stateTime = 0
    this.clock = 0
    this.ripples = []
    this.resetLevelState()

    setupShare(() => this.shareSeconds())
    wx.onTouchEnd(e => this.handleTap(e))

    // 调试截图钩子：仅浏览器预览生效
    // 如 preview.html?shot=menu / levelselect / guide / win / winA / winB / fail / mid / hint / revive / level1 ~ level9
    if (typeof location !== 'undefined' && location.search) {
      const m = location.search.match(/shot=(\w+)/)
      if (m) this.debugShot(m[1])
    }
  }

  // 强制进入指定状态，用于备案/宣传截图
  debugShot(kind) {
    if (kind === 'menu') {
      this.state = 'menu'
      this.stateTime = 1
      return
    }
    if (kind === 'levelselect') {
      this.state = 'levelselect'
      this.stateTime = 1
      return
    }
    if (kind === 'guide') {
      // 新手引导层：第 1 关开局 + 引导显示中
      this.levelIndex = 0
      this.startLevel(0)
      this.guiding = true
      this.guideUntil = this.clock + 1e18
      return
    }
    const lv = kind.match(/^level(\d)$/)
    if (lv) {
      this.levelIndex = (Number(lv[1]) - 1 + LEVELS.length) % LEVELS.length
      this.startLevel(this.levelIndex)
      return
    }
    // 其余都是对局内状态截图：先确保处于第 1 关对局中
    if (this.state !== 'play') {
      this.levelIndex = 0
      this.resetLevelState()
      this.state = 'play'
    }
    const total = this.level.timeLimit
    if (kind === 'win') {
      this.elapsed = 38
      this.remaining = total - 38 // 剩余时间与用时一致，截图更真实
      for (const t of this.level.targets) this.found.add(t.id)
      this.toWin()
      this.stateTime = 1
    } else if (kind === 'winA') {
      this.elapsed = 62
      this.remaining = total - 62
      for (const t of this.level.targets) this.found.add(t.id)
      this.toWin()
      this.stateTime = 1
    } else if (kind === 'winB') {
      this.elapsed = 85
      this.remaining = Math.max(0, total - 85)
      for (const t of this.level.targets) this.found.add(t.id)
      this.toWin()
      this.stateTime = 1
    } else if (kind === 'fail') {
      for (const t of this.level.targets.slice(0, 2)) this.found.add(t.id)
      this.toFail()
      this.stateTime = 1
    } else if (kind === 'mid') {
      // 对局中盘：已找到 2 个，剩余时间过半
      for (const t of this.level.targets.slice(0, 2)) this.found.add(t.id)
      this.elapsed = 30
      this.remaining = total - 30
    } else if (kind === 'hint') {
      // 提示高亮状态：常亮显示一个未找物品的提示圈
      for (const t of this.level.targets.slice(0, 1)) this.found.add(t.id)
      const t = this.level.targets[1]
      this.hintId = t.id
      this.hintUntil = 1e18
      this.elapsed = 20
      this.remaining = total - 20
    } else if (kind === 'revive') {
      // 复活后状态：剩余时间超过初始限时
      for (const t of this.level.targets.slice(0, 2)) this.found.add(t.id)
      this.elapsed = total + 5
      this.remaining = total + REVIVE_BONUS - this.elapsed
    }
  }

  get level() { return LEVELS[this.levelIndex] }
  get levelCount() { return LEVELS.length }
  get totalTargets() { return this.level.targets.length }

  // ---------------- 进度存档（wx.setStorageSync 持久化） ----------------

  // 某关历史最佳秒数（0 = 未通关）
  bestOfLevel(i) {
    try { return Number(wx.getStorageSync(`best_${LEVELS[i].id}`)) || 0 } catch (e) { return 0 }
  }

  // 按顺序解锁：第 1 关始终解锁，其余需前一关有通关记录
  isUnlocked(i) {
    return i === 0 || this.bestOfLevel(i - 1) > 0
  }

  passedCount() {
    let n = 0
    for (let i = 0; i < LEVELS.length; i++) if (this.bestOfLevel(i) > 0) n++
    return n
  }

  // 首个未通关关卡序号（全部通关则回第 1 关）
  firstUnpassed() {
    for (let i = 0; i < LEVELS.length; i++) if (this.bestOfLevel(i) === 0) return i
    return 0
  }

  // 是否首次游玩（本地无任何最佳成绩记录）—— 决定是否出新手引导
  isFirstPlay() {
    return this.passedCount() === 0
  }

  // ---------------- 状态切换 ----------------

  enterMenu() {
    this.state = 'menu'
    this.stateTime = 0
  }

  enterLevelSelect() {
    this.state = 'levelselect'
    this.stateTime = 0
  }

  // 进入指定关卡开始一局
  startLevel(i) {
    this.levelIndex = i
    this.resetLevelState()
    this.state = 'play'
    // 首次进入第 1 关且本地无任何成绩：显示新手引导，该局点错不扣时间
    if (i === 0 && this.isFirstPlay()) {
      this.guiding = true
      this.guideUntil = this.clock + GUIDE_SEC
      this.noPenalty = true
    }
  }

  // 重置一局的对局数据（不改变 state，由调用方决定进入哪个状态）
  resetLevelState() {
    this.stateTime = 0           // 进入当前状态的时长（驱动淡入）
    this.totalTime = this.level.timeLimit
    this.remaining = this.level.timeLimit
    this.elapsed = 0
    this.found = new Set()
    this.ripples = []            // 点击涟漪 {x, y, r0, color, age}
    this.hintId = null           // 被提示高亮的物品 id
    this.hintUntil = 0           // 高亮截止时间（clock 秒）
    this.resultSec = 0
    this.grade = null
    this.best = 0
    this.isNewBest = false
    this.guiding = false         // 新手引导层显示中
    this.guideUntil = 0          // 引导自动消失时间（clock 秒）
    this.noPenalty = false       // 引导局点错不扣时间
    this.lastTickSec = -1        // 上次滴答音对应的剩余整秒
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
    // 引导层到时自动消失
    if (this.guiding && this.clock >= this.guideUntil) this.guiding = false

    if (this.state === 'play' && !this.guiding) {
      this.elapsed += dt
      this.remaining -= dt
      // 最后 10 秒每秒滴答
      if (this.remaining > 0 && this.remaining <= 10) {
        const sec = Math.ceil(this.remaining)
        if (sec !== this.lastTickSec) {
          this.lastTickSec = sec
          playSound('tick')
        }
      }
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
    playSound('win')
    // 历史最佳：wx.setStorageSync 持久化，每关独立记录
    const key = `best_${this.level.id}`
    const prev = this.bestOfLevel(this.levelIndex)
    this.isNewBest = !prev || this.resultSec < prev
    this.best = this.isNewBest ? this.resultSec : prev
    if (this.isNewBest) {
      try { wx.setStorageSync(key, this.resultSec) } catch (e) {}
    }
  }

  toFail() {
    this.state = 'fail'
    this.stateTime = 0
    playSound('fail')
  }

  // 分享标题用的秒数：结算页用成绩，对局中用当前用时
  shareSeconds() {
    if (this.state === 'win') return this.resultSec
    if (this.state === 'play' && this.elapsed > 1) return Math.round(this.elapsed)
    return 0
  }

  // ---------------- 点击分发 ----------------

  // 触点坐标换算：屏幕逻辑像素 → 750×1334 设计坐标
  handleTap(e) {
    const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0])
    if (!t) return
    const x = (t.clientX * this.dpr - this.ox) / this.scale
    const y = (t.clientY * this.dpr - this.oy) / this.scale

    if (this.state === 'menu') this.tapMenu(x, y)
    else if (this.state === 'levelselect') this.tapLevelSelect(x, y)
    else if (this.state === 'play') this.tapPlay(x, y)
    else if (this.state === 'win') this.tapWin(x, y)
    else if (this.state === 'fail') this.tapFail(x, y)
  }

  // 静音开关（主菜单/选关页共用），返回是否命中
  tapMute(x, y) {
    if (!inRect(MUTE_BTN, x, y)) return false
    this.muted = toggleMute()
    if (!this.muted) playSound('tap') // 取消静音时给一声反馈
    return true
  }

  tapMenu(x, y) {
    if (this.tapMute(x, y)) return
    if (inRect(MENU_BTNS.start, x, y)) {
      playSound('tap')
      this.startLevel(this.firstUnpassed()) // 从首个未通关的关卡开始
    } else if (inRect(MENU_BTNS.select, x, y)) {
      playSound('tap')
      this.enterLevelSelect()
    }
  }

  tapLevelSelect(x, y) {
    if (this.tapMute(x, y)) return
    if (inRect(BACK_BTN, x, y)) {
      playSound('tap')
      this.enterMenu()
      return
    }
    for (let i = 0; i < LEVELS.length; i++) {
      if (inRect(levelCardRect(i), x, y)) {
        if (this.isUnlocked(i)) {
          playSound('tap')
          this.startLevel(i)
        } else {
          playSound('wrong') // 未解锁给个低沉反馈
        }
        return
      }
    }
  }

  tapPlay(x, y) {
    // 新手引导层显示中：任意点击仅关闭引导，本点击不作用于游戏
    if (this.guiding) {
      this.guiding = false
      playSound('tap')
      return
    }
    if (inRect(HINT_BTN, x, y)) {
      playSound('tap')
      this.watchAd('hint')
      return
    }
    if (y < SCENE_TOP) return // HUD 区域不惩罚
    const t = hitTarget(this.level, x, y)
    if (t && !this.found.has(t.id)) {
      this.found.add(t.id)
      playSound('correct')
      this.ripples.push({ x: t.x, y: t.y, r0: t.r, color: '#5C8A3A', age: 0 }) // 绿色扩散
      if (this.found.size >= this.totalTargets) this.toWin()
    } else if (!t) {
      // 点错：扣 3 秒 + 红色涟漪（新手引导局不扣时间）
      playSound('wrong')
      if (!this.noPenalty) {
        this.remaining = Math.max(0, this.remaining - WRONG_PENALTY)
      }
      this.ripples.push({ x, y, r0: 12, color: '#C0392B', age: 0 })
    }
    // 点到已找到的物品：忽略，不惩罚
  }

  tapWin(x, y) {
    if (inRect(WIN_BTNS.next, x, y)) {
      playSound('tap')
      if (this.levelIndex + 1 < LEVELS.length) {
        this.startLevel(this.levelIndex + 1) // 进下一关
      } else {
        this.backToSelectWithAd() // 最后一关返回选关
      }
    } else if (inRect(WIN_BTNS.share, x, y)) {
      playSound('tap')
      shareResult(this.resultSec)
    } else if (inRect(WIN_BTNS.back, x, y)) {
      playSound('tap')
      this.backToSelectWithAd()
    }
  }

  tapFail(x, y) {
    if (inRect(FAIL_BTNS.retry, x, y)) {
      playSound('tap')
      this.startLevel(this.levelIndex)
    } else if (inRect(FAIL_BTNS.ad, x, y)) {
      playSound('tap')
      this.watchAd('revive')
    } else if (inRect(FAIL_BTNS.back, x, y)) {
      playSound('tap')
      this.enterLevelSelect()
    }
  }

  // 通关后回到关卡选择：每满 3 关（第 3/6/9 关）插屏广告一次（占位，失败静默）
  backToSelectWithAd() {
    if ((this.levelIndex + 1) % 3 === 0) showInterstitialAd()
    this.enterLevelSelect()
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

  // ---------------- 渲染 ----------------

  render() {
    const ctx = this.ctx
    ctx.save()
    // 设计分辨率外的留边区域填深色
    ctx.fillStyle = '#241A10'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.translate(this.ox, this.oy)
    ctx.scale(this.scale, this.scale)

    if (this.state === 'menu') {
      drawMenu(ctx, this)
      ctx.restore()
      return
    }
    if (this.state === 'levelselect') {
      drawLevelSelect(ctx, this, LEVELS)
      ctx.restore()
      return
    }

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

    // 新手引导层（覆盖一切）
    if (this.guiding) drawGuide(ctx, this)

    ctx.restore()
  }
}
