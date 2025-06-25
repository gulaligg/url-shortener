// src/store/index.ts
import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

export const useLinkStore = defineStore('link', {
    state: () => ({
        links: [] as Array<{
            originalUrl: string
            shortUrl: string
            shortCode: string
        }>,
    }),
    actions: {
        async createLink(payload: {
            originalUrl: string
            alias?: string
            expiresAt?: string
        }) {
            // 1) Sadece dolu alanları body’ye ekle
            const body: Record<string, any> = { originalUrl: payload.originalUrl }
            if (payload.alias) body.alias = payload.alias
            if (payload.expiresAt) body.expiresAt = new Date(payload.expiresAt).toISOString()

            try {
                // 2) API isteğini yap
                const res = await api.post('/shorten', body)
                console.log('CREATE LINK RESPONSE:', res.data)

                // 3) API sadece shortUrl döndürüyor, shortCode’u URL’den çıkar
                const shortUrl = res.data.shortUrl as string
                const parts = shortUrl.split('/')
                const shortCode = parts[parts.length - 1] || ''

                // 4) originalUrl, shortUrl ve extracted shortCode’u kullan
                const originalUrl = payload.originalUrl

                // 5) state’i güncelle
                this.links.unshift({ originalUrl, shortUrl, shortCode })

                // 6) consumer’ın da kullanabilmesi için objeyi return et
                return { originalUrl, shortUrl, shortCode }
            } catch (err: any) {
                console.error(
                    'API Error:',
                    err.response?.status,
                    err.response?.data
                )
                throw err
            }
        },

        async fetchAnalytics(shortCode: string) {
            const res = await api.get(`/analytics/${shortCode}`)
            return res.data
        },

        async fetchInfo(shortCode: string) {
            const res = await api.get(`/info/${shortCode}`)
            return res.data
        },
    },
})
