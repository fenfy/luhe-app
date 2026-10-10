<script setup>
import { computed } from 'vue'
import LotteryBall from './LotteryBall.vue'

const props = defineProps({
  /** enrichDraw() 的结果；为空时全部显示为滚动中 */
  draw: { type: Object, default: null },
  size: { type: String, default: 'md' },
  showZodiac: Boolean,
  /** 已揭晓的个数（0~7），用于开奖动画；默认全部揭晓 */
  revealed: { type: Number, default: 7 },
})

const slots = computed(() => {
  const balls = props.draw ? [...props.draw.balls, props.draw.specialBall] : Array(7).fill(null)
  return balls.map((ball, i) => ({ ball, rolling: !ball || i >= props.revealed, special: i === 6 }))
})
</script>

<template>
  <div class="draw-balls" :class="`size-${size}`">
    <template v-for="(s, i) in slots" :key="i">
      <span v-if="s.special" class="plus" aria-hidden="true">+</span>
      <LotteryBall :ball="s.ball" :rolling="s.rolling" :special="s.special" :size="size" :show-zodiac="showZodiac" />
    </template>
  </div>
</template>

<style scoped>
.draw-balls {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.plus {
  display: flex;
  align-items: center;
  color: var(--dim);
  font-size: 28px;
  height: 60px;
  padding: 0 2px;
}
.size-md {
  gap: 8px;
}
.size-md .plus {
  height: 40px;
  font-size: 20px;
}
.size-sm {
  gap: 10px;
}
.size-sm .plus {
  height: 32px;
  font-size: 16px;
}
.size-xs {
  gap: 5px;
}
.size-xs .plus {
  display: none;
}

@media (max-width: 767px) {
  .draw-balls {
    gap: 5px;
  }
  .size-lg .plus,
  .size-md .plus {
    height: 40px;
    font-size: 18px;
    padding: 0;
  }
  .size-sm {
    gap: 4px;
  }
  .size-sm .plus {
    height: 30px;
    font-size: 14px;
  }
  .size-xs {
    gap: 3px;
  }
}
</style>
