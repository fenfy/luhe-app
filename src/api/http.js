/**
 * 真实接口：luhe 后端 C端服务（luhe-app，:8061）的公开开奖接口。
 * RuoYi 约定：AjaxResult = { code, msg, data }；TableDataInfo = { code, msg, rows, total }。
 * 开发时 /api 由 Vite 代理到后端（见 vite.config.js），生产环境由 VITE_API_BASE 指定。
 */
import { withDemoVideo } from './videoSource.js'

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
 * date（YYYY-MM-DD）与 period（yyyyMMdd）都对应期号；两者都填但不是同一天时结果为空。
 */
export async function getVideoList({ page = 1, pageSize = 10, date = '', period = '' } = {}) {
  const fromDate = date ? date.replace(/-/g, '') : ''
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
