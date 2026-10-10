import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getWave,
  getZodiac,
  periodOf,
  dayKeyOfPeriod,
  isValidPeriod,
  latestDrawDayKey,
  nextDrawAt,
  shiftPeriod,
  dayKeyOfDate,
  splitDuration,
  formatClock,
  enrichDraw,
} from '../src/utils/lottery.js'
import { getLatestDraw, getDrawHistory, getVideoList, getVideoDetail, mockNumbers } from '../src/api/mock.js'

// 2026-10-10 14:00 澳门时间 = 06:00 UTC（未到 21:32）
const BEFORE = Date.UTC(2026, 9, 10, 6, 0)
// 2026-10-10 21:32:00 澳门时间 = 13:32 UTC（刚开奖）
const AT = Date.UTC(2026, 9, 10, 13, 32)

test('波色：每种颜色的号码数量正确', () => {
  const count = { red: 0, blue: 0, green: 0 }
  for (let n = 1; n <= 49; n++) count[getWave(n)]++
  assert.deepEqual(count, { red: 17, blue: 16, green: 16 })
  assert.equal(getWave(1), 'red')
  assert.equal(getWave(3), 'blue')
  assert.equal(getWave(49), 'green')
})

test('生肖：2026 马年 01 马、02 蛇、12 羊、13 马、49 马', () => {
  assert.equal(getZodiac(1, 2026), '马')
  assert.equal(getZodiac(2, 2026), '蛇')
  assert.equal(getZodiac(12, 2026), '羊')
  assert.equal(getZodiac(13, 2026), '马')
  assert.equal(getZodiac(49, 2026), '马')
  assert.equal(getZodiac(1, 2025), '蛇')
})

test('期号：日期与期号互转', () => {
  const key = Date.UTC(2026, 9, 9)
  assert.equal(periodOf(key), '2026282')
  assert.equal(dayKeyOfPeriod('2026282'), key)
  assert.equal(periodOf(Date.UTC(2026, 0, 1)), '2026001')
  assert.equal(shiftPeriod('2026001', -1), '2025365')
  assert.ok(isValidPeriod('2026282'))
  assert.ok(!isValidPeriod('2026366'))
  assert.ok(!isValidPeriod('20262'))
  assert.ok(isValidPeriod('2024366'))
})

test('开奖时刻：21:32 前最新一期是昨天，之后是今天', () => {
  assert.equal(periodOf(latestDrawDayKey(BEFORE)), '2026282')
  assert.equal(periodOf(latestDrawDayKey(AT - 1)), '2026282')
  assert.equal(periodOf(latestDrawDayKey(AT)), '2026283')
  assert.equal(nextDrawAt(BEFORE), AT)
  assert.equal(nextDrawAt(AT), AT + 86400000)
})

test('日期解析', () => {
  assert.equal(dayKeyOfDate('2026-10-09'), Date.UTC(2026, 9, 9))
  assert.equal(dayKeyOfDate('2026-02-30'), null)
  assert.equal(dayKeyOfDate('abc'), null)
})

test('时长格式化', () => {
  assert.deepEqual(splitDuration(7 * 3600e3 + 32 * 60e3 + 5e3), { h: '07', m: '32', s: '05' })
  assert.deepEqual(splitDuration(-5), { h: '00', m: '00', s: '00' })
  assert.equal(formatClock(135), '02:15')
})

test('mock 号码：7 个不重复、1~49、同期稳定', () => {
  const a = mockNumbers('2026282')
  const all = [...a.numbers, a.special]
  assert.equal(new Set(all).size, 7)
  assert.ok(all.every((n) => n >= 1 && n <= 49))
  assert.deepEqual(mockNumbers('2026282'), a)
})

test('mock 最新一期与下一期', async () => {
  const r = await getLatestDraw({ now: BEFORE })
  assert.equal(r.current.period, '2026282')
  assert.equal(r.next.period, '2026283')
  assert.equal(new Date(r.next.drawAt).getTime(), AT)
  const after = await getLatestDraw({ now: AT })
  assert.equal(after.current.period, '2026283')
})

test('mock 历史分页倒序、跨年连续', async () => {
  const p1 = await getDrawHistory({ page: 1, pageSize: 10, now: BEFORE })
  assert.equal(p1.list.length, 10)
  assert.equal(p1.list[0].period, '2026282')
  assert.equal(p1.list[9].period, '2026273')
  assert.equal(p1.total, 365 + 282)
  const last = await getDrawHistory({ page: Math.ceil(p1.total / 10), pageSize: 10, now: BEFORE })
  assert.equal(last.list.at(-1).period, '2025001')
  const d = enrichDraw(p1.list[0])
  assert.equal(d.date, '2026-10-09')
  assert.equal(d.week, '周五')
  assert.equal(d.balls.length, 6)
})

test('mock 视频筛选与详情', async () => {
  const byPeriod = await getVideoList({ period: '2026280', now: BEFORE })
  assert.equal(byPeriod.list.length, 1)
  const byDate = await getVideoList({ date: '2026-10-07', now: BEFORE })
  assert.equal(byDate.list[0].period, '2026280')
  const both = await getVideoList({ date: '2026-10-08', period: '2026280', now: BEFORE })
  assert.equal(both.total, 0)
  const future = await getVideoList({ period: '2026283', now: BEFORE })
  assert.equal(future.total, 0)
  const v = await getVideoDetail('2026282', { now: BEFORE })
  assert.ok(['mp4', 'hls'].includes(v.type))
  assert.equal(await getVideoDetail('2026283', { now: BEFORE }), null)
  assert.equal(await getVideoDetail('bad', { now: BEFORE }), null)
})
