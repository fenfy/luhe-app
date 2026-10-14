<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { layoutMasonry } from '../../utils/masonry.js'

const props = defineProps({
  /** [{ id, src }] */
  items: { type: Array, required: true },
  columns: { type: Number, default: 4 },
  /** 卡片间距（px） */
  gap: { type: Number, default: 12 },
  /** 无障碍：每张图的说明 */
  altOf: { type: Function, default: () => '图库图片' },
})
const emit = defineEmits(['select'])

/** 图片还没加载出来时的占位比例（高/宽） */
const PLACEHOLDER_RATIO = 4 / 3

/* 图片尺寸：id → { ratio, failed }。只有尺寸已知的图片才放进列里，避免加载后跳动 */
const sizes = reactive({})
const measuring = new Set()

function measure(item) {
  if (sizes[item.id] || measuring.has(item.id)) return
  measuring.add(item.id)
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1
    sizes[item.id] = { ratio: Math.min(Math.max(ratio, 0.25), 4), failed: false }
    measuring.delete(item.id)
  }
  img.onerror = () => {
    sizes[item.id] = { ratio: 0.75, failed: true }
    measuring.delete(item.id)
  }
  img.src = item.src
}
watch(() => props.items, (list) => list.forEach(measure), { immediate: true })

/** 按顺序已知尺寸的前几项（中间有一张没加载完，后面的先等着，保证顺序） */
const readyCount = computed(() => {
  let n = 0
  while (n < props.items.length && sizes[props.items[n].id]) n++
  return n
})

/* 列宽：用来把 px 间距换算成比例 */
const root = ref(null)
const width = ref(0)
let ro = null
onMounted(() => {
  ro = new ResizeObserver((entries) => {
    width.value = entries[0].contentRect.width
  })
  if (root.value) ro.observe(root.value)
})
onBeforeUnmount(() => ro?.disconnect())

const colWidth = computed(() => {
  const w = width.value || props.columns * 240
  return Math.max(1, (w - props.gap * (props.columns - 1)) / props.columns)
})

/** 已就绪的图片 + 最多一行占位块 */
const cells = computed(() => {
  const ready = props.items.slice(0, readyCount.value).map((item, i) => ({
    key: item.id,
    index: i,
    item,
    ratio: sizes[item.id].ratio,
    failed: sizes[item.id].failed,
  }))
  const pending = Math.min(props.items.length - readyCount.value, props.columns)
  for (let i = 0; i < pending; i++) {
    ready.push({ key: `ph-${readyCount.value + i}`, index: -1, ratio: PLACEHOLDER_RATIO, placeholder: true })
  }
  return ready
})

const columnsOfCells = computed(() =>
  layoutMasonry(
    cells.value.map((c) => c.ratio),
    props.columns,
    props.gap / colWidth.value,
  ).map((col) => col.map((i) => cells.value[i])),
)
</script>

<template>
  <div ref="root" class="masonry" :style="{ '--gap': `${gap}px` }">
    <div v-for="(col, ci) in columnsOfCells" :key="ci" class="col">
      <template v-for="c in col" :key="c.key">
        <div v-if="c.placeholder" class="tile ph" :style="{ aspectRatio: `1 / ${c.ratio}` }" aria-hidden="true" />
        <button
          v-else
          type="button"
          class="tile"
          :style="{ aspectRatio: `1 / ${c.ratio}` }"
          :aria-label="`查看大图：${altOf(c.item)}`"
          @click="emit('select', c.index)"
        >
          <span v-if="c.failed" class="broken">图片加载失败</span>
          <img v-else :src="c.item.src" :alt="altOf(c.item)" loading="lazy" decoding="async" />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.masonry {
  display: flex;
  align-items: flex-start;
  gap: var(--gap);
}
.col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}
.tile {
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-hover);
  cursor: zoom-in;
  transition: box-shadow 0.2s, transform 0.2s;
}
.tile:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.tile:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  cursor: default;
  background: linear-gradient(100deg, var(--surface-hover) 30%, var(--line-soft) 50%, var(--surface-hover) 70%);
  background-size: 300% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
.ph:hover {
  box-shadow: none;
  transform: none;
}
.broken {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: var(--faint);
}
@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}
@media (max-width: 767px) {
  .tile {
    border-radius: 10px;
  }
  .tile:hover {
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ph {
    animation: none;
  }
}
</style>
