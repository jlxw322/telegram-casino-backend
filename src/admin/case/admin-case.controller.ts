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
import { AdminCaseService } from './admin-case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { AdminGuard } from '../../shared/guards/admin.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Admin - Cases')
@ApiBearerAuth('JWT')
@Controller('admin/cases')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminCaseController {
  constructor(private readonly adminCaseService: AdminCaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new case' })
  @ApiResponse({
    status: 201,
    description: 'Case created successfully',
  })
  create(@Body() createCaseDto: CreateCaseDto) {
    return this.adminCaseService.create(createCaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Cases retrieved successfully',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.adminCaseService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  @ApiResponse({
    status: 200,
    description: 'Case retrieved successfully',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminCaseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update case' })
  @ApiResponse({
    status: 200,
    description: 'Case updated successfully',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCaseDto: UpdateCaseDto,
  ) {
    return this.adminCaseService.update(id, updateCaseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete case' })
  @ApiResponse({
    status: 200,
    description: 'Case deleted successfully',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminCaseService.remove(id);
  }
}
