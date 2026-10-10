<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  page: { type: Number, required: true },
  pageCount: { type: Number, required: true },
  disabled: Boolean,
})
const emit = defineEmits(['change'])

/** 1 … p-1 p p+1 … N */
const items = computed(() => {
  const n = props.pageCount
  const cur = props.page
  const want = [...new Set([1, 2, cur - 1, cur, cur + 1, n - 1, n])]
    .filter((x) => x >= 1 && x <= n)
    .sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const x of want) {
    if (x - prev > 1) out.push({ key: `gap-${x}`, gap: true })
    out.push({ key: x, page: x })
    prev = x
  }
  return out
})

function go(p) {
  if (props.disabled || p < 1 || p > props.pageCount || p === props.page) return
  emit('change', p)
}
</script>

<template>
  <nav v-if="pageCount > 1" class="pager" aria-label="分页">
    <button class="pg" type="button" aria-label="上一页" :disabled="page <= 1 || disabled" @click="go(page - 1)">
      <Icon name="left" />
    </button>
    <template v-for="it in items" :key="it.key">
      <span v-if="it.gap" class="gap" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="pg num"
        :class="{ on: it.page === page }"
        :aria-current="it.page === page ? 'page' : undefined"
        :disabled="disabled && it.page !== page"
        @click="go(it.page)"
      >
        {{ it.page }}
      </button>
    </template>
    <button class="pg" type="button" aria-label="下一页" :disabled="page >= pageCount || disabled" @click="go(page + 1)">
      <Icon name="right" />
    </button>
    <span class="info">第 {{ page }} / {{ pageCount }} 页</span>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.pg {
  min-width: 44px;
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text);
  font-size: 17px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pg:hover:not(:disabled) {
  border-color: var(--gold);
}
.pg:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pg.on {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--on-gold);
  opacity: 1;
  cursor: default;
}
.gap {
  min-width: 24px;
  text-align: center;
  color: var(--muted);
}
.info {
  margin-left: 12px;
  color: var(--muted);
  font-size: 14px;
}
</style>
