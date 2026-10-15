<script setup>
import { computed } from 'vue'
import { formatMonthDay, localClock, localDayKey, weekdayOf } from '../utils/lottery.js'
import DrawBalls from './DrawBalls.vue'
import CountdownDigits from './CountdownDigits.vue'
import Icon from './Icon.vue'

const props = defineProps({
  /** 当前彩种 { code, name, drawTime, schedule } */
  game: { type: Object, required: true },
  /** enrichDraw() 后的最新一期 */
  draw: { type: Object, default: null },
  /** { period, drawAt }；香港未排期时为空 */
  next: { type: Object, default: null },
  /** idle | waiting | revealing */
  phase: { type: String, default: 'idle' },
  revealed: { type: Number, default: 7 },
})
const emit = defineEmits(['countdown-end'])

const waiting = computed(() => props.phase === 'waiting')
const shownPeriod = computed(() => (waiting.value ? props.next?.period : props.draw?.period) || '')
// 背景大字：期号的天数部分
const seqText = computed(() => shownPeriod.value.slice(-3))
const empty = computed(() => !props.draw && props.phase === 'idle')
const nextTarget = computed(() => (props.next ? Date.parse(props.next.drawAt) : 0))
const nextDay = computed(() => {
  if (!props.next) return ''
  const at = Date.parse(props.next.drawAt)
  const key = localDayKey(at)
  return `${formatMonthDay(key)} ${weekdayOf(key)} ${localClock(at)}`
})
const daily = computed(() => props.game.schedule !== 'scheduled')
const replayTo = computed(() => ({
  name: 'video',
  query: { lottery: props.game.code, ...(props.draw ? { period: props.draw.period } : {}) },
}))

const fmtDate = (iso) => {
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}
</script>

<template>
  <section class="hero" aria-label="最新开奖">
    <div class="hero-main card">
      <div class="bg-seq num" aria-hidden="true">{{ seqText }}</div>
      <div class="head">
        <div class="eyebrow"><span class="dot" />{{ game.name }} · {{ waiting ? '正在开奖' : '最新开奖' }}</div>
        <h1 class="title">
          第 <span class="num period">{{ shownPeriod || '-------' }}</span> 期
        </h1>
        <div class="meta" aria-live="polite">
          <template v-if="waiting">开奖中…号码即将揭晓</template>
          <template v-else-if="phase === 'revealing'">号码揭晓中…</template>
          <template v-else-if="draw">{{ fmtDate(draw.drawAt) }}</template>
        </div>
      </div>

      <p v-if="empty" class="empty">暂无开奖结果，敬请期待首期开奖</p>
      <DrawBalls v-else :draw="waiting ? null : draw" :revealed="phase === 'revealing' ? revealed : 7" size="lg" show-zodiac />

      <div v-if="draw" class="actions only-pc">
        <RouterLink :to="replayTo" class="btn btn-primary btn-tall"><Icon name="play" />观看本期开奖回放</RouterLink>
        <span class="hint">生肖按{{ draw.zodiacName }}年（开奖日所在农历年）对照</span>
      </div>
    </div>

    <div class="hero-next card">
      <div class="next-head">
        <div class="next-label">距下期开奖</div>
        <div class="next-period">
          第 <span class="num">{{ next?.period || '-------' }}</span> 期
        </div>
        <div class="next-day">{{ nextDay }}</div>
      </div>
      <CountdownDigits v-if="next" :key="game.code + next.period" :target="nextTarget" @end="emit('countdown-end')" />
      <p v-else class="no-next">下期开奖时间待公布</p>
      <div class="next-foot only-pc">
        <Icon name="clock" :size="16" />
        <template v-if="daily">每天 {{ game.drawTime }} 准时开奖，归零后号码逐个揭晓</template>
        <template v-else>开奖日期以官方排期为准，归零后号码逐个揭晓</template>
      </div>
      <RouterLink v-if="draw" :to="replayTo" class="btn btn-primary btn-tall only-mobile"><Icon name="play" />观看本期开奖回放</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.no-next {
  margin: 0;
  padding: 18px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--muted);
  text-align: center;
}
.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.hero-main {
  flex: 999 1 600px;
  min-width: 0;
  border-top: 2px solid var(--gold);
  padding: 36px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 30px;
}
.hero-main > *:not(.bg-seq) {
  position: relative;
}
.bg-seq {
  position: absolute;
  right: -8px;
  bottom: -56px;
  font-size: 240px;
  font-weight: 700;
  line-height: 1;
  color: var(--surface-hover);
  pointer-events: none;
  user-select: none;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--gold-text);
  font-size: 14px;
  letter-spacing: 1px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gold);
}
.title {
  font-size: 22px;
  font-weight: 500;
}
.period {
  font-size: 52px;
  font-weight: 700;
  letter-spacing: 1px;
}
.meta {
  color: var(--muted);
  font-size: 15px;
  min-height: 22px;
}
.empty {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  min-height: 60px;
  display: flex;
  align-items: center;
}
.actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.btn-tall {
  min-height: 48px;
  padding: 0 24px;
  border-radius: 12px;
}
.hint {
  color: var(--muted);
  font-size: 14px;
}

.hero-next {
  flex: 1 1 360px;
  min-width: 0;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 22px;
}
.next-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.next-label {
  color: var(--muted);
  font-size: 14px;
  letter-spacing: 1px;
}
.next-period {
  font-size: 18px;
}
.next-period .num {
  font-size: 28px;
  font-weight: 700;
}
.next-day {
  color: var(--muted);
  font-size: 14px;
}
.next-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
  border-top: 1px solid var(--line-soft);
  padding-top: 18px;
}
.only-mobile {
  display: none;
}

/* 手机端：两块合成一张卡片 */
@media (max-width: 767px) {
  .hero {
    gap: 0;
    background: var(--surface);
    border: 1px solid var(--line);
    border-top: 2px solid var(--gold);
    border-radius: 18px;
    overflow: hidden;
  }
  .hero-main,
  .hero-next {
    flex-basis: 100%;
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .hero-main {
    padding: 20px 20px 18px;
    gap: 20px;
  }
  .bg-seq {
    font-size: 140px;
    top: -24px;
    bottom: auto;
    right: -6px;
  }
  .eyebrow {
    font-size: 13px;
    gap: 8px;
  }
  .title {
    font-size: 18px;
  }
  .period {
    font-size: 38px;
  }
  .meta {
    font-size: 13px;
  }
  .hero-next {
    padding: 18px 20px 20px;
    margin: 0 20px;
    padding-left: 0;
    padding-right: 0;
    border-top: 1px solid var(--line-soft);
    gap: 14px;
  }
  .next-head {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 8px;
  }
  .next-label {
    display: none;
  }
  .next-period {
    font-size: 13px;
    color: var(--muted);
  }
  .next-period::before {
    content: '距';
  }
  .next-period::after {
    content: '开奖';
  }
  .next-period .num {
    font-size: 17px;
    color: var(--text);
    font-weight: 600;
  }
  .next-day {
    font-size: 13px;
  }
  .only-pc {
    display: none;
  }
  .only-mobile {
    display: inline-flex;
    width: 100%;
    margin-top: 6px;
  }
}
</style>
