import {
  IsUrl,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({
    example: 'https://google.com',
    description: 'The full URL to be shortened',
  })
  @IsUrl()
  originalUrl!: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Expiration timestamp in ISO-8601 format',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: 'google',
    description: 'Custom alias (max 20 chars)',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  alias?: string;
}
