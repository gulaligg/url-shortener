import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorDto {
    @ApiProperty({ example: 404 })
    statusCode!: number;

    @ApiProperty({ example: 'Not Found' })
    error!: string;

    @ApiProperty({
        example: 'Link not found',
        description: 'Various error messages to display to the user',
    })
    message!: string | string[];
}
