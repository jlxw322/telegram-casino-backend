import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EditMultiplierDto {
  @ApiProperty({
    description: 'Current multiplier value',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  oldMultiplier: number;

  @ApiProperty({
    description: 'New multiplier value',
    example: 2.5,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  newMultiplier: number;

  @ApiProperty({
    description: 'Success chance as decimal (0.0 - 1.0)',
    example: 0.5,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  chance?: number;
}
