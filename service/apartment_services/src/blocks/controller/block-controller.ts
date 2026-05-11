import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { BlocksService } from '../services/block-services';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  create(@Body() createBlockDto: CreateBlockDto) {
    return this.blocksService.create(createBlockDto);
  }

  @Get()
  findAll() {
    return this.blocksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blocksService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateBlockDto: UpdateBlockDto) {
    return this.blocksService.update(id, updateBlockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blocksService.remove(id);
  }

  //  GET FULL DETAILS (FLOORS, FLATS, UNITS)
  @Get(':id/full-details')
  getFullDetails(@Param('id') id: string) {
    return this.blocksService.getFullDetails(id);
  }
} 

