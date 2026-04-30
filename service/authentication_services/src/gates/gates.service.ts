import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Gate, GateDocument, GateSchedule, GateScheduleDocument, GatekeeperSession, GatekeeperSessionDocument } from '../schemas/gate.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Role } from '../common/enums/roles.enum';
import { GateStatus, SessionStatus } from '../common/enums/status.enum';

@Injectable()
export class GatesService {
  constructor(
    @InjectModel(Gate.name)    private gateModel: Model<GateDocument>,
    @InjectModel(GateSchedule.name) private scheduleModel: Model<GateScheduleDocument>,
    @InjectModel(GatekeeperSession.name) private sessionModel: Model<GatekeeperSessionDocument>,
    @InjectModel(User.name)    private userModel: Model<UserDocument>,
  ) {}

  // ── Gates ─────────────────────────────────────────────────────────────────

  async createGate(creatorId: string, creatorRole: Role, dto: any) {
    if (![Role.SUPER_ADMIN, Role.ADMIN].includes(creatorRole)) {
      throw new ForbiddenException('Only ADMIN can create gates');
    }
    const exists = await this.gateModel.findOne({ gate_name: dto.gate_name });
    if (exists) throw new BadRequestException('Gate name already exists');
    return this.gateModel.create({ ...dto, created_by: new Types.ObjectId(creatorId) });
  }

  async getAllGates() {
    return this.gateModel.find().sort({ gate_name: 1 }).lean();
  }

  async getGateById(id: string) {
    const gate = await this.gateModel.findById(id).lean();
    if (!gate) throw new NotFoundException('Gate not found');
    return gate;
  }

  async updateGateStatus(id: string, status: GateStatus) {
    await this.gateModel.findByIdAndUpdate(id, { status });
    return { message: `Gate status updated to ${status}` };
  }

  // ── Schedules ─────────────────────────────────────────────────────────────

  async createSchedule(creatorId: string, creatorRole: Role, dto: any) {
    if (![Role.ADMIN_SECURITY, Role.ADMIN, Role.SUPER_ADMIN].includes(creatorRole)) {
      throw new ForbiddenException('Only ADMIN_SECURITY can manage schedules');
    }
    if (!dto.day_of_week && !dto.specific_date) {
      throw new BadRequestException('Provide day_of_week or specific_date');
    }
    const gk = await this.userModel.findById(dto.gatekeeper_id);
    if (!gk || gk.role !== Role.GATEKEEPER) {
      throw new BadRequestException('Invalid gatekeeper ID');
    }
    return this.scheduleModel.create({
      gatekeeper: new Types.ObjectId(dto.gatekeeper_id),
      gate: new Types.ObjectId(dto.gate_id),
      shift_start: dto.shift_start,
      shift_end: dto.shift_end,
      shift_name: dto.shift_name,
      day_of_week: dto.day_of_week,
      specific_date: dto.specific_date,
      notes: dto.notes,
      created_by: new Types.ObjectId(creatorId),
    });
  }

  async getSchedulesByGatekeeper(gatekeeperId: string) {
    return this.scheduleModel
      .find({ gatekeeper: new Types.ObjectId(gatekeeperId), is_active: true })
      .populate('gate', 'gate_name location')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAllSchedules(creatorId: string, creatorRole: Role) {
    const query: any = { is_active: true };
    if (creatorRole === Role.ADMIN_SECURITY) query.created_by = new Types.ObjectId(creatorId);
    return this.scheduleModel
      .find(query)
      .populate('gate', 'gate_name location')
      .populate('gatekeeper', 'full_name email mobile')
      .lean();
  }

  async updateSchedule(id: string, dto: any) {
    await this.scheduleModel.findByIdAndUpdate(id, dto);
    return { message: 'Schedule updated' };
  }

  async deleteSchedule(id: string) {
    await this.scheduleModel.findByIdAndUpdate(id, { is_active: false });
    return { message: 'Schedule deactivated' };
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  async getActiveSessions() {
    return this.sessionModel
      .find({ status: SessionStatus.ACTIVE })
      .populate('gatekeeper', 'full_name email mobile')
      .populate('gate', 'gate_name location')
      .lean();
  }

  async getSessionsByGatekeeper(gatekeeperId: string, limit = 30) {
    return this.sessionModel
      .find({ gatekeeper: new Types.ObjectId(gatekeeperId) })
      .populate('gate', 'gate_name location')
      .sort({ session_date: -1 })
      .limit(limit)
      .lean();
  }

  async getSessionsByDate(date: string) {
    return this.sessionModel
      .find({ session_date: date })
      .populate('gatekeeper', 'full_name email mobile')
      .populate('gate', 'gate_name location')
      .lean();
  }
}
