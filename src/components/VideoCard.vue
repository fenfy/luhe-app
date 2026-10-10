<script setup>
import DrawBalls from './DrawBalls.vue'
import Icon from './Icon.vue'

defineProps({
  /** enrichDraw() 后的视频对象（含 durationText） */
  video: { type: Object, required: true },
  active: Boolean,
})
defineEmits(['select'])
</script>

<template>
  <!--
    PC：播放列表的一行（缩略图 | 期号日期 | 号码 | 时长 | 播放）
    手机：卡片（上排缩略图 + 标题，下排整行号码）
  -->
  <button
    type="button"
    class="vrow"
    :class="{ on: active }"
    :aria-current="active ? 'true' : undefined"
    :aria-label="`播放第 ${video.period} 期回放`"
    @click="$emit('select', video.period)"
  >
    <div class="thumb">
      <img v-if="video.cover" :src="video.cover" alt="" class="cover-img" loading="lazy" />
      <span class="thumb-play"><Icon name="play" :size="16" /></span>
      <span class="thumb-dur num">{{ video.durationText }}</span>
    </div>

    <div class="info">
      <span class="title">第 <span class="num">{{ video.period }}</span> 期</span>
      <span class="date">{{ video.date }} {{ video.week }} {{ video.time }}</span>
      <span v-if="active" class="playing">正在播放</span>
    </div>

    <DrawBalls :draw="video" size="sm" show-zodiac class="balls" />

    <span class="dur num">{{ video.durationText }}</span>

    <span class="action" aria-hidden="true">
      <Icon name="play" :size="14" /><span class="action-text">{{ active ? '播放中' : '播放' }}</span>
    </span>
  </button>
</template>

<style scoped>
/* ---------- PC：列表行 ---------- */
.vrow {
  display: grid;
  grid-template-columns: 136px minmax(150px, 200px) minmax(0, 1fr) 64px 104px;
  grid-template-areas: 'thumb info balls dur action';
  align-items: center;
  column-gap: 24px;
  width: 100%;
  padding: 14px 24px;
  border: 0;
  border-bottom: 1px solid var(--line-soft);
  background: transparent;
  color: var(--text);
  text-align: left;
}
.vrow:last-child {
  border-bottom: 0;
}
.vrow:hover {
  background: var(--surface-hover);
}
.vrow.on {
  background: rgba(240, 185, 74, 0.07);
}

.thumb {
  grid-area: thumb;
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: var(--thumb);
  border: 1px solid var(--line);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vrow.on .thumb {
  border: 2px solid var(--gold);
}
.cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-play {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(240, 185, 74, 0.15);
  border: 1px solid var(--gold);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.vrow:hover .thumb-play,
.vrow.on .thumb-play {
  background: var(--gold);
  color: var(--on-gold);
}
.thumb-dur {
  display: none;
  position: absolute;
  right: 5px;
  bottom: 5px;
  background: rgba(5, 7, 13, 0.85);
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;
}

.info {
  grid-area: info;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.title {
  font-size: 14px;
}
.title .num {
  font-size: 21px;
  font-weight: 600;
}
.date {
  font-size: 13px;
  color: var(--muted);
}
.playing {
  align-self: flex-start;
  background: var(--gold);
  color: var(--on-gold);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
}

.balls {
  grid-area: balls;
  justify-self: center;
}

.dur {
  grid-area: dur;
  font-size: 16px;
  color: var(--muted);
  text-align: right;
}

.action {
  grid-area: action;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 88px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 14px;
}
.vrow:hover .action {
  border-color: var(--gold);
  color: var(--gold);
}
.vrow.on .action {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--on-gold);
  font-weight: 700;
}

/* ---------- 平板宽度：收窄缩略图，时长放进缩略图，播放键只留图标 ---------- */
@media (min-width: 768px) and (max-width: 1023px) {
  .vrow {
    grid-template-columns: 112px minmax(130px, 170px) minmax(0, 1fr) 44px;
    grid-template-areas: 'thumb info balls action';
    column-gap: 16px;
    padding: 12px 16px;
  }
  .dur {
    display: none;
  }
  .thumb-dur {
    display: block;
  }
  .action {
    min-width: 44px;
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 50%;
  }
  .action-text {
    display: none;
  }
}

/* ---------- 手机：卡片 ---------- */
@media (max-width: 767px) {
  .vrow {
    grid-template-columns: 120px minmax(0, 1fr);
    grid-template-areas:
      'thumb info'
      'balls balls';
    gap: 10px 12px;
    padding: 12px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
  }
  .vrow:last-child {
    border-bottom: 1px solid var(--line);
  }
  .vrow.on {
    border-color: var(--gold);
    background: var(--surface);
  }
  .vrow.on .thumb {
    border: 1px solid var(--line);
  }
  .thumb {
    border-radius: 8px;
  }
  .thumb-play {
    width: auto;
    height: auto;
    background: none !important;
    border: 0;
    color: var(--gold) !important;
  }
  .thumb-dur {
    display: block;
  }
  .info {
    justify-content: center;
  }
  .title .num {
    font-size: 18px;
  }
  .date {
    font-size: 12px;
  }
  .vrow .balls {
    justify-self: stretch;
    justify-content: space-between;
  }
  .dur,
  .action {
    display: none;
  }
}
</style>
