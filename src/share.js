// ============================================================
// share.js —— 分享（含离屏绘制分享卡片图）与广告封装
// 正式接入广告只需把 AD_UNIT_ID / INTERSTITIAL_AD_UNIT_ID
// 替换为微信后台的真实广告位 ID
// ============================================================
import { rr } from './painter.js'

// 占位广告位 ID（正式接入时替换）
const AD_UNIT_ID = 'adunit-xxxxxxxxxxxxxxxx'
const INTERSTITIAL_AD_UNIT_ID = 'adunit-xxxxxxxxxxxxxxxx'

// ------------------------------------------------------------
// 分享卡片图：离屏 canvas 绘制 5:4（500×400），
// 微信环境用 toTempFilePathSync 生成临时文件路径；
// 浏览器预览无此 API，降级为空 imageUrl
// ------------------------------------------------------------
let shareCardCache = { sec: -1, url: '' }

function buildShareCard(sec) {
  if (shareCardCache.sec === sec) return shareCardCache.url
  let url = ''
  try {
    const cv = wx.createCanvas() // 非首个 canvas，即离屏画布
    cv.width = 500
    cv.height = 400
    const ctx = cv.getContext('2d')

    // 老街黄昏底色（与主菜单同调性）
    const sky = ctx.createLinearGradient(0, 0, 0, 400)
    sky.addColorStop(0, '#3E2C4A')
    sky.addColorStop(0.6, '#8A4A3A')
    sky.addColorStop(1, '#D08A4A')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 500, 400)
    // 屋檐剪影色块
    ctx.fillStyle = '#2E1E16'
    ctx.beginPath()
    ctx.moveTo(0, 300); ctx.lineTo(120, 240); ctx.lineTo(240, 300)
    ctx.lineTo(360, 250); ctx.lineTo(500, 310)
    ctx.lineTo(500, 400); ctx.lineTo(0, 400)
    ctx.closePath(); ctx.fill()
    // 两盏灯笼色块
    for (const lx of [80, 420]) {
      ctx.fillStyle = '#C0392B'
      ctx.beginPath(); ctx.ellipse(lx, 300, 20, 25, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#E2B34C'
      ctx.fillRect(lx - 8, 272, 16, 6)
      ctx.fillRect(lx - 7, 322, 14, 6)
    }
    // 标题
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = 'bold 72px sans-serif'
    ctx.lineWidth = 8; ctx.strokeStyle = '#3A2412'; ctx.lineJoin = 'round'
    ctx.strokeText('老街寻宝', 250, 110)
    ctx.fillStyle = '#E2B34C'
    ctx.fillText('老街寻宝', 250, 110)
    // 挑战文案
    ctx.fillStyle = '#F5E9D0'; ctx.font = '34px sans-serif'
    ctx.fillText(
      sec > 0 ? `我找了 ${sec} 秒，你敢挑战吗` : '市井老街藏宝贝，等你来挑战',
      250, 200
    )
    // 描边圆角框装饰
    rr(ctx, 18, 18, 464, 364, 18)
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(245,233,208,0.35)'; ctx.stroke()

    url = cv.toTempFilePathSync({ x: 0, y: 0, width: 500, height: 400, destWidth: 500, destHeight: 400 })
  } catch (e) {
    url = '' // 浏览器预览等无 toTempFilePathSync 环境，分享不带图
  }
  shareCardCache = { sec, url }
  return url
}

// 注册转发分享：getSeconds 返回用于分享标题的秒数（0 表示还没有成绩）
export function setupShare(getSeconds) {
  try {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
  } catch (e) { /* 低版本基础库降级忽略 */ }
  wx.onShareAppMessage(() => {
    const s = getSeconds()
    return {
      title: s > 0
        ? `老街寻宝：这张图我找了${s}秒，你敢来挑战吗？`
        : '老街寻宝：市井老街藏宝贝，你敢来挑战吗？',
      imageUrl: buildShareCard(s)
    }
  })
}

// 结算页"分享成绩"按钮主动拉起分享
export function shareResult(sec) {
  try {
    wx.shareAppMessage({
      title: `老街寻宝：这张图我找了${sec}秒，你敢来挑战吗？`,
      imageUrl: buildShareCard(sec)
    })
  } catch (e) { /* 浏览器预览环境由 shim 兜底 */ }
}

// 激励视频：看完整条广告后 onReward 发放奖励
// 广告不可用 / 加载失败时降级为演示模式：弹窗说明后直接发奖励，不阻断流程
export function showRewardedAd(onReward) {
  const fallback = () => {
    wx.showModal({
      title: '演示模式',
      content: '广告位待接入，演示模式直接生效',
      showCancel: false,
      confirmText: '领取奖励',
      success: () => onReward()
    })
  }

  let ad = null
  try {
    ad = wx.createRewardedVideoAd({ adUnitId: AD_UNIT_ID })
  } catch (e) {
    ad = null // 浏览器预览等无广告环境
  }
  if (!ad) return fallback()

  ad.onClose(res => {
    if (res && res.isEnded) {
      onReward()
    } else {
      try { wx.showToast({ title: '看完视频才能获得奖励哦', icon: 'none' }) } catch (e) {}
    }
  })
  ad.show().catch(() => {
    ad.load().then(() => ad.show()).catch(fallback)
  })
}

// 插屏广告占位：通关回到关卡选择页时由 main.js 择机调用
// 创建/展示失败一律静默降级，不打扰玩家
let interstitialAd = null
let interstitialTried = false

export function showInterstitialAd() {
  try {
    if (!interstitialTried) {
      interstitialTried = true
      interstitialAd = wx.createInterstitialAd({ adUnitId: INTERSTITIAL_AD_UNIT_ID })
      if (interstitialAd && interstitialAd.onError) {
        interstitialAd.onError(() => {}) // 占位广告位报错静默吞掉
      }
    }
    if (interstitialAd && interstitialAd.show) {
      interstitialAd.show().catch(() => {})
    }
  } catch (e) { /* 无插屏广告环境（浏览器预览/低版本基础库） */ }
}
