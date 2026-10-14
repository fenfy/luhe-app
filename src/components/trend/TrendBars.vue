<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** [{ key, label, value, color?, note?, tip }] */
  items: { type: Array, required: true },
  /** 图表区高度（px） */
  height: { type: Number, default: 200 },
  /** 每根柱子最小占位宽度（px）；总宽不够时横向滚动 */
  minSlot: { type: Number, default: 0 },
  /** x 轴下方小字的行名（如“遗漏”），为空则不显示 */
  noteName: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
})

/** 取整到 1/2/5×10ⁿ 的刻度，最多 4 格 */
const scale = computed(() => {
  const maxVal = Math.max(1, ...props.items.map((i) => i.value))
  const raw = maxVal / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) || pow * 10
  const stepInt = Math.max(1, Math.ceil(step))
  const max = stepInt * Math.ceil(maxVal / stepInt)
  const ticks = []
  for (let v = 0; v <= max; v += stepInt) ticks.push(v)
  return { max, ticks }
})

const bars = computed(() =>
  props.items.map((it) => ({ ...it, h: Math.round((it.value / scale.value.max) * props.height) })),
)
const plotMinWidth = computed(() => (props.minSlot ? `${props.items.length * props.minSlot + 40}px` : undefined))
</script>

<template>
  <div class="chart" role="group" :aria-label="ariaLabel">
    <div class="scroll">
      <div class="plot" :style="{ minWidth: plotMinWidth }">
        <!-- y 轴 -->
        <div class="y-axis" :style="{ height: `${height}px` }" aria-hidden="true">
          <span v-for="t in scale.ticks" :key="t" class="tick num" :style="{ bottom: `${(t / scale.max) * 100}%` }">{{ t }}</span>
        </div>

        <!-- 绘图区 -->
        <div class="area" :style="{ height: `${height}px` }">
          <div
            v-for="t in scale.ticks"
            :key="t"
            class="grid"
            :class="{ base: t === 0 }"
            :style="{ bottom: `${(t / scale.max) * 100}%` }"
            aria-hidden="true"
          />
          <div class="bars">
            <div
              v-for="b in bars"
              :key="b.key"
              class="col"
              tabindex="0"
              :aria-label="b.tip"
              :style="{ '--h': `${b.h}px`, '--c': b.color || 'var(--chart-bar)' }"
            >
              <span v-if="b.value > 0" class="val num">{{ b.value }}</span>
              <div class="bar" />
              <div class="tip" role="tooltip">{{ b.tip }}</div>
            </div>
          </div>
        </div>

        <!-- x 轴 -->
        <div class="y-axis-pad" aria-hidden="true">
          <span v-if="noteName" class="note-name">{{ noteName }}</span>
        </div>
        <div class="x-labels" aria-hidden="true">
          <div v-for="b in bars" :key="b.key" class="x">
            <span class="x-label num">{{ b.label }}</span>
            <span v-if="b.note !== undefined && b.note !== null" class="x-note num">{{ b.note }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll {
  overflow-x: auto;
  overflow-y: visible;
  /* 横向滚动时容器会裁切溢出内容，顶部留出空间放悬停提示 */
  padding-top: 64px;
  margin-top: -64px;
}
.plot {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  column-gap: 8px;
}
.y-axis {
  position: relative;
}
.tick {
  position: absolute;
  right: 0;
  transform: translateY(50%);
  font-size: 12px;
  color: var(--faint);
  line-height: 1;
}
.area {
  position: relative;
}
.grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--chart-grid);
}
.grid.base {
  background: var(--line);
}
.bars {
  position: absolute;
  inset: 0;
  display: flex;
}
.col {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  outline: none;
  cursor: default;
}
.col:hover,
.col:focus-visible {
  background: rgba(16, 24, 40, 0.03);
}
.bar {
  width: min(16px, 62%);
  height: var(--h);
  min-height: 0;
  background: var(--c);
  border-radius: 4px 4px 0 0;
  transition: filter 0.15s;
}
.col:hover .bar,
.col:focus-visible .bar {
  filter: brightness(0.82);
}
.val {
  font-size: 12px;
  color: var(--muted);
  line-height: 1;
  margin-bottom: 4px;
}
.tip {
  display: none;
  position: absolute;
  bottom: calc(var(--h) + 24px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  white-space: nowrap;
  background: var(--text);
  color: #fff;
  font-size: 12px;
  line-height: 1.4;
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.18);
  pointer-events: none;
}
.col:hover .tip,
.col:focus-visible .tip {
  display: block;
}
.col:first-child .tip,
.col:nth-child(2) .tip {
  left: 0;
  transform: none;
}
.col:last-child .tip,
.col:nth-last-child(2) .tip {
  left: auto;
  right: 0;
  transform: none;
}
.y-axis-pad {
  position: relative;
}
.note-name {
  position: absolute;
  right: 0;
  top: 26px;
  font-size: 11px;
  color: var(--faint);
}
.x-labels {
  display: flex;
  border-top: 0;
  padding-top: 6px;
}
.x {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.x-label {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
}
.x-note {
  font-size: 11px;
  color: var(--faint);
  white-space: nowrap;
}
</style>
