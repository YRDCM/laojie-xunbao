// ============================================================
// share.js —— 分享与激励视频广告封装
// 正式接入广告只需把 AD_UNIT_ID 替换为微信后台的真实广告位 ID
// ============================================================

// 占位广告位 ID（正式接入时替换）
const AD_UNIT_ID = 'adunit-xxxxxxxxxxxxxxxx'

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
      imageUrl: '' // 正式版可换成分享图地址
    }
  })
}

// 结算页"分享成绩"按钮主动拉起分享
export function shareResult(sec) {
  try {
    wx.shareAppMessage({
      title: `老街寻宝：这张图我找了${sec}秒，你敢来挑战吗？`,
      imageUrl: ''
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
