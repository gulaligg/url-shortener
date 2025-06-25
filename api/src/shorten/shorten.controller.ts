import {
    Controller,
    Post,
    Body,
    UsePipes,
    ValidationPipe,
    Get,
    Param,
    Req,
    Res,
    Delete,
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiParam,
    ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse,
    ApiBadRequestResponse, ApiExtraModels, getSchemaPath,
} from '@nestjs/swagger';
import { HttpErrorDto } from './dto/http-error.dto';
import { ShortenService } from './shorten.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { Request, Response } from 'express';

@ApiTags('shorten')
@ApiExtraModels(HttpErrorDto)
@Controller()
export class ShortenController {
    constructor(private readonly service: ShortenService) { }

    @Post('shorten')
    @ApiOperation({ summary: 'Create a short URL' })
    @ApiCreatedResponse({
        description: 'Short link created',
        schema: {
            example: {
                id: 'clv1k2z5a0000d9mtl8xk6h9n',
                shortCode: 'abc123',
                originalUrl: 'https://gulaligulaliyev.com',
                expiresAt: null,
            },
        },
    })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async shorten(@Body() dto: CreateLinkDto) {
        return this.service.create(dto)
    }

    @Get('info/:shortCode')
    @ApiOperation({ summary: 'Get link metadata' })
    @ApiParam({
        name: 'shortCode',
        description: 'The code returned when the link was created',
        example: 'abc123',
    })
    @ApiOkResponse({
        description: 'Link information',
        schema: {
            example: {
                shortCode: 'abc123',
                originalUrl: 'https://gulaligulaliyev.com',
                createdAt: '2025-06-25T10:00:10.000Z',
                clicks: 5,
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Invalid short code',
        schema: { $ref: getSchemaPath(HttpErrorDto) },
    })
    @ApiNotFoundResponse({ description: 'Link not found' })
    async info(@Param('shortCode') code: string) {
        return this.service.getInfo(code)
    }

    @Get('analytics/:shortCode')
    @ApiOperation({ summary: 'Get click analytics' })
    @ApiParam({ name: 'shortCode', example: 'abc123' })
    @ApiOkResponse({
        description: 'Click timeline and stats',
        schema: {
            example: {
                totalClicks: 5,
                lastClickAt: '2025-06-25T12:40:00.000Z',
                byCountry: { TR: 3, DE: 2 },
            },
        },
    })
    @ApiNotFoundResponse({ description: 'Link not found' })
    async analytics(@Param('shortCode') code: string) {
        return this.service.analytics(code)
    }

    @Delete('delete/:shortCode')
    @ApiOperation({ summary: 'Delete a short link' })
    @ApiParam({ name: 'shortCode', example: 'abc123' })
    @ApiOkResponse({ description: 'Link deleted' })
    @ApiNotFoundResponse({ description: 'Link not found' })
    async remove(@Param('shortCode') code: string) {
        return this.service.delete(code)
    }

    @Get(':shortCode')
    @ApiOperation({ summary: 'Redirect to the original URL' })
    @ApiParam({ name: 'shortCode', example: 'abc123' })
    @ApiResponse({ status: 302, description: 'Browser redirect' })
    @ApiNotFoundResponse({ description: 'Link not found or expired' })
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
