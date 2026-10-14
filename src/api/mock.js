/**
 * Mock 实现（离线开发用，VITE_USE_MOCK=true 时启用）：根据当前时间推算开奖数据，
 * 号码由期号决定（同一期永远相同）。返回结构与真实接口一致，见 README「接口约定」。
 */
import { LOTTERY } from '../config/lottery.js'
import {
  DAY,
  dayKeyOfDate,
  dayKeyOfPeriod,
  drawAtOf,
  isValidPeriod,
  latestDrawDayKey,
  periodOf,
  getWave,
  getZodiac,
  pad2,
  ZODIAC_ORDER,
} from '../utils/lottery.js'
import { withDemoVideo } from './videoSource.js'

const startKey = () => dayKeyOfDate(LOTTERY.mockStartDate)

function rng(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function mockNumbers(period) {
  const r = rng(Number(period))
  const out = []
  while (out.length < 7) {
    const n = 1 + Math.floor(r() * 49)
    if (!out.includes(n)) out.push(n)
  }
  // 与后端一致：正码保持开出顺序
  return { numbers: out.slice(0, 6), special: out[6] }
}

function drawOf(dayKey) {
  const period = periodOf(dayKey)
  return {
    period,
    drawAt: new Date(drawAtOf(dayKey)).toISOString(),
    ...mockNumbers(period),
  }
}

function videoOf(dayKey) {
  return withDemoVideo(drawOf(dayKey))
}

/** 是否已开奖且在 mock 数据范围内 */
function isDrawn(dayKey, now) {
  return dayKey >= startKey() && dayKey <= latestDrawDayKey(now)
}

function delay(data, ms = 200) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

/** 按日期倒序取一页（dayKey 列表） */
function pageKeys(page, pageSize, now) {
  const latest = latestDrawDayKey(now)
  const total = Math.round((latest - startKey()) / DAY) + 1
  const keys = []
  for (let i = 0; i < pageSize; i++) {
    const idx = (page - 1) * pageSize + i
    if (idx >= total) break
    keys.push(latest - idx * DAY)
  }
  return { total, keys }
}

export function getLatestDraw({ now = Date.now() } = {}) {
  const latest = latestDrawDayKey(now)
  return delay({
    current: drawOf(latest),
    next: { period: periodOf(latest + DAY), drawAt: new Date(drawAtOf(latest + DAY)).toISOString() },
  })
}

/** 有筛选条件时最多命中一期 */
function filteredKey({ date = '', period = '' }) {
  let key = null
  if (period) key = isValidPeriod(period) ? dayKeyOfPeriod(period) : null
  if (date) {
    const dk = dayKeyOfDate(date)
    key = period ? (key === dk ? key : null) : dk
  }
  return key
}

export function getDrawHistory({ page = 1, pageSize = 10, date = '', period = '', now = Date.now() } = {}) {
  if (date || period) {
    const key = filteredKey({ date, period })
    const list = key !== null && isDrawn(key, now) && page === 1 ? [drawOf(key)] : []
    return delay({ total: list.length, list })
  }
  const { total, keys } = pageKeys(page, pageSize, now)
  return delay({ total, list: keys.map(drawOf) })
}

export function getVideoList({ page = 1, pageSize = 9, date = '', period = '', now = Date.now() } = {}) {
  if (date || period) {
    const key = filteredKey({ date, period })
    const list = key !== null && isDrawn(key, now) && page === 1 ? [videoOf(key)] : []
    return delay({ total: list.length, list })
  }
  const { total, keys } = pageKeys(page, pageSize, now)
  return delay({ total, list: keys.map(videoOf) })
}

export function getVideoDetail(period, { now = Date.now() } = {}) {
  if (!isValidPeriod(period)) return delay(null)
  const key = dayKeyOfPeriod(period)
  return delay(isDrawn(key, now) ? videoOf(key) : null)
}

const WAVE_NAME = { red: '红波', blue: '蓝波', green: '绿波' }
const SEGMENTS = ['01-10', '11-20', '21-30', '31-40', '41-49']

/** 与后端 LotteryTrend 相同的统计口径 */
export function getTrend({ type = 'special', periods = 30, now = Date.now() } = {}) {
  const special = type === 'special'
  const latest = latestDrawDayKey(now)
  const history = []
  for (let i = 0; i < 100; i++) {
    const key = latest - i * DAY
    if (key < startKey()) break
    history.push(drawOf(key))
  }
  const windowDraws = history.slice(0, periods)
  const picked = (d) => (special ? [d.special] : d.numbers)
  const classify = {
    numbers: (n) => pad2(n),
    waves: (n) => WAVE_NAME[getWave(n)],
    tails: (n) => String(n % 10),
    segments: (n) => SEGMENTS[Math.floor((n - 1) / 10)],
    zodiacs: (n) => getZodiac(n),
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
    windowDraws.forEach((d) => picked(d).forEach((n) => counts[fn(n)]++))
    const miss = {}
    if (special) history.forEach((d, i) => (miss[fn(d.special)] ??= i))
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
      createTime: formatDateTime(now - i * 6 * 3600 * 1000),
    })
  }
  return delay({ total, list })
}

function formatDateTime(ms) {
  const d = new Date(ms + LOTTERY.utcOffsetHours * 3600 * 1000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`
}
