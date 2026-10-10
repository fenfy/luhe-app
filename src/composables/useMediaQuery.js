import { onBeforeUnmount, ref } from 'vue'

/** 响应式媒体查询 */
export function useMediaQuery(query) {
  const mql = typeof window !== 'undefined' ? window.matchMedia(query) : null
  const matches = ref(mql ? mql.matches : false)
  const onChange = (e) => {
    matches.value = e.matches
  }
  mql?.addEventListener('change', onChange)
  onBeforeUnmount(() => mql?.removeEventListener('change', onChange))
  return matches
}

/** 手机端：宽度 < 768px（使用上滑加载） */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
