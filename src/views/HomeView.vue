<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getDrawHistory, getLatestDraw } from '../api/index.js'
import { LOTTERY, PAGE_SIZE } from '../config/lottery.js'
import { enrichDraw } from '../utils/lottery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import { usePagedList } from '../composables/usePagedList.js'
import HomeHero from '../components/HomeHero.vue'
import HistoryList from '../components/HistoryList.vue'
import AppPagination from '../components/AppPagination.vue'
import LoadMore from '../components/LoadMore.vue'

const isMobile = useIsMobile()

/* ---------- 最新一期与开奖流程 ---------- */
const latest = ref(null)
const next = ref(null)
const phase = ref('idle') // idle | waiting | revealing
const revealed = ref(7)
const heroError = ref('')
let pollTimer = null
let revealTimer = null

const latestDraw = computed(() => enrichDraw(latest.value))

async function loadLatest() {
  try {
    const res = await getLatestDraw()
    latest.value = res.current
    next.value = res.next
    heroError.value = ''
    return res
  } catch (e) {
    heroError.value = e?.message || '最新开奖加载失败'
    return null
  }
}

/** 倒计时归零：轮询直到拿到新一期，然后逐个揭晓号码 */
function onCountdownEnd() {
  if (phase.value !== 'idle' || !next.value) return
  const expected = next.value.period
  phase.value = 'waiting'
  const started = Date.now()

  const poll = async () => {
    const res = await loadLatest()
    if (res && res.current.period === expected) return startReveal()
    if (Date.now() - started > 10 * 60 * 1000) {
      phase.value = 'idle' // 超时：放弃动画，保留现有数据
      return
    }
    pollTimer = setTimeout(poll, 3000)
  }
  poll()
}

function startReveal() {
  phase.value = 'revealing'
  revealed.value = 0
  revealTimer = setInterval(() => {
    revealed.value += 1
    if (revealed.value >= 7) {
      clearInterval(revealTimer)
      setTimeout(() => {
        phase.value = 'idle'
        history.refresh()
      }, 600)
    }
  }, LOTTERY.revealIntervalMs)
}

/* ---------- 历史开奖 ---------- */
const pageSize = computed(() => (isMobile.value ? PAGE_SIZE.mobile : PAGE_SIZE.history))
const history = usePagedList((p) => getDrawHistory(p), { pageSize, isMobile })
const historyItems = computed(() => history.list.value.map(enrichDraw))

const historySection = ref(null)
function changePage(p) {
  history.goTo(p).then(() => {
    historySection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

onMounted(() => {
  loadLatest()
  history.reset()
})
onBeforeUnmount(() => {
  clearTimeout(pollTimer)
  clearInterval(revealTimer)
})
</script>

<template>
  <div class="container page">
    <p v-if="heroError && !latest" class="state-box card">
      {{ heroError }}
      <button type="button" class="btn" @click="loadLatest">重试</button>
    </p>
    <HomeHero
      v-else
      :draw="latestDraw"
      :next="next"
      :phase="phase"
      :revealed="revealed"
      @countdown-end="onCountdownEnd"
    />

    <section ref="historySection" class="history" aria-labelledby="history-title">
      <div class="section-head">
        <h2 id="history-title" class="section-title">历史开奖</h2>
        <span class="section-meta">
          共 {{ history.total.value }} 期<template v-if="!isMobile"> · 每页 {{ pageSize }} 期</template>
        </span>
      </div>

      <div v-if="!history.loaded.value && history.loading.value" class="state-box">加载中…</div>
      <div v-else-if="!history.loaded.value && history.error.value" class="state-box">
        {{ history.error.value }}
        <button type="button" class="btn" @click="history.retry">重试</button>
      </div>
      <template v-else>
        <div :class="{ 'is-loading': history.loading.value && !isMobile }">
          <HistoryList :items="historyItems" :is-mobile="isMobile" />
        </div>
        <LoadMore
          v-if="isMobile"
          :loading="history.loading.value"
          :has-more="history.hasMore.value"
          :error="history.error.value"
          :shown="history.list.value.length"
          :total="history.total.value"
          @load="history.loadMore"
          @retry="history.retry"
        />
        <AppPagination
          v-else
          :page="history.page.value"
          :page-count="history.pageCount.value"
          :disabled="history.loading.value"
          @change="changePage"
        />
      </template>
    </section>
  </div>
</template>

<style scoped>
.page {
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.history {
  display: flex;
  flex-direction: column;
  gap: 20px;
  scroll-margin-top: 80px;
}
.is-loading {
  opacity: 0.5;
  transition: opacity 0.2s;
}
.state-box .btn {
  margin-left: 12px;
}
@media (max-width: 767px) {
  .page {
    padding-top: 16px;
    gap: 28px;
  }
  .history {
    gap: 12px;
  }
}
</style>
