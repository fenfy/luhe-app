<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  /** [{ key, label, value, color, note? }] */
  items: { type: Array, required: true },
  /** 圆心下方的小字 */
  centerLabel: { type: String, default: '' },
})

const R = 48
const C = 2 * Math.PI * R
const GAP = 1.2 // 相邻扇区之间的白色间隔（与图表底色同色）

const total = computed(() => props.items.reduce((s, i) => s + i.value, 0))
const active = ref(null)

const arcs = computed(() => {
  let offset = 0
  return props.items.map((it) => {
    const len = total.value ? (it.value / total.value) * C : 0
    const arc = {
      ...it,
      pct: total.value ? ((it.value / total.value) * 100).toFixed(1) : '0.0',
      dash: `${Math.max(0, len - (len > GAP * 2 ? GAP : 0))} ${C}`,
      offset: -offset,
    }
    offset += len
    return arc
  })
})
</script>

<template>
  <div class="donut">
    <svg viewBox="0 0 120 120" class="ring" role="img" :aria-label="arcs.map((a) => `${a.label} ${a.value} 次`).join('，')">
      <circle cx="60" cy="60" :r="R" fill="none" stroke="var(--chart-grid)" stroke-width="16" />
      <circle
        v-for="a in arcs"
        :key="a.key"
        cx="60"
        cy="60"
        :r="R"
        fill="none"
        :stroke="a.color"
        :stroke-width="active === a.key ? 19 : 16"
        :stroke-dasharray="a.dash"
        :stroke-dashoffset="a.offset"
        transform="rotate(-90 60 60)"
        class="seg"
        @mouseenter="active = a.key"
        @mouseleave="active = null"
      >
        <title>{{ a.label }}：{{ a.value }} 次（{{ a.pct }}%）</title>
      </circle>
      <text x="60" y="58" text-anchor="middle" class="total num">{{ total }}</text>
      <text x="60" y="74" text-anchor="middle" class="total-label">{{ centerLabel }}</text>
    </svg>

    <ul class="legend">
      <li
        v-for="a in arcs"
        :key="a.key"
        :class="{ on: active === a.key }"
        @mouseenter="active = a.key"
        @mouseleave="active = null"
      >
        <span class="sw" :style="{ background: a.color }" aria-hidden="true" />
        <span class="lg-label">{{ a.label }}</span>
        <span class="lg-val num">{{ a.value }} 次</span>
        <span class="lg-pct num">{{ a.pct }}%</span>
        <span v-if="a.note" class="lg-note">{{ a.note }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.donut {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
  justify-content: center;
}
.ring {
  width: 180px;
  height: 180px;
  flex: none;
}
.seg {
  transition: stroke-width 0.15s;
  cursor: default;
}
.total {
  font-size: 22px;
  font-weight: 700;
  fill: var(--text);
}
.total-label {
  font-size: 9px;
  fill: var(--muted);
}
.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 200px;
}
.legend li {
  display: grid;
  grid-template-columns: 12px auto 1fr auto;
  align-items: center;
  column-gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
}
.legend li.on {
  background: var(--surface-hover);
}
.sw {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.lg-label {
  font-size: 14px;
}
.lg-val {
  font-size: 16px;
  font-weight: 600;
  text-align: right;
}
.lg-pct {
  font-size: 13px;
  color: var(--muted);
  min-width: 46px;
  text-align: right;
}
.lg-note {
  grid-column: 2 / -1;
  font-size: 12px;
  color: var(--faint);
}
</style>
