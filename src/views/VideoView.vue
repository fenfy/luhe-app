<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLatestDraw, getVideoDetail, getVideoList } from '../api/index.js'
import { LOTTERY, PAGE_SIZE } from '../config/lottery.js'
import { enrichDraw, formatClock, isValidPeriod, normalizePeriod, shiftPeriod } from '../utils/lottery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import { usePagedList } from '../composables/usePagedList.js'
import VideoPlayer from '../components/VideoPlayer.vue'
import VideoCard from '../components/VideoCard.vue'
import DrawBalls from '../components/DrawBalls.vue'
import AppPagination from '../components/AppPagination.vue'
import LoadMore from '../components/LoadMore.vue'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()

const enrichVideo = (v) => (v ? { ...enrichDraw(v), durationText: formatClock(v.duration) } : null)

/* ---------- 当前播放 ---------- */
const latestPeriod = ref('')
const current = ref(null)
const currentLoading = ref(true)
const currentError = ref('')
const autoplay = ref(false)

const queryPeriod = computed(() => (typeof route.query.period === 'string' ? route.query.period : ''))
const currentVideo = computed(() => enrichVideo(current.value))
const isLatest = computed(() => !!current.value && current.value.period === latestPeriod.value)

async function ensureLatestPeriod() {
  if (latestPeriod.value) return latestPeriod.value
  const res = await getLatestDraw()
  latestPeriod.value = res.current?.period || ''
  return latestPeriod.value
}

let loadToken = 0
async function loadCurrent() {
  const my = ++loadToken
  currentLoading.value = true
  currentError.value = ''
  try {
    const latest = await ensureLatestPeriod()
    const period = queryPeriod.value || latest
    // 从“回放”或列表点进来的才自动播放
    autoplay.value = !!queryPeriod.value
    const detail = isValidPeriod(period) ? await getVideoDetail(period) : null
    if (my !== loadToken) return
    current.value = detail
    if (!detail) currentError.value = period ? `没有找到第 ${period} 期的开奖视频` : '暂无开奖视频'
  } catch (e) {
    if (my !== loadToken) return
    current.value = null
    currentError.value = e?.message || '视频加载失败'
  } finally {
    if (my === loadToken) currentLoading.value = false
  }
}

watch(queryPeriod, loadCurrent, { immediate: true })

function openPeriod(period) {
  router.push({ name: 'video', query: { period } })
}
const goPrev = () => current.value && openPeriod(shiftPeriod(current.value.period, -1))
const goNext = () => current.value && !isLatest.value && openPeriod(shiftPeriod(current.value.period, 1))

/* ---------- 列表与筛选 ---------- */
const form = reactive({ date: '', period: '' })
const filters = reactive({ date: '', period: '' })
const formError = ref('')

const pageSize = computed(() => (isMobile.value ? PAGE_SIZE.mobile : PAGE_SIZE.videos))
const videos = usePagedList((p) => getVideoList({ ...p, date: filters.date, period: filters.period }), {
  pageSize,
  isMobile,
})
const videoItems = computed(() => videos.list.value.map(enrichVideo))
const filtering = computed(() => !!(filters.date || filters.period))

function search() {
  const raw = form.period.trim()
  const period = raw ? normalizePeriod(raw) : ''
  if (raw && !period) {
    formError.value = '期号为 年份+3位天数，如 2026285'
    return
  }
  formError.value = ''
  filters.date = form.date
  filters.period = period
  videos.reset()
}
function resetFilters() {
  form.date = ''
  form.period = ''
  formError.value = ''
  if (!filtering.value) return
  filters.date = ''
  filters.period = ''
  videos.reset()
}

const listSection = ref(null)
function changePage(p) {
  videos.goTo(p).then(() => listSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

videos.reset()
</script>

<template>
  <div class="video-page">
    <!-- 播放区 -->
    <section class="stage container" aria-label="正在播放">
      <div class="player-col">
        <div v-if="currentLoading && !current" class="player-placeholder">加载中…</div>
        <div v-else-if="currentError" class="player-placeholder">
          <p>{{ currentError }}</p>
          <RouterLink v-if="queryPeriod" :to="{ name: 'video' }" class="btn">观看最新一期</RouterLink>
        </div>
        <VideoPlayer
          v-else-if="currentVideo"
          :key="currentVideo.period"
          :src="currentVideo.src"
          :type="currentVideo.type"
          :poster="currentVideo.cover || ''"
          :draw="currentVideo"
          :autoplay="autoplay"
        />

        <div v-if="currentVideo" class="title-block">
          <h1 class="title">
            <span class="pc-only">{{ LOTTERY.name }} </span>第 <span class="num">{{ currentVideo.period }}</span> 期 开奖回放
          </h1>
          <div class="sub">
            {{ currentVideo.date }} {{ currentVideo.week }} {{ currentVideo.time }} · 时长 {{ currentVideo.durationText }}
          </div>
        </div>
      </div>

      <aside v-if="currentVideo" class="side card">
        <div class="side-label pc-only">本期开奖号码</div>
        <DrawBalls :draw="currentVideo" :size="isMobile ? 'md' : 'sm'" show-zodiac class="side-balls" />
        <div class="side-nav">
          <button type="button" class="btn" @click="goPrev"><Icon name="left" :size="16" />上一期</button>
          <button type="button" class="btn" :disabled="isLatest" @click="goNext">
            下一期<Icon name="right" :size="16" />
          </button>
        </div>
        <RouterLink to="/" class="side-link pc-only">查看全部开奖结果 →</RouterLink>
      </aside>
    </section>

    <!-- 全部回放 -->
    <section ref="listSection" class="list container" aria-labelledby="list-title">
      <div class="list-head">
        <h2 id="list-title" class="section-title">全部回放</h2>
        <form class="filters" @submit.prevent="search" @reset.prevent="resetFilters">
          <label class="f-item">
            <span>开奖日期</span>
            <input v-model="form.date" class="field" type="date" />
          </label>
          <label class="f-item">
            <span>期号</span>
            <input
              v-model="form.period"
              class="field"
              type="text"
              inputmode="numeric"
              maxlength="10"
              placeholder="如 2026011"
              :aria-invalid="!!formError"
              aria-describedby="period-error"
            />
          </label>
          <button type="submit" class="btn btn-primary"><Icon name="search" :size="16" />搜索</button>
          <button type="reset" class="btn">重置</button>
        </form>
      </div>
      <p v-if="formError" id="period-error" class="form-error" role="alert">{{ formError }}</p>

      <div v-if="!videos.loaded.value && videos.loading.value" class="state-box">加载中…</div>
      <div v-else-if="!videos.loaded.value && videos.error.value" class="state-box">
        {{ videos.error.value }}
        <button type="button" class="btn" @click="videos.retry">重试</button>
      </div>
      <div v-else-if="videos.loaded.value && !videoItems.length" class="state-box">
        {{ filtering ? '没有符合条件的开奖视频' : '暂无开奖视频' }}
      </div>
      <template v-else>
        <div class="grid" :class="{ 'is-loading': videos.loading.value && !isMobile }">
          <VideoCard
            v-for="v in videoItems"
            :key="v.period"
            :video="v"
            :active="v.period === current?.period"
            @select="openPeriod"
          />
        </div>
        <LoadMore
          v-if="isMobile"
          :loading="videos.loading.value"
          :has-more="videos.hasMore.value"
          :error="videos.error.value"
          :shown="videos.list.value.length"
          :total="videos.total.value"
          @load="videos.loadMore"
          @retry="videos.retry"
        />
        <AppPagination
          v-else
          :page="videos.page.value"
          :page-count="videos.pageCount.value"
          :disabled="videos.loading.value"
          @change="changePage"
        />
      </template>
    </section>
  </div>
</template>

<style scoped>
.video-page {
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* 播放区 */
.stage {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}
.player-col {
  flex: 999 1 680px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.player-placeholder {
  aspect-ratio: 16 / 9;
  background: var(--thumb);
  border: 1px solid var(--line);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--muted);
  padding: 16px;
  text-align: center;
}
.player-placeholder p {
  margin: 0;
}
.title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.title {
  font-size: 24px;
  font-weight: 700;
}
.title .num {
  font-size: 30px;
}
.sub {
  color: var(--muted);
  font-size: 14px;
}
.side {
  flex: 1 1 340px;
  min-width: 0;
  border-radius: 18px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.side-label {
  font-size: 14px;
  color: var(--muted);
}
.side .side-balls {
  flex-wrap: wrap;
  gap: 12px 8px;
}
.side-nav {
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--line-soft);
  padding-top: 18px;
}
.side-nav .btn {
  flex: 1;
}
.side-link {
  font-size: 14px;
  text-decoration: none;
}

/* 列表 */
.list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  scroll-margin-top: 80px;
}
.list-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.f-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}
.f-item .field {
  width: 180px;
}
.form-error {
  margin: -12px 0 0;
  color: #c62828;
  font-size: 13px;
}
.grid {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
}
.is-loading {
  opacity: 0.5;
  transition: opacity 0.2s;
}
.state-box .btn {
  margin-left: 12px;
}

@media (max-width: 767px) {
  .video-page {
    padding-top: 0;
    gap: 24px;
  }
  .stage {
    padding-left: 0;
    padding-right: 0;
    gap: 14px;
  }
  .player-col {
    gap: 14px;
  }
  .player-placeholder {
    border-radius: 0;
    border-width: 0 0 1px;
  }
  .title-block,
  .side {
    margin: 0 var(--gutter);
  }
  .title {
    font-size: 18px;
  }
  .title .num {
    font-size: 24px;
  }
  .sub {
    font-size: 13px;
  }
  .side {
    padding: 16px;
    gap: 14px;
    border-radius: 14px;
    flex-basis: 100%;
  }
  .side .side-balls {
    flex-wrap: nowrap;
    gap: 5px;
  }
  .side-nav {
    border-top: 0;
    padding-top: 0;
  }
  .pc-only {
    display: none;
  }
  .list {
    gap: 14px;
  }
  .filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
  }
  .f-item {
    font-size: 12px;
  }
  .f-item .field {
    width: 100%;
  }
  .form-error {
    margin-top: -4px;
  }
  .grid {
    gap: 12px;
    background: transparent;
    border: 0;
    border-radius: 0;
    overflow: visible;
  }
}
</style>
