import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// ─── Panel 1: Admin login ────────────────────────────────────────────────────
// Roles: super_admin, admin
export class AdminLoginDto {
  @ApiProperty({ example: 'admin@ams.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin@1234', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

// ─── Panel 2: Security login ─────────────────────────────────────────────────
// Roles: admin_security  → email + password (no gate)
//        gatekeeper      → email + password + gate_id (required)
export class SecurityLoginDto {
  @ApiProperty({ example: 'security@ams.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Security@1234', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: '665f1b2c3d4e5f6a7b8c9d0e',
    description: 'Required for GATEKEEPER role. Not needed for admin_security.',
  })
  @IsString()
  @IsOptional()
  gate_id?: string;
}

// ─── Panel 3: Maintenance login ──────────────────────────────────────────────
// Roles: admin_maintenance
export class MaintenanceLoginDto {
  @ApiProperty({ example: 'maintenance@ams.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Maint@1234', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

// ─── Panel 4: Account login ──────────────────────────────────────────────────
// Roles: admin_account, accountant
export class AccountLoginDto {
  @ApiProperty({ example: 'accounts@ams.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Account@1234', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

// ─── Panel 5: Resident login ─────────────────────────────────────────────────
// First time  → send { email } only  → triggers OTP flow
// Subsequent  → send { email, password }
export class ResidentLoginDto {
  @ApiProperty({ example: 'resident@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'MyPass@123',
    description: 'Omit on first login (OTP flow will be triggered instead).',
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}

// ─── Resident OTP verify ────────────────────────────────────────────────────
export class VerifyResidentOtpDto {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e' })
  @IsString()
  user_id!: string;

  @ApiProperty({ example: '482910' })
  @IsString()
  otp!: string;
}
