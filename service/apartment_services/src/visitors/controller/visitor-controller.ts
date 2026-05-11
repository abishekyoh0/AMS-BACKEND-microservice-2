import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { VisitorService } from '../services/visitor-service';
import { CreateVisitorDto } from '../dto/visitor-create.dto';
import { UpdateVisitorStatusDto } from '../dto/visitor-update.dto';

@Controller('visitors')
export class VisitorController {

  constructor(private readonly visitorService: VisitorService) {}

  @Post()
  create(@Body() dto: CreateVisitorDto) {
    return this.visitorService.create(dto);
  }
   @Get()
  findAll() {
    return this.visitorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVisitorStatusDto) {
    return this.visitorService.updateStatus(id, dto.status);
  }

  @Patch(':id/entry')
  markEntry(@Param('id') id: string) {
    return this.visitorService.markEntry(id);
  } 

  @Patch(':id/exit')
  markExit(@Param('id') id: string) {
    return this.visitorService.markExit(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorService.delete(id);
  }




}