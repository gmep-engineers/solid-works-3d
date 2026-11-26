import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class SupplierLoginDto {
  @ApiProperty({ example: 'supplier@factory.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'factoryPass123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'WIN-CLIENT-HWID-90821-X', description: 'Hardware-bound device token' })
  @IsNotEmpty()
  @IsString()
  device_token: string;
}

export class UploadRefinedModelDto {
  @ApiProperty({ example: 'https://storage.levitate3d.io/vault/refined_statue_v1.glb' })
  @IsNotEmpty()
  @IsString()
  model_url: string;

  @ApiProperty({ example: 'Calibrated center of gravity. Added 18mm magnet cavity and 3mm internal LED wire channel.' })
  @IsNotEmpty()
  @IsString()
  notes: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6... (optional client computed sha256)', required: false })
  @IsOptional()
  @IsString()
  sha256?: string;
}

export class UpdateJobStatusDto {
  @ApiProperty({
    example: 'REFINEMENT_COMPLETE',
    enum: ['REFINEMENT_COMPLETE', 'PRINTING_WIRING', 'PACKAGED_SHIPPED', 'DISPATCHED_TO_US_HUB'],
  })
  @IsNotEmpty()
  @IsString()
  stage: 'REFINEMENT_COMPLETE' | 'PRINTING_WIRING' | 'PACKAGED_SHIPPED' | 'DISPATCHED_TO_US_HUB';

  @ApiProperty({ example: 'DHL', required: false })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiProperty({ example: 'DHL-9847291048', required: false })
  @IsOptional()
  @IsString()
  tracking_number?: string;
}

export class SendJobMessageDto {
  @ApiProperty({ example: 'Please confirm if client prefers warm white 3000K or ice blue 6000K internal LEDs.' })
  @IsNotEmpty()
  @IsString()
  message_text: string;

  @ApiProperty({ example: 'https://storage.levitate3d.io/vault/attachment_wire_diagram.png', required: false })
  @IsOptional()
  @IsString()
  attachment_url?: string;
}

export class AcceptSupplierJobDto {
  @ApiProperty({ example: 65.0, description: 'Manufacturer quoted fabrication & refinement price in USD' })
  @IsNotEmpty()
  quoted_price: number;

  @ApiProperty({ example: 'Feasible. Magnet cavity & internal wire conduits will take 24-48 hours.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 3, description: 'Estimated turnaround days', required: false })
  @IsOptional()
  turnaround_days?: number;
}

export class RejectSupplierJobDto {
  @ApiProperty({ example: 'UNPRINTABLE_WALL_THICKNESS', description: 'Rejection reason code' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({ example: 'Statue arm wall is 0.4mm, which will crack during photopolymer resin curing.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitSupplierBidDto {
  @ApiProperty({ example: 'mfr-shenzhen-apex' })
  @IsNotEmpty()
  @IsString()
  supplier_id: string;

  @ApiProperty({ example: 'Apex Precision 3D', required: false })
  @IsOptional()
  @IsString()
  supplier_name?: string;

  @ApiProperty({ example: 58.0, description: 'Competitive bid amount (in vendor currency or USD)' })
  @IsNotEmpty()
  bid_amount: number;

  @ApiProperty({ example: 'CNY', description: 'Currency code of the bid (e.g. USD, CNY, JPY, EUR, GBP, CAD)', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 420.0, description: 'Original bid amount in vendor local currency', required: false })
  @IsOptional()
  @IsNumber()
  bid_amount_local?: number;

  @ApiProperty({ example: 3, description: 'Turnaround time in business days' })
  @IsNotEmpty()
  turnaround_days: number;

  @ApiProperty({ example: 'Includes ultrasonic wash & calibrated N52 magnet socket tolerance +-0.05mm', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
