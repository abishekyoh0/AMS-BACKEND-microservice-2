import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GatesService } from './gates.service';

@Controller()
export class GatesController {
  constructor(private readonly gatesService: GatesService) {}
 
  @MessagePattern('gates.create')
  createGate(@Payload() d: any) {
    return this.gatesService.createGate(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('gates.get_all')
  getAll() {
    return this.gatesService.getAllGates();
  }

  @MessagePattern('gates.get_by_id')
  getById(@Payload() d: { id: string }) { 
    return this.gatesService.getGateById(d.id);
  }

  @MessagePattern('gates.update_status')
  updateStatus(@Payload() d: { id: string; status: any }) {
    return this.gatesService.updateGateStatus(d.id, d.status);
  }

  @MessagePattern('gates.create_schedule')
  createSchedule(@Payload() d: any) {
    return this.gatesService.createSchedule(d.creator_id, d.creator_role, d.dto);
  }

  @MessagePattern('gates.get_schedules_gatekeeper')
  getSchedulesByGatekeeper(@Payload() d: { gatekeeper_id: string }) {
    return this.gatesService.getSchedulesByGatekeeper(d.gatekeeper_id);
  }

  @MessagePattern('gates.get_all_schedules')
  getAllSchedules(@Payload() d: { creator_id: string; creator_role: any }) {
    return this.gatesService.getAllSchedules(d.creator_id, d.creator_role);
  }

  @MessagePattern('gates.update_schedule')
  updateSchedule(@Payload() d: { id: string; dto: any }) {
    return this.gatesService.updateSchedule(d.id, d.dto);
  }

  @MessagePattern('gates.delete_schedule')
  deleteSchedule(@Payload() d: { id: string }) {
    return this.gatesService.deleteSchedule(d.id);
  }

  @MessagePattern('gates.active_sessions')
  activeSessions() {
    return this.gatesService.getActiveSessions();
  }

  @MessagePattern('gates.sessions_by_gatekeeper')
  sessionsByGatekeeper(@Payload() d: { gatekeeper_id: string; limit?: number }) {
    return this.gatesService.getSessionsByGatekeeper(d.gatekeeper_id, d.limit);
  }

  @MessagePattern('gates.sessions_by_date')
  sessionsByDate(@Payload() d: { date: string }) {
    return this.gatesService.getSessionsByDate(d.date);
  }
}
