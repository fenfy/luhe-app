<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getLatestDraw } from '../api/index.js'
import { LOTTERY } from '../config/lottery.js'
import { enrichDraw, localClock, localDayKey, weekdayOf } from '../utils/lottery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import { useGames, rememberLottery, storedLottery } from '../composables/useLottery.js'
import HomeHero from '../components/HomeHero.vue'
import LotterySwitch from '../components/LotterySwitch.vue'
import GallerySection from '../components/gallery/GallerySection.vue'

const isMobile = useIsMobile()
const games = useGames()

/* ---------- 彩种 ---------- */
const lottery = ref(storedLottery())
const game = computed(() => games.value.find((g) => g.code === lottery.value) || games.value[0])

/** 标签下的小字：每天开奖的显示时刻；香港显示下期日期或「待公布」 */
const hkNext = ref(undefined)
const notes = computed(() =>
  Object.fromEntries(
    games.value.map((g) => {
      if (g.schedule !== 'scheduled') return [g.code, `每天 ${g.drawTime}`]
      if (hkNext.value === undefined) return [g.code, '']
      if (!hkNext.value) return [g.code, '下期待公布']
      const at = Date.parse(hkNext.value.drawAt)
      return [g.code, `${weekdayOf(localDayKey(at))} ${localClock(at)}`]
    }),
  ),
)

/* ---------- 最新一期与开奖流程 ---------- */
const latest = ref(null)
const next = ref(null)
const phase = ref('idle') // idle | waiting | revealing
const revealed = ref(7)
const heroError = ref('')
const heroLoading = ref(false)
let pollTimer = null
let revealTimer = null
/** 切换彩种或离开页面时加一，旧的请求、轮询作废 */
let session = 0

const latestDraw = computed(() => enrichDraw(latest.value))

async function loadLatest(my = session) {
  try {
    const res = await getLatestDraw(lottery.value)
    if (my !== session) return null
    latest.value = res.current
    next.value = res.next
    if (lottery.value === 'hk') hkNext.value = res.next
    heroError.value = ''
    return res
  } catch (e) {
    if (my === session) heroError.value = e?.message || '最新开奖加载失败'
    return null
  }
}

function stopTimers() {
  clearTimeout(pollTimer)
  clearInterval(revealTimer)
}

async function switchTo() {
  session += 1
  stopTimers()
  phase.value = 'idle'
  revealed.value = 7
  latest.value = null
  next.value = null
  heroError.value = ''
  heroLoading.value = true
  await loadLatest(session)
  heroLoading.value = false
}

watch(lottery, (code) => {
  rememberLottery(code)
  switchTo()
})

/**
 * 倒计时归零：轮询直到这一期公布，然后逐个揭晓号码。
 * 云顶由后台开奖、澳门由接口同步、香港由后台录入，都可能晚于开奖时刻，所以一直等（每 5 秒查一次）。
 */
function onCountdownEnd() {
  if (phase.value !== 'idle' || !next.value) return
  const expected = next.value.period
  const my = session
  phase.value = 'waiting'

  const poll = async () => {
    if (my !== session) return
    const res = await loadLatest(my)
    if (my !== session) return
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

onMounted(() => {
  switchTo()
  // 香港标签的小字需要下一期日期
  if (lottery.value !== 'hk') {
    getLatestDraw('hk')
      .then((res) => (hkNext.value = res.next))
      .catch(() => (hkNext.value = null))
  }
})
onBeforeUnmount(() => {
  session += 1
  stopTimers()
})
</script>

<template>
  <div class="container page">
    <div class="hero-wrap">
      <LotterySwitch v-model="lottery" :games="games" :notes="notes" class="switch" />
      <p v-if="heroError && !latest" class="state-box card">
        {{ heroError }}
        <button type="button" class="btn" @click="switchTo">重试</button>
      </p>
      <div v-else-if="heroLoading && !latest" class="state-box card">加载中…</div>
      <HomeHero
        v-else
        :game="game"
        :draw="latestDraw"
        :next="next"
        :phase="phase"
        :revealed="revealed"
        @countdown-end="onCountdownEnd"
      />
    </div>

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
.hero-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.switch {
  align-self: flex-start;
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
