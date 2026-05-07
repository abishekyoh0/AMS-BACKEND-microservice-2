import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';

import { EmergencyService } from '../services/emergency.service';
import { CreateEmergencyDto } from '../dto/create-emergency.dto';
import { UpdateEmergencyDto } from '../dto/update-emergency.dto';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post()
  create(@Body() dto: CreateEmergencyDto) {
    return this.emergencyService.create(dto);
  }


  @Get('active')
  getActive() {
    return this.emergencyService.getActive();
  }

  @Get('history')
  getHistory() {
    return this.emergencyService.getHistory();
  }

  @Get('stats/dashboard')
  getStats() {
    return this.emergencyService.getStats();
  }

  @Get('report/all')
  generateAllReport() {
    return this.emergencyService.requestExcelReport('ALL');
  }

  @Get('report/:id')
  generateSingleReport(@Param('id') id: string) {
    return this.emergencyService.requestExcelReport('SINGLE', id);
  }


  @Get()
  findAll() {
    return this.emergencyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emergencyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmergencyDto) {
    return this.emergencyService.update(id, dto);
  }

  @Patch('resolve/:id')
  resolve(@Param('id') id: string) {
    return this.emergencyService.resolveEmergency(id);
  }

  @Patch('acknowledge/:id') 
  acknowledge(@Param('id') id: string) {
    return this.emergencyService.acknowledge(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emergencyService.remove(id);
  }
}