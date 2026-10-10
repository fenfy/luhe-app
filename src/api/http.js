/**
 * 真实接口实现（对接 luhe 后端 / RuoYi）。
 * RuoYi 约定：AjaxResult = { code, msg, data }；TableDataInfo = { code, msg, rows, total }。
 * 字段如与后端不一致，只需改这个文件里的映射。
 */
const BASE = import.meta.env.VITE_API_BASE || '/api'

async function get(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  ).toString()
  const res = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`)
  if (!res.ok) throw new Error(`请求失败：${res.status}`)
  const body = await res.json()
  if (body.code !== undefined && body.code !== 200) throw new Error(body.msg || '接口返回错误')
  return body
}

export async function getLatestDraw() {
  const body = await get('/lottery/draw/latest')
  return body.data
}

export async function getDrawHistory({ page = 1, pageSize = 10 } = {}) {
  const body = await get('/lottery/draw/list', { pageNum: page, pageSize })
  return { total: body.total, list: body.rows }
}

export async function getVideoList({ page = 1, pageSize = 9, date = '', period = '' } = {}) {
  const body = await get('/lottery/video/list', { pageNum: page, pageSize, date, period })
  return { total: body.total, list: body.rows }
}

export async function getVideoDetail(period) {
  const body = await get(`/lottery/video/${encodeURIComponent(period)}`)
  return body.data ?? null
}
