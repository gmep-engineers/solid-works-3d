import { Controller, Get, Post, Put, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { WormService } from '../worm/worm.service';
import { Tripo3dService } from '../tripo3d/tripo3d.service';
import {
  ReleaseToBiddingDto,
  AwardBidDto,
  CreateManufacturerDto,
  UpdateManufacturerDto,
  ToggleManufacturerStatusDto,
  UpdateExchangeRateDto,
} from './dto/admin.dto';

@ApiTags('Admin Operations & Financials')
@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly wormService: WormService,
    private readonly tripoService: Tripo3dService,
  ) {}

  @Get('settings/tripo')
  @ApiOperation({ summary: 'Get current Tripo3D API configuration & balance' })
  async getTripoSettings() {
    const config = this.tripoService.getConfig();
    const balance = await this.tripoService.getBalance();
    return {
      ...config,
      balance,
    };
  }

  @Post('settings/tripo')
  @ApiOperation({ summary: 'Update and verify Tripo3D API key and markup multiplier in real-time' })
  async updateTripoSettings(@Body() body: { api_key?: string; mock_mode?: boolean; markup_multiplier?: number }) {
    return this.tripoService.updateConfig(body.api_key || '', body.mock_mode, body.markup_multiplier);
  }

  @Get('settings/currencies')
  @ApiOperation({ summary: 'Get global vendor currencies and FX exchange rates against USD' })
  async getExchangeRates() {
    return this.adminService.getExchangeRates();
  }

  @Post('settings/currencies')
  @ApiOperation({ summary: 'Set or update international vendor exchange rate against USD' })
  async updateExchangeRate(@Body() dto: UpdateExchangeRateDto) {
    return this.adminService.updateExchangeRate(dto);
  }

  @Post('settings/currencies/sync-live')
  @ApiOperation({ summary: 'Fetch and synchronize live real-time interbank FX exchange rates from public feed' })
  async syncLiveExchangeRates() {
    return this.adminService.syncLiveExchangeRates();
  }

  @Get('analytics/financials')
  @ApiOperation({ summary: 'Get real-time financial metrics, COGS, margins, and API costs' })
  @ApiResponse({ status: 200, description: 'Financial breakdown returned' })
  async getFinancials() {
    return this.adminService.getFinancialAnalytics();
  }

  @Get('worm/verify/:orderId')
  @ApiOperation({ summary: 'Cryptographically verify WORM SHA-256 hash chain for an order' })
  @ApiResponse({ status: 200, description: 'Cryptographic chain verification certificate returned' })
  async verifyWormChain(@Param('orderId') orderId: string) {
    return this.wormService.verifyOrderChain(orderId);
  }

  @Get('worm/events')
  @ApiOperation({ summary: 'Browse immutable WORM audit ledger events' })
  async getWormEvents(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @Query('orderId') orderId?: string,
  ) {
    return this.wormService.getEvents(Number(limit), Number(offset), orderId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List customer orders for production pipeline board' })
  async getOrders(@Query('status') status?: string) {
    return this.adminService.getOrders(status);
  }

  @Post('orders/:id/approve')
  @ApiOperation({ summary: 'Admin approves client order and dispatches to manufacturer terminal' })
  async approveOrder(@Param('id') orderId: string, @Body('notes') notes?: string) {
    return this.adminService.approveOrder(orderId, notes);
  }

  @Post('orders/:id/reject')
  @ApiOperation({ summary: 'Admin rejects client order with refund and reasoning' })
  async rejectOrder(
    @Param('id') orderId: string,
    @Body('reason') reason?: string,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.rejectOrder(orderId, reason, notes);
  }

  @Post('orders/:id/release-bidding')
  @ApiOperation({ summary: 'Admin releases project to manufacturers with base bid and deadline' })
  async releaseToBidding(@Param('id') orderId: string, @Body() dto: ReleaseToBiddingDto) {
    return this.adminService.releaseToBidding(orderId, dto);
  }

  @Post('orders/:id/award-bid')
  @ApiOperation({ summary: 'Admin selects winning manufacturer bid to proceed with production' })
  async awardBid(@Param('id') orderId: string, @Body() dto: AwardBidDto) {
    return this.adminService.awardBid(orderId, dto);
  }

  @Get('orders/:id/bids')
  @ApiOperation({ summary: 'List all manufacturer bids for an order with profit analysis' })
  async getOrderBids(@Param('id') orderId: string) {
    return this.adminService.getOrderBids(orderId);
  }

  @Post('orders/:id/assign-supplier')
  @ApiOperation({ summary: 'Dispatch order to specific supplier queue' })
  async assignSupplier(@Param('id') orderId: string, @Body('supplier_id') supplierId: string) {
    return this.adminService.assignSupplier(orderId, supplierId);
  }

  @Post('orders/:id/hub')
  @ApiOperation({ summary: 'Admin configures inbound US Company Hub routing for an order' })
  async updateOrderHub(
    @Param('id') orderId: string,
    @Body() hubData: { hub_facility: string; hub_address: string; hub_city: string; hub_zip: string; notes?: string },
  ) {
    return this.adminService.updateOrderHub(orderId, hubData);
  }

  @Post('orders/:id/receive-at-us-hub')
  @ApiOperation({ summary: 'Mark inbound batch from manufacturer received at US Company Hub' })
  async receiveAtUsHub(@Param('id') orderId: string, @Body('notes') notes?: string) {
    return this.adminService.receiveAtUsHub(orderId, notes);
  }

  @Post('orders/:id/ship-to-client')
  @ApiOperation({ summary: 'Dispatch final package from US Company Hub to end client' })
  async shipToClient(
    @Param('id') orderId: string,
    @Body('carrier') carrier?: string,
    @Body('tracking_number') trackingNumber?: string,
  ) {
    return this.adminService.shipToClient(orderId, carrier, trackingNumber);
  }

  @Get('manufacturers')
  @ApiOperation({ summary: 'List all registered 3D manufacturing partners with device tokens & statuses' })
  async getManufacturers() {
    return this.adminService.getManufacturers();
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List all registered vendor partners (3D Printing & 3D Designers)' })
  async getVendors() {
    return this.adminService.getManufacturers();
  }

  @Get('manufacturers/:id')
  @ApiOperation({ summary: 'Get details for a single manufacturer' })
  async getManufacturer(@Param('id') id: string) {
    return this.adminService.getManufacturer(id);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Get details for a single vendor' })
  async getVendor(@Param('id') id: string) {
    return this.adminService.getManufacturer(id);
  }

  @Post('manufacturers')
  @ApiOperation({ summary: 'Register new manufacturing partner with auto-generated device token' })
  async createManufacturer(@Body() dto: CreateManufacturerDto) {
    return this.adminService.createManufacturer(dto);
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Register new vendor partner (3D Printing or Designer)' })
  async createVendor(@Body() dto: CreateManufacturerDto) {
    return this.adminService.createManufacturer(dto);
  }

  @Patch('manufacturers/:id')
  @ApiOperation({ summary: 'Update manufacturer contact information and capabilities' })
  async updateManufacturer(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.adminService.updateManufacturer(id, dto);
  }

  @Patch('vendors/:id')
  @ApiOperation({ summary: 'Update vendor contact information and capabilities' })
  async updateVendor(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    return this.adminService.updateManufacturer(id, dto);
  }

  @Post('manufacturers/:id/toggle-status')
  @ApiOperation({ summary: 'Enable or disable / suspend a manufacturer from taking jobs and bidding' })
  async toggleManufacturerStatus(@Param('id') id: string, @Body() dto: ToggleManufacturerStatusDto) {
    return this.adminService.toggleManufacturerStatus(id, dto);
  }

  @Post('vendors/:id/toggle-status')
  @ApiOperation({ summary: 'Enable or disable / suspend a vendor from taking jobs and bidding' })
  async toggleVendorStatus(@Param('id') id: string, @Body() dto: ToggleManufacturerStatusDto) {
    return this.adminService.toggleManufacturerStatus(id, dto);
  }

  @Post('manufacturers/:id/rotate-token')
  @ApiOperation({ summary: 'Rotate and re-issue hardware device token for manufacturer Windows client' })
  async rotateDeviceToken(@Param('id') id: string) {
    return this.adminService.rotateManufacturerDeviceToken(id);
  }

  @Post('vendors/:id/rotate-token')
  @ApiOperation({ summary: 'Rotate and re-issue hardware device token for vendor Windows client' })
  async rotateVendorDeviceToken(@Param('id') id: string) {
    return this.adminService.rotateManufacturerDeviceToken(id);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'List registered 3D manufacturing suppliers' })
  async getSuppliers() {
    return this.adminService.getSuppliers();
  }

  @Post('suppliers/tokens')
  @ApiOperation({ summary: 'Issue hardware-bound API token for Supplier Windows Client' })
  async issueToken(@Body('supplier_email') email: string) {
    return this.adminService.issueSupplierDeviceToken(email);
  }

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'List all registered customer and admin users with wallet & order stats' })
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user manually from admin console' })
  async createUser(@Body() dto: { email: string; full_name?: string; role?: string; phone?: string; initial_wallet_balance?: number }) {
    return this.adminService.createUser(dto);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user profile, role, status or contact info' })
  async updateUser(@Param('id') id: string, @Body() dto: { full_name?: string; role?: string; status?: string; phone?: string; shipping_address?: any }) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users/:id/wallet-adjust')
  @ApiOperation({ summary: 'Manually credit or debit user digital wallet' })
  async adjustWallet(@Param('id') id: string, @Body() dto: { amount: number; reason: string; note?: string }) {
    return this.adminService.adjustUserWallet(id, dto);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(@Param('id') id: string, @Body('new_password') newPassword?: string) {
    return this.adminService.resetUserPassword(id, newPassword);
  }
}
