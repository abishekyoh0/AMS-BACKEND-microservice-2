import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Swagger body descriptors for the gateway (HTTP layer).
 *  These are not validated — they exist only so Swagger shows correct schemas. */

export class AdminLoginBody {
  @ApiProperty({ example: 'admin@ams.com' }) email!: string;
  @ApiProperty({ example: 'Admin@1234' }) password!: string;
}

export class SecurityLoginBody {
  @ApiProperty({ example: 'security@ams.com' }) email!: string;
  @ApiProperty({ example: 'Security@1234' }) password!: string;
  @ApiPropertyOptional({ example: '665f1b2c3d4e5f6a7b8c9d0e', description: 'Required for GATEKEEPER only' }) gate_id?: string;
}

export class MaintenanceLoginBody {
  @ApiProperty({ example: 'maintenance@ams.com' }) email!: string;
  @ApiProperty({ example: 'Maint@1234' }) password!: string;
}

export class AccountLoginBody {
  @ApiProperty({ example: 'accounts@ams.com' }) email!: string;
  @ApiProperty({ example: 'Account@1234' }) password!: string;
}

export class ResidentLoginBody {
  @ApiProperty({ example: 'resident@gmail.com' }) email!: string;
  @ApiPropertyOptional({ example: 'MyPass@123', description: 'Omit on first login to trigger OTP flow' }) password?: string;
}

export class VerifyOtpBody {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e' }) user_id!: string;
  @ApiProperty({ example: '482910' }) otp!: string;
}

export class CompleteProfileBody {
  @ApiProperty({ example: 'Aadhar' }) id_proof_type!: string;
  @ApiProperty({ example: '1234-5678-9012' }) id_proof_number!: string;
  @ApiPropertyOptional() id_proof_url?: string;
  @ApiPropertyOptional() address_proof_url?: string;
  @ApiPropertyOptional() permanent_address?: string;
  @ApiProperty({ example: 'Ramesh Sharma' }) emergency_contact_name!: string;
  @ApiProperty({ example: 'Father' }) emergency_contact_relation!: string;
  @ApiProperty({ example: '9876500099' }) emergency_contact_mobile!: string;
  @ApiProperty({ example: '2025-01-15' }) move_in_date!: string;
  @ApiProperty({ example: 'owner', enum: ['owner', 'tenant'] }) resident_type!: string;
  @ApiPropertyOptional({ example: 'TN09AB1234' }) vehicle_number?: string;
  @ApiPropertyOptional({ example: 'Car' }) vehicle_type?: string;
  @ApiPropertyOptional({ example: 'Honda City' }) vehicle_model?: string;
  @ApiPropertyOptional({ example: 'White' }) vehicle_color?: string;
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } }) family_members?: any[];
  @ApiProperty({ example: 'MySecure@123', description: 'Resident sets their password here' }) password!: string;
}

export class CreateAdminBody {
  @ApiProperty({ example: 'Arjun Kumar' }) full_name!: string;
  @ApiProperty({ example: 'admin@ams.com' }) email!: string;
  @ApiPropertyOptional({ example: '9876500001' }) mobile?: string;
  @ApiProperty({ example: 'Admin@1234' }) password!: string;
}

export class CreateSubAdminBody {
  @ApiProperty({ example: 'Ravi Security' }) full_name!: string;
  @ApiProperty({ example: 'security@ams.com' }) email!: string;
  @ApiPropertyOptional() mobile?: string;
  @ApiProperty({ example: 'SubAdmin@1234' }) password!: string;
  @ApiProperty({ example: 'admin_security', enum: ['admin_maintenance', 'admin_security', 'admin_account'] }) role!: string;
}

export class CreateGatekeeperBody {
  @ApiProperty({ example: 'Muthu Guard' }) full_name!: string;
  @ApiProperty({ example: 'gate1@ams.com' }) email!: string;
  @ApiPropertyOptional() mobile?: string;
  @ApiProperty({ example: 'Gate@1234' }) password!: string;
}

export class CreateAccountantBody {
  @ApiProperty({ example: 'Priya Accounts' }) full_name!: string;
  @ApiProperty({ example: 'accountant@ams.com' }) email!: string;
  @ApiPropertyOptional() mobile?: string;
  @ApiProperty({ example: 'Acct@1234' }) password!: string;
}

export class CreateResidentBody {
  @ApiProperty({ example: 'Sunita Sharma' }) full_name!: string;
  @ApiProperty({ example: 'sunita@gmail.com' }) email!: string;
  @ApiProperty({ example: '9876500005' }) mobile!: string;
  @ApiProperty({ example: 'owner', enum: ['owner', 'tenant'] }) resident_type!: string;
  @ApiPropertyOptional({ example: 'A' }) block?: string;
  @ApiProperty({ example: '401' }) unit_number!: string;
  @ApiPropertyOptional() flat_id?: string;
}

export class CreateWorkerBody {
  @ApiProperty({ example: 'Selvam Plumber' }) full_name!: string;
  @ApiPropertyOptional({ example: '9876500006' }) mobile?: string;
  @ApiPropertyOptional({ example: 'Plumber', enum: ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Other'] }) expertise?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional() id_proof_type?: string;
  @ApiPropertyOptional() id_proof_number?: string;
  @ApiPropertyOptional() notes?: string;
}

export class CreateGateBody {
  @ApiProperty({ example: 'Gate A' }) gate_name!: string;
  @ApiPropertyOptional({ example: 'Near main road' }) location?: string;
  @ApiPropertyOptional() description?: string;
}

export class CreateScheduleBody {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e' }) gatekeeper_id!: string;
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0f' }) gate_id!: string;
  @ApiProperty({ example: '06:00' }) shift_start!: string;
  @ApiProperty({ example: '14:00' }) shift_end!: string;
  @ApiPropertyOptional({ example: 'Morning' }) shift_name?: string;
  @ApiPropertyOptional({ example: 'monday', enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] }) day_of_week?: string;
  @ApiPropertyOptional({ example: '2025-04-25' }) specific_date?: string;
}
