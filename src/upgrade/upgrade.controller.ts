import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpgradeService } from './upgrade.service';
import { UserGuard } from '../shared/guards/user.guard';
import { User } from '../shared/decorator/user.decorator';
import { GetUpgradeOptionsDto } from './dto/get-upgrade-options.dto';
import { ExecuteUpgradeDto } from './dto/execute-upgrade.dto';
import { UpgradeOptionsResponseDto } from './dto/upgrade-options-response.dto';
import { UpgradeResultDto } from './dto/upgrade-result.dto';
import { GetUpgradeHistoryDto } from './dto/get-upgrade-history.dto';
import { UpgradeHistoryResponseDto } from './dto/upgrade-history-response.dto';
import { UpgradeStatsResponseDto } from './dto/upgrade-stats-response.dto';

@ApiTags('Upgrade')
@Controller('upgrade')
export class UpgradeController {
  constructor(private readonly upgradeService: UpgradeService) {}

  @Get('options')
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upgrade options for an inventory item' })
  @ApiResponse({
    status: 200,
    description: 'Returns available upgrade paths with chances',
    type: UpgradeOptionsResponseDto,
  })
  async getUpgradeOptions(
    @Query() dto: GetUpgradeOptionsDto,
    @User('id') userId: string,
  ): Promise<UpgradeOptionsResponseDto> {
    return this.upgradeService.getUpgradeOptions(dto.inventoryItemId, userId);
  }

  @Post('execute')
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute an upgrade attempt' })
  @ApiResponse({
    status: 201,
    description: 'Upgrade executed, returns success/failure result',
    type: UpgradeResultDto,
  })
  async executeUpgrade(
    @Body() dto: ExecuteUpgradeDto,
    @User('id') userId: string,
  ): Promise<UpgradeResultDto> {
    return this.upgradeService.executeUpgrade(
      dto.inventoryItemId,
      dto.multiplier,
      userId,
    );
  }

  @Get('history')
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user upgrade history' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated upgrade history',
    type: UpgradeHistoryResponseDto,
  })
  async getUpgradeHistory(
    @Query() dto: GetUpgradeHistoryDto,
    @User('id') userId: string,
  ): Promise<UpgradeHistoryResponseDto> {
    return this.upgradeService.getUpgradeHistory(userId, dto.page, dto.limit);
  }

  @Get('stats')
  @UseGuards(UserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user upgrade statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns comprehensive upgrade statistics',
    type: UpgradeStatsResponseDto,
  })
  async getUpgradeStats(
    @User('id') userId: string,
  ): Promise<UpgradeStatsResponseDto> {
    return this.upgradeService.getUpgradeStats(userId);
  }
}
