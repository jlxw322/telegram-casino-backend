import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ description: 'Page number', example: 1, required: false })
  page?: number;

  @ApiProperty({ description: 'Items per page', example: 20, required: false })
  limit?: number;
}

export class ConvertGiftToPrizeDto {
  @ApiProperty({ description: 'Gift ID to convert', example: 1 })
  giftId: number;
}

export class ConvertGiftToInventoryDto {
  @ApiProperty({ description: 'Gift ID to convert', example: 1 })
  giftId: number;

  @ApiProperty({ description: 'User ID to assign gift to', example: 'uuid-here' })
  userId: string;
}

export class SendGiftNotificationDto {
  @ApiProperty({ description: 'Telegram user ID', example: 123456789 })
  telegramUserId: number;

  @ApiProperty({ description: 'Gift title', example: 'Premium Gift Box' })
  title: string;

  @ApiProperty({ description: 'Gift description', example: 'Congratulations on winning!', required: false })
  description?: string;
}
