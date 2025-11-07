import { IsString, IsInt, Min, IsUrl, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePrizeDto {
  @ApiPropertyOptional({ description: 'Prize name', example: 'Gold Coin' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Prize amount/value',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Prize image URL',
    example: 'https://example.com/prize.png',
  })
  @IsOptional()
  @IsUrl()
  url?: string;
}
