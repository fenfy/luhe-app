/**
 * 运行环境判断（纯函数，有单测）：决定页面底部显示「添加到主屏幕」还是「下载安卓 App」。
 * 参数都由调用方传入（navigator.userAgent、是否已在主屏幕/App 内打开），方便测试。
 */

export const isIOS = (ua = '', touchPoints = 0) =>
  /iPhone|iPad|iPod/i.test(ua) ||
  // iPadOS 13+ 默认伪装成 Mac Safari，UA 完全一样，只能靠「Macintosh + 多点触控」区分
  (/Macintosh/i.test(ua) && touchPoints > 1)

/** iOS 上只有 Safari 能「添加到主屏幕」；Chrome(CriOS)、Firefox(FxiOS)、微信等内置浏览器都不行 */
export const isIOSSafari = (ua = '', touchPoints = 0) =>
  isIOS(ua, touchPoints) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|MicroMessenger|QQ\/|Weibo|DingTalk/i.test(ua)

export const isAndroid = (ua = '') => /Android/i.test(ua)

/**
 * 底部引导条的类型
 * @param {object} env
 * @param {string} env.ua navigator.userAgent
 * @param {number} env.touchPoints navigator.maxTouchPoints
 * @param {boolean} env.standalone 已经从主屏幕打开（PWA）
 * @param {boolean} env.native 在 Capacitor App 内
 * @returns {'ios-install' | 'android-download' | null}
 */
export function installHint({ ua = '', touchPoints = 0, standalone = false, native = false } = {}) {
  if (native || standalone) return null
  if (isIOSSafari(ua, touchPoints)) return 'ios-install'
  if (isAndroid(ua)) return 'android-download'
  return null
}
