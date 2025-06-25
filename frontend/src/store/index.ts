// src/store/index.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import type { AxiosResponse } from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

interface Link {
    originalUrl: string
    shortUrl: string
    shortCode: string
}

interface Info {
    originalUrl: string
    createdAt: string
    clickCount: number
}

interface Analytics {
    clickCount: number
    lastIps: string[]
}

export const useLinkStore = defineStore('link', {
    state: () => ({
        links: [] as Link[],
    }),

    actions: {
        /** Yeni link oluştur */
        async createLink(payload: {
            originalUrl: string
            alias?: string
            expiresAt?: string
        }): Promise<Link> {
            const body: Record<string, any> = { originalUrl: payload.originalUrl }
            if (payload.alias) body.alias = payload.alias
            if (payload.expiresAt) body.expiresAt = new Date(payload.expiresAt).toISOString()

            const res: AxiosResponse<{ shortUrl: string }> = await api.post('/shorten', body)
            const shortUrl = res.data.shortUrl
            const parts = shortUrl.split('/')
            const shortCode = parts[parts.length - 1] || ''
            const link: Link = {
                originalUrl: payload.originalUrl,
                shortUrl,
                shortCode,
            }

            // en başa ekle
            this.links.unshift(link)
            return link
        },

        /** Link bilgisi getir (`<InfoView>`) */
        async fetchInfo(shortCode: string): Promise<Info> {
            const res: AxiosResponse<Info> = await api.get(`/info/${shortCode}`)
            return res.data
        },

        /** Analitik veriyi getir (`clickCount` + son 5 IP) */
        async fetchAnalytics(shortCode: string): Promise<Analytics> {
            const res: AxiosResponse<Analytics> = await api.get(`/analytics/${shortCode}`)
            return res.data
        },

        /** Link’i ve ilgili tıklamaları sil */
        async deleteLink(shortCode: string): Promise<void> {
            await api.delete(`/links/${shortCode}`)
            this.links = this.links.filter(l => l.shortCode !== shortCode)
        },
    },
})
