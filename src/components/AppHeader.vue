<script setup>
import { computed, reactive } from 'vue'
import logoUrl from '../assets/logo.png'
import logoUrlH5 from '../assets/logo-h5.png'
import { useIsMobile } from '../composables/useMediaQuery.js'
const isMobile = useIsMobile()
const filters = reactive({ date: '', period: '' })
const filtering = computed(() => !!(filters.date || filters.period))
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <RouterLink to="/" class="brand" aria-label="云顶六合彩 首页">
        <img :src="!isMobile && !filtering ? logoUrl : logoUrlH5" alt="云顶六合彩 logo" class="brand-mark" />
        <span class="brand-name">云顶六合彩</span>
      </RouterLink>
      <nav aria-label="主导航" class="nav">
        <RouterLink to="/" class="nav-link" exact-active-class="is-active">首页</RouterLink>
        <RouterLink to="/results" class="nav-link" active-class="is-active">开奖公告</RouterLink>
        <RouterLink to="/video" class="nav-link" active-class="is-active">开奖视频</RouterLink>
        <RouterLink to="/trend" class="nav-link" active-class="is-active">走势图</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 0 rgba(16, 24, 40, 0.02);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line-soft);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
}
.brand:hover {
  color: var(--text);
}
.brand-mark {
  height: 66px;
  object-fit: cover;
  display: block;
}
.brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 3px;
}
.nav {
  display: flex;
  gap: 32px;
}
.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--muted);
  text-decoration: none;
  font-size: 16px;
  border-bottom: 2px solid transparent;
}
.nav-link:hover {
  color: var(--text);
}
.nav-link.is-active {
  color: var(--text);
  border-bottom-color: var(--gold);
}

@media (max-width: 767px) {
  .header-inner {
    min-height: 56px;
  }
  .brand-mark {
    height: 46px;
  }
  .brand-name {
    font-size: 17px;
    letter-spacing: 2px;
  }
  .nav {
    gap: 14px;
  }
  .nav-link {
    font-size: 15px;
  }
}
/* 窄屏放不下 4 个栏目：品牌只保留图标 */
@media (max-width: 479px) {
  .brand-name {
    display: none;
  }
  .nav {
    gap: 12px;
  }
}
</style>
