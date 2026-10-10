import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 5173,
      // 对接后端时把 /api 转发到 luhe 服务
      proxy: env.VITE_API_PROXY
        ? { '/api': { target: env.VITE_API_PROXY, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') } }
        : undefined,
    },
  }
})
