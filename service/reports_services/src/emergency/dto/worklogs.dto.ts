import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsDateString
} from 'class-validator';

export class WorkLogsDto {
    @IsNotEmpty()
    @IsString()
    worklog_id!: string;

    @IsNotEmpty()
    @IsString()
    assignment_id!: string;

    @IsNotEmpty()
    @IsDateString()
    start_time!: Date;

    @IsNotEmpty()
    @IsDateString()
    end_time!: Date;

    @IsNotEmpty()
    @IsEnum(['In Progress', 'Completed'])
    status!: 'In Progress' | 'Completed';

    @IsNotEmpty()
    @IsString()
    notes!: string;

    @IsOptional()
    @IsDateString()
    created_at!: Date;

    @IsOptional()
    @IsDateString()
    updated_at!: Date;


}