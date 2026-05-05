import {
  Injectable, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Complaint, ComplaintDocument } from '../schemas/complaint.schema';
import { ComplaintAssignment, ComplaintAssignmentDocument } from '../schemas/complaint-assignment.schema';
import { ComplaintCounter, ComplaintCounterDocument } from '../schemas/complaint-counter.schema';
import {
  ComplaintStatus, AssignmentStatus, RaisedByRole, ComplaintType,
} from '../common/enums/complaint.enum';
import {
  CreateResidentComplaintDto, CreateAdminComplaintDto,
  AssignWorkerDto, UpdateAssignmentStatusDto,
  ExtraChargesDto, CloseComplaintDto, ComplaintFilterDto,
} from './dto/complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name)
    private complaintModel: Model<ComplaintDocument>,
    @InjectModel(ComplaintAssignment.name)
    private assignmentModel: Model<ComplaintAssignmentDocument>,
    @InjectModel(ComplaintCounter.name)
    private counterModel: Model<ComplaintCounterDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-generate complaint number:  AMS-2025-00001
  // ─────────────────────────────────────────────────────────────────────────
  private async nextComplaintNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.counterModel.findOneAndUpdate(
      { year },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    const padded = String(counter.seq).padStart(5, '0');
    return `AMS-${year}-${padded}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESIDENT raises a complaint
  // resident_name, block, floor, unit_number pulled from their profile
  // ─────────────────────────────────────────────────────────────────────────
  async createResidentComplaint(
    userId: string,
    profile: { resident_name: string; block: string; floor: string; unit_number: string },
    dto: CreateResidentComplaintDto,
  ) {
    const number = await this.nextComplaintNumber();
    const complaint = await this.complaintModel.create({
      complaint_number: number,
      raised_by_id: new Types.ObjectId(userId),
      raised_by_role: RaisedByRole.RESIDENT,
      resident_name: profile.resident_name,
      block: profile.block,
      floor: profile.floor,
      unit_number: profile.unit_number,
      complaint_type: dto.complaint_type,
      category: dto.category,
      priority: dto.priority,
      title: dto.title,
      description: dto.description,
      images: dto.images || [],
      status: ComplaintStatus.OPEN,
    });
    return complaint;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN_MAINTENANCE raises a complaint on behalf of a resident
  // ─────────────────────────────────────────────────────────────────────────
  async createAdminComplaint(userId: string, userName: string, dto: CreateAdminComplaintDto) {
    const number = await this.nextComplaintNumber();
    const complaint = await this.complaintModel.create({
      complaint_number: number,
      raised_by_id: new Types.ObjectId(userId),
      raised_by_role: RaisedByRole.ADMIN_MAINTENANCE,
      resident_name: dto.resident_name,
      block: dto.block,
      floor: dto.floor,
      unit_number: dto.unit_number,
      complaint_type: dto.complaint_type,
      category: dto.category,
      priority: dto.priority,
      title: dto.title,
      description: dto.description,
      images: dto.images || [],
      status: ComplaintStatus.OPEN,
    });
    return complaint;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN_MAINTENANCE assigns a worker to a complaint
  // ─────────────────────────────────────────────────────────────────────────
  async assignWorker(
    complaintId: string,
    adminId: string,
    adminName: string,
    dto: AssignWorkerDto,
  ) {
    const complaint = await this.complaintModel.findById(complaintId);
    if (!complaint || complaint.is_deleted) throw new NotFoundException('Complaint not found');

    if ([ComplaintStatus.CLOSED, ComplaintStatus.RESOLVED].includes(complaint.status)) {
      throw new BadRequestException('Cannot assign worker to a resolved or closed complaint');
    }

    // If there's an active assignment that was rejected, that's fine — create new one
    const assignment = await this.assignmentModel.create({
      complaint_id: new Types.ObjectId(complaintId),
      worker_id: new Types.ObjectId(dto.worker_id),
      worker_name: dto.worker_name,
      worker_expertise: dto.worker_expertise || null,
      assigned_by_id: new Types.ObjectId(adminId),
      assigned_by_name: adminName,
      assigned_date: new Date(),
      scheduled_visit_date: dto.scheduled_visit_date ? new Date(dto.scheduled_visit_date) : null,
      status: AssignmentStatus.ASSIGNED,
    });

    // Update complaint
    await this.complaintModel.findByIdAndUpdate(complaintId, {
      status: ComplaintStatus.ASSIGNED,
      assigned_worker_id: new Types.ObjectId(dto.worker_id),
      assigned_worker_name: dto.worker_name,
      current_assignment_id: assignment._id,
    });

    return { complaint_number: complaint.complaint_number, assignment };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Update assignment status (worker actions / admin update)
  // Accepted | In Progress | Resolved | Rejected
  // ─────────────────────────────────────────────────────────────────────────
  async updateAssignmentStatus(
    assignmentId: string,
    dto: UpdateAssignmentStatusDto,
  ) {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');

    const now = new Date();
    const updateFields: any = { status: dto.status };

    switch (dto.status) {
      case AssignmentStatus.ACCEPTED:
        updateFields.accepted_at = now;
        break;

      case AssignmentStatus.REJECTED:
        if (!dto.rejection_reason) throw new BadRequestException('rejection_reason is required');
        updateFields.rejection_reason = dto.rejection_reason;
        break;

      case AssignmentStatus.IN_PROGRESS:
        updateFields.work_started_at = now;
        break;

      case AssignmentStatus.RESOLVED:
        if (!dto.work_notes) throw new BadRequestException('work_notes is required when marking resolved');
        updateFields.resolved_at = now;
        updateFields.work_notes = dto.work_notes;
        updateFields.completion_images = dto.completion_images || [];
        break;
    }

    await this.assignmentModel.findByIdAndUpdate(assignmentId, updateFields);

    // Map assignment status → complaint status
    const statusMap: Partial<Record<AssignmentStatus, ComplaintStatus>> = {
      [AssignmentStatus.ACCEPTED]:    ComplaintStatus.ACCEPTED,
      [AssignmentStatus.REJECTED]:    ComplaintStatus.REJECTED,
      [AssignmentStatus.IN_PROGRESS]: ComplaintStatus.IN_PROGRESS,
      [AssignmentStatus.RESOLVED]:    ComplaintStatus.RESOLVED,
    };

    const complaintStatus = statusMap[dto.status];
    const complaintUpdate: any = {};

    if (complaintStatus) complaintUpdate.status = complaintStatus;
    if (dto.status === AssignmentStatus.RESOLVED) complaintUpdate.resolved_at = now;

    // If rejected — clear the assigned worker from complaint
    if (dto.status === AssignmentStatus.REJECTED) {
      complaintUpdate.assigned_worker_id = null;
      complaintUpdate.assigned_worker_name = null;
      complaintUpdate.current_assignment_id = null;
    }

    await this.complaintModel.findByIdAndUpdate(assignment.complaint_id, complaintUpdate);

    return { message: `Assignment updated to ${dto.status}` };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Add extra charges (worker / admin)
  // ─────────────────────────────────────────────────────────────────────────
  async addExtraCharges(assignmentId: string, dto: ExtraChargesDto) {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.assignmentModel.findByIdAndUpdate(assignmentId, {
      has_extra_charges: true,
      extra_charge_amount: dto.amount,
      extra_charge_description: dto.description,
      extra_charges_approved: false,
    });

    return { message: 'Extra charges submitted for admin approval' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Approve extra charges (admin_maintenance)
  // ─────────────────────────────────────────────────────────────────────────
  async approveExtraCharges(assignmentId: string) {
    await this.assignmentModel.findByIdAndUpdate(assignmentId, {
      extra_charges_approved: true,
    });
    return { message: 'Extra charges approved' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Close complaint (resident or admin confirms resolution)
  // ─────────────────────────────────────────────────────────────────────────
  async closeComplaint(complaintId: string, dto: CloseComplaintDto) {
    const complaint = await this.complaintModel.findById(complaintId);
    if (!complaint || complaint.is_deleted) throw new NotFoundException('Complaint not found');

    if (complaint.status !== ComplaintStatus.RESOLVED) {
      throw new BadRequestException('Complaint must be in Resolved status before closing');
    }

    await this.complaintModel.findByIdAndUpdate(complaintId, {
      status: ComplaintStatus.CLOSED,
      closed_at: new Date(),
      closure_remark: dto.closure_remark || null,
      rating: dto.rating || null,
      rating_comment: dto.rating_comment || null,
    });

    return { message: 'Complaint closed successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET — single complaint with its assignment history
  // ─────────────────────────────────────────────────────────────────────────
  async getComplaintById(complaintId: string) {
    const complaint = await this.complaintModel
      .findOne({ _id: complaintId, is_deleted: false })
      .lean();
    if (!complaint) throw new NotFoundException('Complaint not found');

    const assignments = await this.assignmentModel
      .find({ complaint_id: new Types.ObjectId(complaintId) })
      .sort({ createdAt: -1 })
      .lean();

    return { complaint, assignments };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET — list complaints with filters
  // ─────────────────────────────────────────────────────────────────────────
  async listComplaints(filter: ComplaintFilterDto, forUserId?: string, forUserRole?: string) {
    const query: any = { is_deleted: false };

    // Residents only see their own complaints
    if (forUserRole === 'resident') {
      query.raised_by_id = new Types.ObjectId(forUserId);
    }

    if (filter.status)         query.status = filter.status;
    if (filter.complaint_type) query.complaint_type = filter.complaint_type;
    if (filter.priority)       query.priority = filter.priority;
    if (filter.category)       query.category = filter.category;

    const page  = Number(filter.page)  || 1;
    const limit = Number(filter.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.complaintModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.complaintModel.countDocuments(query),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET — complaints by worker (for worker's task view)
  // ─────────────────────────────────────────────────────────────────────────
  async getWorkerAssignments(workerId: string) {
    const assignments = await this.assignmentModel
      .find({
        worker_id: new Types.ObjectId(workerId),
        status: { $nin: [AssignmentStatus.REJECTED] },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with complaint details
    const complaintIds = assignments.map(a => a.complaint_id);
    const complaints = await this.complaintModel
      .find({ _id: { $in: complaintIds } })
      .select('complaint_number title category priority status unit_number block floor resident_name')
      .lean();

    const complaintMap = Object.fromEntries(complaints.map(c => [String(c._id), c]));

    return assignments.map(a => ({
      ...a,
      complaint: complaintMap[String(a.complaint_id)] || null,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Soft delete
  // ─────────────────────────────────────────────────────────────────────────
  async deleteComplaint(complaintId: string) {
    const complaint = await this.complaintModel.findById(complaintId);
    if (!complaint || complaint.is_deleted) throw new NotFoundException('Complaint not found');

    if ([ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS].includes(complaint.status)) {
      throw new BadRequestException('Cannot delete a complaint that is currently in progress');
    }

    await this.complaintModel.findByIdAndUpdate(complaintId, { is_deleted: true });
    return { message: 'Complaint deleted' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary stats (for dashboard)
  // ─────────────────────────────────────────────────────────────────────────
  async getSummaryStats() {
    const stats = await this.complaintModel.aggregate([
      { $match: { is_deleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byPriority = await this.complaintModel.aggregate([
      { $match: { is_deleted: false, status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.ASSIGNED] } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    return {
      by_status: Object.fromEntries(stats.map(s => [s._id, s.count])),
      open_by_priority: Object.fromEntries(byPriority.map(s => [s._id, s.count])),
    };
  }
}
