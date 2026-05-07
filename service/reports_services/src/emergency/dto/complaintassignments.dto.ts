import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsDateString
} from 'class-validator';

export class ComplaintsAssignmentsDto {
    @IsNotEmpty()
    @IsString()
    complaint_id!: string;

    @IsNotEmpty()
    @IsString()
    assignment_id!: string;

    @IsNotEmpty()
    @IsString()
    technician_id!: string;

    @IsNotEmpty()
    @IsDateString()
    assigned_date!: Date;

    @IsNotEmpty()
    @IsEnum(['Assigned', 'Accepted', 'Rejected'])
    status!: 'Assigned' | 'Accepted' | 'Rejected';

    @IsOptional()
    @IsDateString()
    scheduled_date!: Date;

    @IsOptional()
    @IsDateString()
    created_at!: Date;

    @IsOptional()
    @IsDateString()
    updated_at!: Date;

}
