/** 图库通用：只展示有图片的类别；说明文字为 “类别 · 上传日期” */

export const visibleTypes = (types) => (types || []).filter((t) => Number(t.count) > 0)

/** "2026-10-14 10:20:30" / ISO → "2026-10-14" */
export const dateOf = (time) => (typeof time === 'string' ? time.slice(0, 10) : '')

export function captionOf(item, types) {
  const label = (types || []).find((t) => t.value === item.type)?.label || '图库'
  const date = dateOf(item.createTime)
  return date ? `${label} · ${date}` : label
}
