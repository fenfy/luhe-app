/**
 * 云顶六合彩的开奖配置（新澳门、香港见下方 GAMES）。
 * 生肖按每期开奖日所在的农历年计算（utils/lottery.js 的春节日期表）。
 */
export const LOTTERY = {
  /** 彩种名称 */
  name: '云顶六合彩',
  /** 每天开奖时间（开奖地时间，HH:mm） */
  drawTime: '22:32',
  /** 开奖地时区相对 UTC 的小时数（新澳门 UTC+8） */
  utcOffsetHours: 8,
  /** 开奖揭晓动画中每个号码的间隔（毫秒），7 个号码共约 7 秒 */
  revealIntervalMs: 1000,
  /** mock 数据的第一期日期（开奖地日期） */
  mockStartDate: '2025-01-01',
}

/**
 * 彩种（后端 /app/lottery/games 加载失败时用这份；shortName 为切换标签上的简称，以后端返回为准）。
 * schedule：daily 每天固定时刻开奖；scheduled 按排期开奖（日期不固定，香港）。
 */
export const GAMES = [
  { code: 'yd', name: '云顶六合彩', shortName: '马彩', drawTime: '22:32', schedule: 'daily' },
  { code: 'xam', name: '新澳门六合彩', shortName: '澳彩', drawTime: '21:32', schedule: 'daily' },
  { code: 'hk', name: '香港六合彩', shortName: '港彩', drawTime: null, schedule: 'scheduled' },
]

/** 默认彩种 */
export const DEFAULT_GAME = 'yd'

/** 分页配置 */
export const PAGE_SIZE = {
  history: 10,
  videos: 10,
  mobile: 10,
}

/** 图库配置 */
export const GALLERY = {
  /** 首页展示的类别数（按字典排序取前几个，跳过没有图片的类别） */
  homeTypes: { pc: 8, mobile: 5 },
  /** 首页每个类别展示的图片数 */
  homeImages: { pc: 12, mobile: 10 },
  /** 图库页每次加载的图片数 */
  pageSize: 20,
  /** 瀑布流列数 */
  columns: { pc: 4, mobile: 2 },
}
