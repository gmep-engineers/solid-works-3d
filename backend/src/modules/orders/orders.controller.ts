import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';

@ApiTags('Orders')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create custom statue & magnetic base order' })
  @ApiResponse({ status: 201, description: 'Order created with WORM audit log' })
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    const customerId = req.user?.userId;
    return this.ordersService.createOrder(dto, customerId);
  }

  @Get()
  @ApiOperation({ summary: 'List orders for authenticated customer' })
  async getOrders(@Req() req: any) {
    const customerId = req.user?.userId;
    return this.ordersService.getOrders(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details for customer' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order tracking and milestone progress' })
  async getOrderTracking(@Param('id') id: string) {
    return this.ordersService.getOrderTracking(id);
  }

  @Post(':id/approve-refined')
  @ApiOperation({ summary: 'Client approves refined 3D model for manufacturer printing' })
  async approveRefinedModel(@Param('id') id: string, @Body('feedback') feedback?: string) {
    return this.ordersService.approveRefinedModel(id, feedback);
  }
}
