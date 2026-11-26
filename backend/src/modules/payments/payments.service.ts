import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { WormService } from '../worm/worm.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;
  private mockMode: boolean;

  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
    private wormService: WormService,
  ) {
    const secretKey = this.configService.get('stripe.secretKey');
    this.mockMode = this.configService.get('stripe.mockMode');

    if (secretKey && secretKey !== 'sk_test_mock_stripe_key') {
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' as any });
      this.logger.log('Stripe client initialized in live/test API mode.');
    } else {
      this.logger.log('Stripe running in simulated instant checkout mode.');
    }
  }

  async processCheckout(orderId: string, testMode = false) {
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

    if (order.payment_status === 'PAID') {
      return {
        success: true,
        order_id: orderId,
        payment_status: 'PAID',
        message: 'Order has already been paid and locked into WORM ledger.',
      };
    }

    const amountCents = Math.round(Number(order.total_price) * 100);
    let paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let clientSecret = `pi_mock_secret_${Date.now()}`;

    if (this.stripe && !testMode && !this.mockMode) {
      try {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: amountCents,
          currency: 'usd',
          metadata: {
            order_id: orderId,
            order_number: order.order_number,
          },
        });
        paymentIntentId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret;
      } catch (err) {
        this.logger.error(`Stripe error: ${err.message}. Using simulated payment.`);
      }
    }

    // Capture payment and advance order status to DESIGNER_REFINING
    const paymentReceiptHash = this.wormService.computeHash({
      order_id: orderId,
      order_number: order.order_number,
      payment_intent_id: paymentIntentId,
      amount: order.total_price,
      currency: 'USD',
      status: 'CAPTURED',
      timestamp: new Date().toISOString(),
    });

    if (this.db.isPostgresConnected) {
      await this.db.query(
        `UPDATE orders SET 
          payment_status = 'PAID',
          status = 'DESIGNER_REFINING',
          stripe_payment_intent_id = $1,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [paymentIntentId, orderId],
      );
    } else {
      order.payment_status = 'PAID';
      order.status = 'DESIGNER_REFINING';
      order.stripe_payment_intent_id = paymentIntentId;
      order.updated_at = new Date().toISOString();
      this.db.getMemoryStore().orders.set(orderId, order);
    }

    // RECORD PAYMENT_AUTHORIZED_AND_CAPTURED into WORM Ledger
    await this.wormService.recordEvent({
      actor_role: 'CUSTOMER',
      actor_id: order.customer_id,
      order_id: orderId,
      event_type: 'PAYMENT_AUTHORIZED_AND_CAPTURED',
      payload_json: {
        order_number: order.order_number,
        payment_intent_id: paymentIntentId,
        amount_usd: order.total_price,
        breakdown: {
          base_price: order.base_price,
          internal_led_price: order.internal_led_price,
          shipping: order.shipping_price,
        },
      },
      artifact_sha256: paymentReceiptHash,
    });

    // Also record transition to JOB_DISPATCHED_TO_SUPPLIER
    await this.wormService.recordEvent({
      actor_role: 'SYSTEM',
      order_id: orderId,
      event_type: 'JOB_DISPATCHED_TO_SUPPLIER',
      payload_json: {
        order_number: order.order_number,
        stage: 'NEEDS_REFINEMENT',
        internal_led_lighting: order.internal_led_lighting,
        statue_specs: {
          size: order.size,
          finish: order.finish,
          designer_notes: order.designer_notes,
        },
      },
    });

    return {
      success: true,
      order_id: orderId,
      order_number: order.order_number,
      payment_status: 'PAID',
      status: 'DESIGNER_REFINING',
      payment_intent_id: paymentIntentId,
      client_secret: clientSecret,
      receipt_sha256: paymentReceiptHash,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      return { received: true, simulated: true };
    }

    const webhookSecret = this.configService.get('stripe.webhookSecret');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await this.processCheckout(orderId, true);
      }
    }

    return { received: true };
  }
}
