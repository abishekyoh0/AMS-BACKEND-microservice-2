import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UnitsService } from '../services/unit-services';
import { CreateUnitDto } from '../dto/create-unit.dto';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto);
  }

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }

  @Get('block/:block_id')
  findByBlock(@Param('block_id') block_id: string) {
    return this.unitsService.findByBlock(block_id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: { floor?: number; unit_number?: string; rent?: number }) {
    return this.unitsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}