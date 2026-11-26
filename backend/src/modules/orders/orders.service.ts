import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { WormService } from '../worm/worm.service';
import { AuthService } from '../auth/auth.service';
import { CreateOrderDto } from './dto/order.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private db: DatabaseService,
    private wormService: WormService,
    private authService: AuthService,
  ) {}

  /**
   * Calculates dynamic pricing based on levitation platform & lighting specs
   */
  calculatePricing(dto: Partial<CreateOrderDto>) {
    let basePrice = 149.0; // Standard 12cm statue + Magnetic levitation & glow base
    let internalLedPrice = 0.0;
    let finishPrice = 0.0;
    let sizePriceDelta = 0.0;
    const shippingPrice = 15.0;

    if (dto.size === 'LARGE') {
      sizePriceDelta = 40.0; // Large 18cm tier
    }

    if (dto.internal_led_lighting) {
      internalLedPrice = 35.0; // Internal inductive LED illumination coil & wiring
    }

    if (dto.finish === 'TRANSLUCENT_GLOW') {
      finishPrice = 15.0;
    } else if (dto.finish === 'FULL_COLOR') {
      finishPrice = 35.0;
    }

    const unitPrice = basePrice + sizePriceDelta + finishPrice;
    const totalPrice = unitPrice + internalLedPrice + shippingPrice;

    // COGS estimation for admin financial analysis
    const hardwareCogs = 28.0; // Electromagnet base + power supply
    const printResinCogs = dto.size === 'LARGE' ? 22.0 : 12.0;
    const ledInductiveCogs = dto.internal_led_lighting ? 8.0 : 0.0;
    const totalCogs = hardwareCogs + printResinCogs + ledInductiveCogs;

    // Supplier payout
    const supplierPayout = dto.internal_led_lighting ? 65.0 : 50.0;
    const tripoApiCost = 0.2;

    return {
      basePrice,
      sizePriceDelta,
      finishPrice,
      internalLedPrice,
      shippingPrice,
      unitPrice,
      totalPrice,
      totalCogs,
      supplierPayout,
      tripoApiCost,
      netMargin: totalPrice - (totalCogs + supplierPayout + tripoApiCost + shippingPrice),
    };
  }

  /**
   * Creates an order with seamless customer auto-provisioning and WORM audit record
   */
  async createOrder(dto: CreateOrderDto, customerUserId?: string) {
    // 1. Auto-provision customer if not logged in
    let customerId = customerUserId;
    if (!customerId) {
      const user = await this.authService.findOrCreateCustomer(
        dto.customer_email,
        dto.customer_name,
        dto.customer_phone,
      );
      customerId = user.id;
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `LEV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const shareToken = `share_${crypto.randomBytes(12).toString('hex')}`;
    const pricing = this.calculatePricing(dto);

    // Initial status is ORDER_PLACED
    const orderRecord = {
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      generation_id: dto.generation_id || null,
      base_option: dto.base_option || 'MAGNETIC_LEVITATING_BASE',
      internal_led_lighting: dto.internal_led_lighting,
      size: dto.size,
      finish: dto.finish,
      designer_notes: dto.designer_notes || '',
      reference_image_url: dto.reference_image_url || null,
      base_price: pricing.basePrice + pricing.sizePriceDelta,
      internal_led_price: pricing.internalLedPrice,
      finish_price: pricing.finishPrice,
      shipping_price: pricing.shippingPrice,
      total_price: pricing.totalPrice,
      cogs_amount: pricing.totalCogs,
      supplier_payout: pricing.supplierPayout,
      tripo_api_cost: pricing.tripoApiCost,
      status: 'ORDER_PLACED',
      payment_status: 'PENDING',
      shipping_address: dto.shipping_address || {},
      supplier_stage: 'NEEDS_REFINEMENT',
      share_token: shareToken,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `INSERT INTO orders (
          id, order_number, customer_id, generation_id, base_option, internal_led_lighting,
          size, finish, designer_notes, reference_image_url, base_price, internal_led_price,
          finish_price, shipping_price, total_price, cogs_amount, supplier_payout, tripo_api_cost,
          status, payment_status, shipping_address, supplier_stage, share_token
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )`,
        [
          orderRecord.id,
          orderRecord.order_number,
          orderRecord.customer_id,
          orderRecord.generation_id,
          orderRecord.base_option,
          orderRecord.internal_led_lighting,
          orderRecord.size,
          orderRecord.finish,
          orderRecord.designer_notes,
          orderRecord.reference_image_url,
          orderRecord.base_price,
          orderRecord.internal_led_price,
          orderRecord.finish_price,
          orderRecord.shipping_price,
          orderRecord.total_price,
          orderRecord.cogs_amount,
          orderRecord.supplier_payout,
          orderRecord.tripo_api_cost,
          orderRecord.status,
          orderRecord.payment_status,
          JSON.stringify(orderRecord.shipping_address),
          orderRecord.supplier_stage,
          orderRecord.share_token,
        ],
      );
    } else {
      this.db.getMemoryStore().orders.set(orderId, orderRecord);
      this.db.persistDevStore();
    }

    // 2. Record CUSTOMIZATION_SUBMITTED into WORM ledger
    await this.wormService.recordEvent({
      actor_role: 'CUSTOMER',
      actor_id: customerId,
      order_id: orderId,
      event_type: 'CUSTOMIZATION_SUBMITTED',
      payload_json: {
        order_number: orderNumber,
        base_option: dto.base_option,
        internal_led_lighting: dto.internal_led_lighting,
        size: dto.size,
        finish: dto.finish,
        designer_notes: dto.designer_notes,
        total_price: pricing.totalPrice,
      },
    });

    return orderRecord;
  }

  /**
   * Retrieves order by ID for customer
   */
  async getOrder(orderId: string) {
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
    let promptText: string = order.prompt_text || 'A happy running dog';
    if (order.generation_id) {
      if (this.db.isPostgresConnected) {
        const genRes = await this.db.query('SELECT model_glb_url, prompt_text FROM generations WHERE id = $1', [order.generation_id]);
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

    return {
      ...order,
      prompt_text: promptText,
      model_glb_url: order.refined_model_url || genModelUrl || '/models/sample_levitating_statue.glb',
      original_model_url: genModelUrl,
    };
  }

  /**
   * Retrieves orders for customer dashboard
   */
  async getOrders(customerId?: string) {
    if (this.db.isPostgresConnected) {
      const sql = customerId
        ? 'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM orders ORDER BY created_at DESC';
      const params = customerId ? [customerId] : [];
      const res = await this.db.query(sql, params);
      return res.rows;
    } else {
      let orders = Array.from(this.db.getMemoryStore().orders.values());
      if (customerId) {
        orders = orders.filter((o: any) => !o.customer_id || o.customer_id === customerId);
      }
      return orders.map((o: any) => {
        const gen = o.generation_id ? this.db.getMemoryStore().generations.get(o.generation_id) : null;
        return {
          ...o,
          prompt_text: gen?.prompt_text || o.prompt_text || 'A happy running dog',
          model_glb_url: o.refined_model_url || gen?.model_glb_url || '/models/sample_levitating_statue.glb',
        };
      });
    }
  }

  /**
   * Retrieves order tracking and 2-stage fulfillment pipeline
   * (Manufacturer -> US Company Hub -> End Client)
   */
  async getOrderTracking(orderId: string) {
    const order = await this.getOrder(orderId);
    const status = order.status || 'ORDER_PLACED';

    const milestones = [
      {
        step: 1,
        key: 'ORDER_PLACED',
        label: '1. Client Ordered 3D Model',
        description: 'Order placed by client and securely certified into immutable WORM legal ledger.',
        facility: 'Client Web Studio',
        status: 'COMPLETED',
      },
      {
        step: 2,
        key: 'DESIGNER_REFINING',
        label: '2. Admin Review & Engineering Check',
        description: status === 'ORDER_REJECTED'
          ? `Order Rejected: ${order.rejection_notes || 'Model geometry unprintable or fails levitation balance.'}`
          : 'Admin reviewed prompt, specifications, and feasibility, then approved dispatch to manufacturer desktop app.',
        facility: 'Levitate3D Operations (Admin)',
        status: status === 'ORDER_REJECTED'
          ? 'REJECTED'
          : ['DESIGNER_REFINING', 'PENDING_CLIENT_APPROVAL', 'REFINED_MODEL_READY', 'CLIENT_APPROVED_PRINTING', 'PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status) && status !== 'ORDER_PLACED' && status !== 'PENDING_ADMIN_REVIEW'
          ? 'COMPLETED'
          : status === 'ORDER_PLACED' || status === 'PENDING_ADMIN_REVIEW'
          ? 'IN_PROGRESS'
          : 'PENDING',
      },
      {
        step: 3,
        key: 'PENDING_CLIENT_APPROVAL',
        label: '3. Manufacturer Refined 3D Model',
        description: 'Manufacturer 3D engineer carved 18.2mm N52 magnet socket and calibrated balance. Model uploaded for client review.',
        facility: 'Precision 3D Lab (Manufacturer Desktop App)',
        status: ['PENDING_CLIENT_APPROVAL', 'REFINED_MODEL_READY', 'CLIENT_APPROVED_PRINTING', 'PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status)
          ? ['CLIENT_APPROVED_PRINTING', 'PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status) ? 'COMPLETED' : 'IN_PROGRESS'
          : 'PENDING',
      },
      {
        step: 4,
        key: 'CLIENT_APPROVED_PRINTING',
        label: '4. Client Approved Refined Model',
        description: 'Client inspected refined 3D model on web app and approved it to authorize 3D printing and fabrication.',
        facility: 'Client Web App Portal',
        status: ['CLIENT_APPROVED_PRINTING', 'PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status)
          ? ['PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status) ? 'COMPLETED' : 'IN_PROGRESS'
          : 'PENDING',
      },
      {
        step: 5,
        key: 'PRINTING_LED_ASSEMBLY',
        label: '5. Precision 3D Printing & Fabrication',
        description: 'Manufacturer 3D printing in photopolymer resin and installing wireless inductive LED coils.',
        facility: 'Precision 3D Lab (Manufacturer)',
        status: ['PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status)
          ? ['IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status) ? 'COMPLETED' : 'IN_PROGRESS'
          : 'PENDING',
      },
      {
        step: 6,
        key: 'IN_TRANSIT_TO_US_HUB',
        label: '6. Manufacturer Dispatched to US Hub',
        description: 'Production finished. Dispatched via international air freight to Levitate3D US Fulfillment Center.',
        facility: 'Inbound Air Freight -> US Hub',
        status: ['IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status)
          ? ['US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status) ? 'COMPLETED' : 'IN_PROGRESS'
          : 'PENDING',
      },
      {
        step: 7,
        key: 'US_HUB_PROCESSING',
        label: '7. US Company QA & Base Pairing',
        description: 'Received at US company hub. Levitation floating balance tested, paired with magnetic base & luxury packaging.',
        facility: 'Levitate3D US Hub • Beaverton, OR, USA',
        status: ['US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status)
          ? ['SHIPPED_TO_CLIENT', 'DELIVERED'].includes(status) ? 'COMPLETED' : 'IN_PROGRESS'
          : 'PENDING',
      },
      {
        step: 8,
        key: 'SHIPPED_TO_CLIENT',
        label: '8. US Company Shipped to Client',
        description: 'Dispatched from US Company Hub via domestic carrier directly to client address.',
        facility: 'Domestic Delivery • USPS / UPS Ground',
        status: ['SHIPPED_TO_CLIENT', 'DELIVERED'].includes(status)
          ? status === 'DELIVERED' ? 'COMPLETED' : 'IN_PROGRESS'
          : 'PENDING',
      },
    ];

    const hasInbound = ['IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'SHIPPED_TO_CLIENT', 'DELIVERED', 'QUALITY_CHECK_SHIPPED'].includes(status);
    const hasClientOutbound = ['SHIPPED_TO_CLIENT', 'DELIVERED'].includes(status);
    const requiresClientApproval = ['PENDING_CLIENT_APPROVAL', 'REFINED_MODEL_READY'].includes(status);

    return {
      order_id: order.id,
      order_number: order.order_number,
      current_status: status,
      supplier_stage: order.supplier_stage,
      size: order.size,
      finish: order.finish,
      internal_led_lighting: order.internal_led_lighting,
      requires_client_approval: requiresClientApproval,
      refined_model_url: order.refined_model_url || order.model_glb_url,
      refined_notes: order.refined_notes,
      // Leg 1: Manufacturer -> US Company Hub
      inbound_freight: hasInbound
        ? {
            carrier: order.inbound_freight_carrier || 'DHL Express Air Freight',
            tracking_number: order.inbound_tracking_number || 'DHL-INB-891042',
            tracking_url: order.inbound_tracking_url || 'https://www.dhl.com/en/express/tracking.html?AWB=DHL-9847291048',
            origin: 'Precision 3D Lab (Manufacturer)',
            destination: order.hub_facility ? `${order.hub_facility} (${order.hub_city || 'USA'})` : 'Levitate3D US Hub (Beaverton, OR)',
          }
        : null,
      // Leg 2: US Company Hub -> End Client
      carrier: hasClientOutbound ? (order.client_carrier || order.carrier || 'USPS Priority Mail') : (order.carrier || 'Pending US Hub Inspection'),
      tracking_number: hasClientOutbound ? (order.client_tracking_number || order.tracking_number || 'USPS-9400111899562537482910') : null,
      tracking_url: hasClientOutbound ? (order.client_tracking_url || order.tracking_url || 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899562537482910') : null,
      client_shipping_address: order.shipping_address,
      share_token: order.share_token,
      is_delivered: status === 'DELIVERED',
      is_rejected: status === 'ORDER_REJECTED',
      rejection_reason: order.rejection_reason,
      rejection_notes: order.rejection_notes,
      payment_status: order.payment_status,
      milestones,
    };
  }

  /**
   * Client approves refined 3D model, authorizing manufacturer to fabricate
   */
  async approveRefinedModel(orderId: string, feedback?: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(orderId);
    }
    if (!order) throw new NotFoundException('Order not found');

    const newStatus = 'CLIENT_APPROVED_PRINTING';
    const newStage = 'READY_TO_PRINT';

    if (this.db.isPostgresConnected) {
      await this.db.query('UPDATE orders SET status = $1, supplier_stage = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [newStatus, newStage, orderId]);
    } else {
      order.status = newStatus;
      order.supplier_stage = newStage;
      order.client_approved_at = new Date().toISOString();
      order.client_feedback = feedback || 'Client approved refined 3D model for fabrication.';
      order.updated_at = new Date().toISOString();
      this.db.getMemoryStore().orders.set(orderId, order);
      this.db.persistDevStore();
    }

    await this.wormService.recordEvent({
      actor_role: 'CUSTOMER',
      actor_id: order.customer_id,
      order_id: orderId,
      event_type: 'CUSTOMER_APPROVAL_RECORDED',
      payload_json: {
        order_number: order.order_number,
        action: 'CLIENT_APPROVED_REFINED_MODEL',
        feedback: feedback || 'Approved for 3D printing and fabrication',
        refined_model_url: order.refined_model_url,
        approved_at: new Date().toISOString(),
      },
    });

    return {
      success: true,
      order_id: orderId,
      status: newStatus,
      supplier_stage: newStage,
      message: 'Refined model approved by client. Manufacturer authorized to begin 3D printing!',
    };
  }

  /**
   * Retrieves order by share token for public showcase
   */
  async getOrderByShareToken(shareToken: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE share_token = $1', [shareToken]);
      order = res.rows[0];
    } else {
      order = Array.from(this.db.getMemoryStore().orders.values()).find(
        (o: any) => o.share_token === shareToken,
      );
    }

    if (!order) {
      throw new NotFoundException('Showcase not found');
    }

    return {
      order_number: order.order_number,
      size: order.size,
      finish: order.finish,
      internal_led_lighting: order.internal_led_lighting,
      status: order.status,
      share_token: order.share_token,
      model_glb_url: order.refined_model_url || '/models/sample_levitating_statue.glb',
      turntable_video_url: order.turntable_video_url,
      showcase_image_url: order.showcase_image_url,
      customer_review: order.customer_review,
    };
  }
}
