import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: 'The question asked by customers' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'The detailed answer explaining the topic' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: 'Category identifier (e.g. LEVITATION, STUDIO_AI, PRINTING, ORDERS, WALLET)', default: 'LEVITATION' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the FAQ is visible to the public', default: true })
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @ApiPropertyOptional({ description: 'Display sorting order index', default: 0 })
  @IsNumber()
  @IsOptional()
  order_index?: number;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ description: 'The question asked by customers' })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({ description: 'The detailed answer explaining the topic' })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({ description: 'Category identifier' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the FAQ is visible to the public' })
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @ApiPropertyOptional({ description: 'Display sorting order index' })
  @IsNumber()
  @IsOptional()
  order_index?: number;
}
