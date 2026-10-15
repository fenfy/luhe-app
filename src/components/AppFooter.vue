<template>
  <footer class="footer">
    <div class="container footer-inner">
      <span>© {{ year }} 云顶六合彩</span>
      <span>开奖数据仅供参考，请理性对待</span>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  border-top: 1px solid var(--line-soft);
  margin-top: 64px;
}
.footer-inner {
  display: flex;
  justify-content: space-between;
  gap: 8px 16px;
  flex-wrap: wrap;
  padding-top: 28px;
  padding-bottom: 28px;
  color: var(--faint);
  font-size: 13px;
}
@media (max-width: 767px) {
  .footer {
    margin-top: 40px;
  }
  .footer-inner {
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    padding-top: 22px;
    padding-bottom: calc(22px + env(safe-area-inset-bottom));
  }
}
</style>
