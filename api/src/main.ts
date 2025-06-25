import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpErrorDto } from './shorten/dto/http-error.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  const config = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('Short Link Creation')
    .setVersion('1.0.0')
    .addTag('shorten')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [HttpErrorDto],
  });
  SwaggerModule.setup('docs', app, document)

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
void bootstrap()
