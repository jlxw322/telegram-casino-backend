import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenCaseDto {
  @ApiProperty({
    description: 'Number of cases to open (1-3)',
    example: 1,
    minimum: 1,
    maximum: 3,
  })
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  multiplier: number;
}
