import { LOTTERY } from '../config/lottery.js'

const DAY = 86400000

/* ---------------- 号码：波色、生肖 ---------------- */

const RED = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46]
const BLUE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48]
// 其余为绿波：5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49

/** 生肖标准顺序（鼠年为 0） */
export const ZODIAC_ORDER = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

/** 号码波色：'red' | 'blue' | 'green' */
export function getWave(n) {
  if (RED.includes(n)) return 'red'
  if (BLUE.includes(n)) return 'blue'
  return 'green'
}

/**
 * 号码生肖：01 为当年生肖，号码每 +1 生肖倒退一位，12 个一轮。
 * 例：2026 马年 → 01 马、02 蛇、03 龙 … 12 羊、13 马。
 */
export function getZodiac(n, year = LOTTERY.zodiacYear) {
  const yearIdx = (((year - 4) % 12) + 12) % 12
  const idx = (((yearIdx - ((n - 1) % 12)) % 12) + 12) % 12
  return ZODIAC_ORDER[idx]
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 把号码转成展示用对象 */
export function toBall(n) {
  return { value: n, num: pad2(n), wave: getWave(n), zodiac: getZodiac(n) }
}

/** 把接口返回的开奖记录补充展示字段 */
export function enrichDraw(draw) {
  if (!draw) return null
  const dayKey = dayKeyOfPeriod(draw.period)
  return {
    ...draw,
    balls: draw.numbers.map(toBall),
    specialBall: toBall(draw.special),
    date: formatDate(dayKey),
    md: formatMonthDay(dayKey),
    week: weekdayOf(dayKey),
    time: LOTTERY.drawTime,
  }
}

/* ---------------- 时间与期号 ----------------
 * dayKey：开奖地日历日期对应的 UTC 0 点时间戳，用来代表“某一天”。
 * 期号：开奖日期 yyyyMMdd，如 2026-10-11 → 20261011（与后端一致）。
 */

function drawMinutes() {
  const [h, m] = LOTTERY.drawTime.split(':').map(Number)
  return h * 60 + m
}

/** 某天的开奖时刻（真实时间戳） */
export function drawAtOf(dayKey) {
  return dayKey + drawMinutes() * 60000 - LOTTERY.utcOffsetHours * 3600000
}

/** 开奖地当天的 dayKey */
export function localDayKey(now = Date.now()) {
  const shifted = now + LOTTERY.utcOffsetHours * 3600000
  return Math.floor(shifted / DAY) * DAY
}

/** 最近一次已开奖的 dayKey */
export function latestDrawDayKey(now = Date.now()) {
  const today = localDayKey(now)
  return now >= drawAtOf(today) ? today : today - DAY
}

/** 下一次开奖的时间戳 */
export function nextDrawAt(now = Date.now()) {
  return drawAtOf(latestDrawDayKey(now) + DAY)
}

/** dayKey → 期号 yyyyMMdd（与后端 app_draw.issue_no 一致） */
export function periodOf(dayKey) {
  return formatDate(dayKey).replace(/-/g, '')
}

/** 期号 yyyyMMdd → dayKey */
export function dayKeyOfPeriod(period) {
  const p = String(period)
  return Date.UTC(Number(p.slice(0, 4)), Number(p.slice(4, 6)) - 1, Number(p.slice(6, 8)))
}

/** 合法期号：8 位数字且是有效日期 */
export function isValidPeriod(period) {
  const p = String(period ?? '')
  return /^\d{8}$/.test(p) && periodOf(dayKeyOfPeriod(p)) === p
}

/** 期号 → 'YYYY-MM-DD' */
export function dateOfPeriod(period) {
  return formatDate(dayKeyOfPeriod(period))
}

export function shiftPeriod(period, days) {
  return periodOf(dayKeyOfPeriod(period) + days * DAY)
}

/** 'YYYY-MM-DD' → dayKey，非法返回 null */
export function dayKeyOfDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '')
  if (!m) return null
  const key = Date.UTC(+m[1], +m[2] - 1, +m[3])
  return formatDate(key) === str ? key : null
}

export function formatDate(dayKey) {
  const d = new Date(dayKey)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function formatMonthDay(dayKey) {
  const d = new Date(dayKey)
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function weekdayOf(dayKey) {
  return WEEK[new Date(dayKey).getUTCDay()]
}

/** 毫秒 → { h, m, s }（两位字符串） */
export function splitDuration(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  return {
    h: pad2(Math.floor(sec / 3600)),
    m: pad2(Math.floor((sec % 3600) / 60)),
    s: pad2(sec % 60),
  }
}

/** 秒 → 'mm:ss' */
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0))
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}

export { DAY }
