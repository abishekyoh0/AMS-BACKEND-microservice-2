import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsDateString, IsNumber, IsOptional,
  IsString, Max, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Billing Config (accountant sets global rate) ─────────────────────────────
export class SetBillingConfigDto {
  @ApiProperty({ example: 2, description: 'Rate per square foot in ₹. Bill = sq_ft × rate.' })
  @IsNumber()
  @Min(0.1)
  rate_per_sqft: number;

  @ApiProperty({ example: 5, description: 'Day of month when bill is due (1–28)' })
  @IsNumber()
  @Min(1)
  @Max(28)
  due_day_of_month: number;

  @ApiPropertyOptional({ example: 5, description: 'Late fee as % of maintenance amount. Used if late_fee_fixed = 0.' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  late_fee_percentage?: number;

  @ApiPropertyOptional({ example: 0, description: 'Fixed late fee in ₹. If > 0, overrides late_fee_percentage.' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  late_fee_fixed?: number;

  @ApiPropertyOptional({ example: 3, description: 'Grace period in days after due date before late fee is applied.' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  grace_period_days?: number;

  @ApiProperty({ example: '2025-05', description: 'YYYY-MM — from which billing month this config is effective' })
  @IsString()
  effective_from: string;
}

// ─── Register resident unit (admin_account sets sq_ft) ────────────────────────
export class RegisterResidentUnitDto {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e', description: 'Resident user _id from auth service' })
  @IsString()
  resident_id: string;

  @ApiProperty({ example: 'Sunita Sharma' })
  @IsString()
  resident_name: string;

  @ApiProperty({ example: 'sunita@gmail.com' })
  @IsString()
  email: string;

  @ApiPropertyOptional({ example: '9876500005' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiPropertyOptional({ example: '3' })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiProperty({ example: '301' })
  @IsString()
  unit_number: string;

  @ApiProperty({ example: 850, description: 'Square footage of the unit. Bill = sq_ft × rate_per_sqft.' })
  @IsNumber()
  @Min(1)
  sq_ft: number;
}

export class UpdateResidentUnitDto {
  @ApiPropertyOptional({ example: 900 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  sq_ft?: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiPropertyOptional({ example: '4' })
  @IsString()
  @IsOptional()
  floor?: string;
}

// ─── Extra charge (accountant adds to a bill before generating) ───────────────
export class ExtraChargeItemDto {
  @ApiProperty({ example: 'Club house renovation levy' })
  @IsString()
  description: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class AddExtraChargesDto {
  @ApiProperty({ type: [ExtraChargeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraChargeItemDto)
  charges: ExtraChargeItemDto[];
}

// ─── Generate bills for a month ───────────────────────────────────────────────
export class GenerateBillsDto {
  @ApiProperty({ example: '2025-05', description: 'YYYY-MM — billing month to generate for' })
  @IsString()
  billing_month: string;
}
