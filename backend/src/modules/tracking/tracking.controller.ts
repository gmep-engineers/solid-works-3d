import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

@ApiTags('Order Tracking')
@Controller('api/v1/orders')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get visual milestone order tracking & carrier status' })
  @ApiResponse({ status: 200, description: 'Milestone tracking information returned' })
  async getTracking(@Param('id') id: string) {
    return this.trackingService.getOrderTracking(id);
  }
}
