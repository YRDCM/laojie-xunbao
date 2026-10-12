// 冒烟测试：node 环境下用 Proxy 桩掉 Canvas/wx，跑全部状态渲染与点击路径
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const ORDER = ['src/levels.js','src/painter.js','src/scene.js','src/ui.js','src/audio.js','src/share.js','src/main.js']

function strip(code) {
  const out = []
  let inImport = false
  for (const line of code.split('\n')) {
    const t = line.trim()
    if (inImport) {
      if (t.includes(' from ') || t.endsWith('.js\'') || t.endsWith('.js"')) inImport = false
      continue
    }
    if (t.startsWith('import ')) {
      if (!t.includes(' from ')) inImport = true
      continue
    }
    if (t.startsWith('export {')) continue
    out.push(line.replace(/^export\s+(?=(const|let|var|function|class)\b)/, ''))
  }
  return out.join('\n')
}
const bundle = ORDER.map(f => strip(fs.readFileSync(path.join(ROOT, f), 'utf8'))).join('\n')

// ---- 桩 ----
const grad = { addColorStop() {} }
const ctxStub = new Proxy({}, {
  get(t, k) {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad
    if (k === 'measureText') return () => ({ width: 10 })
    if (typeof t[k] !== 'undefined') return t[k]
    return () => {}
  },
  set(t, k, v) { t[k] = v; return true }
})
const canvasStub = { width: 0, height: 0, getContext: () => ctxStub,
  toTempFilePathSync: () => '/tmp/share.png' }

const store = {}
const rafQueue = []
let touchFn = null
let shareFn = null

global.wx = {
  getSystemInfoSync: () => ({ screenWidth: 375, screenHeight: 667, pixelRatio: 2 }),
  createCanvas: () => canvasStub,
  setStorageSync: (k, v) => { store[k] = v },
  getStorageSync: k => (k in store ? store[k] : ''),
  removeStorageSync: k => { delete store[k] },
  showShareMenu: () => {},
  onShareAppMessage: fn => { shareFn = fn },
  shareAppMessage: o => { console.log('[分享]', o.title, '| imageUrl =', o.imageUrl) },
  showModal: o => { console.log('[弹窗]', o.title); o.success && o.success({ confirm: true }) },
  showToast: o => console.log('[toast]', o.title),
  createRewardedVideoAd: () => { throw new Error('no ad') },
  createInterstitialAd: () => { throw new Error('no ad') },
  createInnerAudioContext: () => ({ src: '', play() {}, pause() {}, stop() {}, seek() {}, destroy() {}, onError() {}, onEnded() {} }),
  onTouchEnd: fn => { touchFn = fn }
}
global.requestAnimationFrame = fn => { rafQueue.push(fn) }
global.location = { search: '' }

eval(bundle + '\nglobal.__Game = Game\n')

const game = new global.__Game()
function frame(dtMs = 16) { game.update(dtMs / 1000); game.render() }
function tap(x, y) { touchFn({ touches: [], changedTouches: [{ clientX: x, clientY: y }] }) }
// 375×667 @ dpr2 → 画布 750×1334，scale=1，设计坐标 = clientX × 2
function tapDesign(x, y) { tap(x / 2, y / 2) }

let step = '构造'
try {
  // 1 主菜单渲染
  step = 'menu 渲染'
  for (let i = 0; i < 5; i++) frame()

  // 2 主菜单 → 关卡选择
  step = 'menu→levelselect'
  tapDesign(375, 932) // 关卡选择按钮
  if (game.state !== 'levelselect') throw new Error('未进入 levelselect，state=' + game.state)
  for (let i = 0; i < 3; i++) frame()

  // 3 选关：未解锁关卡应拒绝
  step = '未解锁拦截'
  tapDesign(505 + 100, 300 + 120) // 第3关卡片（应锁定）
  if (game.state !== 'levelselect') throw new Error('锁定关卡被意外进入')

  // 4 选关 → 第1关（含新手引导）
  step = '进入第1关'
  tapDesign(45 + 100, 300 + 120)
  if (game.state !== 'play') throw new Error('未进入 play')
  if (!game.guiding) throw new Error('首次进入第1关未出现引导层')
  frame()
  // 引导层点击仅关闭引导
  tapDesign(400, 700)
  if (game.guiding) throw new Error('引导层未被点击关闭')
  for (let i = 0; i < 3; i++) frame()

  // 5 引导局点错不扣时间
  step = '引导局免惩罚'
  const before = game.remaining
  tapDesign(375, 1000) // 空白处
  if (game.remaining < before - 0.5) throw new Error(`引导局点错仍扣时 ${before}→${game.remaining}`)

  // 6 点击 5 个目标通关（含倒计时滴答路径）
  step = '通关第1关'
  const lv = game.level
  for (const t of lv.targets) { tapDesign(t.x, t.y); frame() }
  if (game.state !== 'win') throw new Error('未进入 win，state=' + game.state)
  for (let i = 0; i < 30; i++) frame(50)

  // 7 分享卡片图
  step = '分享卡片图'
  const o = shareFn()
  if (!o.imageUrl) throw new Error('分享图 imageUrl 为空')
  console.log('[分享回调]', o.title, '| imageUrl =', o.imageUrl)

  // 8 胜利页 → 下一关
  step = 'win→下一关'
  tapDesign(255, 782)
  if (game.state !== 'play' || game.levelIndex !== 1) throw new Error('未进入第2关，state=' + game.state + ' idx=' + game.levelIndex)
  if (game.guiding) throw new Error('第2关不应出现引导')
  if (!game.isUnlocked(1)) throw new Error('第2关未解锁')
  frame()

  // 9 第2关点错扣 3 秒
  step = '正常局惩罚'
  const r2 = game.remaining
  tapDesign(375, 1000)
  if (r2 - game.remaining < 2.9) throw new Error(`第2关点错未扣时 ${r2}→${game.remaining}`)

  // 10 失败路径：耗尽时间
  step = 'fail 路径'
  game.remaining = 0.01
  frame(50)
  if (game.state !== 'fail') throw new Error('未进入 fail')
  for (let i = 0; i < 30; i++) frame(50)
  // 失败页看广告复活（演示模式直接发奖励）
  tapDesign(495, 702)
  frame()
  if (game.state !== 'play') throw new Error('复活后未回到 play')

  // 11 debugShot 全部钩子
  step = 'debugShot 钩子'
  for (const k of ['menu','levelselect','guide','win','winA','winB','fail','mid','hint','revive',
                   'level1','level2','level3','level4','level5','level6','level7','level8','level9']) {
    game.debugShot(k)
    for (let i = 0; i < 3; i++) frame(50)
  }

  // 12 第3关通关回选关触发插屏（静默降级路径）
  step = '插屏降级'
  game.debugShot('level3')
  game.state = 'win'
  game.backToSelectWithAd()
  if (game.state !== 'levelselect') throw new Error('未回到选关页')

  // 13 静音开关
  step = '静音开关'
  game.enterMenu()
  tapDesign(708, 50)
  if (!game.muted) throw new Error('静音未开启')
  tapDesign(708, 50)
  if (game.muted) throw new Error('静音未关闭')

  console.log('\n冒烟测试全部通过 ✔')
} catch (err) {
  console.error(`✘ 失败于步骤「${step}」:`, err && err.stack || err)
  process.exit(1)
}
