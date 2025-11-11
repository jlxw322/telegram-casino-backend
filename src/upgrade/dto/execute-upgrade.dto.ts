import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ExecuteUpgradeDto {
  @ApiProperty({
    description: 'ID of the inventory item to upgrade',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  inventoryItemId: number;

  @ApiProperty({
    description: 'Target multiplier for the upgrade (e.g., 1.5, 2, 3, 5, 10)',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  multiplier: number;
}
