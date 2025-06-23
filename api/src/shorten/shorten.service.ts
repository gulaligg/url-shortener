// src/shorten/shorten.service.ts

import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';

import { CreateLinkDto } from './dto/create-link.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShortenService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    private async generateAlias(): Promise<string> {
        const chars =
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const bytes = randomBytes(8);
        let code = '';
        for (const b of bytes) {
            code += chars[b % chars.length];
        }
        // Eğer collision varsa yeniden üret
        const exists = await this.prisma.link.findUnique({
            where: { shortCode: code },
        });
        return exists ? this.generateAlias() : code;
    }

    async create(dto: CreateLinkDto) {
        const { originalUrl, expiresAt, alias } = dto;
        const cacheKey = `alias:${originalUrl}`;

        // 1) Custom alias verilmişse benzersizliğini kontrol et
        if (alias) {
            const conflict = await this.prisma.link.findUnique({
                where: { shortCode: alias },
            });
            if (conflict) throw new BadRequestException('Alias already in use');
        }

        // 2) Alias yoksa önce cache’e bak, sonra generate et
        let shortCode = alias;
        if (!shortCode) {
            const cached = await this.cacheManager.get<string>(cacheKey);
            if (cached) {
                shortCode = cached;
            } else {
                shortCode = await this.generateAlias();
                // TTL = 300 saniye (5 dakika)
                await this.cacheManager.set(cacheKey, shortCode, 300);
            }
        }

        // 3) Veritabanına kaydet
        const link = await this.prisma.link.create({
            data: {
                originalUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                shortCode,
            },
        });

        return { shortUrl: `${process.env.APP_URL}/${link.shortCode}` };
    }

    async redirect(shortCode: string, ip: string) {
        const link = await this.prisma.link.findUnique({
            where: { shortCode },
        });
        if (!link || (link.expiresAt && link.expiresAt < new Date())) {
            throw new NotFoundException('Link not found or expired');
        }

        // Tıklama sayısını artır ve click kaydı oluştur
        await this.prisma.$transaction([
            this.prisma.link.update({
                where: { shortCode },
                data: { clickCount: { increment: 1 } },
            }),
            this.prisma.click.create({
                data: { linkId: link.id, ipAddress: ip },
            }),
        ]);

        return link.originalUrl;
    }
}
