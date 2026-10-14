import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '首页' } },
    {
      path: '/video',
      name: 'video',
      component: () => import('../views/VideoView.vue'),
      meta: { title: '开奖视频' },
    },
    {
      path: '/trend',
      name: 'trend',
      component: () => import('../views/TrendView.vue'),
      meta: { title: '走势图' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // 视频页内切换期号时也回到顶部播放器
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 路合开奖` : '路合开奖'
})

export default router
