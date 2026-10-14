/**
 * 页面只从这里取数据。
 * 默认请求 luhe 后端真实接口；VITE_USE_MOCK=true 时改用本地 mock（离线开发用，见 .env.example）。
 */
import * as mock from './mock.js'
import * as http from './http.js'

const impl = import.meta.env.VITE_USE_MOCK === 'true' ? mock : http

/** 最新一期 + 下一期：{ current: Draw | null, next: { period, drawAt } } */
export const getLatestDraw = () => impl.getLatestDraw()

/** 历史开奖（倒序，可按 date / period 筛选）：{ total, list: Draw[] } */
export const getDrawHistory = (params) => impl.getDrawHistory(params)

/** 开奖视频列表（倒序，可按 date / period 筛选）：{ total, list: Video[] } */
export const getVideoList = (params) => impl.getVideoList(params)

/** 单期视频：Video | null */
export const getVideoDetail = (period) => impl.getVideoDetail(period)

/** 走势统计：type = special（特码）/ normal（正码），periods = 10/20/30/50/100 */
export const getTrend = (params) => impl.getTrend(params)

/** 图库类别：[{ value, label, count }] */
export const getGalleryTypes = () => impl.getGalleryTypes()

/** 图库图片（新上传的在前）：{ total, list: [{ id, type, src, createTime }] } */
export const getGalleryImages = (params) => impl.getGalleryImages(params)
