import { Module } from '@nestjs/common';
import { GiftController } from './gift.controller';
import { AdminGiftController } from './admin-gift.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [GiftController, AdminGiftController],
})
export class GiftModule {}
