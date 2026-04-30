import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags, ApiOperation, ApiBody, ApiResponse,
  ApiBearerAuth, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import { Role } from '../common/enums/roles.enum';
import { CreateGateBody, CreateScheduleBody } from '../common/swagger/api-bodies.dto';

@ApiTags('gates')
@ApiBearerAuth()
@Controller('gates')
export class GatesGatewayController {
  constructor(@Inject('AUTH_SERVICE') private readonly auth: ClientProxy) {}

  // ── Gates ────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a gate (ADMIN only)' })
  @ApiBody({ type: CreateGateBody })
  createGate(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('gates.create', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Get()
  @ApiOperation({ summary: 'List all gates' })
  getAllGates() {
    return firstValueFrom(this.auth.send('gates.get_all', {}));
  }

  // ── Sessions (before /:id to avoid route collision) ──────────────────────

  @Get('sessions/active')
  @ApiOperation({ summary: 'List all currently active gatekeeper sessions' })
  getActiveSessions() {
    return firstValueFrom(this.auth.send('gates.active_sessions', {}));
  }

  @Get('sessions/date/:date')
  @ApiOperation({ summary: 'Get all gatekeeper sessions on a specific date' })
  @ApiParam({ name: 'date', example: '2025-04-21', description: 'YYYY-MM-DD' })
  getSessionsByDate(@Param('date') date: string) {
    return firstValueFrom(this.auth.send('gates.sessions_by_date', { date }));
  }

  @Get('sessions/gatekeeper/:id')
  @ApiOperation({ summary: 'Get session history for a gatekeeper' })
  @ApiParam({ name: 'id', description: 'Gatekeeper user _id' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSessionsByGatekeeper(@Param('id') id: string, @Query('limit') limit?: number) {
    return firstValueFrom(this.auth.send('gates.sessions_by_gatekeeper', {
      gatekeeper_id: id, limit,
    }));
  }

  // ── Schedules (before /:id) ───────────────────────────────────────────────

  @Roles(Role.ADMIN_SECURITY, Role.ADMIN, Role.SUPER_ADMIN)
  @Post('schedules')
  @ApiOperation({
    summary: 'Assign a gatekeeper to a gate for a shift (ADMIN_SECURITY)',
    description: 'Provide either day_of_week (recurring weekly) OR specific_date (one-time).',
  })
  @ApiBody({ type: CreateScheduleBody })
  createSchedule(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.auth.send('gates.create_schedule', {
      creator_id: user._id || user.id, creator_role: user.role, dto: body,
    }));
  }

  @Get('schedules')
  @ApiOperation({ summary: 'List all gate schedules (filtered by role)' })
  getAllSchedules(@CurrentUser() user: any) {
    return firstValueFrom(this.auth.send('gates.get_all_schedules', {
      creator_id: user._id || user.id, creator_role: user.role,
    }));
  }

  @Get('schedules/gatekeeper/:id')
  @ApiOperation({ summary: "List all schedules for a specific gatekeeper" })
  @ApiParam({ name: 'id', description: 'Gatekeeper user _id' })
  getSchedulesByGatekeeper(@Param('id') id: string) {
    return firstValueFrom(this.auth.send('gates.get_schedules_gatekeeper', {
      gatekeeper_id: id,
    }));
  }

  @Roles(Role.ADMIN_SECURITY, Role.ADMIN)
  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update a gate schedule' })
  @ApiParam({ name: 'id', description: 'Schedule _id' })
  updateSchedule(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.auth.send('gates.update_schedule', { id, dto: body }));
  }

  @Roles(Role.ADMIN_SECURITY, Role.ADMIN)
  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Deactivate a gate schedule' })
  @ApiParam({ name: 'id', description: 'Schedule _id' })
  deleteSchedule(@Param('id') id: string) {
    return firstValueFrom(this.auth.send('gates.delete_schedule', { id }));
  }

  // ── Single gate (last to avoid swallowing sub-routes) ────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get gate by ID' })
  @ApiParam({ name: 'id', description: 'Gate _id' })
  getGateById(@Param('id') id: string) {
    return firstValueFrom(this.auth.send('gates.get_by_id', { id }));
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(':id/status')
  @ApiOperation({ summary: 'Update gate status (active / inactive / maintenance)' })
  @ApiParam({ name: 'id', description: 'Gate _id' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['active','inactive','maintenance'] } } } })
  updateGateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return firstValueFrom(this.auth.send('gates.update_status', { id, status: body.status }));
  }
}
