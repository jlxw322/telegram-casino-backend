import { ApiProperty } from '@nestjs/swagger';

export class UpgradeHistoryItemDto {
  @ApiProperty({
    description: 'Upgrade attempt ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Whether the upgrade was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Multiplier used',
    example: 2,
  })
  multiplier: number;

  @ApiProperty({
    description: 'Chance at the time of upgrade',
    example: 0.5,
  })
  chance: number;

  @ApiProperty({
    description: 'Source prize',
    example: {
      id: 1,
      name: '100 Coins',
      amount: 100,
      url: 'https://example.com/prize.png',
    },
  })
  fromPrize: {
    id: number;
    name: string;
    amount: number;
    url: string;
  };

  @ApiProperty({
    description: 'Target prize (only if successful)',
    example: {
      id: 2,
      name: '200 Coins',
      amount: 200,
      url: 'https://example.com/prize.png',
    },
    required: false,
  })
  toPrize?: {
    id: number;
    name: string;
    amount: number;
    url: string;
  };

  @ApiProperty({
    description: 'Timestamp of upgrade attempt',
    example: '2024-11-08T12:00:00.000Z',
  })
  createdAt: Date;
}

export class UpgradeHistoryResponseDto {
  @ApiProperty({
    description: 'List of upgrade attempts',
    type: [UpgradeHistoryItemDto],
  })
  upgrades: UpgradeHistoryItemDto[];

  @ApiProperty({
    description: 'Total count of upgrades',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;
}
