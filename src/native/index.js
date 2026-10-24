/**
 * Capacitor（Android App）专用：在浏览器 / PWA 里什么也不做。
 * - 物理返回键：有上一页就返回；在首页时 2 秒内再按一次退出
 * - 状态栏：白底黑字，与页头一致，不盖住页面
 * - 启动页：页面挂载后再隐藏，避免白屏闪一下
 */
import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()

const EXIT_WINDOW_MS = 2000

function toast(text) {
  const el = document.createElement('div')
  el.className = 'native-toast'
  el.textContent = text
  document.body.appendChild(el)
  setTimeout(() => el.remove(), EXIT_WINDOW_MS)
}

export async function initNative(router) {
  if (!isNative()) return
  document.documentElement.classList.add('is-native')

  const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
  ])

  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
  StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => {})
  // Style.Light = 浅色背景配深色文字
  StatusBar.setStyle({ style: Style.Light }).catch(() => {})

  let lastBackAt = 0
  App.addListener('backButton', ({ canGoBack }) => {
    const atHome = router.currentRoute.value.name === 'home'
    if (!atHome && canGoBack) {
      router.back()
      return
    }
    if (!atHome) {
      // 从外部链接直接打开某个页面时没有历史记录：先回首页
      router.replace({ name: 'home' })
      return
    }
    const now = Date.now()
    if (now - lastBackAt < EXIT_WINDOW_MS) {
      App.exitApp()
    } else {
      lastBackAt = now
      toast('再按一次退出')
    }
  })

  await router.isReady()
  SplashScreen.hide().catch(() => {})
}
