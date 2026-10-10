/**
 * 页面只从这里取数据。
 * VITE_USE_MOCK=false 时切换为真实接口（见 .env.example）。
 */
import * as mock from './mock.js'
import * as http from './http.js'

const impl = import.meta.env.VITE_USE_MOCK === 'false' ? http : mock

/** 最新一期 + 下一期：{ current: Draw, next: { period, drawAt } } */
export const getLatestDraw = () => impl.getLatestDraw()

/** 历史开奖（倒序）：{ total, list: Draw[] } */
export const getDrawHistory = (params) => impl.getDrawHistory(params)

/** 开奖视频列表（倒序，可按 date / period 筛选）：{ total, list: Video[] } */
export const getVideoList = (params) => impl.getVideoList(params)

/** 单期视频：Video | null */
export const getVideoDetail = (period) => impl.getVideoDetail(period)
