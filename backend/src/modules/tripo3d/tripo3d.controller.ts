import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Tripo3dService, TripoGenerateDto } from './tripo3d.service';

@ApiTags('3D Generation (Tripo3D)')
@Controller('api/v1/generations')
export class Tripo3dController {
  constructor(private readonly tripoService: Tripo3dService) {}

  @Post('tripo')
  @ApiOperation({ summary: 'Initiate 3D model generation via Tripo3D API' })
  @ApiResponse({ status: 201, description: 'Task queued successfully' })
  async createGeneration(@Body() dto: TripoGenerateDto) {
    return this.tripoService.startGeneration(dto);
  }

  @Get('tripo/balance')
  @ApiOperation({ summary: 'Query live Tripo3D account credit balance' })
  async getBalance() {
    return this.tripoService.getBalance();
  }

  @Get('tripo/pricing')
  @ApiOperation({ summary: 'Get live scaled markup pricing table matching Tripo3D credit system' })
  async getPricing() {
    return this.tripoService.getPricingTable();
  }

  @Get('tripo/:taskId/status')
  @ApiOperation({ summary: 'Poll status and retrieve generated .glb model' })
  async getStatus(@Param('taskId') taskId: string) {
    return this.tripoService.getStatus(taskId);
  }
}
