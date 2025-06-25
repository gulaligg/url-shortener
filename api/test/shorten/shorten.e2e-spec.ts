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
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    prisma = mod.get(PrismaService)
  })

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    await prisma.click.deleteMany()
    await prisma.link.deleteMany()
  })

  afterEach(async () => {
    await app.close()
  })

  it('full scenario: create → click → info → analytics → delete → 404', async () => {
    const payload = { originalUrl: 'https://gulaligulaliyev.com', alias: 'myalias123' }
    const resCreate = await request(app.getHttpServer())
      .post('/shorten')
      .send(payload)
      .expect(201)

    expect(resCreate.body.shortUrl).toMatch(/\/myalias123$/)
    createdShortCode = 'myalias123'

    await request(app.getHttpServer()).get(`/${createdShortCode}`).expect(302)

    await request(app.getHttpServer())
      .get(`/info/${createdShortCode}`)
      .expect(200)

    await request(app.getHttpServer()).get(`/${createdShortCode}`).expect(302)
    await request(app.getHttpServer()).get(`/${createdShortCode}`).expect(302)

    await request(app.getHttpServer())
      .get(`/analytics/${createdShortCode}`)
      .expect(200)
      .expect(({ body }) => expect(body.clickCount).toBe(3))

    await request(app.getHttpServer())
      .delete(`/delete/${createdShortCode}`)
      .expect(200, { deleted: true })

    await request(app.getHttpServer()).get(`/info/${createdShortCode}`).expect(404)
    await request(app.getHttpServer()).get(`/analytics/${createdShortCode}`).expect(404)
  })
})
