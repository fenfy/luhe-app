<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DrawBalls from './DrawBalls.vue'
import Icon from './Icon.vue'

const props = defineProps({
  src: { type: String, default: '' },
  /** mp4 | hls */
  type: { type: String, default: 'mp4' },
  /** enrichDraw() 后的本期数据，用于封面 */
  draw: { type: Object, default: null },
  poster: { type: String, default: '' },
  autoplay: Boolean,
})

const video = ref(null)
const started = ref(false)
const error = ref('')
let hls = null
let token = 0

function destroyHls() {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

async function attach() {
  const my = ++token
  destroyHls()
  started.value = false
  error.value = ''
  const v = video.value
  if (!v || !props.src) return
  v.removeAttribute('src')
  v.load()

  const nativeHls = v.canPlayType('application/vnd.apple.mpegurl')
  if (props.type === 'hls' && !nativeHls) {
    const { default: Hls } = await import('hls.js')
    if (my !== token) return
    if (!Hls.isSupported()) {
      error.value = '当前浏览器不支持播放该视频'
      return
    }
    hls = new Hls()
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) error.value = '视频加载失败，请稍后重试'
    })
    if (props.autoplay) hls.on(Hls.Events.MANIFEST_PARSED, play)
    hls.loadSource(props.src)
    hls.attachMedia(v)
  } else {
    v.src = props.src
    if (props.autoplay) play()
  }
}

function play() {
  const v = video.value
  if (!v) return
  v.play().catch(() => {
    // 浏览器禁止有声自动播放时改为静音播放
    v.muted = true
    return v.play().catch(() => {})
  })
}

function onError() {
  if (!hls) error.value = '视频加载失败，请稍后重试'
}

watch(() => [props.src, props.type], attach)
onMounted(attach)
onBeforeUnmount(() => {
  token++
  destroyHls()
})
</script>

<template>
  <div class="player">
    <video
      ref="video"
      class="video"
      controls
      playsinline
      preload="metadata"
      :poster="poster || undefined"
      @play="started = true"
      @error="onError"
    />

    <div v-if="!started || error" class="cover" :class="{ 'has-poster': poster }">
      <template v-if="error">
        <p class="error">{{ error }}</p>
        <button type="button" class="btn" @click="attach">重新加载</button>
      </template>
      <template v-else>
        <DrawBalls v-if="draw && !poster" :draw="draw" size="md" class="cover-balls" />
        <button type="button" class="big-play" aria-label="播放" @click="play">
          <Icon name="play" :size="34" />
        </button>
      </template>
    </div>

    <div v-if="draw" class="badges" aria-hidden="true">
      <span class="badge-gold">回放</span>
      <span class="badge-dark">第 {{ draw.period }} 期</span>
    </div>
  </div>
</template>

<style scoped>
.player {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--surface-deep);
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
}
.video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000;
}
.cover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background: var(--surface-deep);
}
.cover.has-poster {
  background: rgba(5, 7, 13, 0.35);
}
.big-play {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 0;
  background: var(--gold);
  color: var(--on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 10px rgba(240, 185, 74, 0.15);
  transition: transform 0.15s;
}
.big-play:hover {
  transform: scale(1.06);
}
.error {
  margin: 0;
  color: #c9cfdb;
}
.badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}
.badge-gold {
  background: var(--gold);
  color: var(--on-gold);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}
.badge-dark {
  background: rgba(5, 7, 13, 0.8);
  color: #fff;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
}

@media (max-width: 767px) {
  .player {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    border-top: 0;
  }
  .cover {
    gap: 14px;
  }
  .cover-balls {
    display: none;
  }
  .big-play {
    width: 64px;
    height: 64px;
    box-shadow: 0 0 0 8px rgba(240, 185, 74, 0.15);
  }
  .badges {
    top: 10px;
    left: 12px;
    gap: 6px;
  }
  .badge-gold {
    font-size: 11px;
    padding: 3px 8px;
  }
  .badge-dark {
    font-size: 12px;
    padding: 3px 8px;
  }
}
</style>
