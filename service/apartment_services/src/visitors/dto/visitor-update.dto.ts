import { IsIn } from 'class-validator';

export class UpdateVisitorStatusDto {

  @IsIn(['Pending', 'Approved', 'Rejected', 'Completed'])
  status!: string;
}