import { Module } from '@nestjs/common';
import { Tripo3dService } from './tripo3d.service';
import { Tripo3dController } from './tripo3d.controller';

@Module({
  controllers: [Tripo3dController],
  providers: [Tripo3dService],
  exports: [Tripo3dService],
})
export class Tripo3dModule {}
