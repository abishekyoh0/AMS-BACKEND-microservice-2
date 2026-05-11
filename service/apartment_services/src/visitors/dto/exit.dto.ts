import { IsOptional } from 'class-validator';

export class VisitorEntryExitDto {

  @IsOptional()
  entry_time!: Date;

  @IsOptional()
  exit_time!: Date;
}