import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/roles.enum';
import { ResidentType } from '../../common/enums/status.enum';

export class CreateAdminDto {
  @ApiProperty({ example: 'Arjun Kumar' }) @IsString() full_name: string;
  @ApiProperty({ example: 'admin@ams.com' }) @IsEmail() email: string;
  @ApiPropertyOptional({ example: '9876500001' }) @IsString() @IsOptional() mobile?: string;
  @ApiProperty({ example: 'Admin@1234' }) @IsString() @MinLength(8) password: string;
}

export class CreateSubAdminDto {
  @ApiProperty({ example: 'Ravi Security' }) @IsString() full_name: string;
  @ApiProperty({ example: 'security@ams.com' }) @IsEmail() email: string;
  @ApiPropertyOptional({ example: '9876500002' }) @IsString() @IsOptional() mobile?: string;
  @ApiProperty({ example: 'SubAdmin@1234' }) @IsString() @MinLength(8) password: string;
  @ApiProperty({ enum: [Role.ADMIN_MAINTENANCE, Role.ADMIN_SECURITY, Role.ADMIN_ACCOUNT], example: Role.ADMIN_SECURITY })
  @IsEnum([Role.ADMIN_MAINTENANCE, Role.ADMIN_SECURITY, Role.ADMIN_ACCOUNT]) role: Role;
}

export class CreateGatekeeperDto {
  @ApiProperty({ example: 'Muthu Guard' }) @IsString() full_name: string;
  @ApiProperty({ example: 'gate1@ams.com' }) @IsEmail() email: string;
  @ApiPropertyOptional({ example: '9876500003' }) @IsString() @IsOptional() mobile?: string;
  @ApiProperty({ example: 'Gate@1234' }) @IsString() @MinLength(8) password: string;
}

export class CreateAccountantDto {
  @ApiProperty({ example: 'Priya Accounts' }) @IsString() full_name: string;
  @ApiProperty({ example: 'accountant@ams.com' }) @IsEmail() email: string;
  @ApiPropertyOptional({ example: '9876500004' }) @IsString() @IsOptional() mobile?: string;
  @ApiProperty({ example: 'Acct@1234' }) @IsString() @MinLength(8) password: string;
}

// No password — resident sets it in move-in form
export class CreateResidentDto {
  @ApiProperty({ example: 'Sunita Sharma' }) @IsString() full_name: string;
  @ApiProperty({ example: 'sunita@gmail.com' }) @IsEmail() email: string;
  @ApiProperty({ example: '9876500005' }) @IsString() mobile: string;
  @ApiProperty({ enum: ResidentType, example: ResidentType.OWNER }) @IsEnum(ResidentType) resident_type: ResidentType;
  @ApiPropertyOptional({ example: 'A' }) @IsString() @IsOptional() block?: string;
  @ApiProperty({ example: '401' }) @IsString() unit_number: string;
  @ApiPropertyOptional({ example: '665f1b2c3d4e5f6a7b8c9d0e' }) @IsString() @IsOptional() flat_id?: string;
}

export class CreateWorkerDto {
  @ApiProperty({ example: 'Selvam Plumber' }) @IsString() full_name: string;
  @ApiPropertyOptional({ example: '9876500006' }) @IsString() @IsOptional() mobile?: string;
  @ApiPropertyOptional({ example: 'Plumber' }) @IsString() @IsOptional() expertise?: string;
  @ApiPropertyOptional({ example: '23, Gandhi Street, Chennai' }) @IsString() @IsOptional() address?: string;
  @ApiPropertyOptional({ example: 'Aadhar' }) @IsString() @IsOptional() id_proof_type?: string;
  @ApiPropertyOptional({ example: '1234-5678-9012' }) @IsString() @IsOptional() id_proof_number?: string;
  @ApiPropertyOptional({ example: 'Available Mon-Sat' }) @IsString() @IsOptional() notes?: string;
}
