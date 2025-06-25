import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import InfoView from '../views/InfoView.vue'

const routes = [
    { path: '/', name: 'home', component: HomeView },
    { path: '/info/:shortCode', name: 'info', component: InfoView, props: true },
]

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})
