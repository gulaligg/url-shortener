import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'
import { config } from 'dotenv'
config()

describe('ShortenController (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let createdShortCode: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    prisma = app.get(PrismaService)
    await prisma.click.deleteMany()
    await prisma.link.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  it('/shorten (POST) should create a link with custom alias', async () => {
    const payload = { originalUrl: 'https://example.com', alias: 'myalias123' }

    const res = await request(app.getHttpServer() as any)
      .post('/shorten')
      .send(payload)
      .expect(201)

    const body = res.body as { shortUrl: string }
    expect(body).toHaveProperty('shortUrl')
    expect(body.shortUrl).toMatch(/\/myalias123$/)

    const link = await prisma.link.findUnique({
      where: { shortCode: 'myalias123' },
    })
    expect(link).not.toBeNull()
    expect(link!.originalUrl).toBe(payload.originalUrl)

    createdShortCode = 'myalias123'
  })

  it('/:shortCode (GET) should redirect and increment clickCount', async () => {
    const before = await prisma.link.findUnique({
      where: { shortCode: createdShortCode },
    })
    expect(before).not.toBeNull()
    expect(before!.clickCount).toBe(0)

    const res = await request(app.getHttpServer() as any)
      .get(`/${createdShortCode}`)
      .expect(302)

    expect(res.header.location).toBe('https://example.com')

    const after = await prisma.link.findUnique({
      where: { shortCode: createdShortCode },
    })
    expect(after).not.toBeNull()
    expect(after!.clickCount).toBe(1)

    const clicks = await prisma.click.findMany({ where: { linkId: after!.id } })
    expect(clicks.length).toBe(1)
    expect(clicks[0].ipAddress).toBeDefined() // IP adresi kaydı da olsun
  })

  it('/info/:shortCode (GET) should return link info', async () => {
    const res = await request(app.getHttpServer() as any)
      .get(`/info/${createdShortCode}`)
      .expect(200)

    expect(res.body).toEqual({
      originalUrl: 'https://example.com',
      createdAt: expect.any(String),
      clickCount: 1,
    })
  })

  it('/analytics/:shortCode (GET) should return analytics data', async () => {
    await request(app.getHttpServer() as any)
      .get(`/${createdShortCode}`)
      .expect(302)
    await request(app.getHttpServer() as any)
      .get(`/${createdShortCode}`)
      .expect(302)

    const res = await request(app.getHttpServer() as any)
      .get(`/analytics/${createdShortCode}`)
      .expect(200)

    expect(res.body).toEqual({
      clickCount: 3,
      lastIps: expect.arrayContaining([expect.any(String)]),
    })
    expect(res.body.lastIps.length).toBeLessThanOrEqual(5)
  })

  it('/links/:shortCode (DELETE) should remove the link', async () => {
    const res = await request(app.getHttpServer() as any)
      .delete(`/links/${createdShortCode}`)
      .expect(200)

    expect(res.body).toEqual({ deleted: true })

    const link = await prisma.link.findUnique({
      where: { shortCode: createdShortCode },
    })
    expect(link).toBeNull()
  })

  it('after deletion, info and analytics should return 404', async () => {
    await request(app.getHttpServer() as any)
      .get(`/info/${createdShortCode}`)
      .expect(404)

    await request(app.getHttpServer() as any)
      .get(`/analytics/${createdShortCode}`)
      .expect(404)
  })
})
