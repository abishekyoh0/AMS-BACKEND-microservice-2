import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResidentType } from '../../common/enums/status.enum';

export class FamilyMemberDto {
  @ApiProperty({ example: 'Anjali Sharma' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Spouse' })
  @IsString()
  relation!: string;

  @ApiPropertyOptional({ example: '9876500010' })
  @IsString()
  @IsOptional()
  mobile?: string;
}

/**
 * CompleteResidentProfileDto
 *
 * Submitted during the resident move-in form (first login, step 3).
 * The resident sets their own password here.
 * Based on FRD sections 3.1.2, 3.1.3, 3.1.4, 3.1.6.
 */
export class CompleteResidentProfileDto {
  // ── Identity & address ──────────────────────────────────────────────────

  @ApiProperty({ example: 'Aadhar', enum: ['Aadhar', 'Passport', 'Driving License'] })
  @IsString()
  id_proof_type!: string;

  @ApiProperty({ example: '1234-5678-9012' })
  @IsString()
  id_proof_number!: string;

  @ApiPropertyOptional({ example: 'https://storage.ams.com/id/abc.jpg' })
  @IsString()
  @IsOptional()
  id_proof_url?: string;

  @ApiPropertyOptional({ example: 'https://storage.ams.com/addr/abc.jpg' })
  @IsString()
  @IsOptional()
  address_proof_url?: string;

  @ApiPropertyOptional({ example: '12, MG Road, Chennai - 600001' })
  @IsString()
  @IsOptional()
  permanent_address?: string;

  // ── Emergency contact ────────────────────────────────────────────────────

  @ApiProperty({ example: 'Ramesh Sharma' })
  @IsString()
  emergency_contact_name!: string;

  @ApiProperty({ example: 'Father' })
  @IsString()
  emergency_contact_relation!: string;

  @ApiProperty({ example: '9876500099' })
  @IsString()
  emergency_contact_mobile!: string;

  // ── Move-in ──────────────────────────────────────────────────────────────

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  move_in_date!: string;

  @ApiProperty({ enum: ResidentType, example: ResidentType.OWNER })
  @IsEnum(ResidentType)
  resident_type!: ResidentType;

  // ── Vehicle (optional) ───────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'TN09AB1234' })
  @IsString()
  @IsOptional()
  vehicle_number?: string;

  @ApiPropertyOptional({ example: 'Car', enum: ['Car', 'Bike', 'Other'] })
  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @ApiPropertyOptional({ example: 'Honda City' })
  @IsString()
  @IsOptional()
  vehicle_model?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsString()
  @IsOptional()
  vehicle_color?: string;

  // ── Family members (optional) ─────────────────────────────────────────────

  @ApiPropertyOptional({ type: [FamilyMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  @IsOptional()
  family_members?: FamilyMemberDto[];

  // ── Password (resident sets their own) ───────────────────────────────────

  @ApiProperty({ example: 'MySecure@123', minLength: 8, description: 'Resident sets their password here on first login.' })
  @IsString()
  @MinLength(8)
  password!: string;
}
