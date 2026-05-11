import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @MessagePattern('billing.set_config')
  setConfig(@Payload() d: any) { return this.service.setConfig(d.user_id, d.dto); }

  @MessagePattern('billing.get_config')
  getConfig() { return this.service.getActiveConfig(); }

  @MessagePattern('billing.config_history')
  configHistory() { return this.service.getConfigHistory(); }

  @MessagePattern('billing.register_unit')
  registerUnit(@Payload() d: any) { return this.service.registerUnit(d.user_id, d.dto); }

  @MessagePattern('billing.update_unit')
  updateUnit(@Payload() d: any) { return this.service.updateUnit(d.resident_id, d.dto); }

  @MessagePattern('billing.get_unit')
  getUnit(@Payload() d: any) { return this.service.getUnit(d.resident_id); }

  @MessagePattern('billing.all_units')
  allUnits() { return this.service.getAllUnits(); }

  @MessagePattern('billing.generate_bills')
  generateBills(@Payload() d: any) { return this.service.generateMonthlyBills(d.user_id, d.dto); }

  @MessagePattern('billing.add_extra_charges')
  addExtraCharges(@Payload() d: any) { return this.service.addExtraCharges(d.bill_id, d.dto); }

  @MessagePattern('billing.apply_late_fees')
  applyLateFees() { return this.service.applyLateFees(); }

  @MessagePattern('billing.get_bills')
  getBills(@Payload() d: any) { return this.service.getBills(d.filter, d.resident_id); }

  @MessagePattern('billing.get_bill_by_id')
  getBillById(@Payload() d: any) { return this.service.getBillById(d.bill_id); }

  @MessagePattern('billing.monthly_summary')
  monthlySummary(@Payload() d: any) { return this.service.getMonthlyCollectionSummary(d.billing_month); }

  @MessagePattern('billing.unpaid_bills')
  unpaidBills(@Payload() d: any) { return this.service.getUnpaidBills(d.billing_month); }
}
