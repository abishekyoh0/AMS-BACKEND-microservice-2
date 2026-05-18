import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateEmergencyDto } from '../dto/create-emergency.dto';
import { UpdateEmergencyDto } from '../dto/update-emergency.dto';
import { ReportStatusEnum } from '../../schemas/report-status.schema';
import { EmergencyService } from '../services/emergency.service';

@ApiTags('emergency')
@ApiBearerAuth('Bearer')
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post()
  @ApiOperation({ summary: 'Raise emergency (gatekeeper/admin_security/admin)', description: 'alertId, time, acknowledged, status are auto-generated — do NOT send them.' })
  @ApiBody({ type: CreateEmergencyDto })
  @ApiResponse({ status: 201, description: 'Emergency created. Notifications sent. alertId auto-generated.' })
  create(@Body() dto: CreateEmergencyDto) {
  return this.emergencyService.create(dto);
}

  @Get()
  @ApiOperation({ summary: 'List all emergencies' })
  findAll() { return this.emergencyService.findAll(); }

  @Get('active')
  @ApiOperation({ summary: 'Active emergencies (status = Active)' })
  getActive() { return this.emergencyService.getActive(); }

  @Get('history')
  @ApiOperation({ summary: 'Full emergency history' })
  getHistory() { return this.emergencyService.getHistory(); }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Dashboard: total, active, resolved, highPriority' })
  getStats() { return this.emergencyService.getStats(); }

  @Patch('resolve/:id')
  @ApiOperation({ summary: 'Resolve emergency (admin/admin_security)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { properties: { resolution_note: { type: 'string', example: 'Fire extinguished. Building cleared.' } } } })
  @ApiResponse({ status: 200, description: 'Resolved. Resolution notification sent.' })
  resolve(@Param('id') id: string) {
  return this.emergencyService.resolveEmergency(id);
}

  @Patch('acknowledge/:id')
  @ApiOperation({ summary: 'Acknowledge (all users) — increments count' })
  @ApiParam({ name: 'id' })
  acknowledge(@Param('id') id: string) { return this.emergencyService.acknowledge(id); }

  @Patch(':id')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateEmergencyDto) {
    return this.emergencyService.update(id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) { return this.emergencyService.remove(id); }

  @Get(':id')
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) { return this.emergencyService.findOne(id); }

  @Post('report/all')
  @ApiOperation({ summary: 'Request Excel export of all emergencies' })
  @ApiQuery({ name: 'requestedBy', required: false })
  generateAllReport(@Query('requestedBy') requestedBy?: string) {
    return this.emergencyService.requestExcelReport('ALL', undefined, requestedBy);
  }

  @Post('report/:id')
  @ApiParam({ name: 'id' })
  generateSingleReport(@Param('id') id: string, @Query('requestedBy') requestedBy?: string) {
    return this.emergencyService.requestExcelReport('SINGLE', id, requestedBy);
  }

  @Get('report/status/:reportId')
  @ApiParam({ name: 'reportId' })
  getReportStatus(@Param('reportId') reportId: string) {
    return this.emergencyService.getReportStatus(reportId);
  }

  @Get('report/history')
  @ApiQuery({ name: 'requestedBy', required: false })
  getReportHistory(@Query('requestedBy') requestedBy?: string) {
    return this.emergencyService.getReportHistory(requestedBy);
  }
}
