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

/** 公历年 → 当年春节（月, 日）；与后端 LotteryZodiac 一致，表外年份按 2 月 4 日近似 */
const SPRING_FESTIVAL = {
  2024: [2, 10],
  2025: [1, 29],
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
  2029: [2, 13],
  2030: [2, 3],
}

/** 开奖地某天（dayKey）所在的农历年：春节前属于上一年 */
export function lunarYearOf(dayKey) {
  const d = new Date(dayKey)
  const year = d.getUTCFullYear()
  const [m, day] = SPRING_FESTIVAL[year] || [2, 4]
  return dayKey < Date.UTC(year, m - 1, day) ? year - 1 : year
}

/** 某个农历年的生肖：2026 → 马 */
export function zodiacOfYear(year) {
  return ZODIAC_ORDER[(((year - 4) % 12) + 12) % 12]
}

/**
 * 号码生肖：01 为当年生肖，号码每 +1 生肖倒退一位，12 个一轮。
 * 例：2026 马年 → 01 马、02 蛇、03 龙 … 12 羊、13 马。
 * year 为农历年，默认今天所在的农历年。
 */
export function getZodiac(n, year = lunarYearOf(localDayKey())) {
  const yearIdx = (((year - 4) % 12) + 12) % 12
  const idx = (((yearIdx - ((n - 1) % 12)) % 12) + 12) % 12
  return ZODIAC_ORDER[idx]
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 把号码转成展示用对象；year 为开奖日所在的农历年 */
export function toBall(n, year) {
  return { value: n, num: pad2(n), wave: getWave(n), zodiac: getZodiac(n, year) }
}

/**
 * 把接口返回的开奖记录补充展示字段。
 * 日期、时间取自 drawAt（香港期号不是按天编的）；生肖按开奖日所在农历年。
 */
export function enrichDraw(draw) {
  if (!draw) return null
  const at = Date.parse(draw.drawAt)
  const dayKey = Number.isNaN(at) ? dayKeyOfPeriod(draw.period) : localDayKey(at)
  const year = lunarYearOf(dayKey)
  return {
    ...draw,
    balls: draw.numbers.map((n) => toBall(n, year)),
    specialBall: toBall(draw.special, year),
    zodiacYear: year,
    zodiacName: zodiacOfYear(year),
    date: formatDate(dayKey),
    md: formatMonthDay(dayKey),
    week: weekdayOf(dayKey),
    time: Number.isNaN(at) ? LOTTERY.drawTime : localClock(at),
  }
}

/** 时间戳 → 开奖地 'HH:mm' */
export function localClock(ms) {
  const d = new Date(ms + LOTTERY.utcOffsetHours * 3600000)
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

/** 时间戳 → 开奖地 'YYYY-MM-DD HH:mm' */
export function formatDateTime(ms) {
  return `${formatDate(localDayKey(ms))} ${localClock(ms)}`
}

/* ---------------- 时间与期号 ----------------
 * dayKey：开奖地日历日期对应的 UTC 0 点时间戳，用来代表“某一天”。
 * 期号：年份 + 当年第几天（3 位），如 2026-10-12 → 2026285（与后端一致）。
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

/** dayKey → 期号：年份 + 当年第几天（3 位），如 2026-10-12 → 2026285（与后端 LotteryIssue 一致） */
export function periodOf(dayKey) {
  const year = new Date(dayKey).getUTCFullYear()
  const seq = Math.round((dayKey - Date.UTC(year, 0, 1)) / DAY) + 1
  return `${year}${String(seq).padStart(3, '0')}`
}

/** 期号 → dayKey */
export function dayKeyOfPeriod(period) {
  const p = String(period)
  return Date.UTC(Number(p.slice(0, 4)), 0, Number(p.slice(4)))
}

/** 合法期号：7 位数字，天数在当年范围内 */
export function isValidPeriod(period) {
  const p = String(period ?? '')
  return /^\d{7}$/.test(p) && Number(p.slice(4)) >= 1 && periodOf(dayKeyOfPeriod(p)) === p
}

/** 期号 → 'YYYY-MM-DD' */
export function dateOfPeriod(period) {
  return formatDate(dayKeyOfPeriod(period))
}

/** 用户输入转期号：接受期号（2026285）或日期（20261012 / 2026-10-12），无效返回 null */
export function normalizePeriod(input) {
  const s = String(input ?? '').trim()
  if (isValidPeriod(s)) return s
  const m = /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(s)
  if (!m) return null
  const key = dayKeyOfDate(`${m[1]}-${m[2]}-${m[3]}`)
  return key === null ? null : periodOf(key)
}

export function shiftPeriod(period, days) {
  return periodOf(dayKeyOfPeriod(period) + days * DAY)
}

/* ---------------- 按彩种区分的期号规则 ----------------
 * 云顶、新澳门：年份 + 当年第几天（可输入日期换算）；香港：年份 + 3 位当年序号（与日期无关）。
 */

/** 用户输入转期号；无效返回 null */
export function normalizeIssue(input, lottery = 'yd') {
  if (lottery !== 'hk') return normalizePeriod(input)
  const s = String(input ?? '').trim()
  return /^\d{7}$/.test(s) && Number(s.slice(4)) >= 1 ? s : null
}

/** 期号格式提示 */
export function issueHint(lottery = 'yd') {
  return lottery === 'hk' ? '期号为 年份+3位序号，如 2026112' : '期号为 年份+3位天数，如 2026285'
}

/** 相邻一期；香港跨年时无法推算，返回 null */
export function shiftIssue(period, delta, lottery = 'yd') {
  if (lottery !== 'hk') return shiftPeriod(period, delta)
  const seq = Number(String(period).slice(4)) + delta
  return seq >= 1 && seq <= 999 ? `${String(period).slice(0, 4)}${String(seq).padStart(3, '0')}` : null
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
