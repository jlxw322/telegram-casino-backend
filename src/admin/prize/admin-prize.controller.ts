import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminPrizeService } from './admin-prize.service';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Admin - Prizes')
@ApiBearerAuth('JWT')
@Controller('admin/prizes')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminPrizeController {
  constructor(private readonly adminPrizeService: AdminPrizeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prize' })
  @ApiResponse({
    status: 201,
    description: 'Prize created successfully',
  })
  create(@Body() createPrizeDto: CreatePrizeDto) {
    return this.adminPrizeService.create(createPrizeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prizes with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Prizes retrieved successfully',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.adminPrizeService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prize by ID' })
  @ApiResponse({
    status: 200,
    description: 'Prize retrieved successfully',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminPrizeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update prize' })
  @ApiResponse({
    status: 200,
    description: 'Prize updated successfully',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePrizeDto: UpdatePrizeDto,
  ) {
    return this.adminPrizeService.update(id, updatePrizeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete prize' })
  @ApiResponse({
    status: 200,
    description: 'Prize deleted successfully',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminPrizeService.remove(id);
  }
}
