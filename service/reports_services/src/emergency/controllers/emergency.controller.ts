import {
  Controller, Get, Post, Body, Param, Patch, Delete, Query,
} from '@nestjs/common';

import { CreateEmergencyDto } from '../dto/create-emergency.dto';
import { UpdateEmergencyDto } from '../dto/update-emergency.dto';
import { ReportStatusEnum } from '../../schemas/report-status.schema';
import { EmergencyService } from '../services/emergency.service';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}


  @Post()
  create(@Body() dto: CreateEmergencyDto) {
    return this.emergencyService.create(dto);
  }

  @Get()
  findAll() {
    return this.emergencyService.findAll();
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

  @Post('report/all')
  generateAllReport(@Query('requestedBy') requestedBy?: string) {
    return this.emergencyService.requestExcelReport('ALL', undefined, requestedBy);
  }

  @Post('report/:id')
  generateSingleReport(
    @Param('id') id: string,
    @Query('requestedBy') requestedBy?: string,
  ) {
    return this.emergencyService.requestExcelReport('SINGLE', id, requestedBy);
  }

  @Get('report/status/:reportId')
  getReportStatus(@Param('reportId') reportId: string) {
    return this.emergencyService.getReportStatus(reportId);
  }

  @Get('report/history')
  getReportHistory(@Query('requestedBy') requestedBy?: string) {
    return this.emergencyService.getReportHistory(requestedBy);
  }

  @Patch('report/status/:reportId')
  updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() body: { status: ReportStatusEnum; downloadUrl?: string; errorMessage?: string },
  ) {
    return this.emergencyService.updateReportStatus(
      reportId,
      body.status,
      body.downloadUrl,
      body.errorMessage,
    );
  }
}