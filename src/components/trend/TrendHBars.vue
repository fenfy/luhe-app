<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** [{ key, label, value, pct, note? }] */
  items: { type: Array, required: true },
  ariaLabel: { type: String, default: '' },
})

const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))
</script>

<template>
  <ul class="hbars" :aria-label="ariaLabel">
    <li v-for="it in items" :key="it.key" class="row">
      <span class="label">{{ it.label }}</span>
      <div class="track" aria-hidden="true">
        <div class="fill" :style="{ width: `${(it.value / max) * 100}%` }" />
      </div>
      <span class="val num">{{ it.value }} 次</span>
      <span class="pct num">{{ it.pct }}%</span>
      <span class="note">{{ it.note ?? '' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.hbars {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 52px 48px 64px;
  align-items: center;
  column-gap: 10px;
  min-height: 26px;
  border-radius: 6px;
  padding: 0 4px;
}
.row:hover {
  background: var(--surface-hover);
}
.label {
  font-size: 14px;
  text-align: center;
}
.track {
  height: 10px;
  background: var(--chart-grid);
  border-radius: 0 5px 5px 0;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--chart-bar);
  border-radius: 0 5px 5px 0;
}
.row:hover .fill {
  background: var(--chart-bar-hover);
}
.val {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
}
.pct {
  font-size: 12px;
  color: var(--muted);
  text-align: right;
}
.note {
  font-size: 12px;
  color: var(--faint);
  white-space: nowrap;
}
@media (max-width: 767px) {
  .row {
    grid-template-columns: 24px minmax(0, 1fr) 46px 44px 58px;
    column-gap: 8px;
  }
}
</style>
