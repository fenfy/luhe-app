import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 把 /api 转发到 luhe 后端 C端服务（luhe-app，默认 :8061）并去掉 /api 前缀
  const apiProxy = {
    '/api': {
      target: env.VITE_API_PROXY || 'http://localhost:8061',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api/, ''),
    },
    // 图库图片（后端返回 /profile/... 相对路径），同样由 luhe-app 提供
    '/profile': {
      target: env.VITE_API_PROXY || 'http://localhost:8061',
      changeOrigin: true,
    },
  }
  return {
    plugins: [
      vue(),
      // PWA（iOS「添加到主屏幕」）。打 Android 包（--mode app）时关闭：App 内页面本来就在本地，不需要 Service Worker
      VitePWA({
        disable: mode === 'app',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: '路合',
          short_name: '路合',
          description: '开奖公告、开奖视频、走势图、图库',
          lang: 'zh-CN',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#FFFFFF',
          theme_color: '#FFFFFF',
          icons: [
            { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // 预缓存页面框架（html/js/css/图标），不含 apk
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          // 这些路径不是前端路由，不能回退到 index.html
          navigateFallbackDenylist: [/^\/api\//, /^\/profile\//, /^\/download\//],
          runtimeCaching: [
            // 开奖数据要实时：只走网络，不缓存
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
            // 图库图片：先读缓存，最多 300 张、保留 7 天
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/profile/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'gallery-images',
                expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 3600 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // 视频（mp4 / m3u8 / ts）不缓存
            { urlPattern: ({ request, url }) => request.destination === 'video' || /\.(m3u8|ts|mp4)$/.test(url.pathname), handler: 'NetworkOnly' },
            // Google 字体
            {
              urlPattern: ({ url }) => /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname),
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 3600 } },
            },
          ],
        },
      }),
    ],
    // 打包输出目录改为 app（默认 dist）；Capacitor 的 webDir 也指向这里
    build: { outDir: 'app' },
    // npm run dev
    server: { host: true, port: 5173, proxy: apiProxy },
    // npm run preview（预览打包结果）不读 server 配置，需要单独配一份
    preview: { host: true, port: 4173, proxy: apiProxy },
  }
})
