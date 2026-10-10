<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { pad2 } from '../utils/lottery.js'

const props = defineProps({
  /** toBall() 返回的对象；rolling 时可为空 */
  ball: { type: Object, default: null },
  /** lg | md | sm | xs */
  size: { type: String, default: 'md' },
  special: Boolean,
  /** 滚动中（未揭晓） */
  rolling: Boolean,
  showZodiac: Boolean,
})

const rollingNum = ref('00')
let timer = null

function stop() {
  clearInterval(timer)
  timer = null
}

watch(
  () => props.rolling,
  (on) => {
    stop()
    if (on) {
      timer = setInterval(() => {
        rollingNum.value = pad2(1 + Math.floor(Math.random() * 49))
      }, 80)
    }
  },
  { immediate: true },
)

onBeforeUnmount(stop)
</script>

<template>
  <div class="ball-wrap" :class="`size-${size}`">
    <div
      class="ball num"
      :class="[rolling || !ball ? 'is-rolling' : `wave-${ball.wave}`, { 'is-special': special }]"
      :aria-label="rolling || !ball ? '开奖中' : `${special ? '特码 ' : ''}${ball.num} 号 ${ball.zodiac}`"
      role="img"
    >
      {{ rolling || !ball ? rollingNum : ball.num }}
    </div>
    <span v-if="showZodiac" class="zodiac" :class="{ 'is-special': special }" aria-hidden="true">
      {{ rolling || !ball ? '?' : ball.zodiac }}
    </span>
  </div>
</template>

<style scoped>
.ball-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: none;
}
.ball {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  box-shadow:
    inset -4px -6px 10px rgba(0, 0, 0, 0.35),
    inset 3px 4px 8px rgba(255, 255, 255, 0.28);
}
.wave-red {
  background: var(--red);
}
.wave-blue {
  background: var(--blue);
}
.wave-green {
  background: var(--green);
}
.is-rolling {
  background: #39425a;
  color: #dfe4ee;
}
.ball.is-special {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}
.ball:not(.is-rolling) {
  animation: pop 0.35s ease-out;
}
@keyframes pop {
  from {
    transform: scale(0.6);
  }
  to {
    transform: scale(1);
  }
}

.zodiac {
  font-size: 14px;
  color: var(--muted);
  line-height: 1;
}
.zodiac.is-special {
  color: var(--gold);
}

.size-lg .ball {
  width: 60px;
  height: 60px;
  font-size: 30px;
}
.size-md .ball {
  width: 40px;
  height: 40px;
  font-size: 22px;
}
.size-md {
  gap: 6px;
}
.size-md .zodiac {
  font-size: 12px;
}
.size-sm .ball {
  width: 32px;
  height: 32px;
  font-size: 17px;
  box-shadow:
    inset -2px -3px 6px rgba(0, 0, 0, 0.35),
    inset 2px 2px 4px rgba(255, 255, 255, 0.25);
}
.size-sm {
  gap: 4px;
}
.size-sm .zodiac {
  font-size: 12px;
}
.size-sm .ball.is-special,
.size-xs .ball.is-special {
  outline-offset: 2px;
}
.size-xs .ball {
  width: 24px;
  height: 24px;
  font-size: 13px;
  box-shadow: none;
}
.size-xs .ball.is-special {
  outline-width: 1.5px;
}

@media (max-width: 767px) {
  .size-lg .ball,
  .size-md .ball {
    width: 38px;
    height: 38px;
    font-size: 21px;
  }
  .size-lg {
    gap: 6px;
  }
  .size-lg .zodiac {
    font-size: 12px;
  }
  .size-sm .ball {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }
  .size-sm .zodiac {
    font-size: 11px;
  }
  .size-xs .ball {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }
  .size-xs .ball.is-special {
    outline-offset: 1px;
  }
}
@media (max-width: 380px) {
  .size-lg .ball,
  .size-md .ball {
    width: 34px;
    height: 34px;
    font-size: 19px;
  }
  .size-sm .ball {
    width: 27px;
    height: 27px;
    font-size: 15px;
  }
}
</style>
