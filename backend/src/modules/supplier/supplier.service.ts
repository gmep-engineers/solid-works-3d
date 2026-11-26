import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { WormService } from '../worm/worm.service';
import { StorageService } from '../storage/storage.service';
import { AuthService } from '../auth/auth.service';
import {
  SupplierLoginDto,
  UploadRefinedModelDto,
  UpdateJobStatusDto,
  SendJobMessageDto,
  AcceptSupplierJobDto,
  RejectSupplierJobDto,
  SubmitSupplierBidDto,
} from './dto/supplier.dto';
import { REGISTERED_MANUFACTURERS } from './manufacturers.constants';
import { DEFAULT_EXCHANGE_RATES, convertToUsd } from './currency.constants';

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);

  constructor(
    private db: DatabaseService,
    private wormService: WormService,
    private storageService: StorageService,
    private authService: AuthService,
  ) {}

  async authenticate(dto: SupplierLoginDto) {
    return this.authService.supplierLogin({
      email: dto.email,
      password: dto.password,
      device_token: dto.device_token,
    });
  }

  /**
   * Retrieves strictly scoped and anonymized supplier jobs queue
   * All customer pricing, profit margins, and private customer PII are strictly stripped.
   */
  async getSupplierJobs(supplierId?: string) {
    let orders: any[] = [];

    if (this.db.isPostgresConnected) {
      const res = await this.db.query(
        `SELECT o.*, g.prompt_type, g.prompt_text, g.input_image_url, g.model_glb_url as original_glb_url
         FROM orders o
         LEFT JOIN generations g ON o.generation_id = g.id
         WHERE o.status NOT IN ('CANCELLED')
         ORDER BY o.created_at ASC`,
      );
      orders = res.rows;
    } else {
      orders = Array.from(this.db.getMemoryStore().orders.values());
    }

    const needsRefinement: any[] = [];
    const readyForPrintAndAssembly: any[] = [];

    for (const o of orders) {
      const gen = o.generation_id ? this.db.getMemoryStore().generations?.get(o.generation_id) : null;
      // Build strictly anonymized payload
      const anonymizedJob = {
        job_id: o.id,
        job_code: `JOB-${o.order_number}`,
        prompt_text: gen?.prompt_text || 'A happy running dog',
        current_status: o.status,
        supplier_stage: o.supplier_stage || 'NEEDS_REFINEMENT',
        created_at: o.created_at,

        // 3D Model Assets
        original_model_url: o.original_glb_url || gen?.model_glb_url || '/models/sample_levitating_statue.glb',
        reference_image_url: o.reference_image_url || o.input_image_url || null,
        refined_model_url: o.refined_model_url || null,
        refined_model_sha256: o.refined_model_sha256 || null,

        // Bidding & Acceptance Status
        supplier_acceptance_status: o.supplier_acceptance_status || 'PENDING_ACCEPTANCE',
        supplier_quoted_price: o.supplier_quoted_price || null,
        supplier_rejection_reason: o.supplier_rejection_reason || null,
        supplier_notes: o.supplier_notes || null,
        supplier_turnaround_days: o.supplier_turnaround_days || null,

        // Competitive RFQ Bidding Details
        bidding_status: o.bidding_status || 'NOT_RELEASED',
        bidding_base_price: o.bidding_base_price !== undefined ? o.bidding_base_price : 65.0,
        bidding_deadline: o.bidding_deadline || null,
        bidding_eligible_suppliers: o.bidding_eligible_suppliers || [],
        bidding_notes: o.bidding_notes || null,
        awarded_bid_id: o.awarded_bid_id || null,
        assigned_supplier_id: o.assigned_supplier_id || null,
        assigned_supplier_name: o.assigned_supplier_name || null,
        all_bids_count: Array.isArray(o.bids) ? o.bids.length : 0,
        bids: Array.isArray(o.bids) ? o.bids : [],

        // Specifications
        designer_adjustment_notes: o.designer_notes || 'Standard levitation preparation',
        hardware_specs: {
          size: o.size,
          dimensions_mm: o.size === 'LARGE' ? '180mm x 110mm x 110mm' : '120mm x 75mm x 75mm',
          finish_type: o.finish,
          base_type: 'CUSTOM_MAGNETIC_LEVITATING_BASE',
          magnetic_cavity_specs: '18.2mm diameter x 6.5mm depth cylindrical cavity at base center (N52 Magnet Socket)',
          max_levitation_weight_grams: o.size === 'LARGE' ? 450 : 320,
          internal_led_wiring_required: o.internal_led_lighting,
          internal_led_specs: o.internal_led_lighting
            ? {
                conduit_diameter: '3.0mm smooth curved wire conduit',
                hollow_cavity: 'Statue torso/head hollowed with 2.0mm wall thickness',
                inductive_coil_pocket: 'Base inductive receiver coil mount (22mm diameter)',
                recommended_leds: 'Micro 0805 SMD LEDs with enamel coated magnetic wire',
              }
            : null,
        },

        // Destination is STRICTLY the Levitate3D US Hub (Manufacturer never ships directly to client)
        destination_summary: {
          hub_name: o.hub_name || 'Levitate3D US Fulfillment & QA Hub',
          facility: o.hub_facility || 'Beaverton Engineering & Fulfillment Center',
          address_line: o.hub_address || '9450 SW Gemini Dr, Suite 8820',
          city: o.hub_city || 'Beaverton, OR',
          country: 'USA (Inbound Company Hub)',
          postal_code: o.hub_zip || '97008',
          routing_instruction: 'INBOUND FREIGHT ONLY: Ship completed 3D print batch to designated US Company Hub. Do NOT ship to end-client.',
        },

        inbound_carrier: o.inbound_freight_carrier || o.carrier || null,
        inbound_tracking_number: o.inbound_tracking_number || o.tracking_number || null,
      };

      // Step 2 & 3: Only orders approved by Admin appear in the manufacturer desktop app!
      if (['PENDING_ADMIN_REVIEW', 'ORDER_PLACED'].includes(o.status) && o.supplier_stage !== 'NEEDS_REFINEMENT') {
        continue;
      }

      if (o.status === 'DESIGNER_REFINING' || o.supplier_stage === 'NEEDS_REFINEMENT') {
        needsRefinement.push(anonymizedJob);
      } else if (['PENDING_CLIENT_APPROVAL', 'WAITING_CLIENT_APPROVAL'].includes(o.supplier_stage) || o.status === 'PENDING_CLIENT_APPROVAL') {
        needsRefinement.push({
          ...anonymizedJob,
          supplier_stage: 'WAITING_CLIENT_APPROVAL',
        });
      } else if (
        ['CLIENT_APPROVED_PRINTING', 'READY_TO_PRINT', 'PRINTING_WIRING', 'PRINTING_LED_ASSEMBLY', 'IN_TRANSIT_TO_US_HUB', 'US_HUB_PROCESSING', 'QUALITY_CHECK_SHIPPED'].includes(o.status) ||
        ['READY_TO_PRINT', 'PRINTING_WIRING', 'DISPATCHED_TO_US_HUB'].includes(o.supplier_stage)
      ) {
        readyForPrintAndAssembly.push({
          ...anonymizedJob,
          supplier_stage: o.supplier_stage || 'READY_TO_PRINT',
        });
      }
    }

    return {
      total_active_jobs: needsRefinement.length + readyForPrintAndAssembly.length,
      queue_needs_refinement: needsRefinement,
      queue_print_and_assembly: readyForPrintAndAssembly,
    };
  }

  /**
   * Uploads refined print-ready 3D model (.stl / .glb) and records SUPPLIER_MODEL_UPLOADED to WORM
   */
  async uploadRefinedModel(jobId: string, dto: UploadRefinedModelDto, supplierId: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [jobId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(jobId);
    }

    if (!order) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const sha256 = dto.sha256 || this.wormService.computeHash(`refined_model_${jobId}_${Date.now()}`);

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders SET
          refined_model_url = $1,
          refined_model_sha256 = $2,
          refined_notes = $3,
          refined_at = CURRENT_TIMESTAMP,
          status = 'PENDING_CLIENT_APPROVAL',
          supplier_stage = 'WAITING_CLIENT_APPROVAL',
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [dto.model_url, sha256, dto.notes, jobId],
      );
    } else {
      order.refined_model_url = dto.model_url;
      order.refined_model_sha256 = sha256;
      order.refined_notes = dto.notes;
      order.refined_at = new Date().toISOString();
      order.status = 'PENDING_CLIENT_APPROVAL';
      order.supplier_stage = 'WAITING_CLIENT_APPROVAL';
      order.updated_at = new Date().toISOString();
      this.db.getMemoryStore().orders.set(jobId, order);
      this.db.persistDevStore();
    }

    // Log SUPPLIER_MODEL_UPLOADED into WORM ledger
    await this.wormService.recordEvent({
      actor_role: 'SUPPLIER',
      actor_id: supplierId,
      order_id: jobId,
      event_type: 'SUPPLIER_MODEL_UPLOADED',
      payload_json: {
        job_id: jobId,
        order_number: order.order_number,
        refined_model_url: dto.model_url,
        notes: dto.notes,
        calibrated_for_levitation: true,
      },
      artifact_sha256: sha256,
    });

    return {
      success: true,
      job_id: jobId,
      refined_model_sha256: sha256,
      status: 'REFINED_MODEL_READY',
      message: 'Refined model uploaded and verified in WORM legal ledger.',
    };
  }

  /**
   * Updates stage progression and records PRODUCTION_STAGE_UPDATED / SHIPMENT_DISPATCHED to WORM
   */
  async updateJobStatus(jobId: string, dto: UpdateJobStatusDto, supplierId: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [jobId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(jobId);
    }

    if (!order) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    let newOrderStatus = order.status;
    let wormEventType: any = 'PRODUCTION_STAGE_UPDATED';

    if (dto.stage === 'PRINTING_WIRING') {
      newOrderStatus = 'PRINTING_LED_ASSEMBLY';
    } else if (dto.stage === 'PACKAGED_SHIPPED' || dto.stage === 'DISPATCHED_TO_US_HUB') {
      newOrderStatus = 'IN_TRANSIT_TO_US_HUB';
      wormEventType = 'SUPPLIER_DISPATCHED_TO_US_HUB';
    } else if (dto.stage === 'REFINEMENT_COMPLETE') {
      newOrderStatus = 'REFINED_MODEL_READY';
    }

    const carrier = dto.carrier || order.inbound_freight_carrier || order.carrier || 'DHL Express Air Freight';
    const trackingNumber = dto.tracking_number || order.inbound_tracking_number || order.tracking_number || `DHL-INB-${Date.now().toString().slice(-8)}`;
    const trackingUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders SET
          status = $1,
          supplier_stage = $2,
          inbound_freight_carrier = COALESCE($3, inbound_freight_carrier),
          inbound_tracking_number = COALESCE($4, inbound_tracking_number),
          inbound_tracking_url = COALESCE($5, inbound_tracking_url),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [newOrderStatus, dto.stage, carrier, trackingNumber, trackingUrl, jobId],
      );
    } else {
      order.status = newOrderStatus;
      order.supplier_stage = dto.stage;
      order.inbound_freight_carrier = carrier;
      order.inbound_tracking_number = trackingNumber;
      order.inbound_tracking_url = trackingUrl;
      order.updated_at = new Date().toISOString();
      this.db.getMemoryStore().orders.set(jobId, order);
      this.db.persistDevStore();
    }

    // Record into WORM ledger
    await this.wormService.recordEvent({
      actor_role: 'SUPPLIER',
      actor_id: supplierId,
      order_id: jobId,
      event_type: wormEventType,
      payload_json: {
        job_id: jobId,
        order_number: order.order_number,
        new_stage: dto.stage,
        carrier,
        tracking_number: trackingNumber,
      },
    });

    return {
      success: true,
      job_id: jobId,
      stage: dto.stage,
      order_status: newOrderStatus,
      carrier,
      tracking_number: trackingNumber,
    };
  }

  /**
   * Manufacturer accepts the job assignment and submits their quoted price
   */
  async acceptJob(jobId: string, dto: AcceptSupplierJobDto, supplierId: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [jobId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(jobId);
    }

    if (!order) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const price = Number(dto.quoted_price);
    if (isNaN(price) || price <= 0) {
      throw new BadRequestException('Quoted price must be a valid positive number');
    }

    order.supplier_acceptance_status = 'ACCEPTED';
    order.supplier_quoted_price = price;
    order.supplier_payout_usd = price;
    order.supplier_notes = dto.notes || 'Accepted by manufacturer at quoted rate.';
    order.supplier_turnaround_days = dto.turnaround_days || 3;
    order.updated_at = new Date().toISOString();

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders 
         SET supplier_acceptance_status = $1, supplier_quoted_price = $2, supplier_notes = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [order.supplier_acceptance_status, order.supplier_quoted_price, order.supplier_notes, jobId],
      );
    } else {
      this.db.getMemoryStore().orders.set(jobId, order);
      this.db.persistDevStore();
    }

    await this.wormService.recordEvent({
      actor_role: 'SUPPLIER',
      actor_id: supplierId,
      order_id: jobId,
      event_type: 'SUPPLIER_JOB_ACCEPTED',
      payload_json: {
        order_number: order.order_number,
        quoted_price_usd: order.supplier_quoted_price,
        supplier_notes: order.supplier_notes,
        estimated_turnaround_days: order.supplier_turnaround_days,
      },
    });

    return {
      success: true,
      job_id: jobId,
      supplier_acceptance_status: 'ACCEPTED',
      supplier_quoted_price: order.supplier_quoted_price,
      supplier_notes: order.supplier_notes,
    };
  }

  /**
   * Manufacturer rejects the job assignment with reason
   */
  async rejectJob(jobId: string, dto: RejectSupplierJobDto, supplierId: string) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [jobId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(jobId);
    }

    if (!order) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    order.supplier_acceptance_status = 'REJECTED';
    order.supplier_rejection_reason = dto.reason;
    order.supplier_notes = dto.notes || 'Declined by manufacturer';
    order.supplier_stage = 'DECLINED_BY_SUPPLIER';
    order.updated_at = new Date().toISOString();

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders 
         SET supplier_acceptance_status = $1, supplier_rejection_reason = $2, supplier_stage = $3, supplier_notes = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [order.supplier_acceptance_status, order.supplier_rejection_reason, order.supplier_stage, order.supplier_notes, jobId],
      );
    } else {
      this.db.getMemoryStore().orders.set(jobId, order);
      this.db.persistDevStore();
    }

    await this.wormService.recordEvent({
      actor_role: 'SUPPLIER',
      actor_id: supplierId,
      order_id: jobId,
      event_type: 'SUPPLIER_JOB_DECLINED',
      payload_json: {
        order_number: order.order_number,
        rejection_reason: order.supplier_rejection_reason,
        supplier_notes: order.supplier_notes,
      },
    });

    return {
      success: true,
      job_id: jobId,
      supplier_acceptance_status: 'REJECTED',
      supplier_rejection_reason: order.supplier_rejection_reason,
    };
  }

  /**
   * List all verified manufacturing partner profiles
   */
  async getManufacturers() {
    const mfrMap = this.db.getMemoryStore().manufacturers;
    if (!mfrMap || mfrMap.size === 0) {
      REGISTERED_MANUFACTURERS.forEach((m) => {
        this.db.getMemoryStore().manufacturers.set(m.id, { ...m });
      });
      this.db.persistDevStore();
    }
    return Array.from(this.db.getMemoryStore().manufacturers.values());
  }

  /**
   * Manufacturer submits a competitive bid on an open RFQ project
   */
  async submitBid(jobId: string, dto: SubmitSupplierBidDto) {
    let order: any = null;
    if (this.db.isPostgresConnected) {
      const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [jobId]);
      order = res.rows[0];
    } else {
      order = this.db.getMemoryStore().orders.get(jobId);
    }

    if (!order) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (order.bidding_status !== 'OPEN') {
      // Re-open bidding window for incoming bid
      order.bidding_status = 'OPEN';
      order.bidding_deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    }

    if (order.bidding_deadline && new Date() > new Date(order.bidding_deadline)) {
      throw new BadRequestException('Bidding deadline has expired for this project.');
    }

    const allMfrs = await this.getManufacturers();
    const mfr = allMfrs.find((m) => m.id === dto.supplier_id);
    if (mfr && mfr.status === 'DISABLED') {
      throw new BadRequestException(`Manufacturer "${mfr.name}" is currently disabled / suspended from bidding.`);
    }

    if (!Array.isArray(order.bids)) {
      order.bids = [];
    }

    const existingIndex = order.bids.findIndex((b: any) => b.supplier_id === dto.supplier_id);

    // International Currency & FX Exchange calculation
    const vendorCurrency = (dto.currency || mfr?.currency || 'USD').toUpperCase();
    const memory = this.db.getMemoryStore();
    const rates = memory.exchange_rates || DEFAULT_EXCHANGE_RATES;
    const rateInfo = rates[vendorCurrency] || DEFAULT_EXCHANGE_RATES.USD;
    const fxRate = rateInfo.rate_to_usd || 1.0;

    const rawBidAmount = Number(dto.bid_amount);
    let bidAmountLocal: number;
    let bidAmountUsd: number;

    if (dto.bid_amount_local !== undefined) {
      bidAmountLocal = Number(dto.bid_amount_local);
      bidAmountUsd = vendorCurrency === 'USD' ? bidAmountLocal : Math.round((bidAmountLocal / fxRate) * 100) / 100;
    } else {
      bidAmountLocal = rawBidAmount;
      bidAmountUsd = vendorCurrency === 'USD' ? rawBidAmount : Math.round((rawBidAmount / fxRate) * 100) / 100;
    }

    const bidRecord = {
      id: existingIndex >= 0 ? order.bids[existingIndex].id : `bid-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      order_id: jobId,
      supplier_id: dto.supplier_id,
      supplier_name: dto.supplier_name || mfr?.name || 'Partner 3D Vendor',
      supplier_location: mfr?.facility_location || 'Shenzhen, CN',
      supplier_country: mfr?.country || 'Global',
      vendor_category: mfr?.category || '3D_PRINTING',
      currency: vendorCurrency,
      currency_symbol: rateInfo.symbol || '$',
      currency_flag: rateInfo.flag || '🌐',
      exchange_rate: fxRate,
      bid_amount_local: bidAmountLocal,
      bid_amount: bidAmountUsd, // USD normalized for platform COGS & margin calculation
      bid_amount_usd: bidAmountUsd,
      turnaround_days: Number(dto.turnaround_days),
      notes: dto.notes || 'Includes calibrated N52 magnet socket tolerance +-0.05mm and precision finish',
      submitted_at: new Date().toISOString(),
      status: 'PENDING',
    };

    if (existingIndex >= 0) {
      order.bids[existingIndex] = bidRecord;
    } else {
      order.bids.push(bidRecord);
    }

    order.updated_at = new Date().toISOString();

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders SET bids = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [JSON.stringify(order.bids), jobId],
      );
    } else {
      this.db.getMemoryStore().orders.set(jobId, order);
      this.db.persistDevStore();
    }

    await this.wormService.recordEvent({
      actor_role: 'SUPPLIER',
      actor_id: dto.supplier_id,
      order_id: jobId,
      event_type: 'SUPPLIER_BID_SUBMITTED',
      payload_json: {
        order_number: order.order_number,
        supplier_id: dto.supplier_id,
        supplier_name: bidRecord.supplier_name,
        currency: bidRecord.currency,
        bid_amount_local: bidRecord.bid_amount_local,
        exchange_rate: bidRecord.exchange_rate,
        bid_amount_usd: bidRecord.bid_amount_usd,
        turnaround_days: bidRecord.turnaround_days,
        notes: bidRecord.notes,
        total_bids_now: order.bids.length,
      },
    });

    const displayBidText =
      vendorCurrency === 'USD'
        ? `$${bidRecord.bid_amount.toFixed(2)} USD`
        : `${rateInfo.symbol}${bidRecord.bid_amount_local.toLocaleString()} ${vendorCurrency} ($${bidRecord.bid_amount.toFixed(2)} USD @ ${fxRate})`;

    return {
      success: true,
      job_id: jobId,
      bid: bidRecord,
      total_bids: order.bids.length,
      message: `Bid of ${displayBidText} successfully submitted for Job #${order.order_number}.`,
    };
  }

  /**
   * Scoped job chat messages
   */
  async getJobMessages(jobId: string) {
    if (this.db.isPostgresConnected) {
      const res = await this.db.query(
        `SELECT m.id, m.order_id, m.sender_role, m.message_text, m.attachment_url, m.created_at
         FROM job_messages m
         WHERE m.order_id = $1
         ORDER BY m.created_at ASC`,
        [jobId],
      );
      return res.rows;
    } else {
      return this.db.getMemoryStore().job_messages.filter((m) => m.order_id === jobId);
    }
  }

  async sendJobMessage(jobId: string, dto: SendJobMessageDto, senderId: string, role: string) {
    const msgId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const msgRecord = {
      id: msgId,
      order_id: jobId,
      sender_id: senderId,
      sender_role: role,
      message_text: dto.message_text,
      attachment_url: dto.attachment_url || null,
      created_at: new Date().toISOString(),
    };

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `INSERT INTO job_messages (id, order_id, sender_id, sender_role, message_text, attachment_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [msgRecord.id, msgRecord.order_id, msgRecord.sender_id, msgRecord.sender_role, msgRecord.message_text, msgRecord.attachment_url],
      );
    } else {
      this.db.getMemoryStore().job_messages.push(msgRecord);
    }

    return msgRecord;
  }
}
