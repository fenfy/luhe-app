import { test } from 'node:test'
import assert from 'node:assert/strict'
import { installHint, isIOSSafari } from '../src/utils/platform.js'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1'
const IPHONE_WECHAT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50'
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

test('isIOSSafari：只认 iOS Safari（含 iPadOS 桌面模式），排除其他 iOS 浏览器和 Mac', () => {
  assert.equal(isIOSSafari(IPHONE_SAFARI), true)
  // iPadOS 的 UA 与 Mac Safari 相同，靠多点触控区分
  assert.equal(isIOSSafari(MAC_SAFARI, 5), true)
  assert.equal(isIOSSafari(IPHONE_CHROME), false)
  assert.equal(isIOSSafari(IPHONE_WECHAT), false)
  assert.equal(isIOSSafari(MAC_SAFARI), false)
})

test('installHint：iOS Safari 提示添加到主屏幕，Android 浏览器提示下载 App', () => {
  assert.equal(installHint({ ua: IPHONE_SAFARI }), 'ios-install')
  assert.equal(installHint({ ua: ANDROID_CHROME }), 'android-download')
  assert.equal(installHint({ ua: WINDOWS_CHROME }), null)
  assert.equal(installHint({ ua: IPHONE_CHROME }), null)
})

test('installHint：已从主屏幕打开或在 App 内时不提示', () => {
  assert.equal(installHint({ ua: IPHONE_SAFARI, standalone: true }), null)
  assert.equal(installHint({ ua: ANDROID_CHROME, native: true }), null)
})
