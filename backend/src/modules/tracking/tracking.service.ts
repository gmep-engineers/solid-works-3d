import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface MilestoneStep {
  step: number;
  key: string;
  label: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  completed_at?: string;
}

@Injectable()
export class TrackingService {
  constructor(private db: DatabaseService) {}

  async getOrderTracking(orderId: string) {
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

    let genModelUrl: string | null = null;
    let promptText = 'A happy running dog, Golden yellow fur, Detailed fur texture';
    if (order.generation_id) {
      if (this.db.isPostgresConnected) {
        const genRes = await this.db.query(
          'SELECT model_glb_url, prompt_text FROM generations WHERE id = $1',
          [order.generation_id],
        );
        if (genRes.rows.length > 0) {
          genModelUrl = genRes.rows[0].model_glb_url;
          if (genRes.rows[0].prompt_text) promptText = genRes.rows[0].prompt_text;
        }
      } else {
        const gen = this.db.getMemoryStore().generations.get(order.generation_id);
        if (gen) {
          genModelUrl = gen.model_glb_url;
          if (gen.prompt_text) promptText = gen.prompt_text;
        }
      }
    }

    const currentStatus = order.status;
    const milestones: MilestoneStep[] = [
      {
        step: 1,
        key: 'ORDER_PLACED',
        label: 'Order Placed',
        description: 'Order confirmed and locked into WORM legal ledger.',
        status: 'COMPLETED',
        completed_at: order.created_at,
      },
      {
        step: 2,
        key: 'DESIGNER_REFINING',
        label: '3D Designer Refining Model',
        description: 'Supplier 3D engineer preparing magnet cavity and internal wiring channels.',
        status:
          currentStatus === 'ORDER_PLACED'
            ? 'PENDING'
            : currentStatus === 'DESIGNER_REFINING'
            ? 'IN_PROGRESS'
            : 'COMPLETED',
      },
      {
        step: 3,
        key: 'REFINED_MODEL_READY',
        label: 'Refined 3D Model Ready',
        description: '3D print-ready model calibrated for magnetic levitation balance.',
        status: ['ORDER_PLACED', 'DESIGNER_REFINING'].includes(currentStatus)
          ? 'PENDING'
          : currentStatus === 'REFINED_MODEL_READY'
          ? 'IN_PROGRESS'
          : 'COMPLETED',
        completed_at: order.refined_at,
      },
      {
        step: 4,
        key: 'PRINTING_LED_ASSEMBLY',
        label: '3D Printing & LED Assembly',
        description: order.internal_led_lighting
          ? 'Statue 3D printing, inductive coil mounting, and LED illumination wiring.'
          : 'High-precision resin 3D printing and surface finishing.',
        status: ['ORDER_PLACED', 'DESIGNER_REFINING', 'REFINED_MODEL_READY'].includes(currentStatus)
          ? 'PENDING'
          : currentStatus === 'PRINTING_LED_ASSEMBLY'
          ? 'IN_PROGRESS'
          : 'COMPLETED',
      },
      {
        step: 5,
        key: 'QUALITY_CHECK_SHIPPED',
        label: 'Quality Check & Shipped',
        description: 'Levitation balance tested. Boxed with magnetic floating base & power supply.',
        status: ['ORDER_PLACED', 'DESIGNER_REFINING', 'REFINED_MODEL_READY', 'PRINTING_LED_ASSEMBLY'].includes(
          currentStatus,
        )
          ? 'PENDING'
          : currentStatus === 'QUALITY_CHECK_SHIPPED'
          ? 'IN_PROGRESS'
          : 'COMPLETED',
      },
      {
        step: 6,
        key: 'DELIVERED',
        label: 'Delivered',
        description: 'Statue delivered. Social Media Showcase Kit unlocked!',
        status: currentStatus === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
      },
    ];

    return {
      order_id: order.id,
      order_number: order.order_number,
      current_status: order.status,
      size: order.size,
      finish: order.finish,
      internal_led_lighting: order.internal_led_lighting,
      carrier: order.carrier || 'DHL Express',
      tracking_number: order.tracking_number || (currentStatus === 'QUALITY_CHECK_SHIPPED' || currentStatus === 'DELIVERED' ? 'DHL-9847291048' : null),
      tracking_url: order.tracking_url || (order.tracking_number ? `https://www.dhl.com/en/express/tracking.html?AWB=${order.tracking_number}` : null),
      refined_model_url: order.refined_model_url || genModelUrl || '/models/sample_levitating_statue.glb',
      model_glb_url: order.refined_model_url || genModelUrl || '/models/sample_levitating_statue.glb',
      original_model_url: genModelUrl,
      prompt_text: promptText,
      share_token: order.share_token,
      is_delivered: currentStatus === 'DELIVERED',
      milestones,
      updated_at: order.updated_at,
    };
  }
}
