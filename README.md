# 路合开奖 · 前台（luhe-app）

新澳门六合彩开奖结果展示站，包含三个页面：**首页**（最新开奖、下期倒计时、历史开奖）、**开奖视频**（回放播放、按日期或期号筛选、回放列表）和**走势图**（特码 / 正码的号码、波色、生肖、尾数、波段出现次数统计）。

技术栈：Vue 3（`<script setup>`，JavaScript）、Vue Router 4、Vite 6、hls.js（播放 m3u8）。没有使用 UI 组件库。

## 启动

需要 Node.js 18.18 或更高版本。

1. 启动后端 C端服务 luhe-app（`:8061`），需要包含开奖接口 `/app/lottery/draw/**`（见后端 `docs/superpowers/specs/2026-10-12-app-lottery-api-design.md`）。
2. 在本目录执行：

```bash
npm install
npm run dev        # 开发：http://localhost:5173，/api 自动代理到 http://localhost:8061
npm run build      # 打包到 dist/
npm run preview    # 本地预览打包结果
npm test           # 单元测试（期号、生肖、波色、mock 数据、接口映射）
```

后端不在本机时，在 `.env.local` 里设置 `VITE_API_PROXY`。没有后端时，可以设置 `VITE_USE_MOCK=true` 改用本地 mock 数据（见 `.env.example`）。

部署说明（打包后页面要能请求到 `/api`，否则会报 `Unexpected token '<' ... is not valid JSON`，因为 `/api` 请求拿到的是 index.html）：
- `npm run preview`：已在 `vite.config.js` 配好 `preview.proxy`，和开发时一样把 `/api` 转发到 `VITE_API_PROXY`（默认 `http://localhost:8061`）。访问 http://localhost:4173。
- Nginx：参考 `deploy/nginx.conf.example`。要点是 `location /api/ { proxy_pass http://127.0.0.1:8061/; }`（结尾的 `/` 用来去掉 `/api` 前缀）和 `try_files $uri $uri/ /index.html;`（history 路由）。
- 其他静态服务器（如直接用 `npx serve dist`）不会转发 `/api`，不能直接使用。或者在打包前把 `VITE_API_BASE` 设为后端完整地址（如 `https://api.example.com`），这时后端 `app.cors.allowed-origins` 要加上 H5 的域名。

## 目录

```
src/
  config/lottery.js        彩种名称、开奖时间、时区、生肖年份、分页大小
  utils/lottery.js         波色、生肖、期号与日期互转、倒计时格式化（纯函数，有单测）
  api/
    index.js               页面只从这里取数据；默认真实接口，VITE_USE_MOCK=true 时用 mock
    http.js                真实接口（luhe-app 的 /app/lottery/draw/**，RuoYi 返回格式适配）
    videoSource.js         开奖视频的临时来源（测试视频），后端有视频数据后删除
    mock.js                离线开发用的 mock 数据
  composables/
    usePagedList.js        分页列表：PC 端按页码翻页，手机端上滑追加
    useMediaQuery.js       断点判断（< 768px 为手机）
  components/              号码球、倒计时、分页、上滑加载、播放器、视频卡片等
  views/HomeView.vue       首页
  views/VideoView.vue      开奖视频页（/video?period=2026282）
  views/TrendView.vue      走势图页（/trend）
  components/trend/        走势图图表：TrendSection（一组统计）、TrendBars（柱状图）、TrendDonut（环形图）、TrendHBars（横向条形）
tests/                     node:test 单元测试
```

## 规则说明

- **开奖时间**：每天 21:32（UTC+8），由后端配置 `app.lottery.draw-time` 决定，前端 `config/lottery.js` 的 `drawTime` 只用于显示和 mock，修改时两边保持一致。期号就是开奖日期 `yyyyMMdd`，例如 2026-10-11 对应 `20261011`，与后端 `app_draw.issue_no` 一致。
- **开奖与公布**：开奖由后台人工执行。某期要到开奖时刻后才对外可见，后台提前开奖也不会提前显示。
- **生肖**：`config/lottery.js` 中的 `zodiacYear` 年生肖对应 01 号，号码每加 1，生肖往前退一位。例如 2026 马年：01 马、02 蛇、03 龙……12 羊、13 马。到了新的生肖年，只需修改这一个配置。
- **波色**：标准六合彩红波、蓝波、绿波对照表，见 `utils/lottery.js`。
- **倒计时归零**：首页显示“开奖中”，每 5 秒请求一次最新一期，直到后台开奖、拿到新一期为止。拿到后 7 个号码每秒揭晓一个，揭晓完自动刷新历史列表。打开页面时已过开奖时刻但后台还没开奖，也会直接进入“开奖中”。
- **分页**：宽度 ≥ 768px 时用页码分页；手机端用上滑加载（IntersectionObserver）。
- **播放器**：mp4 直接播放；m3u8 在 Safari 上原生播放，其他浏览器按需加载 hls.js。从“回放”按钮或列表进入时会自动播放，如果浏览器拦截有声自动播放，会改为静音播放。

## 接口

接口由后端 luhe-app 提供，公开、只读、无需登录，只返回期号、号码和开奖时间。

| 接口 | 返回 |
| --- | --- |
| `GET /app/lottery/draw/latest` | `data = { current: Draw \| null, next: { period, drawAt } }` |
| `GET /app/lottery/draw/list?pageNum&pageSize&issueNo` | `{ rows: Draw[], total }`，期号倒序 |
| `GET /app/lottery/draw/{issueNo}` | `data = Draw \| null`（未开奖或未公布时为 null） |
| `GET /app/lottery/trend?type=special\|normal&periods=10\|20\|30\|50\|100` | `data = { periods, fromIssue, toIssue, hits, numbers, waves, tails, segments, zodiacs }`，每项 `{ key, count, miss }`，`miss` 仅特码有 |

```js
Draw = { period: '20261011', drawAt: '2026-10-11T21:32:00+08:00', numbers: [6 个正码，升序], special: 特码 }
```

开奖视频列表和视频页使用同一组接口：视频页的“开奖日期”和“期号”筛选都会转换成 `issueNo` 查询。播放地址暂时由 `src/api/videoSource.js` 补上测试视频。后端以后在 Draw 里返回 `src`、`type`（`mp4` / `hls`）、`duration`、`cover` 字段时，去掉 `http.js` 里对 `withDemoVideo` 的调用即可。

## 演示视频源

后端还没有视频数据，每期开奖暂时配一个公开测试视频：奇数期用 Mux 的 HLS 测试流，偶数期用 MDN 的 CC0 示例 mp4。视频时长是按期号生成的演示数字。
