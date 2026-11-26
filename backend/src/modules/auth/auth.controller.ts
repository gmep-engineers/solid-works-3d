import { Controller, Post, Get, Put, Delete, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('tags')
  @ApiOperation({ summary: 'Get stored feature tags for user' })
  async getTags(@Query('email') email: string) {
    return this.authService.getUserTags(email);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Save stored feature tags for user' })
  async saveTags(@Body() body: { email: string; tags: string[] }) {
    return this.authService.saveUserTags(body.email, body.tags || []);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register customer account' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh JWT access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user credentials, contact information, and wallet balance' })
  async getProfile(@Query('email') email?: string) {
    const userEmail = email || 'alex.mercer@gmail.com';
    return this.authService.getUserProfile(userEmail);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update contact information (name, phone, shipping address)' })
  async updateProfile(@Body() body: { email: string; full_name?: string; phone?: string; shipping_address?: any }) {
    const userEmail = body.email || 'alex.mercer@gmail.com';
    return this.authService.updateProfile(userEmail, body);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user password with cryptographic WORM audit' })
  async changePassword(@Body() body: { email: string; current_password?: string; new_password?: string }) {
    const userEmail = body.email || 'alex.mercer@gmail.com';
    return this.authService.changePassword(userEmail, body.current_password, body.new_password);
  }

  @Post('wallet/top-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fill wallet balance using payment method' })
  async topUpWallet(@Body() body: { email: string; amount: number; payment_method_id?: string; note?: string }) {
    const userEmail = body.email || 'alex.mercer@gmail.com';
    return this.authService.topUpWallet(userEmail, body.amount, body.payment_method_id, body.note);
  }

  @Post('wallet/payment-methods')
  @ApiOperation({ summary: 'Add saved payment method for wallet funding' })
  async addPaymentMethod(@Body() body: { email: string; number: string; exp_month: number; exp_year: number; brand?: string; is_default?: boolean }) {
    const userEmail = body.email || 'alex.mercer@gmail.com';
    return this.authService.addPaymentMethod(userEmail, body);
  }

  @Delete('wallet/payment-methods/:id')
  @ApiOperation({ summary: 'Remove saved payment method' })
  async removePaymentMethod(@Param('id') id: string, @Query('email') email?: string) {
    const userEmail = email || 'alex.mercer@gmail.com';
    return this.authService.removePaymentMethod(userEmail, id);
  }
}
