<template>
    <div class="max-w-lg mx-auto p-6 space-y-4">
        <h1 class="text-2xl font-semibold text-center">Link Info: {{ shortCode }}</h1>

        <div v-if="info" class="bg-gray-800 rounded-lg p-4 space-y-2">
            <p>
                <span class="font-medium">Original URL:</span>
                <a href="#" @click.prevent="handleClick()" class="text-blue-400 hover:underline break-all">
                    {{ info.originalUrl }}
                </a>
            </p>
            <p class="text-gray-400">Created At: {{ info.createdAt }}</p>
            <p class="font-medium">
                Click Count: <span class="text-blue-300">{{ analytics.clickCount }}</span>
            </p>
        </div>

        <div v-if="analytics.lastIps.length" class="bg-gray-800 rounded-lg p-4">
            <h2 class="font-medium mb-2">Last 5 Clicks</h2>
            <ul class="list-disc list-inside space-y-1">
                <li v-for="ip in analytics.lastIps" :key="ip">{{ ip }}</li>
            </ul>
        </div>

        <p v-else class="text-center text-gray-500">Henüz tıklama yok.</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useLinkStore } from '../store/index'

const toast = useToast()
const route = useRoute()
const shortCode = route.params.shortCode as string
const linkStore = useLinkStore()

// veri ref’leri
const info = ref<{ originalUrl: string; createdAt: string } | null>(null)
const analytics = ref<{ clickCount: number; lastIps: string[] }>({
    clickCount: 0,
    lastIps: [],
})

// ilk veri çekimi
onMounted(async () => {
    info.value = await linkStore.fetchInfo(shortCode)
    analytics.value = await linkStore.fetchAnalytics(shortCode)
})

// Original URL’e tıklandığında
async function handleClick() {
    // 1) Yeni sekmede redirect endpoint’in açılması (click kaydeder)
    window.open(`http://localhost:3000/${shortCode}`, '_blank')

    // 2) Kısa gecikmeyle yeni stats al
    setTimeout(async () => {
        analytics.value = await linkStore.fetchAnalytics(shortCode)
        toast.success('Click kaydedildi!')
    }, 200)
}
</script>

<style scoped></style>
