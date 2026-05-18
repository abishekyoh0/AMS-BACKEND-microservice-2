import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import { Role } from '../common/enums/roles.enum';

@ApiTags('emergency')
@ApiBearerAuth('Bearer')
@Controller('emergency')
export class EmergencyGatewayController {
  constructor(@Inject('REPORTS_SERVICE') private readonly reports: ClientProxy) {}

  @Roles(Role.GATEKEEPER, Role.ADMIN_SECURITY, Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Raise an emergency alert',
    description: '**Roles:** gatekeeper, admin_security, admin\n\nalertId, time, acknowledged, status are auto-generated — do NOT send them.',
  })
  @ApiBody({ schema: { required: ['type','location','message','sendTo'], properties: {
    type:     { type: 'string', example: 'Fire', description: 'Fire / Medical / Power / Water / Security / Structural / Other' },
    priority: { type: 'string', enum: ['High','Medium','Low'], example: 'High' },
    location: { type: 'string', example: 'Block A — 3rd Floor Corridor' },
    message:  { type: 'string', example: 'Fire detected in stairwell. Evacuate immediately.' },
    sendTo:   { type: 'array', items: { type: 'string' }, example: ['all'], description: 'all | resident | maintenance | admin | security' },
    total:    { type: 'number', example: 40, description: 'Estimated people affected (optional)' },
  }}})
  @ApiResponse({ status: 201, description: 'Emergency created. Notifications sent to targeted roles.' })
  @ApiResponse({ status: 403, description: 'Role not allowed to raise emergencies' })
  createEmergency(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.reports.send('emergency.create', {
      raised_by_id: user._id || user.id, raised_by_name: user.full_name, raised_by_role: user.role, dto: body,
    }));
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ADMIN_SECURITY, Role.GATEKEEPER)
  @Get()
  @ApiOperation({ summary: 'List all emergencies (admin + security)' })
  findAll() { return firstValueFrom(this.reports.send('emergency.find_all', {})); }

  @Get('active')
  @ApiOperation({ summary: 'Active emergencies — all authenticated users' })
  findActive() { return firstValueFrom(this.reports.send('emergency.find_active', {})); }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ADMIN_SECURITY)
  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats: total, active, resolved, highPriority' })
  getStats() { return firstValueFrom(this.reports.send('emergency.stats', {})); }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ADMIN_SECURITY, Role.GATEKEEPER)
  @Patch('resolve/:id')
  @ApiOperation({ summary: 'Resolve emergency — admin/security resolves', description: 'Sends resolution notification to all originally alerted roles.' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { properties: { resolution_note: { type: 'string', example: 'Fire extinguished. Building cleared and safe.' } } } })
  @ApiResponse({ status: 200, description: 'Resolved. Resolution notification sent.' })
  @ApiResponse({ status: 403, description: 'Role not allowed' })
  @ApiResponse({ status: 404, description: 'Emergency not found' })
  resolve(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return firstValueFrom(this.reports.send('emergency.resolve', {
      emergency_id: id, resolved_by_id: user._id || user.id,
      resolved_by_name: user.full_name, resolved_by_role: user.role, resolution_note: body.resolution_note,
    }));
  }

  @Patch('acknowledge/:id')
  @ApiOperation({ summary: 'Acknowledge emergency — increments count (all users)' })
  @ApiParam({ name: 'id' })
  acknowledge(@Param('id') id: string) {
    return firstValueFrom(this.reports.send('emergency.acknowledge', { emergency_id: id }));
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 404, description: 'Emergency not found' })
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.reports.send('emergency.find_one', { emergency_id: id }));
  }
}
