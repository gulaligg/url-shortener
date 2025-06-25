// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  //  ─── Burada CORS’u açıyoruz ───────────────────────────────────────
  app.enableCors({
    origin: 'http://localhost:5173', // frontend’in adresi
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // cookie / auth header’a izin
  })

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
