import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { FlatsService } from '../services/flat-services';
import { CreateFlatDto } from '../dto/create-flat.dto';
import { UpdateFlatDto } from '../dto/update-flat.dto';

@Controller('flats')
export class FlatsController {
  constructor(private readonly flatsService: FlatsService) {}

  @Post()
  create(@Body() dto: CreateFlatDto) {
    return this.flatsService.create(dto);
  }

  @Get()
  findAll() {
    return this.flatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flatsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFlatDto) {
    return this.flatsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flatsService.remove(id);
  }

  // Get all flats in a block
  @Get('block/:block_id')
  findByBlock(@Param('block_id') block_id: string) {
    return this.flatsService.findByBlock(block_id);
  }

  // Get all flats on a floor
  @Get('floor/:floor_id')
  findByFloor(@Param('floor_id') floor_id: string) {
    return this.flatsService.findByFloor(floor_id);
  }
}