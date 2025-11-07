import { IsString, IsInt, Min, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrizeDto {
  @ApiProperty({ description: 'Prize name', example: 'Gold Coin' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Prize amount/value',
    example: 100,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Prize image URL',
    example: 'https://example.com/prize.png',
  })
  @IsUrl()
  url: string;
}
