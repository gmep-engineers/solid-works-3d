import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsIn } from 'class-validator';

export class ReleaseToBiddingDto {
  @ApiProperty({ example: 65.0, description: 'Base ceiling bid price in USD' })
  @IsNotEmpty()
  @IsNumber()
  base_bid_usd: number;

  @ApiProperty({ example: 24, description: 'Bidding duration in hours' })
  @IsNotEmpty()
  @IsNumber()
  duration_hours: number;

  @ApiProperty({ example: 'ALL', enum: ['3D_PRINTING', 'DESIGNER', 'ALL'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['3D_PRINTING', 'DESIGNER', 'ALL'])
  bidding_category?: '3D_PRINTING' | 'DESIGNER' | 'ALL';

  @ApiProperty({ example: ['mfr-shenzhen-apex', 'vendor-neotokyo-sculpt'], required: false })
  @IsOptional()
  @IsArray()
  eligible_supplier_ids?: string[];

  @ApiProperty({ example: 'Requires N52 cavity tolerance +-0.05mm and translucent resin finish', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AwardBidDto {
  @ApiProperty({ example: 'bid-12345' })
  @IsNotEmpty()
  @IsString()
  bid_id: string;

  @ApiProperty({ example: 'Winning vendor selected based on turnaround and margin', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateManufacturerDto {
  @ApiProperty({ example: 'Tokyo Hyper3D Works' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '3D_PRINTING', enum: ['3D_PRINTING', 'DESIGNER'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['3D_PRINTING', 'DESIGNER'])
  category?: '3D_PRINTING' | 'DESIGNER';

  @ApiProperty({ example: 'tokyo@hyper3d-factory.jp' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: '+81 3 5550 9100' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Kenji Sato (Lead Production Tech)' })
  @IsNotEmpty()
  @IsString()
  contact_person: string;

  @ApiProperty({ example: 'Tokyo, Japan' })
  @IsNotEmpty()
  @IsString()
  facility_location: string;

  @ApiProperty({ example: 'Micro-precision resin casting & custom conductive trace routing' })
  @IsNotEmpty()
  @IsString()
  specialty: string;

  @ApiProperty({ example: 'JPY', description: 'Vendor bidding currency (USD, CNY, JPY, EUR, GBP, CAD)', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'Japan', description: 'Vendor country location', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 4.9, required: false })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  avg_turnaround_days?: number;

  @ApiProperty({ example: 'Specializes in Japanese domestic rapid fulfillment.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateManufacturerDto {
  @ApiProperty({ example: 'Apex Precision 3D', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '3D_PRINTING', enum: ['3D_PRINTING', 'DESIGNER'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['3D_PRINTING', 'DESIGNER'])
  category?: '3D_PRINTING' | 'DESIGNER';

  @ApiProperty({ example: 'factory@3dprint-supplier.cn', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '+86 755 8839 2011', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Wei Zhang (Lead SLA Engineer)', required: false })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({ example: 'Shenzhen, CN', required: false })
  @IsOptional()
  @IsString()
  facility_location?: string;

  @ApiProperty({ example: 'High-Precision SLA Resin & Electroless Nickel Plating', required: false })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'DISABLED'], required: false })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'DISABLED';

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'CNY', description: 'Vendor bidding currency (USD, CNY, JPY, EUR, GBP, CAD)', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'China', description: 'Vendor country location', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 4.9, required: false })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  avg_turnaround_days?: number;
}

export class ToggleManufacturerStatusDto {
  @ApiProperty({ example: 'DISABLED', enum: ['ACTIVE', 'DISABLED'], required: false })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'DISABLED';

  @ApiProperty({ example: 'Scheduled factory maintenance / machine downtime', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Aliases for Vendor naming convention
export class CreateVendorDto extends CreateManufacturerDto {}
export class UpdateVendorDto extends UpdateManufacturerDto {}
export class ToggleVendorStatusDto extends ToggleManufacturerStatusDto {}

export class UpdateExchangeRateDto {
  @ApiProperty({ example: 'JPY', description: 'Currency code (e.g. USD, CNY, JPY, EUR, GBP, CAD)' })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({ example: 154.5, description: 'Exchange rate: 1 USD = rate units of currency' })
  @IsNotEmpty()
  @IsNumber()
  rate_to_usd: number;
}
