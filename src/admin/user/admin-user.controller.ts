import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/shared/guards/admin.guard';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin/user')
@ApiTags('Admin - User')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminUserController {
  private readonly logger = new Logger(AdminUserController.name);

  constructor(private adminUserService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async getAllUsers(@Query() pagination: PaginationDto) {
    try {
      return await this.adminUserService.getAllUsers(pagination);
    } catch (error) {
      this.logger.error('Failed to get users: ', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  async getUserById(@Param('id') id: string) {
    try {
      return await this.adminUserService.getUserById(id);
    } catch (error) {
      this.logger.error(`Failed to get user with id ${id}: `, error);
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      return await this.adminUserService.updateUser(id, updateUserDto);
    } catch (error) {
      this.logger.error(`Failed to update user with id ${id}: `, error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  async deleteUser(@Param('id') id: string) {
    try {
      return await this.adminUserService.deleteUser(id);
    } catch (error) {
      this.logger.error(`Failed to delete user with id ${id}: `, error);
      throw error;
    }
  }

  @Patch(':id/ban')
  @ApiOperation({ summary: 'Ban user' })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
  })
  async banUser(@Param('id') id: string) {
    try {
      return await this.adminUserService.banUser(id);
    } catch (error) {
      this.logger.error(`Failed to ban user with id ${id}: `, error);
      throw error;
    }
  }

  @Patch(':id/unban')
  @ApiOperation({ summary: 'Unban user' })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
  })
  async unbanUser(@Param('id') id: string) {
    try {
      return await this.adminUserService.unbanUser(id);
    } catch (error) {
      this.logger.error(`Failed to unban user with id ${id}: `, error);
      throw error;
    }
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Update user balance' })
  @ApiResponse({
    status: 200,
    description: 'User balance updated successfully',
  })
  async updateBalance(
    @Param('id') id: string,
    @Body('balance') balance: number,
  ) {
    try {
      return await this.adminUserService.updateBalance(id, balance);
    } catch (error) {
      this.logger.error(
        `Failed to update balance for user with id ${id}: `,
        error,
      );
      throw error;
    }
  }
}
