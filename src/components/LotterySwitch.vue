<script setup>
/** 彩种切换：云顶 / 新澳门 / 香港 */
defineProps({
  games: { type: Array, required: true },
  modelValue: { type: String, required: true },
  /** 每个彩种下方的小字（如开奖时间），可选：{ [code]: text } */
  notes: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="lottery-switch" :class="{ 'has-notes': notes }" role="group" aria-label="选择彩种">
    <button
      v-for="g in games"
      :key="g.code"
      type="button"
      class="opt"
      :class="{ on: g.code === modelValue }"
      :aria-pressed="g.code === modelValue"
      @click="emit('update:modelValue', g.code)"
    >
      <span class="name">{{ g.shortName }}</span>
      <span v-if="notes" class="note num">{{ notes[g.code] || ' ' }}</span>
    </button>
  </div>
</template>

<style scoped>
.lottery-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  max-width: 100%;
}
.opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font-size: 15px;
  white-space: nowrap;
}
.has-notes .opt {
  min-height: 52px;
  padding: 4px 22px;
}
.opt:hover {
  background: var(--surface-hover);
}
.opt.on {
  background: var(--gold);
  color: var(--on-gold);
  font-weight: 600;
}
.note {
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}
.opt.on .note {
  color: var(--on-gold);
  opacity: 0.8;
}
@media (max-width: 767px) {
  .lottery-switch {
    display: flex;
    width: 100%;
  }
  .opt {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 6px;
    font-size: 14px;
  }
  .has-notes .opt {
    padding: 4px 6px;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .note {
    font-size: 11px;
  }
}
</style>
