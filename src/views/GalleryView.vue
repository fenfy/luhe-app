<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGalleryImages, getGalleryTypes } from '../api/index.js'
import { GALLERY } from '../config/lottery.js'
import { ALL_TYPE, captionOf, typeParam, typesWithAll } from '../utils/gallery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import { usePagedList } from '../composables/usePagedList.js'
import { useLottery } from '../composables/useLottery.js'
import LotterySwitch from '../components/LotterySwitch.vue'
import MasonryGrid from '../components/gallery/MasonryGrid.vue'
import ImageViewer from '../components/gallery/ImageViewer.vue'
import LoadMore from '../components/LoadMore.vue'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()

/* ---------- 彩种：URL ?lottery= 优先，其次上次选择（与首页共用） ---------- */
const { games, code: lottery, setLottery } = useLottery()

/* ---------- 类别（最前面是「全部」：该彩种下的全部图片） ---------- */
const types = ref([])
const typesLoaded = ref(false)
const typesError = ref('')
const shownTypes = computed(() => typesWithAll(types.value))

/** 路由不带类别即「全部」 */
const routeType = computed(() => (typeof route.params.type === 'string' && route.params.type ? route.params.type : ALL_TYPE))
const current = computed(() => shownTypes.value.find((t) => t.value === routeType.value) || null)

let typesToken = 0
async function loadTypes() {
  const my = ++typesToken
  typesError.value = ''
  typesLoaded.value = false
  try {
    const list = await getGalleryTypes(lottery.value)
    if (my !== typesToken) return
    types.value = list
    typesLoaded.value = true
  } catch (e) {
    if (my === typesToken) typesError.value = e?.message || '图库加载失败'
  }
}
watch(lottery, loadTypes)

/** 类别不存在（已删除、该彩种下没有图片）时回到「全部」 */
watch([shownTypes, routeType], () => {
  if (!typesLoaded.value || current.value || !shownTypes.value.length) return
  router.replace({ name: 'gallery', query: route.query })
})

/* ---------- 图片：PC、手机都是滚动加载 ---------- */
const appendMode = ref(true)
const images = usePagedList(
  (p) => getGalleryImages({ ...p, lottery: lottery.value, type: typeParam(current.value?.value) }),
  { pageSize: GALLERY.pageSize, isMobile: appendMode },
)
/** 彩种或类别变化时重新加载（等类别列表加载完再取图，避免用到上一个彩种的类别） */
watch(
  () => (typesLoaded.value && current.value ? `${lottery.value}/${current.value.value}` : ''),
  (key) => {
    if (!key) return
    viewing.value = -1
    images.reset()
    window.scrollTo({ top: 0 })
  },
)

/* ---------- 大图 ---------- */
const viewing = ref(-1)
const caption = (item) => captionOf(item, types.value)

/* ---------- 手机：全部类别面板，当前类别滚到可见 ---------- */
const panelOpen = ref(false)
const chips = ref(null)
watch(
  () => current.value?.value,
  async () => {
    panelOpen.value = false
    await nextTick()
    chips.value?.querySelector('.chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  },
)
/** 类别链接：「全部」不带类别；保留 ?lottery= */
const typeTo = (t) => ({
  name: 'gallery',
  params: t.value === ALL_TYPE ? {} : { type: t.value },
  query: route.query,
})

onMounted(loadTypes)
</script>

<template>
  <div class="gallery-page">
    <div class="container lottery-bar">
      <LotterySwitch :model-value="lottery" :games="games" @update:model-value="setLottery" />
    </div>

    <div v-if="typesError" class="container state-box">
      {{ typesError }}
      <button type="button" class="btn" @click="loadTypes">重试</button>
    </div>
    <div v-else-if="!typesLoaded" class="container state-box">加载中…</div>
    <div v-else-if="!shownTypes.length" class="container state-box">该彩种暂无图库</div>

    <template v-else>
      <!-- 手机：类别横条 + 全部类别面板 -->
      <nav v-if="isMobile" class="m-bar" aria-label="图库类别">
        <div ref="chips" class="chips">
          <RouterLink
            v-for="t in shownTypes"
            :key="t.value"
            :to="typeTo(t)"
            replace
            class="chip"
            :class="{ on: t.value === current?.value }"
          >
            {{ t.label }}
          </RouterLink>
        </div>
        <button type="button" class="all-btn" :aria-expanded="panelOpen" @click="panelOpen = !panelOpen">
          <Icon name="grid" :size="16" />全部
        </button>
      </nav>
      <div v-if="isMobile && panelOpen" class="panel-mask" @click.self="panelOpen = false">
        <div class="panel" role="dialog" aria-label="全部图库类别">
          <div class="panel-head">
            <span>全部类别（{{ shownTypes.length }}）</span>
            <button type="button" class="panel-close" aria-label="关闭" @click="panelOpen = false">
              <Icon name="close" :size="20" />
            </button>
          </div>
          <div class="panel-grid">
            <RouterLink
              v-for="t in shownTypes"
              :key="t.value"
              :to="typeTo(t)"
              replace
              class="cell"
              :class="{ on: t.value === current?.value }"
            >
              {{ t.label }}
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="container layout">
        <!-- PC：左侧类别栏 -->
        <aside v-if="!isMobile" class="side card" aria-label="图库类别">
          <div class="side-title">图库类别</div>
          <nav class="side-list">
            <RouterLink
              v-for="t in shownTypes"
              :key="t.value"
              :to="typeTo(t)"
              class="side-item"
              :class="{ on: t.value === current?.value }"
            >
              <span class="side-label">{{ t.label }}</span>
              <span class="side-count num">{{ t.count }}</span>
            </RouterLink>
          </nav>
        </aside>

        <main class="main">
          <header v-if="current" class="head">
            <h1 class="title">{{ current.value === ALL_TYPE ? '全部图库' : current.label }}</h1>
            <span class="section-meta">共 {{ images.total.value || current.count }} 张</span>
          </header>

          <div v-if="!images.loaded.value && images.loading.value" class="state-box">加载中…</div>
          <div v-else-if="!images.loaded.value && images.error.value" class="state-box">
            {{ images.error.value }}
            <button type="button" class="btn" @click="images.retry">重试</button>
          </div>
          <div v-else-if="images.loaded.value && !images.list.value.length" class="state-box">暂无图片</div>
          <template v-else>
            <MasonryGrid
              :items="images.list.value"
              :columns="isMobile ? GALLERY.columns.mobile : GALLERY.columns.pc"
              :gap="isMobile ? 8 : 14"
              :alt-of="caption"
              @select="viewing = $event"
            />
            <LoadMore
              :loading="images.loading.value"
              :has-more="images.hasMore.value"
              :error="images.error.value"
              :shown="images.list.value.length"
              :total="images.total.value"
              unit="张"
              :label="isMobile ? '上滑加载更多' : '继续滚动加载更多'"
              @load="images.loadMore"
              @retry="images.retry"
            />
          </template>
        </main>
      </div>

      <ImageViewer
        v-if="viewing >= 0 && images.list.value[viewing]"
        v-model:index="viewing"
        :items="images.list.value"
        :total="images.total.value"
        :caption-of="caption"
        @reach-end="images.loadMore"
        @close="viewing = -1"
      />
    </template>
  </div>
</template>

<style scoped>
.gallery-page {
  padding-top: 32px;
}
.lottery-bar {
  margin-bottom: 20px;
}
.layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
.side {
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 112px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  padding: 16px 10px 10px;
}
.side-title {
  font-size: 13px;
  color: var(--muted);
  padding: 0 10px 10px;
}
.side-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.side-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--text);
  text-decoration: none;
  font-size: 15px;
  border-left: 3px solid transparent;
}
.side-item:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.side-item.on {
  background: var(--surface-hover);
  border-left-color: var(--gold);
  font-weight: 600;
}
.side-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.side-count {
  flex: none;
  font-size: 12px;
  color: var(--faint);
}
.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.head {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.title {
  font-size: 26px;
  font-weight: 700;
}
.state-box .btn {
  margin-left: 12px;
}

/* 手机 */
.m-bar {
  position: sticky;
  top: 56px;
  z-index: 15;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(8px);
}
.chips {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 12px 10px var(--gutter);
  scrollbar-width: none;
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip,
.cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  white-space: nowrap;
  text-decoration: none;
}
.chip.on,
.cell.on {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--on-gold);
  font-weight: 600;
}
.all-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 0 var(--gutter) 0 12px;
  border: 0;
  border-left: 1px solid var(--line-soft);
  background: transparent;
  color: var(--text);
  font-size: 14px;
}
.panel-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(10, 13, 20, 0.45);
  display: flex;
  align-items: flex-end;
}
.panel {
  width: 100%;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 16px 16px 0 0;
  padding: 8px var(--gutter) calc(16px + env(safe-area-inset-bottom));
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
}
.panel-close {
  width: 44px;
  height: 44px;
  margin-right: -10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--muted);
}
.panel-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
  padding: 4px 0;
}
.cell {
  padding: 0 4px;
  border-radius: 10px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 767px) {
  .gallery-page {
    padding-top: 0;
  }
  .layout {
    display: block;
    padding-top: 14px;
  }
  .main {
    gap: 12px;
  }
  .title {
    font-size: 20px;
  }
}
</style>
