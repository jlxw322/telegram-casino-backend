import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteUpgradeChanceDto {
  @ApiProperty({
    description: 'ID of upgrade chance to delete',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;
}
