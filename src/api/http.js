/**
 * 真实接口：luhe 后端 C端服务（luhe-app，:8061）的公开开奖接口。
 * RuoYi 约定：AjaxResult = { code, msg, data }；TableDataInfo = { code, msg, rows, total }。
 * 开发时 /api 由 Vite 代理到后端（见 vite.config.js），生产环境由 VITE_API_BASE 指定。
 */
import { withDemoVideo } from './videoSource.js'
import { normalizePeriod } from '../utils/lottery.js'

const BASE = import.meta.env?.VITE_API_BASE || '/api'

async function get(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  ).toString()
  let res
  try {
    res = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new Error('网络异常，请检查网络后重试')
  }
  if (!res.ok) throw new Error(`服务暂时不可用（${res.status}）`)
  // 返回的不是 JSON（常见是 index.html）：说明 /api 没有转发到后端，见 README「部署说明」
  if (!(res.headers.get('content-type') || '').includes('json')) {
    console.error(`[api] ${res.url} 返回的不是 JSON，请检查 /api 是否转发到 luhe-app`)
    throw new Error('接口地址未正确配置，请联系管理员')
  }
  const body = await res.json()
  if (body.code !== undefined && body.code !== 200) throw new Error(body.msg || '接口返回错误')
  return body
}

/** GET /app/lottery/draw/latest → { current: Draw | null, next: { period, drawAt } } */
export async function getLatestDraw() {
  const body = await get('/app/lottery/draw/latest')
  return body.data
}

/** GET /app/lottery/draw/list → { total, list: Draw[] }（期号倒序） */
export async function getDrawHistory({ page = 1, pageSize = 10 } = {}) {
  const body = await get('/app/lottery/draw/list', { pageNum: page, pageSize })
  return { total: body.total, list: body.rows }
}

/**
 * 开奖视频列表：按期号倒序的已开奖期 + 测试视频
 * date（YYYY-MM-DD）换算成期号；与 period 都填但不是同一期时结果为空。
 */
export async function getVideoList({ page = 1, pageSize = 10, date = '', period = '' } = {}) {
  const fromDate = date ? normalizePeriod(date) : ''
  if (period && fromDate && period !== fromDate) return { total: 0, list: [] }
  const issueNo = period || fromDate
  const body = await get('/app/lottery/draw/list', { pageNum: page, pageSize, issueNo })
  return { total: body.total, list: body.rows.map(withDemoVideo) }
}

/** 单期视频；未开奖或未公布返回 null */
export async function getVideoDetail(period) {
  const body = await get(`/app/lottery/draw/${encodeURIComponent(period)}`)
  return body.data ? withDemoVideo(body.data) : null
}

/**
 * GET /app/lottery/trend → 走势统计
 * { type, periods, fromIssue, toIssue, hits, numbers, waves, tails, segments, zodiacs }
 * 各项为 { key, count, miss }；miss 为当前遗漏期数，只有特码组有（正码组为 null）
 */
export async function getTrend({ type = 'special', periods = 30 } = {}) {
  const body = await get('/app/lottery/trend', { type, periods })
  return body.data
}
