<template>
    <div class="min-h-screen bg-gradient-to-br from-white to-gray-300">
        <div class="max-w-lg mx-auto p-6 space-y-6">
            <button @click="$router.back()" class="flex items-center hover:text-gray-800 cursor-pointer">
                <ArrowLeftIcon class="h-5 w-5 mr-2" />
                Go Back
            </button>
            <h1 class="text-2xl font-semibold text-center">
                Link Info: {{ shortCode }}
            </h1>
            <div v-if="info" class="bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl p-6 space-y-2 shadow-lg">
                <p class="text-white">
                    <span class="font-medium">Original URL:</span>
                    <a href="#" @click.prevent="handleClick()" class="underline hover:text-gray-200 break-all">
                        {{ info.originalUrl }}
                    </a>
                </p>
                <p class="text-gray-200 text-sm">Created At: {{ info.createdAt }}</p>
                <p class="text-white">
                    <span class="font-medium">Click Count:</span>
                    <span class="text-yellow-300">{{ analytics.clickCount }}</span>
                </p>
            </div>
            <div v-if="analytics.lastIps.length"
                class="bg-gradient-to-br from-green-400 to-blue-600 rounded-xl p-6 shadow-lg">
                <h2 class="text-white font-medium mb-3">Last 5 Clicks</h2>
                <div class="flex flex-wrap gap-2">
                    <span v-for="ip in analytics.lastIps" :key="ip"
                        class="inline-block bg-white bg-opacity-20 text-black rounded-full px-3 py-1 text-sm">
                        {{ ip }}
                    </span>
                </div>
            </div>

            <p v-else class="text-center text-gray-400">No clicks yet.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useLinkStore } from '../store/index'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const toast = useToast()
const route = useRoute()
const shortCode = route.params.shortCode as string
const linkStore = useLinkStore()

const info = ref<{ originalUrl: string; createdAt: string } | null>(null)
const analytics = ref<{ clickCount: number; lastIps: string[] }>({
    clickCount: 0,
    lastIps: [],
})

onMounted(async () => {
    info.value = await linkStore.fetchInfo(shortCode)
    analytics.value = await linkStore.fetchAnalytics(shortCode)
})

async function handleClick() {
    window.open(`http://localhost:3000/${shortCode}`, '_blank')
    setTimeout(async () => {
        analytics.value = await linkStore.fetchAnalytics(shortCode)
        toast.success('Click saved!')
    }, 200)
}
</script>
