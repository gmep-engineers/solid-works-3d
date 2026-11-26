import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import {
  SupplierLoginDto,
  UploadRefinedModelDto,
  UpdateJobStatusDto,
  SendJobMessageDto,
  AcceptSupplierJobDto,
  RejectSupplierJobDto,
  SubmitSupplierBidDto,
} from './dto/supplier.dto';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Supplier Isolated Desktop API')
@Controller('api/v1/supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post('auth')
  @ApiOperation({ summary: 'Hardware-bound login for Supplier Windows Desktop App' })
  @ApiResponse({ status: 200, description: 'Supplier authenticated and scoped JWT issued' })
  async auth(@Body() dto: SupplierLoginDto) {
    return this.supplierService.authenticate(dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get assigned jobs queue (Strictly stripped of pricing and customer PII)' })
  @ApiResponse({ status: 200, description: 'Anonymized supplier jobs queue returned' })
  async getJobs(@Req() req: any) {
    const supplierId = req.user?.userId;
    return this.supplierService.getSupplierJobs(supplierId);
  }

  @Post('jobs/:id/upload-refined')
  @ApiOperation({ summary: 'Upload calibrated 3D model (.stl/.glb) with magnet & wiring specs' })
  @ApiResponse({ status: 201, description: 'Refined model uploaded and hash locked to WORM' })
  async uploadRefinedModel(
    @Param('id') jobId: string,
    @Body() dto: UploadRefinedModelDto,
    @Req() req: any,
  ) {
    const supplierId = req.user?.userId || 'SUPPLIER_DESKTOP_CLIENT';
    return this.supplierService.uploadRefinedModel(jobId, dto, supplierId);
  }

  @Patch('jobs/:id/status')
  @ApiOperation({ summary: 'Update production and shipping status (Refinement -> Printing -> Shipped)' })
  async updateJobStatus(
    @Param('id') jobId: string,
    @Body() dto: UpdateJobStatusDto,
    @Req() req: any,
  ) {
    const supplierId = req.user?.userId || 'SUPPLIER_DESKTOP_CLIENT';
    return this.supplierService.updateJobStatus(jobId, dto, supplierId);
  }

  @Get('manufacturers')
  @ApiOperation({ summary: 'List verified manufacturing partner profiles' })
  async getManufacturers() {
    return this.supplierService.getManufacturers();
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List verified vendor partner profiles (Designers & 3D Printing)' })
  async getVendors() {
    return this.supplierService.getManufacturers();
  }

  @Post('jobs/:id/bid')
  @ApiOperation({ summary: 'Manufacturer submits competitive bid on open RFQ project' })
  async submitBid(
    @Param('id') jobId: string,
    @Body() dto: SubmitSupplierBidDto,
  ) {
    return this.supplierService.submitBid(jobId, dto);
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Manufacturer accepts the job assignment and quotes their price' })
  async acceptJob(
    @Param('id') jobId: string,
    @Body() dto: AcceptSupplierJobDto,
    @Req() req: any,
  ) {
    const supplierId = req.user?.userId || 'SUPPLIER_DESKTOP_CLIENT';
    return this.supplierService.acceptJob(jobId, dto, supplierId);
  }

  @Post('jobs/:id/reject')
  @ApiOperation({ summary: 'Manufacturer rejects the job assignment with reason' })
  async rejectJob(
    @Param('id') jobId: string,
    @Body() dto: RejectSupplierJobDto,
    @Req() req: any,
  ) {
    const supplierId = req.user?.userId || 'SUPPLIER_DESKTOP_CLIENT';
    return this.supplierService.rejectJob(jobId, dto, supplierId);
  }

  @Get('jobs/:id/messages')
  @ApiOperation({ summary: 'Get scoped technical job chat messages' })
  async getMessages(@Param('id') jobId: string) {
    return this.supplierService.getJobMessages(jobId);
  }

  @Post('jobs/:id/messages')
  @ApiOperation({ summary: 'Send technical query on specific job without exposing customer contact' })
  async sendMessage(
    @Param('id') jobId: string,
    @Body() dto: SendJobMessageDto,
    @Req() req: any,
  ) {
    const senderId = req.user?.userId || 'SUPPLIER_DESKTOP_CLIENT';
    return this.supplierService.sendJobMessage(jobId, dto, senderId, 'SUPPLIER');
  }
}
