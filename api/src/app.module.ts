import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager'
import * as redisStore from 'cache-manager-ioredis'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { ShortenModule } from './shorten/shorten.module'

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST ?? 'redis',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      ttl: 60,
      isGlobal: true,
    }),
    PrismaModule,
    ShortenModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
