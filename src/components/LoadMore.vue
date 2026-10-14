<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  loading: Boolean,
  hasMore: Boolean,
  error: { type: String, default: '' },
  shown: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  /** 计数单位：期 / 张 */
  unit: { type: String, default: '期' },
  /** 未加载时的提示文字 */
  label: { type: String, default: '上滑加载更多' },
})
const emit = defineEmits(['load', 'retry'])

const sentinel = ref(null)
let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loading && !props.error) emit('load')
    },
    { rootMargin: '0px 0px 240px 0px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})
// 加载完成后重新观察：哨兵仍在可视区时会再次触发，直到填满屏幕
watch(
  () => props.loading,
  (v) => {
    if (!v && observer && sentinel.value) {
      observer.unobserve(sentinel.value)
      observer.observe(sentinel.value)
    }
  },
)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="sentinel" class="load-more" aria-live="polite">
    <template v-if="error">
      <span>{{ error }}</span>
      <button type="button" class="btn" @click="emit('retry')">重试</button>
    </template>
    <template v-else-if="hasMore">
      <button type="button" class="trigger" :disabled="loading" @click="emit('load')">
        <Icon name="spinner" :size="16" class="spin" />
        {{ loading ? '加载中…' : label }}
      </button>
      <span class="count">已显示 {{ shown }} / {{ total }} {{ unit }}</span>
    </template>
    <span v-else-if="total > 0" class="count">— 已显示全部 {{ total }} {{ unit }} —</span>
  </div>
</template>

<style scoped>
.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0 4px;
  color: var(--muted);
  font-size: 13px;
}
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
}
.spin {
  color: var(--gold-text);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.count {
  font-size: 12px;
  color: var(--faint);
}
</style>
