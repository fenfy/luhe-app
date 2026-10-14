<script setup>
import { LOTTERY } from '../config/lottery.js'
import { useIsMobile } from '../composables/useMediaQuery.js'
import TrendSection from '../components/trend/TrendSection.vue'

const isMobile = useIsMobile()
</script>

<template>
  <div class="container page">
    <header class="page-head">
      <h1 class="page-title">走势图</h1>
      <p class="page-sub">
        {{ LOTTERY.name }}近期开奖统计：号码、波色、尾数、波段、生肖的出现次数。特码另附当前遗漏期数，可分别切换统计期数。
      </p>
    </header>

    <TrendSection type="special" :is-mobile="isMobile" />
    <TrendSection type="normal" :is-mobile="isMobile" />
  </div>
</template>

<style scoped>
.page {
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.page-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: -16px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
}
.page-sub {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
@media (max-width: 767px) {
  .page {
    padding-top: 16px;
    gap: 28px;
  }
  .page-title {
    font-size: 22px;
  }
  .page-sub {
    font-size: 13px;
  }
}
</style>
