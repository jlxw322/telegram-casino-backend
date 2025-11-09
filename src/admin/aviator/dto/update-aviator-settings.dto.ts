import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAviatorSettingsDto {
  @ApiProperty({
    description: 'Minimum multiplier value',
    example: 1.01,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minMultiplier: number;

  @ApiProperty({
    description: 'Maximum multiplier value',
    example: 100,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxMultiplier: number;

  @ApiProperty({
    description: 'Minimum bet amount in coins',
    example: 25,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minBet: number;

  @ApiProperty({
    description: 'Maximum bet amount in coins',
    example: 10000,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxBet: number;
}
