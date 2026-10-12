import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 5173,
      // 开发时把 /api 转发到 luhe 后端 C端服务（luhe-app，默认 :8061），浏览器不涉及跨域
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8061',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  }
})
