import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsDateString, IsEnum, IsMongoId, IsNumber,
  IsOptional, IsString, Max, Min,
} from 'class-validator';
import {
  ComplaintType, CommonCategory, IndividualCategory,
  Priority, ComplaintStatus, AssignmentStatus,
} from '../../common/enums/complaint.enum';

// ─── Raise Complaint (Resident) ───────────────────────────────────────────────
export class CreateResidentComplaintDto {
  @ApiProperty({ enum: ComplaintType, example: ComplaintType.INDIVIDUAL,
    description: 'common = common area issue | individual = inside your flat' })
  @IsEnum(ComplaintType)
  complaint_type: ComplaintType;

  @ApiProperty({
    example: 'Plumbing',
    description: `Common categories: ${Object.values(CommonCategory).join(', ')} | Individual: ${Object.values(IndividualCategory).join(', ')}`,
  })
  @IsString()
  category: string;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({ example: 'Water leaking from bathroom ceiling' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'There is a continuous water drip from the top corner of the bathroom since morning.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: [String], example: ['https://storage.ams.com/img1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

// ─── Raise Complaint (Maintenance Admin) ─────────────────────────────────────
// Admin can raise on behalf of any resident — requires location details
export class CreateAdminComplaintDto {
  @ApiProperty({ example: 'Sunita Sharma', description: 'Affected resident name' })
  @IsString()
  resident_name: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  block: string;

  @ApiProperty({ example: '3' })
  @IsString()
  floor: string;

  @ApiProperty({ example: '301' })
  @IsString()
  unit_number: string;

  @ApiProperty({ enum: ComplaintType, example: ComplaintType.COMMON })
  @IsEnum(ComplaintType)
  complaint_type: ComplaintType;

  @ApiProperty({ example: 'Lift' })
  @IsString()
  category: string;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({ example: 'Lift not working on Block A' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'The lift on Block A has been stuck on the 2nd floor since 8 AM.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

// ─── Assign Worker ────────────────────────────────────────────────────────────
export class AssignWorkerDto {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e', description: 'Worker _id from auth service' })
  @IsMongoId()
  worker_id: string;

  @ApiProperty({ example: 'Selvam Plumber' })
  @IsString()
  worker_name: string;

  @ApiPropertyOptional({ example: 'Plumber' })
  @IsString()
  @IsOptional()
  worker_expertise?: string;

  @ApiPropertyOptional({ example: '2025-05-10', description: 'Scheduled visit date' })
  @IsDateString()
  @IsOptional()
  scheduled_visit_date?: string;
}

// ─── Update Assignment Status (worker actions) ────────────────────────────────
export class UpdateAssignmentStatusDto {
  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.ACCEPTED })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;

  @ApiPropertyOptional({ example: 'Not available for this type of work', description: 'Required when status = Rejected' })
  @IsString()
  @IsOptional()
  rejection_reason?: string;

  @ApiPropertyOptional({ example: 'Replaced the leaking pipe joint. Tested for 30 minutes.', description: 'Required when status = Resolved' })
  @IsString()
  @IsOptional()
  work_notes?: string;

  @ApiPropertyOptional({ type: [String], description: 'Completion photos (when status = Resolved)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  completion_images?: string[];
}

// ─── Extra charges ────────────────────────────────────────────────────────────
export class ExtraChargesDto {
  @ApiProperty({ example: 450, description: 'Amount in INR' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Replaced copper pipe fitting (₹300) + labour (₹150)' })
  @IsString()
  description: string;
}

// ─── Close complaint ──────────────────────────────────────────────────────────
export class CloseComplaintDto {
  @ApiPropertyOptional({ example: 'Issue resolved, satisfied with the work.' })
  @IsString()
  @IsOptional()
  closure_remark?: string;

  @ApiPropertyOptional({ example: 5, description: '1–5 star rating for the work' })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 'Very prompt service, thank you!' })
  @IsString()
  @IsOptional()
  rating_comment?: string;
}

// ─── Query filters ────────────────────────────────────────────────────────────
export class ComplaintFilterDto {
  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ComplaintType })
  @IsEnum(ComplaintType)
  @IsOptional()
  complaint_type?: ComplaintType;

  @ApiPropertyOptional({ enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ example: 'Plumbing' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: '20', description: 'Items per page' })
  @IsOptional()
  limit?: number;
}
