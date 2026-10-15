<script setup>
import { useIsMobile } from '../composables/useMediaQuery.js'
import { useLottery } from '../composables/useLottery.js'
import LotterySwitch from '../components/LotterySwitch.vue'
import TrendSection from '../components/trend/TrendSection.vue'

const isMobile = useIsMobile()
const { games, code: lottery, game, setLottery } = useLottery()
</script>

<template>
  <div class="container page">
    <header class="page-head">
      <LotterySwitch :model-value="lottery" :games="games" class="switch" @update:model-value="setLottery" />
      <h1 class="page-title">{{ game.name }}走势图</h1>
      <p class="page-sub">
        {{ game.name }}近期开奖统计：号码、波色、尾数、波段、生肖的出现次数。特码另附当前遗漏期数，可分别切换统计期数。
      </p>
    </header>

    <TrendSection type="special" :lottery="lottery" :is-mobile="isMobile" />
    <TrendSection type="normal" :lottery="lottery" :is-mobile="isMobile" />
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
.switch {
  align-self: flex-start;
  margin-bottom: 12px;
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
