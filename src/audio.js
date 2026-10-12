// ============================================================
// audio.js —— 音效封装
// 微信环境用 wx.createInnerAudioContext 播放 assets/audio/ 下的 mp3；
// 浏览器预览由 preview.html 的 shim 降级为 HTMLAudio；
// 带静音开关，状态存本地存储（键 muted）
// ============================================================

// 六个短音效（相对小游戏包根目录，preview.html 在同目录下也可直接引用）
const SOUND_FILES = {
  correct: 'assets/audio/correct.mp3', // 找到物品：清脆叮声
  wrong: 'assets/audio/wrong.mp3',     // 点错：低沉短促
  win: 'assets/audio/win.mp3',         // 胜利欢快
  fail: 'assets/audio/fail.mp3',       // 失败惋惜
  tick: 'assets/audio/tick.mp3',       // 最后 10 秒每秒滴答
  tap: 'assets/audio/tap.mp3'          // 按钮点击
}

const MUTE_KEY = 'muted'

let muted = false
const contexts = {} // name → InnerAudioContext（懒创建，每个音效一个实例）

// 读取静音存档（启动时调用一次）
export function initAudio() {
  try { muted = !!wx.getStorageSync(MUTE_KEY) } catch (e) { muted = false }
}

export function isMuted() { return muted }

// 切换静音并持久化，返回切换后的状态
export function toggleMute() {
  muted = !muted
  try { wx.setStorageSync(MUTE_KEY, muted) } catch (e) {}
  if (muted) {
    // 立即停掉正在播放的音效
    for (const name in contexts) {
      try { contexts[name].stop() } catch (e) {}
    }
  }
  return muted
}

// 播放指定音效；静音或环境不支持时静默忽略
export function playSound(name) {
  if (muted) return
  const src = SOUND_FILES[name]
  if (!src) return
  try {
    let ctx = contexts[name]
    if (!ctx) {
      ctx = wx.createInnerAudioContext()
      ctx.src = src
      ctx.obeyMuteSwitch = false // 手机静音键不强制静音，游戏内开关为准
      ctx.onError(() => {})      // 音频缺失/解码失败静默降级
      contexts[name] = ctx
    }
    // 重播：先回到开头再播放，支持连点叠加感
    if (ctx.seek) {
      try { ctx.seek(0) } catch (e) {}
    } else if (ctx.stop) {
      try { ctx.stop() } catch (e) {}
    }
    ctx.play()
  } catch (e) { /* 浏览器预览等环境兜底 */ }
}
