import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';

export interface SocialPlatformPayload {
  platform: string;
  share_url: string;
  caption: string;
  hashtags: string[];
  direct_share_link?: string;
}

@Injectable()
export class ShareService {
  constructor(
    private db: DatabaseService,
    private configService: ConfigService,
  ) {}

  async getShareKit(orderId: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(orderId);
    }

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const frontendUrl = this.configService.get('frontendUrl') || 'http://localhost:3000';
    const showcaseUrl = `${frontendUrl}/showcase/${order.share_token}`;

    const caption = `My custom AI-sculpted magnetic levitating statue just arrived! Floating on my desk with embedded ${
      order.internal_led_lighting ? 'wireless internal LED lighting' : 'pedestal illumination'
    }. Created with Levitate3D.`;

    const hashtags = [
      '#LevitatingStatue',
      '#Tripo3D',
      '#Custom3DPrint',
      '#DeskSetup',
      '#Levitate3D',
      '#MagneticLevitation',
      '#3DManufacturing',
    ];

    const platforms: SocialPlatformPayload[] = [
      {
        platform: 'Twitter / X',
        share_url: showcaseUrl,
        caption,
        hashtags,
        direct_share_link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          caption + ' ' + hashtags.join(' ') + ' ' + showcaseUrl,
        )}`,
      },
      {
        platform: 'Facebook',
        share_url: showcaseUrl,
        caption,
        hashtags,
        direct_share_link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(showcaseUrl)}`,
      },
      {
        platform: 'Pinterest',
        share_url: showcaseUrl,
        caption,
        hashtags,
        direct_share_link: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
          showcaseUrl,
        )}&media=${encodeURIComponent(
          order.showcase_image_url || `${frontendUrl}/models/showcase_preview.png`,
        )}&description=${encodeURIComponent(caption)}`,
      },
      {
        platform: 'Instagram / TikTok (Native Share Sheet)',
        share_url: showcaseUrl,
        caption,
        hashtags,
      },
    ];

    return {
      order_id: order.id,
      order_number: order.order_number,
      share_token: order.share_token,
      showcase_url: showcaseUrl,
      title: `Custom Levitating 3D Statue #${order.order_number}`,
      description: caption,
      model_glb_url: order.refined_model_url || '/models/sample_levitating_statue.glb',
      turntable_video_url: order.turntable_video_url,
      showcase_image_url: order.showcase_image_url,
      customer_review: order.customer_review,
      platforms,
      open_graph: {
        'og:title': `Custom Magnetic Levitating & Illuminated 3D Statue`,
        'og:description': caption,
        'og:image': order.showcase_image_url || `${frontendUrl}/models/showcase_preview.png`,
        'og:url': showcaseUrl,
        'og:type': 'product',
      },
    };
  }

  async updateShowcase(
    orderId: string,
    data: { showcase_image_url?: string; turntable_video_url?: string; customer_review?: string },
  ) {
    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders SET
          showcase_image_url = COALESCE($1, showcase_image_url),
          turntable_video_url = COALESCE($2, turntable_video_url),
          customer_review = COALESCE($3, customer_review),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [data.showcase_image_url, data.turntable_video_url, data.customer_review, orderId],
      );
    } else {
      const order = this.db.getMemoryStore().orders.get(orderId);
      if (order) {
        if (data.showcase_image_url) order.showcase_image_url = data.showcase_image_url;
        if (data.turntable_video_url) order.turntable_video_url = data.turntable_video_url;
        if (data.customer_review) order.customer_review = data.customer_review;
        order.updated_at = new Date().toISOString();
      }
    }
    return this.getShareKit(orderId);
  }
}
