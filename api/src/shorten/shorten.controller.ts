import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  Res,
  Req,
  Delete,
} from '@nestjs/common'
import { ShortenService } from './shorten.service'
import { CreateLinkDto } from './dto/create-link.dto'
import { Response, Request } from 'express'

@Controller()
export class ShortenController {
  constructor(private readonly service: ShortenService) {}

  @Post('shorten')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async shorten(@Body() dto: CreateLinkDto) {
    return this.service.create(dto)
  }

  // info ve analytics dynamic param'dan önce tanımlanmalı:
  @Get('info/:shortCode')
  async info(@Param('shortCode') code: string) {
    return this.service.getInfo(code)
  }

  @Get('analytics/:shortCode')
  async analytics(@Param('shortCode') code: string) {
    return this.service.analytics(code)
  }

  @Delete('links/:shortCode')
  async remove(@Param('shortCode') code: string) {
    return this.service.delete(code)
  }

  // en sona: tüm diğer "GET /:shortCode" istekleri buraya,
  // böylece info/ ve analytics/ rotalarını bozmaz:
  @Get(':shortCode')
  async redirect(
    @Param('shortCode') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const clientIp = req.ip ?? '0.0.0.0'
    const target = await this.service.redirect(code, clientIp)
    return res.redirect(target)
  }
}
