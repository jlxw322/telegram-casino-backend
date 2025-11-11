import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUpgradeChanceDto {
  @ApiProperty({
    description: 'Multiplier value (e.g., 1.5, 2, 3, 5, 10)',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  multiplier: number;

  @ApiProperty({
    description: 'Success chance as decimal (0.0 - 1.0)',
    example: 0.5,
    minimum: 0,
    maximum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  chance: number;
}
