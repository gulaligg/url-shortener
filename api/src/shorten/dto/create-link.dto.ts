import {
  IsUrl,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator'

export class CreateLinkDto {
  @IsUrl()
  originalUrl!: string

  @IsOptional()
  @IsDateString()
  expiresAt?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alias?: string
}
