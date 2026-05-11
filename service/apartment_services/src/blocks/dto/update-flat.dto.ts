import { PartialType } from '@nestjs/mapped-types';
import { CreateFlatDto } from './create-flat.dto';

export class UpdateFlatDto extends PartialType(CreateFlatDto) {}