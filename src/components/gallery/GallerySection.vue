<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { getGalleryImages, getGalleryTypes } from '../../api/index.js'
import { GALLERY } from '../../config/lottery.js'
import { ALL_TYPE, captionOf, homeTabs, typeParam } from '../../utils/gallery.js'
import MasonryGrid from './MasonryGrid.vue'
import ImageViewer from './ImageViewer.vue'

/** 首页「图库系列」：当前彩种的「全部」+ 前几个类别，及所选类别的最新图片 */
const props = defineProps({
  isMobile: Boolean,
  /** 当前彩种（跟随首页顶部的彩种切换） */
  lottery: { type: String, required: true },
})

const types = ref([])
const typesError = ref('')
const typesLoaded = ref(false)

// 「全部」+ 最多 GALLERY.homeTypes 个类别，超过时末尾显示「更多」
const tabs = computed(() => homeTabs(types.value, GALLERY.homeTypes))
const shownTypes = computed(() => tabs.value.tabs)
const active = ref(ALL_TYPE)
const activeType = computed(() => shownTypes.value.find((t) => t.value === active.value) || null)

let typesToken = 0
async function loadTypes() {
  const my = ++typesToken
  typesError.value = ''
  try {
    const list = await getGalleryTypes(props.lottery)
    if (my !== typesToken) return
    types.value = list
    typesLoaded.value = true
  } catch (e) {
    if (my === typesToken) typesError.value = e?.message || '图库加载失败'
  }
}
// 切换彩种：回到「全部」并重新加载类别
watch(
  () => props.lottery,
  () => {
    active.value = ALL_TYPE
    loadTypes()
  },
)
// 类别列表变化（首次加载、切换彩种、PC/手机切换）后，当前类别不在展示范围内就回到「全部」
watch(shownTypes, (list) => {
  if (!list.some((t) => t.value === active.value)) active.value = list[0]?.value || ''
})

/* ---------- 当前类别的图片 ---------- */
const images = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const limit = computed(() => (props.isMobile ? GALLERY.homeImages.mobile : GALLERY.homeImages.pc))
let token = 0

async function loadImages() {
  const type = active.value
  if (!type) return
  const my = ++token
  loading.value = true
  error.value = ''
  try {
    const res = await getGalleryImages({ lottery: props.lottery, type: typeParam(type), page: 1, pageSize: limit.value })
    if (my !== token) return
    images.value = res.list
    total.value = res.total
  } catch (e) {
    if (my === token) error.value = e?.message || '图片加载失败'
  } finally {
    if (my === token) loading.value = false
  }
}
// 类别列表加载完成后才取图（切换彩种时 active 可能不变，也要按新彩种重新取）
watch([active, limit, types], () => {
  if (typesLoaded.value && shownTypes.value.some((t) => t.value === active.value)) loadImages()
})

/* ---------- 大图 ---------- */
const viewing = ref(-1)
const caption = (item) => captionOf(item, types.value)

/** 图库页链接：带上当前彩种；「全部」不带类别 */
function galleryTo(t) {
  const params = t && t.value !== ALL_TYPE ? { type: t.value } : {}
  return { name: 'gallery', params, query: { lottery: props.lottery } }
}

onMounted(loadTypes)
</script>

<template>
  <section class="gallery" aria-labelledby="gallery-title">
    <div class="section-head">
      <h2 id="gallery-title" class="section-title">图库系列</h2>
      <RouterLink v-if="!isMobile && shownTypes.length" :to="galleryTo()" class="more-link">更多图库 →</RouterLink>
    </div>

    <div v-if="typesError" class="state-box">
      {{ typesError }}
      <button type="button" class="btn" @click="loadTypes">重试</button>
    </div>
    <div v-else-if="!typesLoaded" class="state-box">加载中…</div>
    <div v-else-if="!shownTypes.length" class="state-box">暂无图库</div>

    <template v-else>
      <div class="tabs" role="tablist" aria-label="图库类别">
        <button
          v-for="t in shownTypes"
          :key="t.value"
          type="button"
          role="tab"
          class="tab"
          :class="{ on: t.value === active }"
          :aria-selected="t.value === active"
          @click="active = t.value"
        >
          {{ t.label }}
        </button>
        <RouterLink v-if="tabs.more" :to="galleryTo()" class="tab more-tab">更多 ›</RouterLink>
      </div>

      <div v-if="error" class="state-box">
        {{ error }}
        <button type="button" class="btn" @click="loadImages">重试</button>
      </div>
      <div v-else-if="!images.length && loading" class="state-box">加载中…</div>
      <template v-else>
        <MasonryGrid
          :class="{ 'is-loading': loading }"
          :items="images"
          :columns="isMobile ? GALLERY.columns.mobile : GALLERY.columns.pc"
          :gap="isMobile ? 8 : 14"
          :alt-of="caption"
          @select="viewing = $event"
        />
        <RouterLink
          v-if="activeType"
          :to="galleryTo(activeType)"
          class="btn view-all"
        >
          查看更多{{ activeType.value === ALL_TYPE ? '图库' : activeType.label }}（共 {{ total }} 张）→
        </RouterLink>
      </template>
    </template>

    <ImageViewer
      v-if="viewing >= 0 && images[viewing]"
      v-model:index="viewing"
      :items="images"
      :total="images.length"
      :caption-of="caption"
      @close="viewing = -1"
    />
  </section>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.more-link {
  font-size: 14px;
  text-decoration: none;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 18px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  text-decoration: none;
  white-space: nowrap;
}
.tab:hover {
  border-color: var(--gold);
  color: var(--text);
}
.tab.on {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--on-gold);
  font-weight: 600;
}
.more-tab {
  color: var(--gold-text);
}
.view-all {
  align-self: center;
  min-width: 240px;
  justify-content: center;
}
.is-loading {
  opacity: 0.5;
  transition: opacity 0.2s;
}
.state-box .btn {
  margin-left: 12px;
}
@media (max-width: 767px) {
  .gallery {
    gap: 12px;
  }
  /* 手机：5 个类别 + 更多，3 列两行，不用横向滚动 */
  .tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .tab {
    min-height: 40px;
    padding: 0 6px;
    font-size: 14px;
    border-radius: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .view-all {
    align-self: stretch;
    min-width: 0;
  }
}
</style>
