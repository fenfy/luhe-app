<script setup>
import DrawBalls from './DrawBalls.vue'
import LotteryBall from './LotteryBall.vue'
import Icon from './Icon.vue'

defineProps({
  /** enrichDraw() 后的列表 */
  items: { type: Array, required: true },
  isMobile: Boolean,
})

const replayTo = (period) => ({ name: 'video', query: { period } })
</script>

<template>
  <!-- 手机：卡片列表 -->
  <ul v-if="isMobile" class="m-list">
    <li v-for="d in items" :key="d.period" class="m-item">
      <div class="m-top">
        <span class="m-period">第 <span class="num">{{ d.period }}</span> 期</span>
        <span class="m-date">{{ d.date }} {{ d.week }}</span>
      </div>
      <div class="m-bottom">
        <DrawBalls :draw="d" size="sm" show-zodiac class="m-balls" />
        <RouterLink :to="replayTo(d.period)" class="m-replay" :aria-label="`观看第 ${d.period} 期回放`">
          <Icon name="play" :size="16" />
        </RouterLink>
      </div>
    </li>
  </ul>

  <!-- PC：表格 -->
  <div v-else class="table-box">
    <div class="table" role="table" aria-label="历史开奖">
      <div class="row head" role="row">
        <span role="columnheader">期号</span>
        <span role="columnheader">开奖时间</span>
        <span role="columnheader">开奖号码</span>
        <span role="columnheader">特码</span>
        <span role="columnheader" class="right">回放</span>
      </div>
      <div v-for="d in items" :key="d.period" class="row" role="row">
        <span role="cell" class="num period">{{ d.period }}</span>
        <span role="cell" class="date">{{ d.date }} {{ d.week }} {{ d.time }}</span>
        <div role="cell" class="balls">
          <LotteryBall v-for="b in d.balls" :key="b.value" :ball="b" size="sm" class="inline-ball" show-zodiac />
        </div>
        <div role="cell">
          <LotteryBall :ball="d.specialBall" size="sm" special class="inline-ball" show-zodiac />
        </div>
        <div role="cell" class="right">
          <RouterLink :to="replayTo(d.period)" class="btn replay" :aria-label="`观看第 ${d.period} 期回放`">
            <Icon name="play" :size="14" />回放
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* PC 表格 */
.table-box {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
}
.table {
  min-width: 900px;
}
.row {
  display: grid;
  grid-template-columns: 150px 210px minmax(0, 1fr) 100px 120px;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--line-soft);
}
.row:last-child {
  border-bottom: 0;
}
.row:not(.head):hover {
  background: var(--surface-hover);
}
.head {
  color: var(--muted);
  font-size: 13px;
  padding-top: 14px;
  padding-bottom: 14px;
}
.period {
  font-size: 21px;
  font-weight: 600;
}
.date {
  color: var(--muted);
  font-size: 14px;
}
.balls {
  display: flex;
  gap: 12px;
}
.inline-ball {
  flex-direction: row;
  gap: 7px;
}
.right {
  text-align: right;
}
.replay:hover {
  color: var(--gold);
}

/* 手机卡片 */
.m-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-item {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.m-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.m-period {
  font-size: 13px;
}
.m-period .num {
  font-size: 19px;
  font-weight: 600;
}
.m-date {
  font-size: 12px;
  color: var(--muted);
}
.m-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.m-bottom .m-balls {
  flex: 1;
  justify-content: space-between;
  margin-right: 8px;
}
.m-replay {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
}
</style>
