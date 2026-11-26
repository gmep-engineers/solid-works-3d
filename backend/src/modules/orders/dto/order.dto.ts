import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'c7b2d5a3-7621-4f9e-a0e2-63db918c5e62', required: false })
  @IsOptional()
  @IsString()
  generation_id?: string;

  @ApiProperty({ example: 'MAGNETIC_LEVITATING_BASE' })
  @IsNotEmpty()
  @IsString()
  base_option: string;

  @ApiProperty({ example: true, description: 'Toggle internal wireless inductive LEDs embedded inside statue' })
  @IsBoolean()
  internal_led_lighting: boolean;

  @ApiProperty({ example: 'STANDARD', enum: ['STANDARD', 'LARGE'] })
  @IsNotEmpty()
  @IsString()
  size: 'STANDARD' | 'LARGE';

  @ApiProperty({ example: 'TRANSLUCENT_GLOW', enum: ['MATTE_WHITE', 'TRANSLUCENT_GLOW', 'FULL_COLOR'] })
  @IsNotEmpty()
  @IsString()
  finish: 'MATTE_WHITE' | 'TRANSLUCENT_GLOW' | 'FULL_COLOR';

  @ApiProperty({ example: 'Please smooth the facial features and hollow the base for a 15mm magnet cavity', required: false })
  @IsOptional()
  @IsString()
  designer_notes?: string;

  @ApiProperty({ example: 'https://storage.levitate3d.io/vault/reference_markup.png', required: false })
  @IsOptional()
  @IsString()
  reference_image_url?: string;

  // Seamless checkout customer details
  @ApiProperty({ example: 'customer@example.com' })
  @IsNotEmpty()
  @IsString()
  customer_email: string;

  @ApiProperty({ example: 'Alex Mercer', required: false })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiProperty({ example: '+1 555 987 6543', required: false })
  @IsOptional()
  @IsString()
  customer_phone?: string;

  @ApiProperty({
    example: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postal_code: '97477',
      country: 'USA',
    },
  })
  @IsOptional()
  shipping_address?: Record<string, any>;
}

export class CheckoutOrderDto {
  @ApiProperty({ example: 'pm_card_visa', required: false })
  @IsOptional()
  @IsString()
  payment_method_id?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  test_mode?: boolean;
}
