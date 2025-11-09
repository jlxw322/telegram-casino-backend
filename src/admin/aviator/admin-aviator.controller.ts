import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { AviatorService } from './aviator.service';
import { UpdateAviatorSettingsDto } from './dto/update-aviator-settings.dto';
import { PrismaService } from '../../shared/services/prisma.service';
import { SystemKey } from '@prisma/client';
import { HttpException } from '@nestjs/common';

@ApiTags('Admin - Aviator')
@Controller('admin/aviator')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiBearerAuth('JWT')
export class AdminAviatorController {
  private readonly logger = new Logger(AdminAviatorController.name);

  constructor(
    private readonly aviatorService: AviatorService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get aviator settings' })
  @ApiResponse({
    status: 200,
    description: 'Returns current aviator settings',
  })
  public getSettings() {
    return {
      settings: this.aviatorService.getAviatorSettings(),
      timestamp: new Date().toISOString(),
    };
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update aviator settings' })
  @ApiResponse({
    status: 200,
    description: 'Aviator settings updated successfully',
  })
  async updateSettings(@Body() dto: UpdateAviatorSettingsDto) {
    try {
      // Validate settings
      if (dto.minMultiplier >= dto.maxMultiplier) {
        throw new HttpException(
          'minMultiplier must be less than maxMultiplier',
          400,
        );
      }

      if (dto.minBet >= dto.maxBet) {
        throw new HttpException('minBet must be less than maxBet', 400);
      }

      // Update in database
      const updated = await this.prisma.system.upsert({
        where: { key: SystemKey.AVIATOR },
        update: { value: JSON.stringify(dto) },
        create: {
          key: SystemKey.AVIATOR,
          value: JSON.stringify(dto),
        },
      });

      // Reload settings in service
      await this.aviatorService.reloadAviatorSettings();

      return {
        key: updated.key,
        settings: JSON.parse(updated.value),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to update aviator settings', error);
      throw new HttpException('Failed to update aviator settings', 500);
    }
  }
}
