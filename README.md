# 路合开奖 · 前台（luhe-app）

新澳门六合彩开奖结果展示站，包含两个页面：**首页**（最新开奖、下期倒计时、历史开奖）和**开奖视频**（回放播放、按日期或期号筛选、回放列表）。

技术栈：Vue 3（`<script setup>`，JavaScript）、Vue Router 4、Vite 6、hls.js（播放 m3u8）。没有使用 UI 组件库。

## 启动

需要 Node.js 18.18 或更高版本。

```bash
npm install
npm run dev        # 开发：http://localhost:5173
npm run build      # 打包到 dist/
npm run preview    # 本地预览打包结果
npm test           # 单元测试（期号、生肖、波色、mock 数据）
```

部署说明：项目使用 history 路由。服务器需要把所有路径都回退到 `index.html`，例如 Nginx 配置 `try_files $uri $uri/ /index.html;`。

## 目录

```
src/
  config/lottery.js        彩种名称、开奖时间、时区、生肖年份、分页大小
  utils/lottery.js         波色、生肖、期号与日期互转、倒计时格式化（纯函数，有单测）
  api/
    index.js               页面只从这里取数据；按环境变量切换 mock 和真实接口
    mock.js                根据当前时间推算的 mock 数据
    http.js                真实接口（RuoYi 返回格式的适配）
  composables/
    usePagedList.js        分页列表：PC 端按页码翻页，手机端上滑追加
    useMediaQuery.js       断点判断（< 768px 为手机）
  components/              号码球、倒计时、分页、上滑加载、播放器、视频卡片等
  views/HomeView.vue       首页
  views/VideoView.vue      开奖视频页（/video?period=2026282）
tests/                     node:test 单元测试
```

## 规则说明

- **开奖时间**：每天 21:32（澳门时间，UTC+8）。期号格式为“年份 + 当年第几天（3 位）”，例如 2026-10-09 对应 `2026282`。
- **生肖**：`config/lottery.js` 中的 `zodiacYear` 年生肖对应 01 号，号码每加 1，生肖往前退一位。例如 2026 马年：01 马、02 蛇、03 龙……12 羊、13 马。到了新的生肖年，只需修改这一个配置。
- **波色**：标准六合彩红波、蓝波、绿波对照表，见 `utils/lottery.js`。
- **倒计时归零**：首页每 3 秒请求一次最新一期，直到拿到新一期（最多等 10 分钟）。拿到后 7 个号码每秒揭晓一个，揭晓完自动刷新历史列表。
- **分页**：宽度 ≥ 768px 时用页码分页；手机端用上滑加载（IntersectionObserver）。
- **播放器**：mp4 直接播放；m3u8 在 Safari 上原生播放，其他浏览器按需加载 hls.js。从“回放”按钮或列表进入时会自动播放，如果浏览器拦截有声自动播放，会改为静音播放。

## 从 mock 切换到真实接口

1. 复制 `.env.example` 为 `.env.local`，设置：

   ```
   VITE_USE_MOCK=false
   VITE_API_BASE=/api
   VITE_API_PROXY=http://localhost:8080   # 开发时 /api 代理到 luhe 后端
   ```

2. 后端按下面的约定提供接口。路径或字段不一致时，只需修改 `src/api/http.js`。

### 接口约定

所有时间都使用 ISO 8601 格式。号码使用 1–49 的整数，波色和生肖由前端计算。

| 接口 | 返回 |
| --- | --- |
| `GET /lottery/draw/latest` | `AjaxResult.data = { current: Draw, next: { period, drawAt } }` |
| `GET /lottery/draw/list?pageNum&pageSize` | `TableDataInfo = { rows: Draw[], total }`，按期号倒序 |
| `GET /lottery/video/list?pageNum&pageSize&date&period` | `TableDataInfo = { rows: Video[], total }`；`date` 格式为 `YYYY-MM-DD` |
| `GET /lottery/video/{period}` | `AjaxResult.data = Video`，不存在时返回 `null` |

```js
Draw  = { period: '2026282', drawAt: '2026-10-09T13:32:00.000Z', numbers: [6 个号码], special: 号码 }
Video = { ...Draw, duration: 秒数, src: '视频地址', type: 'mp4' | 'hls', cover: '封面图地址或 null' }
```

后端提供 `cover` 后，列表缩略图会自动换成封面图；没有封面图时，缩略图显示这一期的号码。

## 演示视频源

mock 使用公开的测试视频：奇数期用 Mux 的 HLS 测试流，偶数期用 MDN 的 CC0 示例 mp4。接入真实接口后不再使用。
