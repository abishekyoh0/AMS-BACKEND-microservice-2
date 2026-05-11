import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingConfig, BillingConfigDocument } from '../schemas/billing-config.schema';
import { ResidentUnit, ResidentUnitDocument } from '../schemas/resident-unit.schema';
import { Bill, BillDocument } from '../schemas/bill.schema';
import { BillCounter, BillCounterDocument } from '../schemas/payment.schema';
import { BillStatus } from '../common/enums/payment.enum';
import {
  SetBillingConfigDto, RegisterResidentUnitDto,
  UpdateResidentUnitDto, AddExtraChargesDto, GenerateBillsDto,
} from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(BillingConfig.name) private configModel: Model<BillingConfigDocument>,
    @InjectModel(ResidentUnit.name)  private unitModel: Model<ResidentUnitDocument>,
    @InjectModel(Bill.name)          private billModel: Model<BillDocument>,
    @InjectModel(BillCounter.name)   private billCounterModel: Model<BillCounterDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-generate bill number: BILL-2025-05-00001
  // ─────────────────────────────────────────────────────────────────────────
  private async nextBillNumber(month: string): Promise<string> {
    const counter = await this.billCounterModel.findOneAndUpdate(
      { month },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return `BILL-${month}-${String(counter.seq).padStart(5, '0')}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Config
  // ─────────────────────────────────────────────────────────────────────────

  async setConfig(userId: string, dto: SetBillingConfigDto) {
    // Deactivate current config
    await this.configModel.updateMany({}, { is_active: false });

    const config = await this.configModel.create({
      ...dto,
      late_fee_percentage: dto.late_fee_percentage ?? 0,
      late_fee_fixed: dto.late_fee_fixed ?? 0,
      grace_period_days: dto.grace_period_days ?? 0,
      is_active: true,
      created_by: new Types.ObjectId(userId),
    });

    return config;
  }

  async getActiveConfig() {
    const config = await this.configModel.findOne({ is_active: true }).lean();
    if (!config) throw new NotFoundException('No billing config set yet. Please configure billing settings first.');
    return config;
  }

  async getConfigHistory() {
    return this.configModel.find().sort({ createdAt: -1 }).lean();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resident Unit Management
  // ─────────────────────────────────────────────────────────────────────────

  async registerUnit(userId: string, dto: RegisterResidentUnitDto) {
    const exists = await this.unitModel.findOne({
      resident_id: new Types.ObjectId(dto.resident_id),
    });
    if (exists) throw new BadRequestException('Resident unit already registered. Use update instead.');

    return this.unitModel.create({
      ...dto,
      resident_id: new Types.ObjectId(dto.resident_id),
      registered_by: new Types.ObjectId(userId),
    });
  }

  async updateUnit(residentId: string, dto: UpdateResidentUnitDto) {
    const unit = await this.unitModel.findOne({
      resident_id: new Types.ObjectId(residentId),
    });
    if (!unit) throw new NotFoundException('Resident unit not found');
    Object.assign(unit, dto);
    return unit.save();
  }

  async getUnit(residentId: string) {
    const unit = await this.unitModel.findOne({
      resident_id: new Types.ObjectId(residentId),
    }).lean();
    if (!unit) throw new NotFoundException('Resident unit not registered');
    return unit;
  }

  async getAllUnits() {
    return this.unitModel.find({ is_active: true }).sort({ block: 1, unit_number: 1 }).lean();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Bill Generation
  // Generates one bill per resident for the given month.
  // Idempotent — skips residents who already have a bill for the month.
  // ─────────────────────────────────────────────────────────────────────────

  async generateMonthlyBills(userId: string, dto: GenerateBillsDto) {
    const config = await this.getActiveConfig();
    const units = await this.unitModel.find({ is_active: true }).lean();

    if (!units.length) throw new BadRequestException('No resident units registered yet');

    const [year, month] = dto.billing_month.split('-').map(Number);
    const dueDate = new Date(year, month - 1, config.due_day_of_month);

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const unit of units) {
      // Skip if already generated
      const existing = await this.billModel.findOne({
        resident_id: unit.resident_id,
        billing_month: dto.billing_month,
      });
      if (existing) { results.skipped++; continue; }

      try {
        const maintenance_amount = unit.sq_ft * config.rate_per_sqft;
        const bill_number = await this.nextBillNumber(dto.billing_month);

        await this.billModel.create({
          bill_number,
          resident_id: unit.resident_id,
          resident_name: unit.resident_name,
          email: unit.email,
          mobile: unit.mobile,
          block: unit.block,
          floor: unit.floor,
          unit_number: unit.unit_number,
          billing_month: dto.billing_month,
          sq_ft: unit.sq_ft,
          rate_per_sqft: config.rate_per_sqft,
          maintenance_amount,
          extra_charges: [],
          extra_charges_total: 0,
          late_fee: 0,
          total_amount: maintenance_amount,
          amount_paid: 0,
          balance_due: maintenance_amount,
          due_date: dueDate,
          status: BillStatus.PENDING,
        });

        results.created++;
      } catch (e) {
        results.errors.push(`${unit.unit_number}: ${e.message}`);
      }
    }

    return {
      billing_month: dto.billing_month,
      rate_per_sqft: config.rate_per_sqft,
      due_date: dueDate,
      ...results,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Add extra charges to a specific bill (before due date)
  // ─────────────────────────────────────────────────────────────────────────

  async addExtraCharges(billId: string, dto: AddExtraChargesDto) {
    const bill = await this.billModel.findById(billId);
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status === BillStatus.PAID) throw new BadRequestException('Cannot modify a paid bill');

    const newTotal = dto.charges.reduce((sum, c) => sum + c.amount, 0);
    bill.extra_charges.push(...dto.charges);
    bill.extra_charges_total += newTotal;
    bill.total_amount += newTotal;
    bill.balance_due = bill.total_amount - bill.amount_paid;
    return bill.save();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Apply late fees to all overdue bills
  // Called by a scheduled job (or manually by accountant)
  // ─────────────────────────────────────────────────────────────────────────

  async applyLateFees() {
    const config = await this.getActiveConfig();
    const now = new Date();

    const graceCutoff = new Date(now);
    graceCutoff.setDate(graceCutoff.getDate() - (config.grace_period_days || 0));

    const overdueBills = await this.billModel.find({
      status: { $in: [BillStatus.PENDING, BillStatus.PARTIAL] },
      due_date: { $lt: graceCutoff },
      late_fee_applied: false,
    });

    let applied = 0;
    for (const bill of overdueBills) {
      const fee = config.late_fee_fixed > 0
        ? config.late_fee_fixed
        : Math.round(bill.maintenance_amount * (config.late_fee_percentage / 100));

      bill.late_fee = fee;
      bill.total_amount += fee;
      bill.balance_due = bill.total_amount - bill.amount_paid;
      bill.late_fee_applied = true;
      bill.status = BillStatus.OVERDUE;
      await bill.save();
      applied++;
    }

    return { message: `Late fees applied to ${applied} bills` };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Get bills (with filters)
  // ─────────────────────────────────────────────────────────────────────────

  async getBills(filter: any, forResidentId?: string) {
    const query: any = {};
    if (forResidentId) query.resident_id = new Types.ObjectId(forResidentId);
    if (filter.billing_month) query.billing_month = filter.billing_month;
    if (filter.status) query.status = filter.status;

    const page  = Number(filter.page)  || 1;
    const limit = Number(filter.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.billModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.billModel.countDocuments(query),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getBillById(billId: string) {
    const bill = await this.billModel.findById(billId).lean();
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Monthly collection summary (accountant dashboard)
  // ─────────────────────────────────────────────────────────────────────────

  async getMonthlyCollectionSummary(billing_month?: string) {
    const matchStage: any = {};
    if (billing_month) matchStage.billing_month = billing_month;

    const summary = await this.billModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$billing_month',
          total_billed:     { $sum: '$total_amount' },
          total_collected:  { $sum: '$amount_paid' },
          total_balance:    { $sum: '$balance_due' },
          count_paid:       { $sum: { $cond: [{ $eq: ['$status', BillStatus.PAID] }, 1, 0] } },
          count_pending:    { $sum: { $cond: [{ $eq: ['$status', BillStatus.PENDING] }, 1, 0] } },
          count_overdue:    { $sum: { $cond: [{ $eq: ['$status', BillStatus.OVERDUE] }, 1, 0] } },
          count_partial:    { $sum: { $cond: [{ $eq: ['$status', BillStatus.PARTIAL] }, 1, 0] } },
          total_late_fees:  { $sum: '$late_fee' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return summary;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Unpaid bills list (for reminder sending)
  // ─────────────────────────────────────────────────────────────────────────

  async getUnpaidBills(billing_month?: string) {
    const query: any = {
      status: { $in: [BillStatus.PENDING, BillStatus.OVERDUE, BillStatus.PARTIAL] },
    };
    if (billing_month) query.billing_month = billing_month;
    return this.billModel.find(query).sort({ status: 1, due_date: 1 }).lean();
  }
}
