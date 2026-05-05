import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ComplaintsService } from './complaints.service';

/**
 * TCP Message Patterns — consumed by the API Gateway
 *
 * complaints.create.resident          Resident raises a complaint
 * complaints.create.admin             Maintenance admin raises a complaint
 * complaints.assign_worker            Assign a worker to a complaint
 * complaints.update_assignment        Worker/admin updates assignment status
 * complaints.add_extra_charges        Worker adds extra charge request
 * complaints.approve_extra_charges    Admin approves extra charges
 * complaints.close                    Resident/admin closes complaint after resolution
 * complaints.get_by_id               Get complaint + assignment history
 * complaints.list                    List complaints with filters
 * complaints.worker_assignments      Get all active assignments for a worker
 * complaints.delete                  Soft-delete a complaint
 * complaints.stats                   Dashboard summary stats
 */
@Controller()
export class ComplaintsController {
  constructor(private readonly service: ComplaintsService) {}

  @MessagePattern('complaints.create.resident')
  createResident(@Payload() d: any) {
    return this.service.createResidentComplaint(d.user_id, d.profile, d.dto);
  }

  @MessagePattern('complaints.create.admin')
  createAdmin(@Payload() d: any) {
    return this.service.createAdminComplaint(d.user_id, d.user_name, d.dto);
  }

  @MessagePattern('complaints.assign_worker')
  assignWorker(@Payload() d: any) {
    return this.service.assignWorker(d.complaint_id, d.admin_id, d.admin_name, d.dto);
  }

  @MessagePattern('complaints.update_assignment')
  updateAssignment(@Payload() d: any) {
    return this.service.updateAssignmentStatus(d.assignment_id, d.dto);
  }

  @MessagePattern('complaints.add_extra_charges')
  addExtraCharges(@Payload() d: any) {
    return this.service.addExtraCharges(d.assignment_id, d.dto);
  }

  @MessagePattern('complaints.approve_extra_charges')
  approveExtraCharges(@Payload() d: any) {
    return this.service.approveExtraCharges(d.assignment_id);
  }

  @MessagePattern('complaints.close')
  close(@Payload() d: any) {
    return this.service.closeComplaint(d.complaint_id, d.dto);
  }

  @MessagePattern('complaints.get_by_id')
  getById(@Payload() d: any) {
    return this.service.getComplaintById(d.complaint_id);
  }

  @MessagePattern('complaints.list')
  list(@Payload() d: any) {
    return this.service.listComplaints(d.filter, d.user_id, d.user_role);
  }

  @MessagePattern('complaints.worker_assignments')
  workerAssignments(@Payload() d: any) {
    return this.service.getWorkerAssignments(d.worker_id);
  }

  @MessagePattern('complaints.delete')
  delete(@Payload() d: any) {
    return this.service.deleteComplaint(d.complaint_id);
  }

  @MessagePattern('complaints.stats')
  stats() {
    return this.service.getSummaryStats();
  }
}
