import {
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { SystemKey, AviatorStatus } from '@prisma/client';
import { AviatorRangeDto } from '../system/dto/aviator-range.dto';

@Injectable()
export class AviatorService implements OnModuleInit {
  private readonly logger = new Logger(AviatorService.name);
  private aviatorChances: AviatorRangeDto[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAviatorChances();
  }

  /**
   * Load and cache AVIATOR_CHANCES from system variables
   */
  private async loadAviatorChances() {
    try {
      const systemVar = await this.prisma.system.findUnique({
        where: { key: SystemKey.AVIATOR_CHANCES },
      });

      if (!systemVar) {
        this.logger.warn('AVIATOR_CHANCES not found in system variables');
        // Set default chances if not found
        this.aviatorChances = [
          { from: 1, to: 2, chance: 70 },
          { from: 2, to: 5, chance: 20 },
          { from: 5, to: 10, chance: 8 },
          { from: 10, to: 20, chance: 2 },
        ];
      } else {
        this.aviatorChances = JSON.parse(systemVar.value);
      }

      this.logger.log('Aviator chances loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load aviator chances', error);
      throw new HttpException('Failed to load aviator chances', 500);
    }
  }

  /**
   * Reload aviator chances from database (call after admin updates)
   */
  async reloadAviatorChances() {
    await this.loadAviatorChances();
  }

  /**
   * Generate random multiplier based on chances configuration
   */
  private generateMultiplier(): number {
    const totalChance = this.aviatorChances.reduce((a, b) => a + b.chance, 0);
    const random = Math.random() * totalChance;
    let cumulativeChance = 0;

    for (const range of this.aviatorChances) {
      cumulativeChance += range.chance;
      if (random <= cumulativeChance) {
        const multiplier = range.from + Math.random() * (range.to - range.from);
        return Math.round(multiplier * 100) / 100;
      }
    }

    return this.aviatorChances[0]?.from || 1;
  }

  /**
   * Create or get active aviator game
   * Only one ACTIVE game can exist at a time
   */
  async createOrGetAviator() {
    try {
      // Check if there's already an active game
      const existingGame = await this.prisma.aviator.findFirst({
        where: {
          status: AviatorStatus.ACTIVE,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (existingGame) {
        return existingGame;
      }

      // Create new game with startsAt = now + 6 seconds
      const startsAt = new Date(Date.now() + 6000);
      const multiplier = this.generateMultiplier();

      const newGame = await this.prisma.aviator.create({
        data: {
          startsAt,
          multiplier,
          status: AviatorStatus.ACTIVE,
        },
      });

      this.logger.log(
        `Created new aviator game #${newGame.id} with multiplier ${multiplier}x, starts at ${startsAt.toISOString()}`,
      );

      return newGame;
    } catch (error) {
      this.logger.error('Failed to create or get aviator game', error);
      throw new HttpException('Failed to create or get aviator game', 500);
    }
  }

  /**
   * Get current active game
   */
  async getCurrentGame() {
    try {
      const game = await this.prisma.aviator.findFirst({
        where: {
          status: AviatorStatus.ACTIVE,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!game) {
        throw new HttpException('No active aviator game found', 404);
      }

      return game;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to get current aviator game', error);
      throw new HttpException('Failed to get current aviator game', 500);
    }
  }

  /**
   * Update game status
   */
  async updateGameStatus(id: number, status: AviatorStatus) {
    try {
      const updatedGame = await this.prisma.aviator.update({
        where: { id },
        data: { status },
      });

      this.logger.log(`Updated aviator game #${id} status to ${status}`);

      return updatedGame;
    } catch (error) {
      this.logger.error(`Failed to update aviator game #${id} status`, error);
      throw new HttpException('Failed to update aviator game status', 500);
    }
  }
}
