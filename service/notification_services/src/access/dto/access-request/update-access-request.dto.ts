
import { PartialType } from '@nestjs/swagger';
import { CreateAccessRequestDto } from './create-access-request.dto';

export class UpdateAccessRequestDto extends PartialType(
  CreateAccessRequestDto,
) {}