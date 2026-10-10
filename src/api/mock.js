/**
 * Mock 实现：根据当前时间实时推算开奖数据，号码由期号决定（同一期永远相同）。
 * 返回结构与真实接口一致，见 README「接口约定」。
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
} from '../utils/lottery.js'

const SAMPLE_MP4 = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

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
  const draw = drawOf(dayKey)
  const r = rng(Number(draw.period) * 31)
  const hls = Number(draw.period) % 2 === 1
  return {
    ...draw,
    duration: 125 + Math.floor(r() * 40),
    cover: null,
    src: hls ? SAMPLE_HLS : SAMPLE_MP4,
    type: hls ? 'hls' : 'mp4',
  }
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
