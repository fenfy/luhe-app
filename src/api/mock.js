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

export function getDrawHistory({ page = 1, pageSize = 10, now = Date.now() } = {}) {
  const { total, keys } = pageKeys(page, pageSize, now)
  return delay({ total, list: keys.map(drawOf) })
}

export function getVideoList({ page = 1, pageSize = 9, date = '', period = '', now = Date.now() } = {}) {
  // 有筛选条件时最多命中一期
  if (date || period) {
    let key = null
    if (period) key = isValidPeriod(period) ? dayKeyOfPeriod(period) : null
    if (date) {
      const dk = dayKeyOfDate(date)
      key = period ? (key === dk ? key : null) : dk
    }
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
