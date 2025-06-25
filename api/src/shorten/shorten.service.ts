import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { randomBytes } from 'crypto'

import { CreateLinkDto } from './dto/create-link.dto'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ShortenService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    private async generateAlias(): Promise<string> {
        const chars =
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
        const bytes = randomBytes(8)
        let code = ''
        for (const b of bytes) {
            code += chars[b % chars.length]
        }
        const exists = await this.prisma.link.findUnique({
            where: { shortCode: code },
        })
        return exists ? this.generateAlias() : code
    }

    /** Yeni link yaratma */
    async create(dto: CreateLinkDto) {
        const { originalUrl, expiresAt, alias } = dto
        const cacheKey = `alias:${originalUrl}`

        // Eğer kullanıcı özel alias vermişse ve zaten varsa hata fırlat
        if (alias) {
            const conflict = await this.prisma.link.findUnique({
                where: { shortCode: alias },
            })
            if (conflict) {
                throw new BadRequestException('Alias already in use')
            }
        }

        // Alias yoksa cache’den al veya yeni üret
        let shortCode = alias
        if (!shortCode) {
            const cached = await this.cacheManager.get<string>(cacheKey)
            if (cached) {
                shortCode = cached
            } else {
                shortCode = await this.generateAlias()
                // **Üçüncü parametre artık direkt TTL (saniye)**
                await this.cacheManager.set(cacheKey, shortCode, 300)
            }
        }

        const link = await this.prisma.link.create({
            data: {
                originalUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                shortCode,
            },
        })

        return { shortUrl: `${process.env.APP_URL}/${link.shortCode}` }
    }

    /** Kısa koda tıklayınca redirect ve sayaç artışı */
    async redirect(shortCode: string, ip: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
        })
        if (!link || (link.expiresAt && link.expiresAt < new Date())) {
            throw new NotFoundException('Link not found or expired')
        }

        await this.prisma.$transaction([
            this.prisma.link.update({
                where: { shortCode },
                data: { clickCount: { increment: 1 } },
            }),
            this.prisma.click.create({
                data: { linkId: link.id, ipAddress: ip },
            }),
        ])

        return link.originalUrl
    }

    /** Info isteğinde önce DB’den bak, sonra cache’e set et */
    async getInfo(shortCode: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { originalUrl: true, createdAt: true, clickCount: true },
        })
        if (!link) {
            throw new NotFoundException('Link not found')
        }

        // **Cache’e yazarken de direkt TTL**
        await this.cacheManager.set(`info:${shortCode}`, link, 60)
        return link
    }

    /** Link ve click kayıtlarını sil, cache temizle */
    async delete(shortCode: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { id: true },
        })
        if (!link) {
            throw new NotFoundException('Link not found')
        }

        await this.prisma.click.deleteMany({ where: { linkId: link.id } })
        await this.prisma.link.delete({ where: { shortCode } })

        // Cache anahtarlarını mutlaka sil
        await Promise.all([
            this.cacheManager.del(`info:${shortCode}`),
            this.cacheManager.del(`analytics:${shortCode}`),
        ])

        return { deleted: true }
    }

    /** Analytics isteğinde önce DB’den bak, sonra cache’e set et */
    async analytics(shortCode: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { clickCount: true },
        })
        if (!link) {
            throw new NotFoundException('Link not found')
        }

        const lastClicks = await this.prisma.click.findMany({
            where: { link: { shortCode } },
            orderBy: { clickedAt: 'desc' },
            take: 5,
            select: { ipAddress: true },
        })

        const result = {
            clickCount: link.clickCount,
            lastIps: lastClicks.map((c) => c.ipAddress.replace(/^::ffff:/, '')),
        }

        await this.cacheManager.set(`analytics:${shortCode}`, result, 60)
        return result
    }
}
