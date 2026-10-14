/**
 * 瀑布流排列：按顺序把每一项放进当前最矮的一列（高度相同取最左），
 * 这样新的一项总在最上面一行从左到右排开。
 *
 * @param {number[]} ratios 每项的 高/宽 比
 * @param {number} columns 列数
 * @param {number} gap 卡片间距与列宽的比值（列宽为 1）
 * @returns {number[][]} 每列放的项下标
 */
export function layoutMasonry(ratios, columns, gap = 0) {
  const cols = Array.from({ length: Math.max(1, columns) }, () => [])
  const heights = cols.map(() => 0)
  ratios.forEach((r, i) => {
    let target = 0
    for (let c = 1; c < cols.length; c++) {
      if (heights[c] < heights[target] - 1e-9) target = c
    }
    cols[target].push(i)
    heights[target] += r + gap
  })
  return cols
}
