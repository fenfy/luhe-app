/**
 * 真实接口：luhe 后端 C端服务（luhe-app，:8061）的公开开奖接口。
 * RuoYi 约定：AjaxResult = { code, msg, data }；TableDataInfo = { code, msg, rows, total }。
 * 开发时 /api 由 Vite 代理到后端（见 vite.config.js），生产环境由 VITE_API_BASE 指定。
 */
import { withDemoVideo } from './videoSource.js'
import { normalizeIssue } from '../utils/lottery.js'

const BASE = import.meta.env?.VITE_API_BASE || '/api'
/** 上传文件（图库图片）的地址前缀：后端返回 /profile/... 相对路径，默认与页面同域（开发时由 Vite 代理） */
const FILE_BASE = import.meta.env?.VITE_FILE_BASE || ''

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

/** GET /app/lottery/games → [{ code, name, drawTime, schedule }] */
export async function getGames() {
  const body = await get('/app/lottery/games')
  return body.data || []
}

/** GET /app/lottery/draw/latest → { current: Draw | null, next: { period, drawAt } | null } */
export async function getLatestDraw({ lottery = 'xam' } = {}) {
  const body = await get('/app/lottery/draw/latest', { lottery })
  return body.data
}

/** 筛选参数：期号按彩种规则校验；日期原样交给后端（香港期号不能由日期推算） */
function listParams({ lottery = 'xam', page = 1, pageSize = 10, date = '', period = '' }) {
  return { lottery, pageNum: page, pageSize, issueNo: period ? normalizeIssue(period, lottery) || period : '', date }
}

/** GET /app/lottery/draw/list → { total, list: Draw[] }（最新在前），可按期号、开奖日期筛选 */
export async function getDrawHistory(params = {}) {
  const body = await get('/app/lottery/draw/list', listParams(params))
  return { total: body.total, list: body.rows }
}

/**
 * 开奖视频：新澳门暂用测试视频（videoSource.js）；澳门、香港使用后端的 videoUrl，没有时 src 为空
 */
function toVideo(draw, lottery) {
  if (lottery === 'xam') return withDemoVideo(draw)
  const url = draw.videoUrl || null
  return { ...draw, src: url, type: url ? (/\.m3u8(\?|$)/i.test(url) ? 'hls' : 'mp4') : null, duration: null, cover: null }
}

/** 开奖视频列表（最新在前） */
export async function getVideoList(params = {}) {
  const lottery = params.lottery || 'xam'
  const body = await get('/app/lottery/draw/list', listParams(params))
  return { total: body.total, list: body.rows.map((d) => toVideo(d, lottery)) }
}

/** 单期视频；未开奖或未公布返回 null */
export async function getVideoDetail(period, { lottery = 'xam' } = {}) {
  const body = await get(`/app/lottery/draw/${encodeURIComponent(period)}`, { lottery })
  return body.data ? toVideo(body.data, lottery) : null
}

/**
 * GET /app/lottery/trend → 走势统计
 * { type, periods, fromIssue, toIssue, hits, numbers, waves, tails, segments, zodiacs }
 * 各项为 { key, count, miss }；miss 为当前遗漏期数，只有特码组有（正码组为 null）
 */
export async function getTrend({ lottery = 'xam', type = 'special', periods = 30 } = {}) {
  const body = await get('/app/lottery/trend', { lottery, type, periods })
  return body.data
}

const fileUrl = (path) => (!path || /^(https?:)?\/\//.test(path) ? path : `${FILE_BASE}${path}`)

/** GET /app/gallery/types → [{ value, label, count }]（字典 app_gallery_type，按字典排序） */
export async function getGalleryTypes() {
  const body = await get('/app/gallery/types')
  return body.data || []
}

/** GET /app/gallery/list → { total, list: [{ id, type, src, createTime }] }（新上传的在前） */
export async function getGalleryImages({ type = '', page = 1, pageSize = 20 } = {}) {
  const body = await get('/app/gallery/list', { imageType: type, pageNum: page, pageSize })
  return {
    total: body.total,
    list: body.rows.map((r) => ({ id: r.imageId, type: r.imageType, src: fileUrl(r.imageUrl), createTime: r.createTime })),
  }
}
