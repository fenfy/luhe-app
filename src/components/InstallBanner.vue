<script setup>
/**
 * 底部引导条：
 * - iOS Safari（还没添加到主屏幕）：教用户「分享 → 添加到主屏幕」
 * - Android 浏览器（不在 App 内）：提供 APK 下载
 * 关闭后记住，不再出现；App 内、主屏幕打开、桌面浏览器都不显示。
 */
import { onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { installHint } from '../utils/platform.js'

const DISMISS_KEY = 'luhe:install-banner-dismissed'
const APK_URL = import.meta.env?.VITE_APK_URL || '/download/luhe.apk'

const hint = ref(null)

function dismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function close() {
  hint.value = null
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    /* 隐私模式等情况下存不了，本次关闭即可 */
  }
}

onMounted(() => {
  if (dismissed()) return
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  hint.value = installHint({
    ua: navigator.userAgent,
    touchPoints: navigator.maxTouchPoints || 0,
    standalone,
    native: Capacitor.isNativePlatform(),
  })
})
</script>

<template>
  <aside v-if="hint" class="install-banner" role="note">
    <img src="/icons/pwa-192.png" alt="" class="install-icon" width="40" height="40" />
    <p v-if="hint === 'ios-install'" class="install-text">
      点击 Safari 底部的
      <svg class="share-icon" viewBox="0 0 24 24" aria-label="分享" role="img">
        <path d="M12 3v12M12 3l-4 4M12 3l4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
      </svg>
      分享按钮，选择<strong>「添加到主屏幕」</strong>，像 App 一样使用
    </p>
    <template v-else>
      <p class="install-text">安装安卓 App，打开更快、看开奖更方便</p>
      <a :href="APK_URL" class="install-action" download>下载</a>
    </template>
    <button type="button" class="install-close" aria-label="关闭提示" @click="close">×</button>
  </aside>
</template>

<style scoped>
.install-banner {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px 12px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
}
.install-icon {
  flex: none;
  border-radius: 10px;
}
.install-text {
  flex: 1;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
}
.share-icon {
  width: 16px;
  height: 16px;
  vertical-align: -3px;
  fill: none;
  stroke: var(--blue);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.install-action {
  flex: none;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--gold);
  color: var(--on-gold);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.install-close {
  flex: none;
  width: 32px;
  height: 32px;
  border: 0;
  background: none;
  color: var(--faint);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
</style>
