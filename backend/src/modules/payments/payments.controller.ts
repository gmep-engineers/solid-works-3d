import { Controller, Post, Param, Body, Headers, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CheckoutOrderDto } from '../orders/dto/order.dto';

@ApiTags('Payments & Stripe')
@Controller('api/v1')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/checkout')
  @ApiOperation({ summary: 'Process fast checkout with Stripe & lock payment into WORM ledger' })
  @ApiResponse({ status: 200, description: 'Payment captured and WORM receipt generated' })
  async checkout(@Param('id') orderId: string, @Body() dto: CheckoutOrderDto) {
    return this.paymentsService.processCheckout(orderId, dto?.test_mode);
  }

  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe Webhook listener' })
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
