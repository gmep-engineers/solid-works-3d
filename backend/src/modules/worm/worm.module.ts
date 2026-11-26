import { Global, Module } from '@nestjs/common';
import { WormService } from './worm.service';

@Global()
@Module({
  providers: [WormService],
  exports: [WormService],
})
export class WormModule {}
