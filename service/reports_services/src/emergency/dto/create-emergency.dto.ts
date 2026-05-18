import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEmergencyDto {

  @ApiProperty({ example: 'Fire', description: 'Fire / Medical / Power / Water / Security / Structural / Other' })
  @IsString()
  type!: string;

  @ApiProperty({ enum: ['High', 'Medium', 'Low'], example: 'High', default: 'Medium' })
  @IsEnum(['High', 'Medium', 'Low'])
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: 'Block A — 3rd Floor Corridor' })
  @IsString()
  location!: string;

  @ApiProperty({ example: 'Fire detected in stairwell. Evacuate immediately.' })
  @IsString()
  message!: string;

  @ApiProperty({
    type: [String],
    example: ['all'],
    description: `Who to notify:\n
    - ['all']         → resident + maintenance + security + admin\n
    - ['resident']    → residents only\n
    - ['maintenance'] → maintenance team only\n
    - ['admin']       → admin only\n
    - ['security']    → gatekeepers + admin_security\n
    Can combine: ['resident', 'maintenance']`,
  })
  @IsArray()
  @IsString({ each: true })
  sendTo!: string[];

  @ApiPropertyOptional({ example: 40, description: 'Estimated people affected (optional)' })
  @IsNumber()
  @IsOptional()
  total?: number;
}
