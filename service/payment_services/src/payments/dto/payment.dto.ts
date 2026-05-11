import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsEnum, IsNumber, IsOptional,
  IsString, Min,
} from 'class-validator';
import { PaymentMode, PaymentStatus } from '../../common/enums/payment.enum';

// ─── Resident submits a payment ───────────────────────────────────────────────
export class SubmitPaymentDto {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e', description: 'Bill _id being paid' })
  @IsString()
  bill_id: string;

  @ApiProperty({ enum: PaymentMode, example: PaymentMode.UPI })
  @IsEnum(PaymentMode)
  payment_mode: PaymentMode;

  @ApiProperty({ example: 1700, description: 'Amount paid in ₹' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: '2025-05-03',
    description: 'Date when resident actually paid (can be past date for cash)',
  })
  @IsDateString()
  payment_date: string;

  @ApiPropertyOptional({ example: '14:30', description: 'Time of payment HH:MM' })
  @IsString()
  @IsOptional()
  payment_time?: string;

  // UPI specific
  @ApiPropertyOptional({ example: 'TXN123456789', description: 'UPI transaction reference ID' })
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @ApiPropertyOptional({ example: 'sunita@okicici', description: 'UPI ID used' })
  @IsString()
  @IsOptional()
  upi_id?: string;

  // Cheque specific
  @ApiPropertyOptional({ example: '004521', description: 'Cheque number' })
  @IsString()
  @IsOptional()
  cheque_number?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  // Proof
  @ApiPropertyOptional({ example: 'https://storage.ams.com/proof/abc.jpg', description: 'Screenshot or cheque scan URL' })
  @IsString()
  @IsOptional()
  proof_url?: string;

  @ApiPropertyOptional({ example: 'Payment for May 2025 maintenance' })
  @IsString()
  @IsOptional()
  resident_notes?: string;
}

// ─── Accountant verifies / rejects a payment ─────────────────────────────────
export class VerifyPaymentDto {
  @ApiProperty({ enum: [PaymentStatus.VERIFIED, PaymentStatus.REJECTED], example: PaymentStatus.VERIFIED })
  @IsEnum([PaymentStatus.VERIFIED, PaymentStatus.REJECTED])
  status: PaymentStatus.VERIFIED | PaymentStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Transaction ID not matching', description: 'Required when rejecting' })
  @IsString()
  @IsOptional()
  rejection_reason?: string;
}

// ─── Accountant records offline payment directly ──────────────────────────────
// For cash/cheque payments — accountant enters directly, auto-verified
export class RecordOfflinePaymentDto {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e', description: 'Bill _id' })
  @IsString()
  bill_id: string;

  @ApiProperty({ enum: [PaymentMode.CASH, PaymentMode.CHEQUE, PaymentMode.BANK_TRANSFER] })
  @IsEnum([PaymentMode.CASH, PaymentMode.CHEQUE, PaymentMode.BANK_TRANSFER])
  payment_mode: PaymentMode;

  @ApiProperty({ example: 1700 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2025-05-03' })
  @IsDateString()
  payment_date: string;

  @ApiPropertyOptional({ example: '004521' })
  @IsString()
  @IsOptional()
  cheque_number?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Query filters ────────────────────────────────────────────────────────────
export class PaymentHistoryFilterDto {
  @ApiPropertyOptional({ example: '2025-05', description: 'Filter by billing month YYYY-MM' })
  @IsString()
  @IsOptional()
  billing_month?: string;

  @ApiPropertyOptional({ enum: PaymentMode })
  @IsEnum(PaymentMode)
  @IsOptional()
  payment_mode?: PaymentMode;

  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  limit?: number;
}
