// test/shorten.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { config } from 'dotenv';
config();

describe('ShortenController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let createdShortCode: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        prisma = app.get(PrismaService);
        await prisma.click.deleteMany();
        await prisma.link.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/shorten (POST) should create a link with custom alias', async () => {
        const payload = { originalUrl: 'https://example.com', alias: 'myalias123' };

        const res = await request(app.getHttpServer())
            .post('/shorten')
            .send(payload)
            .expect(201);

        expect(res.body).toHaveProperty('shortUrl');
        expect(res.body.shortUrl).toMatch(/\/myalias123$/);

        // Veritabanında da kayıt var mı?
        const link = await prisma.link.findUnique({ where: { shortCode: 'myalias123' } });
        expect(link).not.toBeNull();
        // @ts-ignore: link is non-null after the assertion
        expect(link!.originalUrl).toBe(payload.originalUrl);

        createdShortCode = 'myalias123';
    });

    it('/:shortCode (GET) should redirect and increment clickCount', async () => {
        // Önce clickCount sıfır olmalı
        const before = await prisma.link.findUnique({ where: { shortCode: createdShortCode } });
        expect(before).not.toBeNull();
        // @ts-ignore
        expect(before!.clickCount).toBe(0);

        const res = await request(app.getHttpServer())
            .get(`/${createdShortCode}`)
            .expect(302);

        expect(res.header.location).toBe('https://example.com');

        // clickCount artmış olmalı
        const after = await prisma.link.findUnique({ where: { shortCode: createdShortCode } });
        expect(after).not.toBeNull();
        // @ts-ignore
        expect(after!.clickCount).toBe(1);

        // bir Click kaydı oluşmuş mu?
        // @ts-ignore
        const clicks = await prisma.click.findMany({ where: { linkId: after!.id } });
        expect(clicks.length).toBe(1);
    });
});
