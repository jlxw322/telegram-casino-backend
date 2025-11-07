import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CaseService } from './case.service';
import { UserGuard } from '../shared/guards/user.guard';
import { User } from '../shared/decorator/user.decorator';
import { OpenCaseDto } from './dto/open-case.dto';

@ApiTags('Cases')
@Controller('case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post(':id/open')
  @UseGuards(UserGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Open a case and receive random prizes' })
  @ApiResponse({
    status: 201,
    description: 'Case(s) opened successfully, returns won prizes',
  })
  async openCase(
    @Param('id', ParseIntPipe) caseId: number,
    @Body() openCaseDto: OpenCaseDto,
    @User('id') userId: string,
  ) {
    return this.caseService.openCase(caseId, userId, openCaseDto.multiplier);
  }
}
