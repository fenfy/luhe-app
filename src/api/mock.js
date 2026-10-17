/**
 * Mock 实现（离线开发用，VITE_USE_MOCK=true 时启用）：按当前时间推算三个彩种的开奖，
 * 号码由彩种 + 期号决定（同一期永远相同）。返回结构与真实接口一致，见 README「接口约定」。
 * - xam 云顶：每天 21:32；am 澳门：每天 22:32；期号为 年份 + 当年第几天
 * - hk 香港：每周二、四、六 21:30；期号为 年份 + 当年序号
 */
import { LOTTERY, GAMES } from '../config/lottery.js'
import {
  DAY,
  dayKeyOfDate,
  localDayKey,
  periodOf,
  getWave,
  getZodiac,
  lunarYearOf,
  normalizeIssue,
  pad2,
  ZODIAC_ORDER,
} from '../utils/lottery.js'
import { withDemoVideo } from './videoSource.js'

const startKey = () => dayKeyOfDate(LOTTERY.mockStartDate)
const OFFSET = LOTTERY.utcOffsetHours * 3600000

function rng(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED = { xam: 0, am: 7777, hk: 4242 }

export function mockNumbers(period, lottery = 'xam') {
  const r = rng(Number(period) + (SEED[lottery] || 0))
  const out = []
  while (out.length < 7) {
    const n = 1 + Math.floor(r() * 49)
    if (!out.includes(n)) out.push(n)
  }
  // 与后端一致：正码保持开出顺序
  return { numbers: out.slice(0, 6), special: out[6] }
}

function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** 某彩种的开奖排期（全部，含未来最近一期），时间正序：[{ period, at }] */
const scheduleCache = new Map()
function schedule(lottery, now) {
  const endKey = localDayKey(now) + 7 * DAY
  const cacheKey = `${lottery}:${endKey}`
  if (scheduleCache.has(cacheKey)) return scheduleCache.get(cacheKey)
  const list = []
  if (lottery === 'hk') {
    const mins = minutesOf('21:30')
    let year = null
    let seq = 0
    for (let key = startKey(); key <= endKey; key += DAY) {
      if (![2, 4, 6].includes(new Date(key).getUTCDay())) continue
      const y = new Date(key).getUTCFullYear()
      if (y !== year) {
        year = y
        seq = 0
      }
      seq += 1
      list.push({ period: `${y}${String(seq).padStart(3, '0')}`, at: key + mins * 60000 - OFFSET })
    }
  } else {
    const game = GAMES.find((g) => g.code === lottery) || GAMES[0]
    const mins = minutesOf(lottery === 'xam' ? LOTTERY.drawTime : game.drawTime)
    for (let key = startKey(); key <= endKey; key += DAY) {
      list.push({ period: periodOf(key), at: key + mins * 60000 - OFFSET })
    }
  }
  scheduleCache.clear()
  scheduleCache.set(cacheKey, list)
  return list
}

function drawOf(lottery, item) {
  return { period: item.period, drawAt: new Date(item.at).toISOString(), ...mockNumbers(item.period, lottery) }
}

function videoOf(lottery, item) {
  const d = drawOf(lottery, item)
  // 云顶用测试视频；澳门、香港暂无视频来源
  return lottery === 'xam' ? withDemoVideo(d) : { ...d, videoUrl: null, src: null, type: null, duration: null, cover: null }
}

/** 已开奖的期，最新在前 */
function published(lottery, now) {
  return schedule(lottery, now).filter((d) => d.at <= now).reverse()
}

function delay(data, ms = 200) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

/** 按期号 / 开奖日期筛选并分页 */
function query(lottery, { page = 1, pageSize = 10, date = '', period = '', now }) {
  let list = published(lottery, now)
  if (period) {
    const p = normalizeIssue(period, lottery)
    list = list.filter((d) => d.period === p)
  }
  if (date) {
    const key = dayKeyOfDate(date)
    list = list.filter((d) => localDayKey(d.at) === key)
  }
  return { total: list.length, items: list.slice((page - 1) * pageSize, page * pageSize) }
}

export function getGames() {
  return delay(GAMES.map(({ code, name, drawTime, schedule: s }) => ({ code, name, drawTime, schedule: s })))
}

export function getLatestDraw({ lottery = 'xam', now = Date.now() } = {}) {
  const all = schedule(lottery, now)
  const done = all.filter((d) => d.at <= now)
  const current = done.at(-1)
  const next = all.find((d) => d.at > now)
  return delay({
    current: current ? drawOf(lottery, current) : null,
    next: next ? { period: next.period, drawAt: new Date(next.at).toISOString() } : null,
  })
}

export function getDrawHistory({ lottery = 'xam', now = Date.now(), ...params } = {}) {
  const { total, items } = query(lottery, { ...params, now })
  return delay({ total, list: items.map((d) => drawOf(lottery, d)) })
}

export function getVideoList({ lottery = 'xam', now = Date.now(), ...params } = {}) {
  const { total, items } = query(lottery, { ...params, now })
  return delay({ total, list: items.map((d) => videoOf(lottery, d)) })
}

export function getVideoDetail(period, { lottery = 'xam', now = Date.now() } = {}) {
  const p = normalizeIssue(period, lottery)
  const item = p && published(lottery, now).find((d) => d.period === p)
  return delay(item ? videoOf(lottery, item) : null)
}

const WAVE_NAME = { red: '红波', blue: '蓝波', green: '绿波' }
const SEGMENTS = ['01-10', '11-20', '21-30', '31-40', '41-49']

/** 与后端 LotteryTrend 相同的统计口径；生肖按每期开奖日所在农历年 */
export function getTrend({ lottery = 'xam', type = 'special', periods = 30, now = Date.now() } = {}) {
  const special = type === 'special'
  const history = published(lottery, now)
    .slice(0, 100)
    .map((d) => ({ ...drawOf(lottery, d), year: lunarYearOf(localDayKey(d.at)) }))
  const windowDraws = history.slice(0, periods)
  const picked = (d) => (special ? [d.special] : d.numbers)
  const classify = {
    numbers: (n) => pad2(n),
    waves: (n) => WAVE_NAME[getWave(n)],
    tails: (n) => String(n % 10),
    segments: (n) => SEGMENTS[Math.floor((n - 1) / 10)],
    zodiacs: (n, d) => getZodiac(n, d.year),
  }
  const keys = {
    numbers: Array.from({ length: 49 }, (_, i) => pad2(i + 1)),
    waves: ['红波', '蓝波', '绿波'],
    tails: Array.from({ length: 10 }, (_, i) => String(i)),
    segments: SEGMENTS,
    zodiacs: ZODIAC_ORDER,
  }
  const result = {
    type,
    periods: windowDraws.length,
    fromIssue: windowDraws.at(-1)?.period ?? null,
    toIssue: windowDraws[0]?.period ?? null,
    hits: windowDraws.reduce((s, d) => s + picked(d).length, 0),
  }
  for (const [group, fn] of Object.entries(classify)) {
    const counts = Object.fromEntries(keys[group].map((k) => [k, 0]))
    windowDraws.forEach((d) => picked(d).forEach((n) => counts[fn(n, d)]++))
    const miss = {}
    if (special) history.forEach((d, i) => (miss[fn(d.special, d)] ??= i))
    result[group] = keys[group].map((k) => ({ key: k, count: counts[k], miss: special ? (miss[k] ?? null) : null }))
  }
  return delay(result)
}

/* ---------- 图库 ---------- */

/** 与后台字典 app_gallery_type 初始数据一致；真实类别以后台字典为准 */
const MOCK_GALLERY_TYPES = [
  { value: '1', label: '跑狗系列', count: 46 },
  { value: '2', label: '书籍系列', count: 23 },
  { value: '3', label: '全网系列', count: 31 },
  { value: '4', label: '挂牌系列', count: 0 },
]
const RATIOS = [[3, 4], [2, 3], [1, 1], [4, 3], [3, 5], [9, 16], [4, 5]]
const TINTS = ['#e8d3a6', '#c9d6ea', '#d7e6d2', '#ecd0cf', '#dcd3ea', '#d2e5e8']

/** 生成占位图（SVG data URI），不同宽高比，用于离线查看瀑布流效果 */
function placeholderImage(type, id) {
  const r = rng(Number(type) * 1000 + id)
  const [w, h] = RATIOS[Math.floor(r() * RATIOS.length)].map((n) => n * 120)
  const bg = TINTS[Math.floor(r() * TINTS.length)]
  const label = MOCK_GALLERY_TYPES.find((t) => t.value === type)?.label || '图库'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<rect width="100%" height="100%" fill="${bg}"/>`
    + `<text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(w / 9)}" fill="#5d6577">${label} #${id}</text>`
    + `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function getGalleryTypes() {
  return delay(MOCK_GALLERY_TYPES.map((t) => ({ ...t })))
}

export function getGalleryImages({ type = '', page = 1, pageSize = 20, now = Date.now() } = {}) {
  const t = MOCK_GALLERY_TYPES.find((x) => x.value === type)
  const total = t ? t.count : 0
  const list = []
  for (let i = (page - 1) * pageSize; i < Math.min(total, page * pageSize); i++) {
    const id = total - i
    list.push({
      id: Number(type) * 10000 + id,
      type,
      src: placeholderImage(type, id),
      createTime: formatGalleryTime(now - i * 6 * 3600 * 1000),
    })
  }
  return delay({ total, list })
}

function formatGalleryTime(ms) {
  const d = new Date(ms + LOTTERY.utcOffsetHours * 3600 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`
}
