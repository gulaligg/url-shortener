import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import { randomBytes } from 'crypto'

import { PrismaService } from '../prisma/prisma.service'
import { CreateLinkDto } from './dto/create-link.dto'

/* ---------- lint-safe helper types ------------------------- */
interface Flushable {
    flushall?: () => Promise<unknown>
}

interface StoreLike extends Flushable {
    redis?: Flushable
}

interface CacheWithStore extends Cache {
    store?: StoreLike
}

interface ResettableCache extends Cache {
    reset?: () => Promise<void>
    store?: StoreLike
}
/* ---------------------------------------------------------------- */

@Injectable()
export class ShortenService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) { }

    /* ---------------------------- helpers -------------------------- */
    private async generateAlias(): Promise<string> {
        const alphabet =
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
        const bytes = randomBytes(8)
        let code = ''
        for (const b of bytes) code += alphabet[b % alphabet.length]

        const exists = await this.prisma.link.findUnique({
            where: { shortCode: code },
            select: { id: true },
        })
        return exists ? this.generateAlias() : code
    }

    /* ----------------------------- CREATE -------------------------- */
    async create(dto: CreateLinkDto) {
        const { originalUrl, expiresAt, alias } = dto
        const aliasKey = `alias:${originalUrl}`

        if (alias) {
            const conflict = await this.prisma.link.findUnique({
                where: { shortCode: alias },
                select: { id: true },
            })
            if (conflict) throw new BadRequestException('Alias already in use')
        }

        let shortCode = alias
        if (!shortCode) {
            shortCode =
                (await this.cache.get<string>(aliasKey)) ?? (await this.generateAlias())
            await this.cache.set(aliasKey, shortCode, 300)
        }

        const link = await this.prisma.link.create({
            data: {
                shortCode,
                originalUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        })

        return { shortUrl: `${process.env.APP_URL}/${link.shortCode}` }
    }

    /* ---------------------------- REDIRECT ------------------------- */
    async redirect(shortCode: string, ip: string) {
        const link = await this.prisma.link.findUnique({ where: { shortCode } })
        if (!link || (link.expiresAt && link.expiresAt < new Date()))
            throw new NotFoundException('Link not found or expired')

        await this.prisma.$transaction([
            this.prisma.link.update({
                where: { shortCode },
                data: { clickCount: { increment: 1 } },
            }),
            this.prisma.click.create({ data: { linkId: link.id, ipAddress: ip } }),
        ])

        return link.originalUrl
    }

    /* ------------------------------ INFO --------------------------- */
    async getInfo(shortCode: string) {
        const cacheKey = `info:${shortCode}`
        const cached = await this.cache.get(cacheKey)
        if (cached) return cached

        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { originalUrl: true, createdAt: true, clickCount: true },
        })
        if (!link) throw new NotFoundException('Link not found')

        await this.cache.set(cacheKey, link, 60)
        return link
    }

    /* ----------------------------- DELETE -------------------------- */
    async delete(shortCode: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { id: true, originalUrl: true },
        })
        if (!link) throw new NotFoundException('Link not found')

        await this.prisma.$transaction(async (tx) => {
            await tx.click.deleteMany({ where: { linkId: link.id } })
            await tx.link.delete({ where: { id: link.id } })
        })

        // Cache’i temizle
        await Promise.all([
            this.cache.del(`info:${shortCode}`),
            this.cache.del(`analytics:${shortCode}`),
            this.cache.del(`alias:${link.originalUrl}`),
        ])

        /*  ---- flush/reset işlemleri (tip güvenli) ---- */
        const cws = this.cache as CacheWithStore
        if (cws.store?.redis?.flushall) {
            await cws.store.redis.flushall()
        } else if (cws.store?.flushall) {
            await cws.store.flushall()
        } else {
            const resettable = this.cache as ResettableCache
            if (resettable.reset) await resettable.reset()
        }

        return { deleted: true }
    }

    /* --------------------------- ANALYTICS ------------------------- */
    async analytics(shortCode: string) {
        const cacheKey = `analytics:${shortCode}`
        const cached = await this.cache.get(cacheKey)
        if (cached) return cached

        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { id: true, clickCount: true },
        })
        if (!link) throw new NotFoundException('Link not found')

        const lastClicks = await this.prisma.click.findMany({
            where: { linkId: link.id },
            orderBy: { clickedAt: 'desc' },
            take: 5,
            select: { ipAddress: true },
        })

        const result = {
            clickCount: link.clickCount,
            lastIps: lastClicks.map((c) => c.ipAddress.replace(/^::ffff:/, '')),
        }

        await this.cache.set(cacheKey, result, 60)
        return result
    }
}
