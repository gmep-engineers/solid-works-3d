import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShareService } from './share.service';

@ApiTags('Social Share Kit')
@Controller('api/v1')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get('orders/:id/share-kit')
  @ApiOperation({ summary: 'Generate social media share kit post-delivery' })
  @ApiResponse({ status: 200, description: 'Share kit payload with platform links and OG tags' })
  async getShareKit(@Param('id') orderId: string) {
    return this.shareService.getShareKit(orderId);
  }

  @Patch('orders/:id/showcase')
  @ApiOperation({ summary: 'Update customer showcase photos, turntable video, or review' })
  async updateShowcase(
    @Param('id') orderId: string,
    @Body() body: { showcase_image_url?: string; turntable_video_url?: string; customer_review?: string },
  ) {
    return this.shareService.updateShowcase(orderId, body);
  }
}
