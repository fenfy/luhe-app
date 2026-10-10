import { computed, ref, watch } from 'vue'

/**
 * 统一的分页列表：
 * - PC 端 goTo(page) 按页替换
 * - 手机端 loadMore() 追加下一页（上滑加载）
 * isMobile 变化或调用 reset() 时回到第 1 页。
 *
 * @param {(params: {page:number, pageSize:number}) => Promise<{total:number, list:any[]}>} fetcher
 * @param {{ pageSize: import('vue').Ref<number>|number, isMobile: import('vue').Ref<boolean> }} options
 */
export function usePagedList(fetcher, { pageSize, isMobile }) {
  const list = ref([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  let token = 0

  const size = computed(() => (typeof pageSize === 'object' ? pageSize.value : pageSize))
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
  const hasMore = computed(() => list.value.length < total.value)

  async function load(p, append) {
    const my = ++token
    loading.value = true
    error.value = ''
    try {
      const res = await fetcher({ page: p, pageSize: size.value })
      if (my !== token) return
      total.value = res.total
      list.value = append ? [...list.value, ...res.list] : res.list
      page.value = p
      loaded.value = true
    } catch (e) {
      if (my !== token) return
      error.value = e?.message || '加载失败'
    } finally {
      if (my === token) loading.value = false
    }
  }

  function goTo(p) {
    const target = Math.min(Math.max(1, p), pageCount.value)
    return load(target, false)
  }

  function loadMore() {
    if (loading.value || !hasMore.value || error.value) return
    return load(page.value + 1, true)
  }

  function retry() {
    error.value = ''
    return isMobile.value && list.value.length ? load(page.value + 1, true) : load(page.value, false)
  }

  function reset() {
    list.value = []
    total.value = 0
    loaded.value = false
    return load(1, false)
  }

  /** 静默刷新到第 1 页：保留旧数据直到新数据返回，避免闪烁 */
  function refresh() {
    return load(1, false)
  }

  watch(isMobile, () => reset())

  return { list, total, page, pageCount, loading, error, loaded, hasMore, goTo, loadMore, retry, reset, refresh }
}
