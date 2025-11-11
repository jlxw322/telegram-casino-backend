import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteUpgradeChanceDto {
  @ApiProperty({
    description: 'Multiplier value to delete',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  multiplier: number;
}
