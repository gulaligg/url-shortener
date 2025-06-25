import { Module } from '@nestjs/common'
import { ShortenService } from './shorten.service'
import { ShortenController } from './shorten.controller'

@Module({
  providers: [ShortenService],
  controllers: [ShortenController],
})
export class ShortenModule {}
