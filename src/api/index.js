/**
 * 页面只从这里取数据。
 * 默认请求 luhe 后端真实接口；VITE_USE_MOCK=true 时改用本地 mock（离线开发用，见 .env.example）。
 */
import * as mock from './mock.js'
import * as http from './http.js'

const impl = import.meta.env.VITE_USE_MOCK === 'true' ? mock : http

/** 彩种：[{ code, name, drawTime, schedule }] */
export const getGames = () => impl.getGames()

/**
 * 以下接口都带 lottery：xam 新澳门（默认）/ am 澳门 / hk 香港
 */

/** 最新一期 + 下一期：{ current: Draw | null, next: { period, drawAt } | null }（香港未排期时 next 为空） */
export const getLatestDraw = (lottery) => impl.getLatestDraw({ lottery })

/** 历史开奖（最新在前，可按 date / period 筛选；params.lottery）：{ total, list: Draw[] } */
export const getDrawHistory = (params) => impl.getDrawHistory(params)

/** 开奖视频列表（倒序，可按 date / period 筛选）：{ total, list: Video[] } */
export const getVideoList = (params) => impl.getVideoList(params)

/** 单期视频：Video | null（src 为空表示暂无视频） */
export const getVideoDetail = (period, lottery) => impl.getVideoDetail(period, { lottery })

/** 走势统计：lottery、type = special（特码）/ normal（正码）、periods = 10/20/30/50/100 */
export const getTrend = (params) => impl.getTrend(params)

/** 图库类别：[{ value, label, count }] */
export const getGalleryTypes = () => impl.getGalleryTypes()

/** 图库图片（新上传的在前）：{ total, list: [{ id, type, src, createTime }] } */
export const getGalleryImages = (params) => impl.getGalleryImages(params)
