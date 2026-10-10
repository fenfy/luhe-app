<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { splitDuration } from '../utils/lottery.js'

const props = defineProps({
  /** 目标时间戳（毫秒） */
  target: { type: Number, required: true },
})
const emit = defineEmits(['end'])

const now = ref(Date.now())
let timer = null
let endedFor = null

const left = computed(() => Math.max(0, props.target - now.value))
const parts = computed(() => splitDuration(left.value))
const label = computed(() => `距开奖还有 ${parts.value.h} 小时 ${parts.value.m} 分 ${parts.value.s} 秒`)

function tick() {
  now.value = Date.now()
  if (left.value === 0 && endedFor !== props.target) {
    endedFor = props.target
    emit('end')
  }
}

watch(() => props.target, tick)

onMounted(() => {
  tick()
  timer = setInterval(tick, 250)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="countdown" role="timer" :aria-label="label">
    <div class="unit">
      <div class="digit num">{{ parts.h }}</div>
      <span class="unit-label">时</span>
    </div>
    <span class="colon num" aria-hidden="true">:</span>
    <div class="unit">
      <div class="digit num">{{ parts.m }}</div>
      <span class="unit-label">分</span>
    </div>
    <span class="colon num" aria-hidden="true">:</span>
    <div class="unit">
      <div class="digit num is-sec">{{ parts.s }}</div>
      <span class="unit-label">秒</span>
    </div>
  </div>
</template>

<style scoped>
.countdown {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.digit {
  width: 78px;
  height: 92px;
  border-radius: 14px;
  background: var(--bg);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 58px;
  font-weight: 700;
}
.is-sec {
  color: var(--gold);
}
.colon {
  height: 92px;
  display: flex;
  align-items: center;
  font-size: 40px;
  color: var(--gold);
}
.unit-label {
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 767px) {
  .countdown {
    justify-content: center;
  }
  .digit {
    width: 64px;
    height: 68px;
    border-radius: 12px;
    font-size: 42px;
  }
  .colon {
    height: 68px;
    font-size: 30px;
  }
  .unit {
    gap: 4px;
  }
}
</style>
