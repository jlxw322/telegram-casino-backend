import { ApiProperty } from '@nestjs/swagger';

export class UpgradeChanceResponseDto {
  @ApiProperty({
    description: 'Upgrade chance ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Multiplier value',
    example: 2,
  })
  multiplier: number;

  @ApiProperty({
    description: 'Success chance as decimal (0.0 - 1.0)',
    example: 0.5,
  })
  chance: number;

  @ApiProperty({
    description: 'Created at',
    example: '2025-11-10T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2025-11-10T12:00:00Z',
  })
  updatedAt: Date;
}
