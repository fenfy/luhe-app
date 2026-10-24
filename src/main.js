import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './styles/base.css'
import { initNative } from './native/index.js'

createApp(App).use(router).mount('#app')
initNative(router)
