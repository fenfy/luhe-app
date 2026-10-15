<script setup>
import { computed, ref, watch } from 'vue'
import { getTrend } from '../../api/index.js'
import { getWave, getZodiac } from '../../utils/lottery.js'
import TrendBars from './TrendBars.vue'
import TrendDonut from './TrendDonut.vue'
import TrendHBars from './TrendHBars.vue'

const props = defineProps({
  /** special（特码）/ normal（正码） */
  type: { type: String, required: true },
  /** 彩种代码 */
  lottery: { type: String, default: 'xam' },
  isMobile: Boolean,
})

const PERIOD_OPTIONS = [10, 20, 30, 50, 100]
const WAVE_COLOR = { 红波: 'var(--red)', 蓝波: 'var(--blue)', 绿波: 'var(--green)' }
const WAVE_NAME = { red: '红波', blue: '蓝波', green: '绿波' }

const special = computed(() => props.type === 'special')
const name = computed(() => (special.value ? '特码' : '正码'))

const periods = ref(100)
const sortBy = ref('count') // count | number
const data = ref(null)
const loading = ref(false)
const error = ref('')
let token = 0

async function load() {
  const my = ++token
  loading.value = true
  error.value = ''
  try {
    const res = await getTrend({ lottery: props.lottery, type: props.type, periods: periods.value })
    if (my === token) data.value = res
  } catch (e) {
    if (my === token) error.value = e?.message || '加载失败'
  } finally {
    if (my === token) loading.value = false
  }
}
watch([periods, () => props.lottery], load, { immediate: true })

const hits = computed(() => data.value?.hits || 0)
const pct = (v) => (hits.value ? ((v / hits.value) * 100).toFixed(1) : '0.0')
const missText = (m) => (m === null || m === undefined ? '100+' : String(m))
const missTip = (m) => (special.value ? ` · 当前遗漏 ${m === null || m === undefined ? '100 期以上' : `${m} 期`}` : '')
const byCount = (a, b) => b.value - a.value || String(a.key).localeCompare(String(b.key), 'zh', { numeric: true })

/** 号码：按波色上色 */
const numberItems = computed(() => {
  const list = (data.value?.numbers || []).map((it) => {
    const n = Number(it.key)
    const wave = WAVE_NAME[getWave(n)]
    return {
      key: it.key,
      label: it.key,
      value: it.count,
      color: WAVE_COLOR[wave],
      note: special.value ? missText(it.miss) : getZodiac(n),
      tip: `${it.key} 号 · ${getZodiac(n)} · ${wave} · 出现 ${it.count} 次（${pct(it.count)}%）${missTip(it.miss)}`,
    }
  })
  return sortBy.value === 'count' ? list.sort(byCount) : list
})

const waveItems = computed(() =>
  (data.value?.waves || []).map((it) => ({
    key: it.key,
    label: it.key,
    value: it.count,
    color: WAVE_COLOR[it.key] || 'var(--chart-bar)',
    note: special.value ? `当前遗漏 ${missText(it.miss)} 期` : '',
  })),
)

function simpleBars(list, labelOf) {
  return list
    .map((it) => ({
      key: it.key,
      label: labelOf(it.key),
      value: it.count,
      note: special.value ? missText(it.miss) : undefined,
      tip: `${labelOf(it.key)} · 出现 ${it.count} 次（${pct(it.count)}%）${missTip(it.miss)}`,
    }))
    .sort(byCount)
}
const tailItems = computed(() => simpleBars(data.value?.tails || [], (k) => `${k}尾`))
const segmentItems = computed(() => simpleBars(data.value?.segments || [], (k) => k))
const zodiacItems = computed(() =>
  (data.value?.zodiacs || [])
    .map((it) => ({
      key: it.key,
      label: it.key,
      value: it.count,
      pct: pct(it.count),
      note: special.value ? `遗漏 ${missText(it.miss)}` : '',
    }))
    .sort(byCount),
)

const rangeText = computed(() => {
  const d = data.value
  if (!d || !d.periods) return ''
  const short = d.periods < periods.value ? `（开奖记录只有 ${d.periods} 期）` : ''
  return `第 ${d.fromIssue} 期 – 第 ${d.toIssue} 期，共 ${d.periods} 期${short}`
})
</script>

<template>
  <section class="trend-section" :aria-labelledby="`trend-${type}`">
    <div class="sec-head">
      <div>
        <h2 :id="`trend-${type}`" class="section-title">{{ name }}统计</h2>
        <p class="range">{{ rangeText }}</p>
      </div>
      <div class="periods" role="group" :aria-label="`${name}统计期数`">
        <span class="periods-label">期数</span>
        <button
          v-for="p in PERIOD_OPTIONS"
          :key="p"
          type="button"
          class="seg-btn num"
          :class="{ on: periods === p }"
          :aria-pressed="periods === p"
          @click="periods = p"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <div v-if="error" class="state-box card">
      {{ error }}
      <button type="button" class="btn" @click="load">重试</button>
    </div>
    <div v-else-if="!data" class="state-box card">加载中…</div>
    <div v-else-if="!data.periods" class="state-box card">暂无开奖数据</div>

    <div v-else class="grid" :class="{ 'is-loading': loading }">
      <article class="card chart-card wide">
        <header class="card-head">
          <h3>{{ special ? '特码出现次数' : '正码数字出现次数' }}</h3>
          <div class="sort" role="group" aria-label="排序方式">
            <button type="button" class="link-btn" :class="{ on: sortBy === 'count' }" @click="sortBy = 'count'">按次数</button>
            <button type="button" class="link-btn" :class="{ on: sortBy === 'number' }" @click="sortBy = 'number'">按号码</button>
          </div>
        </header>
        <p class="hint">
          柱子颜色为号码波色；下方小字为{{ special ? '当前遗漏期数（最近一期开出为 0）' : '号码生肖' }}。悬停或点按柱子查看详情。
        </p>
        <TrendBars
          :items="numberItems"
          :height="isMobile ? 160 : 210"
          :min-slot="isMobile ? 24 : 0"
          :note-name="special ? '遗漏' : '生肖'"
          :aria-label="`${name}号码出现次数`"
        />
      </article>

      <article class="card chart-card">
        <header class="card-head">
          <h3>{{ name }}波色出现次数</h3>
        </header>
        <TrendDonut :items="waveItems" center-label="总次数" />
      </article>

      <article class="card chart-card">
        <header class="card-head">
          <h3>{{ special ? '特肖出现次数' : '正码生肖出现次数' }}</h3>
        </header>
        <TrendHBars :items="zodiacItems" :aria-label="`${name}生肖出现次数`" />
      </article>

      <article class="card chart-card">
        <header class="card-head">
          <h3>{{ name }}尾数出现次数</h3>
        </header>
        <TrendBars :items="tailItems" :height="170" :note-name="special ? '遗漏' : ''" :aria-label="`${name}尾数出现次数`" />
      </article>

      <article class="card chart-card">
        <header class="card-head">
          <h3>{{ name }}波段出现次数</h3>
        </header>
        <TrendBars :items="segmentItems" :height="170" :note-name="special ? '遗漏' : ''" :aria-label="`${name}波段出现次数`" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.trend-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 20px;
  flex-wrap: wrap;
}
.range {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.periods {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 4px;
}
.periods-label {
  font-size: 13px;
  color: var(--muted);
  padding: 0 8px 0 6px;
}
.seg-btn {
  min-width: 44px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
}
.seg-btn:hover {
  background: var(--surface-hover);
}
.seg-btn.on {
  background: var(--gold);
  color: var(--on-gold);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.wide {
  grid-column: 1 / -1;
}
.is-loading {
  opacity: 0.55;
  transition: opacity 0.2s;
}
.chart-card {
  padding: 20px 22px 18px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.card-head h3 {
  font-size: 16px;
  font-weight: 700;
  padding-left: 10px;
  border-left: 3px solid var(--gold);
  line-height: 1.2;
}
.chart-card > .donut {
  flex: 1;
}
.hint {
  margin: -4px 0 4px;
  font-size: 12px;
  color: var(--faint);
}
.sort {
  display: flex;
  gap: 4px;
}
.link-btn {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
}
.link-btn:hover {
  color: var(--text);
}
.link-btn.on {
  border-color: var(--line);
  background: var(--surface-hover);
  color: var(--text);
  font-weight: 600;
}
.state-box .btn {
  margin-left: 12px;
}

@media (max-width: 1023px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 767px) {
  .chart-card {
    padding: 16px 14px 14px;
  }
  .periods {
    width: 100%;
    justify-content: space-between;
  }
  .seg-btn {
    flex: 1;
    min-width: 0;
    height: 40px;
  }
}
</style>
