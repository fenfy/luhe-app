/** 图库通用：只展示有图片的类别；说明文字为 “类别 · 上传日期” */

export const visibleTypes = (types) => (types || []).filter((t) => Number(t.count) > 0)

/** 「全部」类别的值：查询时不带类型，即当前彩种下的全部图片 */
export const ALL_TYPE = 'all'

/** 有图片的类别，最前面加「全部」（数量为各类别之和）；没有任何图片时为空 */
export function typesWithAll(types) {
  const shown = visibleTypes(types)
  if (!shown.length) return []
  const count = shown.reduce((sum, t) => sum + Number(t.count), 0)
  return [{ value: ALL_TYPE, label: '全部', count }, ...shown]
}

/**
 * 首页类别标签：「全部」+ 最多 max 个有图片的类别；more 表示还有更多类别（显示「更多」）
 * @returns {{ tabs: Array, more: boolean }}
 */
export function homeTabs(types, max) {
  const all = typesWithAll(types)
  return { tabs: all.slice(0, 1 + max), more: all.length > 1 + max }
}

/** 类别值 → 接口的 imageType（「全部」不传） */
export const typeParam = (value) => (!value || value === ALL_TYPE ? '' : value)

/** "2026-10-14 10:20:30" / ISO → "2026-10-14" */
export const dateOf = (time) => (typeof time === 'string' ? time.slice(0, 10) : '')

export function captionOf(item, types) {
  const label = (types || []).find((t) => t.value === item.type)?.label || '图库'
  const date = dateOf(item.createTime)
  return date ? `${label} · ${date}` : label
}
