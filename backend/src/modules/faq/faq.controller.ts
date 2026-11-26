import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@ApiTags('Frequently Asked Questions (FAQ)')
@Controller('api/v1')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // Public endpoint for customer-facing FAQ page and widgets
  @Get('faq')
  @ApiOperation({ summary: 'Get published FAQ items for website visitors' })
  @ApiResponse({ status: 200, description: 'List of published FAQs' })
  getPublicFaqs() {
    return this.faqService.getAllFaqs(true);
  }

  // Admin endpoints for website management
  @Get('admin/faq')
  @ApiOperation({ summary: 'Get all FAQ items (including drafts and hidden items)' })
  @ApiResponse({ status: 200, description: 'List of all FAQs' })
  getAdminFaqs() {
    return this.faqService.getAllFaqs(false);
  }

  @Post('admin/faq')
  @ApiOperation({ summary: 'Create a new FAQ item' })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.faqService.createFaq(dto);
  }

  @Put('admin/faq/:id')
  @ApiOperation({ summary: 'Update an existing FAQ item' })
  @ApiResponse({ status: 200, description: 'FAQ updated successfully' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqService.updateFaq(id, dto);
  }

  @Delete('admin/faq/:id')
  @ApiOperation({ summary: 'Delete an FAQ item' })
  @ApiResponse({ status: 200, description: 'FAQ deleted' })
  deleteFaq(@Param('id') id: string) {
    return this.faqService.deleteFaq(id);
  }

  @Patch('admin/faq/:id/toggle')
  @ApiOperation({ summary: 'Toggle published visibility of an FAQ item' })
  @ApiResponse({ status: 200, description: 'Visibility updated' })
  togglePublish(@Param('id') id: string) {
    return this.faqService.togglePublish(id);
  }

  @Post('admin/faq/reorder')
  @ApiOperation({ summary: 'Reorder FAQ items display sequence' })
  @ApiResponse({ status: 200, description: 'FAQs reordered' })
  reorderFaqs(@Body() body: { orderedIds: string[] }) {
    return this.faqService.reorderFaqs(body.orderedIds || []);
  }

  @Post('admin/faq/reset')
  @ApiOperation({ summary: 'Reset all FAQs back to standard defaults' })
  @ApiResponse({ status: 200, description: 'Reset complete' })
  resetDefaults() {
    return this.faqService.resetToDefaults();
  }
}
