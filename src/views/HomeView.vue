<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getLatestDraw } from '../api/index.js'
import { LOTTERY } from '../config/lottery.js'
import { enrichDraw } from '../utils/lottery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import HomeHero from '../components/HomeHero.vue'
import GallerySection from '../components/gallery/GallerySection.vue'

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

/**
 * 倒计时归零：轮询直到后端公布这一期，然后逐个揭晓号码。
 * 开奖由后台人工执行，可能晚于开奖时刻，所以一直等（每 5 秒查一次），直到离开页面。
 */
let disposed = false
function onCountdownEnd() {
  if (phase.value !== 'idle' || !next.value) return
  const expected = next.value.period
  phase.value = 'waiting'

  const poll = async () => {
    if (disposed) return
    const res = await loadLatest()
    if (disposed) return
    if (res?.current && res.current.period === expected) return startReveal()
    pollTimer = setTimeout(poll, 5000)
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
      }, 600)
    }
  }, LOTTERY.revealIntervalMs)
}

onMounted(loadLatest)
onBeforeUnmount(() => {
  disposed = true
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

    <GallerySection :is-mobile="isMobile" />
  </div>
</template>

<style scoped>
.page {
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.state-box .btn {
  margin-left: 12px;
}
@media (max-width: 767px) {
  .page {
    padding-top: 16px;
    gap: 28px;
  }
}
</style>
