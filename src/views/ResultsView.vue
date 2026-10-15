<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { getDrawHistory } from '../api/index.js'
import { PAGE_SIZE } from '../config/lottery.js'
import { enrichDraw, issueHint, normalizeIssue } from '../utils/lottery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import { usePagedList } from '../composables/usePagedList.js'
import { useLottery } from '../composables/useLottery.js'
import LotterySwitch from '../components/LotterySwitch.vue'
import HistoryList from '../components/HistoryList.vue'
import AppPagination from '../components/AppPagination.vue'
import LoadMore from '../components/LoadMore.vue'
import Icon from '../components/Icon.vue'

const isMobile = useIsMobile()
const { games, code: lottery, game, setLottery } = useLottery()

/* ---------- 筛选 ---------- */
const form = reactive({ date: '', period: '' })
const filters = reactive({ date: '', period: '' })
const formError = ref('')
const filtering = computed(() => !!(filters.date || filters.period))

const pageSize = computed(() => (isMobile.value ? PAGE_SIZE.mobile : PAGE_SIZE.history))
const history = usePagedList((p) => getDrawHistory({ ...p, lottery: lottery.value, date: filters.date, period: filters.period }), {
  pageSize,
  isMobile,
})
const items = computed(() => history.list.value.map(enrichDraw))

function search() {
  const raw = form.period.trim()
  const period = raw ? normalizeIssue(raw, lottery.value) : ''
  if (raw && !period) {
    formError.value = issueHint(lottery.value)
    return
  }
  formError.value = ''
  filters.date = form.date
  filters.period = period
  history.reset()
}
function resetFilters() {
  form.date = ''
  form.period = ''
  formError.value = ''
  if (!filtering.value) return
  filters.date = ''
  filters.period = ''
  history.reset()
}

const listSection = ref(null)
function changePage(p) {
  history.goTo(p).then(() => listSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// 切换彩种：清空筛选，重新加载
watch(lottery, () => {
  form.date = ''
  form.period = ''
  formError.value = ''
  filters.date = ''
  filters.period = ''
  history.reset()
})

history.reset()
</script>

<template>
  <div class="container page">
    <section ref="listSection" class="results" aria-labelledby="results-title">
      <LotterySwitch :model-value="lottery" :games="games" class="switch" @update:model-value="setLottery" />
      <div class="head">
        <div class="title-wrap">
          <h1 id="results-title" class="page-title">{{ game.name }}开奖公告</h1>
          <span class="section-meta">
            共 {{ history.total.value }} 期<template v-if="!isMobile && !filtering"> · 每页 {{ pageSize }} 期</template>
          </span>
        </div>
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
              :placeholder="lottery === 'hk' ? '如 2026112' : '如 2026285'"
              :aria-invalid="!!formError"
              aria-describedby="results-period-error"
            />
          </label>
          <button type="submit" class="btn btn-primary"><Icon name="search" :size="16" />搜索</button>
          <button type="reset" class="btn">重置</button>
        </form>
      </div>
      <p v-if="formError" id="results-period-error" class="form-error" role="alert">{{ formError }}</p>

      <div v-if="!history.loaded.value && history.loading.value" class="state-box">加载中…</div>
      <div v-else-if="!history.loaded.value && history.error.value" class="state-box">
        {{ history.error.value }}
        <button type="button" class="btn" @click="history.retry">重试</button>
      </div>
      <div v-else-if="history.loaded.value && !items.length" class="state-box">
        {{ filtering ? '没有符合条件的开奖记录（未开奖或未到公布时间）' : '暂无开奖记录' }}
      </div>
      <template v-else>
        <div :class="{ 'is-loading': history.loading.value && !isMobile }">
          <HistoryList :items="items" :is-mobile="isMobile" :lottery="lottery" />
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
  padding-top: 32px;
}
.results {
  display: flex;
  flex-direction: column;
  gap: 24px;
  scroll-margin-top: 80px;
}
.switch {
  align-self: flex-start;
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 20px;
  flex-wrap: wrap;
}
.title-wrap {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
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
  }
  .results {
    gap: 14px;
  }
  .page-title {
    font-size: 22px;
  }
  .filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: 10px;
  }
  .f-item .field {
    width: 100%;
  }
  .form-error {
    margin-top: -6px;
  }
}
</style>
