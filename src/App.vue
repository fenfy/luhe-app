<script setup>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import InstallBanner from './components/InstallBanner.vue'
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter />
    <InstallBanner />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
}
</style>
