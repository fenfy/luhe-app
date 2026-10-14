<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../Icon.vue'

const props = defineProps({
  /** [{ id, src }] */
  items: { type: Array, required: true },
  /** 当前图片下标 */
  index: { type: Number, required: true },
  /** 图片总数（可能还没全部加载），用于显示 “3 / 46” */
  total: { type: Number, default: 0 },
  /** 说明文字：类别 · 日期 */
  captionOf: { type: Function, default: () => '' },
})
const emit = defineEmits(['update:index', 'close', 'reach-end'])

const MAX_SCALE = 4
const item = computed(() => props.items[props.index])
const count = computed(() => Math.max(props.total, props.items.length))
const hasPrev = computed(() => props.index > 0)
const hasNext = computed(() => props.index < count.value - 1 && props.index < props.items.length - 1)

/* ---------- 缩放与拖动 ---------- */
const view = reactive({ scale: 1, x: 0, y: 0 })
const stage = ref(null)
const imgLoaded = ref(false)
const imgFailed = ref(false)

function resetView() {
  view.scale = 1
  view.x = 0
  view.y = 0
}
function clampPan() {
  const el = stage.value
  if (!el || view.scale <= 1) {
    view.x = 0
    view.y = 0
    return
  }
  const maxX = ((view.scale - 1) * el.clientWidth) / 2
  const maxY = ((view.scale - 1) * el.clientHeight) / 2
  view.x = Math.min(maxX, Math.max(-maxX, view.x))
  view.y = Math.min(maxY, Math.max(-maxY, view.y))
}
function setScale(s) {
  view.scale = Math.min(MAX_SCALE, Math.max(1, s))
  clampPan()
}

function onWheel(e) {
  setScale(view.scale * Math.exp(-e.deltaY * 0.0015))
}
function onDblClick() {
  setScale(view.scale > 1 ? 1 : 2)
}

/* 指针：一指拖动（放大时）或左右滑动切换（未放大时），两指捏合缩放 */
const pointers = new Map()
let pinch = null
let swipe = null
let moved = false

function onPointerDown(e) {
  stage.value?.setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  moved = false
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: view.scale }
    swipe = null
  } else if (pointers.size === 1) {
    swipe = { x: e.clientX, y: e.clientY, dx: 0 }
  }
}
function onPointerMove(e) {
  const prev = pointers.get(e.pointerId)
  if (!prev) return
  const cur = { x: e.clientX, y: e.clientY }
  pointers.set(e.pointerId, cur)
  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()]
    setScale((pinch.scale * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.dist)
    moved = true
    return
  }
  const dx = cur.x - prev.x
  const dy = cur.y - prev.y
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true
  if (view.scale > 1) {
    view.x += dx
    view.y += dy
    clampPan()
  } else if (swipe) {
    swipe.dx = cur.x - swipe.x
  }
}
function onPointerUp(e) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null
  if (pointers.size === 0 && swipe && view.scale === 1) {
    if (swipe.dx > 60) prev()
    else if (swipe.dx < -60) next()
    swipe = null
  }
}
/** 点图片外的空白处关闭（拖动、捏合后不算点击） */
function onStageClick(e) {
  if (!moved && e.target === stage.value && view.scale === 1) emit('close')
}

/* ---------- 切换 ---------- */
function prev() {
  if (hasPrev.value) emit('update:index', props.index - 1)
}
function next() {
  if (hasNext.value) emit('update:index', props.index + 1)
}
watch(
  () => props.index,
  (i) => {
    resetView()
    imgLoaded.value = false
    imgFailed.value = false
    // 快看到已加载部分的末尾时，让列表继续加载
    if (i >= props.items.length - 3 && props.items.length < count.value) emit('reach-end')
  },
  { immediate: true },
)

function onKey(e) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

/* ---------- 打开时锁定页面滚动、焦点移入 ---------- */
const closeBtn = ref(null)
let lastFocus = null
let prevOverflow = ''
onMounted(() => {
  lastFocus = document.activeElement
  prevOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  window.addEventListener('keydown', onKey)
  nextTick(() => closeBtn.value?.focus())
})
onBeforeUnmount(() => {
  document.documentElement.style.overflow = prevOverflow
  window.removeEventListener('keydown', onKey)
  lastFocus?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <div class="viewer" role="dialog" aria-modal="true" aria-label="查看大图">
      <header class="bar">
        <div class="caption">
          <span class="cap-text">{{ item ? captionOf(item) : '' }}</span>
          <span class="counter num">{{ index + 1 }} / {{ count }}</span>
        </div>
        <button ref="closeBtn" type="button" class="icon-btn" aria-label="关闭" @click="emit('close')">
          <Icon name="close" :size="22" />
        </button>
      </header>

      <div
        ref="stage"
        class="stage"
        :class="{ zoomed: view.scale > 1 }"
        @wheel.prevent="onWheel"
        @dblclick="onDblClick"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @click="onStageClick"
      >
        <span v-if="!imgLoaded && !imgFailed" class="hint">加载中…</span>
        <span v-if="imgFailed" class="hint">图片加载失败</span>
        <img
          v-if="item"
          :key="item.id"
          :src="item.src"
          alt=""
          class="photo"
          :class="{ ready: imgLoaded }"
          draggable="false"
          :style="{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }"
          @load="imgLoaded = true"
          @error="imgFailed = true"
        />
      </div>

      <button v-if="hasPrev" type="button" class="nav prev" aria-label="上一张" @click="prev">
        <Icon name="left" :size="28" />
      </button>
      <button v-if="hasNext" type="button" class="nav next" aria-label="下一张" @click="next">
        <Icon name="right" :size="28" />
      </button>

      <p class="tip pc">滚轮缩放 · 双击放大/还原 · ← → 切换 · Esc 关闭</p>
      <p class="tip mobile">双指缩放 · 左右滑动切换</p>
    </div>
  </Teleport>
</template>

<style scoped>
.viewer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: rgba(10, 13, 20, 0.97);
  color: #fff;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px 10px 20px;
  min-height: 56px;
}
.caption {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-width: 0;
  font-size: 15px;
}
.cap-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.counter {
  flex: none;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
}
.icon-btn {
  flex: none;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px 72px 24px;
  touch-action: none;
  user-select: none;
  cursor: zoom-in;
}
.stage.zoomed {
  cursor: grab;
}
.photo {
  /* 小图也放大到可视区域（保持比例） */
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.2s;
  will-change: transform;
}
.photo.ready {
  opacity: 1;
}
.hint {
  position: absolute;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}
.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.nav:hover {
  background: rgba(255, 255, 255, 0.2);
}
.prev {
  left: 12px;
}
.next {
  right: 12px;
}
.tip {
  margin: 0;
  padding: 0 16px 14px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.tip.mobile {
  display: none;
}
@media (max-width: 767px) {
  .bar {
    padding: 6px 8px 6px 16px;
  }
  .caption {
    font-size: 14px;
    gap: 10px;
  }
  .stage {
    padding: 0 0 8px;
  }
  .nav {
    display: none;
  }
  .tip.pc {
    display: none;
  }
  .tip.mobile {
    display: block;
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
  }
}
</style>
