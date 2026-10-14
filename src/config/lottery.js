/**
 * 彩种配置：改名称、开奖时间、生肖年份都在这里。
 */
export const LOTTERY = {
  /** 彩种名称 */
  name: '新澳门六合彩',
  /** 每天开奖时间（开奖地时间，HH:mm） */
  drawTime: '21:32',
  /** 开奖地时区相对 UTC 的小时数（澳门 UTC+8） */
  utcOffsetHours: 8,
  /** 生肖对照年份：01 号对应该年生肖（2026 = 马年） */
  zodiacYear: 2026,
  /** 开奖揭晓动画中每个号码的间隔（毫秒），7 个号码共约 7 秒 */
  revealIntervalMs: 1000,
  /** mock 数据的第一期日期（开奖地日期） */
  mockStartDate: '2025-01-01',
}

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
