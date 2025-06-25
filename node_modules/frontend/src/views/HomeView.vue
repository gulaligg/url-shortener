<template>
    <div class="min-h-screen bg-gradient-to-br from-white to-gray-400 flex items-center justify-center p-4">
        <div class="w-full max-w-2xl space-y-8">
            <!-- Header -->
            <header class="text-center">
                <h1 class="text-4xl font-extrabold text-gray-900 mb-2">URL Shortener</h1>
                <p class="text-gray-600">
                    Uzun linklerinizi kısaltın ve takip edin.
                </p>
            </header>

            <!-- Form Card -->
            <section class="bg-white rounded-2xl shadow-lg p-6">
                <form @submit.prevent="onSubmit" class="space-y-5">
                    <div>
                        <label class="block text-gray-700 mb-1">Original URL</label>
                        <input v-model="form.originalUrl" type="url" required placeholder="https://example.com"
                            class="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>

                    <div class="md:flex md:space-x-4">
                        <div class="flex-1">
                            <label class="block text-gray-700 mb-1">Alias (opsiyonel)</label>
                            <input v-model="form.alias" type="text" maxlength="20" placeholder="my-link"
                                class="w-full bg-gray-50 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
                        </div>
                        <div class="flex-1 mt-4 md:mt-0">
                            <label class="block text-gray-700 mb-1">Expires At (opsiyonel)</label>
                            <input v-model="form.expiresAt" type="date"
                                class="w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition" />
                        </div>
                    </div>

                    <button type="submit"
                        class="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg py-3 shadow-md transform hover:-translate-y-0.5 transition">
                        Create
                    </button>
                </form>
            </section>

            <!-- Link List -->
            <section>
                <h2 v-if="linksMemo.length" class="text-2xl text-gray-900 mb-4">Your Links</h2>
                <p v-else class="text-center text-gray-500">Henüz link yok.</p>

                <div v-if="linksMemo.length" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="link in linksMemo" :key="link.shortCode"
                        class="bg-white rounded-xl shadow hover:shadow-xl transition p-6 flex flex-col justify-between">
                        <div class="mb-4">
                            <a :href="link.shortUrl" target="_blank" @click.prevent="handleGo(link)"
                                class="text-blue-600 hover:text-blue-500 break-words transition">
                                {{ link.shortUrl }}
                            </a>
                            <p class="text-gray-500 text-sm mt-1">Original: {{ link.originalUrl }}</p>
                        </div>
                        <div class="flex justify-between items-center mt-auto">
                            <router-link :to="{ name: 'info', params: { shortCode: link.shortCode } }"
                                class="text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 px-4 py-2 rounded-lg text-sm transition">
                                Detail
                            </router-link>
                            <span class="text-gray-400 text-xs">#{{ link.shortCode }}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useLinkStore } from '../store/index'

const toast = useToast()
const linkStore = useLinkStore()

// form state
const form = reactive({
    originalUrl: '',
    alias: '',
    expiresAt: '',
})

// memoized link list (ters kronolojik)
const linksMemo = computed(() =>
    [...linkStore.links].sort((a, b) => (a.shortCode < b.shortCode ? 1 : -1))
)

// yeni link oluştur
async function onSubmit() {
    try {
        const newLink = await linkStore.createLink(form)
        toast.success('Link oluşturuldu: ' + newLink.shortUrl)
        form.originalUrl = ''
        form.alias = ''
        form.expiresAt = ''
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Oluşturulamadı')
    }
}

// link’e tıklanınca
async function handleGo(link: {
    originalUrl: string
    shortUrl: string
    shortCode: string
}) {
    window.open(link.shortUrl, '_blank')

    setTimeout(async () => {
        try {
            const stat = await linkStore.fetchAnalytics(link.shortCode)
            toast.info(`Click Count: ${stat.clickCount}`)
        } catch {
            // sessizce geç
        }
    }, 200)
}
</script>

<style scoped>
/* Tailwind ile hazırsınız! */
</style>