<script setup>
import BrandMark from './BrandMark.vue'
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <RouterLink to="/" class="brand" aria-label="路合开奖 首页">
        <BrandMark class="brand-mark" />
        <span class="brand-name">路合开奖</span>
      </RouterLink>
      <nav aria-label="主导航" class="nav">
        <RouterLink to="/" class="nav-link" exact-active-class="is-active">首页</RouterLink>
        <RouterLink to="/video" class="nav-link" active-class="is-active">开奖视频</RouterLink>
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
  width: 36px;
  height: 36px;
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
    width: 30px;
    height: 30px;
  }
  .brand-name {
    font-size: 17px;
    letter-spacing: 2px;
  }
  .nav {
    gap: 20px;
  }
  .nav-link {
    font-size: 15px;
  }
}
</style>
