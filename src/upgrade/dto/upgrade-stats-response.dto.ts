import { ApiProperty } from '@nestjs/swagger';

export class UpgradeStatsResponseDto {
  @ApiProperty({
    description: 'Total number of upgrade attempts',
    example: 50,
  })
  totalAttempts: number;

  @ApiProperty({
    description: 'Number of successful upgrades',
    example: 28,
  })
  successfulUpgrades: number;

  @ApiProperty({
    description: 'Number of failed upgrades',
    example: 22,
  })
  failedUpgrades: number;

  @ApiProperty({
    description: 'Success rate as percentage',
    example: 56,
  })
  successRate: number;

  @ApiProperty({
    description: 'Total value lost in failed upgrades',
    example: 5500,
  })
  totalValueLost: number;

  @ApiProperty({
    description: 'Total value gained from successful upgrades',
    example: 8400,
  })
  totalValueGained: number;

  @ApiProperty({
    description: 'Net profit/loss from upgrades',
    example: 2900,
  })
  netProfit: number;

  @ApiProperty({
    description: 'Statistics by multiplier',
    example: {
      X1_5: { attempts: 20, successes: 14, successRate: 70 },
      X2: { attempts: 15, successes: 8, successRate: 53.33 },
      X3: { attempts: 10, successes: 3, successRate: 30 },
      X5: { attempts: 3, successes: 1, successRate: 33.33 },
      X10: { attempts: 2, successes: 0, successRate: 0 },
    },
  })
  byMultiplier: Record<
    string,
    {
      attempts: number;
      successes: number;
      successRate: number;
    }
  >;
}
