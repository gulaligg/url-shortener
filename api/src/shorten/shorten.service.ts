import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';

import { CreateLinkDto } from './dto/create-link.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShortenService {
    private static readonly TOMBSTONE = 'DELETED' as const;

    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) { }

    /* -------------------------------------------------- */
    private async generateAlias(): Promise<string> {
        const chars =
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const bytes = randomBytes(8);
        let code = '';
        for (const b of bytes) code += chars[b % chars.length];

        const exists = await this.prisma.link.findUnique({ where: { shortCode: code } });
        return exists ? this.generateAlias() : code;
    }

    /* --------------------------- CREATE --------------------------- */
    async create(dto: CreateLinkDto) {
        const { originalUrl, expiresAt, alias } = dto;
        const cacheKey = `alias:${originalUrl}`;

        if (alias) {
            const conflict = await this.prisma.link.findUnique({ where: { shortCode: alias } });
            if (conflict) throw new BadRequestException('Alias already in use');
        }

        let shortCode = alias;
        if (!shortCode) {
            const cached = await this.cache.get<string>(cacheKey);
            shortCode = cached ?? (await this.generateAlias());
            if (!cached) await this.cache.set(cacheKey, shortCode, 300);
        }

        const link = await this.prisma.link.create({
            data: {
                originalUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                shortCode,
            },
        });

        return { shortUrl: `${process.env.APP_URL}/${link.shortCode}` };
    }

    /* -------------------------- REDIRECT -------------------------- */
    async redirect(shortCode: string, ip: string) {
        const link = await this.prisma.link.findUnique({ where: { shortCode } });
        if (!link || (link.expiresAt && link.expiresAt < new Date()))
            throw new NotFoundException('Link not found or expired');

        await this.prisma.$transaction([
            this.prisma.link.update({
                where: { shortCode },
                data: { clickCount: { increment: 1 } },
            }),
            this.prisma.click.create({ data: { linkId: link.id, ipAddress: ip } }),
        ]);

        return link.originalUrl;
    }

    /* ----------------------------- INFO --------------------------- */
    async getInfo(shortCode: string) {
        const tombstone = ShortenService.TOMBSTONE;
        const cached = await this.cache.get(`info:${shortCode}`);
        if (cached === tombstone) throw new NotFoundException('Link not found');
        if (cached) return cached;

        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { originalUrl: true, createdAt: true, clickCount: true },
        });
        if (!link) throw new NotFoundException('Link not found');

        await this.cache.set(`info:${shortCode}`, link, 60);
        return link;
    }

    /* ---------------------------- DELETE -------------------------- */
    async delete(shortCode: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { id: true, originalUrl: true },
        });
        if (!link) throw new NotFoundException('Link not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.click.deleteMany({ where: { linkId: link.id } });
            await tx.link.delete({ where: { id: link.id } });
        });

        const tombstone = ShortenService.TOMBSTONE;
        await Promise.all([
            this.cache.set(`info:${shortCode}`, tombstone, 60),
            this.cache.set(`analytics:${shortCode}`, tombstone, 60),
            this.cache.del(`alias:${link.originalUrl}`),
        ]);

        return { deleted: true };
    }

    /* -------------------------- ANALYTICS ------------------------- */
    async analytics(shortCode: string) {
        const tombstone = ShortenService.TOMBSTONE;
        const cached = await this.cache.get(`analytics:${shortCode}`);
        if (cached === tombstone) throw new NotFoundException('Link not found');
        if (cached) return cached;

        const link = await this.prisma.link.findUnique({
            where: { shortCode },
            select: { clickCount: true },
        });
        if (!link) throw new NotFoundException('Link not found');

        const lastClicks = await this.prisma.click.findMany({
            where: { link: { shortCode } },
            orderBy: { clickedAt: 'desc' },
            take: 5,
            select: { ipAddress: true },
        });

        const result = {
            clickCount: link.clickCount,
            lastIps: lastClicks.map((c) => c.ipAddress.replace(/^::ffff:/, '')),
        };
        await this.cache.set(`analytics:${shortCode}`, result, 60);
        return result;
    }
}
