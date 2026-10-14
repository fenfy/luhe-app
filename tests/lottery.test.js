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
  dateOfPeriod,
  normalizePeriod,
  dayKeyOfDate,
  splitDuration,
  formatClock,
  enrichDraw,
} from '../src/utils/lottery.js'
import { getLatestDraw, getDrawHistory, getVideoList, getVideoDetail, mockNumbers } from '../src/api/mock.js'
import { withDemoVideo } from '../src/api/videoSource.js'

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

test('期号：年份+当年第几天（与后端一致）', () => {
  const key = Date.UTC(2026, 9, 9)
  assert.equal(periodOf(key), '2026282')
  assert.equal(dayKeyOfPeriod('2026282'), key)
  assert.equal(dateOfPeriod('2026285'), '2026-10-12')
  assert.equal(periodOf(Date.UTC(2026, 0, 1)), '2026001')
  assert.equal(shiftPeriod('2026001', -1), '2025365')
  assert.ok(isValidPeriod('2026282'))
  assert.ok(isValidPeriod('2024366'))
  assert.ok(!isValidPeriod('2026366'))
  assert.ok(!isValidPeriod('2026000'))
  assert.ok(!isValidPeriod('20261012'))
  assert.equal(normalizePeriod('2026285'), '2026285')
  assert.equal(normalizePeriod('20261012'), '2026285')
  assert.equal(normalizePeriod('2026-10-12'), '2026285')
  assert.equal(normalizePeriod('20250229'), null)
  assert.equal(normalizePeriod('abc'), null)
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

test('测试视频：奇数期 HLS、偶数期 mp4，保留开奖字段', () => {
  const even = withDemoVideo({ period: '2026284', numbers: [1, 2, 3, 4, 5, 6], special: 7 })
  const odd = withDemoVideo({ period: '2026285', numbers: [1, 2, 3, 4, 5, 6], special: 7 })
  assert.equal(odd.type, 'hls')
  assert.equal(even.type, 'mp4')
  assert.equal(odd.special, 7)
  assert.ok(odd.duration >= 125 && odd.duration < 165)
})

test('真实接口：请求路径、参数与返回映射', async () => {
  const { getLatestDraw: latestApi, getDrawHistory: historyApi, getVideoList: videoApi, getVideoDetail: detailApi } =
    await import('../src/api/http.js')
  const calls = []
  const draw = { period: '2026284', drawAt: '2026-10-11T21:32:00+08:00', numbers: [3, 15, 22, 31, 40, 47], special: 9 }
  globalThis.fetch = async (url) => {
    calls.push(url)
    const body = url.includes('/latest')
      ? { code: 200, data: { current: draw, next: { period: '2026285', drawAt: '2026-10-12T21:32:00+08:00' } } }
      : url.includes('/list')
        ? { code: 200, rows: [draw], total: 1 }
        : url.endsWith('/2026286')
          ? { code: 200, data: null }
          : url.endsWith('/bad')
            ? { code: 500, msg: '期号格式应为 年份+3位天数，如 2026285' }
            : { code: 200, data: draw }
    return { ok: true, url, headers: new Headers({ 'content-type': 'application/json' }), json: async () => body }
  }

  assert.equal((await latestApi()).next.period, '2026285')
  const h = await historyApi({ page: 2, pageSize: 10 })
  assert.deepEqual(h, { total: 1, list: [draw] })
  assert.equal(calls.at(-1), '/api/app/lottery/draw/list?pageNum=2&pageSize=10')

  const byDate = await videoApi({ page: 1, pageSize: 10, date: '2026-10-11' })
  assert.equal(calls.at(-1), '/api/app/lottery/draw/list?pageNum=1&pageSize=10&issueNo=2026284')
  assert.equal(byDate.list[0].type, 'mp4')

  const n = calls.length
  assert.deepEqual(await videoApi({ date: '2026-10-11', period: '2026283' }), { total: 0, list: [] })
  assert.equal(calls.length, n, '日期与期号不一致时不发请求')

  assert.equal((await detailApi('2026284')).special, 9)
  assert.equal(await detailApi('2026286'), null)
  await assert.rejects(() => detailApi('bad'), /期号格式应为/)
})

test('真实接口：返回 HTML（/api 未转发）时给出明确错误', async () => {
  const { getLatestDraw: latestApi } = await import('../src/api/http.js')
  const origError = console.error
  console.error = () => {}
  globalThis.fetch = async (url) => ({
    ok: true,
    url,
    headers: new Headers({ 'content-type': 'text/html' }),
    json: async () => JSON.parse('<!doctype html>'),
  })
  await assert.rejects(() => latestApi(), /接口地址未正确配置/)
  console.error = origError
})

test('mock getTrend: 特码统计结构与遗漏', async () => {
  const { getTrend } = await import('../src/api/mock.js')
  const now = Date.UTC(2026, 9, 12, 14, 0) // 2026-10-12 22:00 北京时间，已开奖
  const t = await getTrend({ type: 'special', periods: 30, now })
  assert.equal(t.periods, 30)
  assert.equal(t.hits, 30)
  assert.equal(t.toIssue, '2026285')
  assert.equal(t.numbers.length, 49)
  assert.equal(t.zodiacs.length, 12)
  for (const g of ['numbers', 'waves', 'tails', 'segments', 'zodiacs']) {
    assert.equal(t[g].reduce((s, i) => s + i.count, 0), 30, g)
  }
  assert.ok(t.numbers.some((i) => i.miss === 0))
  const n = await getTrend({ type: 'normal', periods: 10, now })
  assert.equal(n.hits, 60)
  assert.equal(n.numbers.reduce((s, i) => s + i.count, 0), 60)
  assert.ok(n.numbers.every((i) => i.miss === null))
})
