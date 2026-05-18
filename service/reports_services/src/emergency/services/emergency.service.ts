import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Emergency, EmergencyDocument } from '../schema/emergency.schema';
import { ReportStatus, ReportStatusDocument, ReportStatusEnum } from '../../schemas/report-status.schema';
import { CreateEmergencyDto } from '../dto/create-emergency.dto';
import { UpdateEmergencyDto } from '../dto/update-emergency.dto';
import { KafkaService } from '../kafka/kafka.service';
import { EmergencyEvent } from '../../common/enums/emergency.enum';
import { EmergencyGateway } from '../emergency.gateway';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectModel(Emergency.name)
    private readonly emergencyModel: Model<EmergencyDocument>,

    @InjectModel(ReportStatus.name)
    private readonly reportStatusModel: Model<ReportStatusDocument>,

    private readonly kafkaService: KafkaService,
    private readonly gateway: EmergencyGateway,
  ) {}

  async create(dto: CreateEmergencyDto) {
    const count = await this.emergencyModel.countDocuments();

    let prefix = 'ALT';
    if (dto.type?.toLowerCase().includes('fire'))    prefix = 'FIRE';
    else if (dto.type?.toLowerCase().includes('medical')) prefix = 'MED';
    else if (dto.type?.toLowerCase().includes('power'))   prefix = 'PWR';
    else if (dto.type?.toLowerCase().includes('water'))   prefix = 'WTR';

    const alertId = `${prefix}${String(count + 1).padStart(3, '0')}`;
    const time = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const emergency = await new this.emergencyModel({
      ...dto,
      alertId,
      time,
      acknowledged: 0,
      status: 'Active',
    }).save();

    await this.kafkaService.sendEvent(EmergencyEvent.CREATED, {
      emergencyId: emergency._id,
      alertId,
      type: emergency.type,
      priority: emergency.priority,
      location: emergency.location,
      raisedBy: emergency.raisedById,
      message: emergency.message,
      sendTo: emergency.sendTo,
      time,
    });

    this.gateway.broadcastEmergencyCreated(emergency.toObject());

    return emergency;
  }

  async findAll() {
    return this.emergencyModel.find().sort({ createdAt: -1 });
  }

  async getActive() {
    return this.emergencyModel.find({ status: 'Active' }).sort({ createdAt: -1 });
  }

  async getHistory() {
    return this.emergencyModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const emergency = await this.emergencyModel.findById(id);
    if (!emergency) throw new NotFoundException(`Emergency ${id} not found`);
    return emergency;
  }

  async update(id: string, dto: UpdateEmergencyDto) {
    const updated = await this.emergencyModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException(`Emergency ${id} not found`);
    return updated;
  }

  async remove(id: string) {
    const removed = await this.emergencyModel.findByIdAndDelete(id);
    if (!removed) throw new NotFoundException(`Emergency ${id} not found`);
    return { message: 'Emergency deleted', id };
  }

  async resolveEmergency(id: string) {
    const emergency = await this.emergencyModel.findByIdAndUpdate(
      id,
      { status: 'Resolved' },
      { new: true },
    );
    if (!emergency) throw new NotFoundException(`Emergency ${id} not found`);

    const resolvedAt = new Date();

    await this.kafkaService.sendEvent(EmergencyEvent.RESOLVED, {
      emergencyId: id,
      alertId: emergency.alertId,
      type: emergency.type,
      resolvedAt: resolvedAt.toISOString(),
    });

    this.gateway.broadcastEmergencyResolved(id, resolvedAt);

    return emergency;
  }

  async acknowledge(id: string) {
    const emergency = await this.emergencyModel.findByIdAndUpdate(
      id,
      { $inc: { acknowledged: 1 } },
      { new: true },
    );
    if (!emergency) throw new NotFoundException(`Emergency ${id} not found`);

    this.gateway.broadcastAcknowledgement(id, emergency.acknowledged);

    await this.kafkaService.sendEvent(EmergencyEvent.ACKNOWLEDGED, {
      emergencyId: id,
      alertId: emergency.alertId,
      acknowledged: emergency.acknowledged,
    });

    return emergency;
  }

  async getStats() {
    const [total, active, resolved, highPriority] = await Promise.all([
      this.emergencyModel.countDocuments(),
      this.emergencyModel.countDocuments({ status: 'Active' }),
      this.emergencyModel.countDocuments({ status: 'Resolved' }),
      this.emergencyModel.countDocuments({ priority: 'High', status: 'Active' }),
    ]);

    return { total, active, resolved, highPriority };
  }


  async requestExcelReport(
    type: 'ALL' | 'SINGLE',
    emergencyId?: string,
    requestedBy?: string,
  ) {
    const reportId = `report-${Date.now()}-${uuidv4().slice(0, 8)}`;

    await this.reportStatusModel.create({
      reportId,
      status: ReportStatusEnum.PENDING,
      reportType: type,
      emergencyId,
      requestedBy,
    });

    await this.kafkaService.sendEvent(EmergencyEvent.REPORT_REQUESTED, {
      reportId,
      type,
      emergencyId,
    });

    return { message: 'Report generation started', reportId };
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatusEnum,
    downloadUrl?: string,
    errorMessage?: string,
  ) {
    await this.reportStatusModel.findOneAndUpdate(
      { reportId },
      { status, downloadUrl, errorMessage },
      { new: true },
    );

    this.gateway.broadcastReportStatus(reportId, status, downloadUrl);
  }

  async getReportStatus(reportId: string) {
    const record = await this.reportStatusModel.findOne({ reportId });
    if (!record) throw new NotFoundException(`Report ${reportId} not found`);
    return record;
  }

  async getReportHistory(requestedBy?: string) {
    const query = requestedBy ? { requestedBy } : {};
    return this.reportStatusModel.find(query).sort({ createdAt: -1 }).limit(50);
  }
}