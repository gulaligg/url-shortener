import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import {router} from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Toast, {
    position: 'top-right',
    timeout: 2000,
})
app.mount('#app')
