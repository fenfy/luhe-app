import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

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
    plugins: [vue()],
    // 打包输出目录改为 app（默认 dist）
    build: { outDir: 'app' },
    // npm run dev
    server: { host: true, port: 5173, proxy: apiProxy },
    // npm run preview（预览打包结果）不读 server 配置，需要单独配一份
    preview: { host: true, port: 4173, proxy: apiProxy },
  }
})
