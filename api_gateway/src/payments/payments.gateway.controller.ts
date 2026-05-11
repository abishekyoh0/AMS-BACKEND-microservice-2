import { Body, Controller, Get, Inject, Param, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags, ApiOperation, ApiBody, ApiParam,
  ApiQuery, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import { Role } from '../common/enums/roles.enum';

/**
 * Payment HTTP Routes  (base: /api/payments)
 *
 * ── Billing Config (admin_account) ──────────────────────────────────────────
 * POST   /api/payments/config              Set rate per sqft + late fee rules
 * GET    /api/payments/config              Get current active config
 * GET    /api/payments/config/history      Config change history
 *
 * ── Resident Units (admin_account) ───────────────────────────────────────────
 * POST   /api/payments/units               Register resident unit + sq_ft
 * PUT    /api/payments/units/:residentId   Update sq_ft or block/floor
 * GET    /api/payments/units               List all resident units
 * GET    /api/payments/units/:residentId   Get one resident's unit
 *
 * ── Bills (admin_account / resident) ─────────────────────────────────────────
 * POST   /api/payments/bills/generate      Generate bills for a month
 * POST   /api/payments/bills/:id/extra-charges  Add extra charges to a bill
 * POST   /api/payments/bills/apply-late-fees    Apply overdue late fees
 * GET    /api/payments/bills               List bills (admin: all, resident: own)
 * GET    /api/payments/bills/unpaid        Unpaid bills list
 * GET    /api/payments/bills/summary       Monthly collection summary
 * GET    /api/payments/bills/:id           Single bill detail
 *
 * ── Payments (resident submits, accountant verifies) ─────────────────────────
 * POST   /api/payments/pay                 Resident submits UPI/Cash payment
 * POST   /api/payments/offline             Accountant records cash/cheque directly
 * PUT    /api/payments/verify/:id          Accountant verifies/rejects payment
 * GET    /api/payments/history             Payment history (role-filtered)
 * GET    /api/payments/pending             Accountant: payments awaiting verification
 *
 * ── Reminders (accountant) ────────────────────────────────────────────────────
 * POST   /api/payments/reminder/:billId    Send reminder for one bill
 * POST   /api/payments/reminder/bulk       Send reminders to all unpaid in a month
 *
 * ── Resident dashboard ────────────────────────────────────────────────────────
 * GET    /api/payments/my-bills            Resident: own bills + payment history
 */
@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsGatewayController {
  constructor(@Inject('PAYMENT_SERVICE') private readonly pay: ClientProxy) {}

  // ── Billing Config ────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Post('config')
  @ApiOperation({ summary: 'Set billing config — rate per sqft, due date, late fee' })
  @ApiBody({
    schema: {
      required: ['rate_per_sqft', 'due_day_of_month', 'effective_from'],
      properties: {
        rate_per_sqft:       { type: 'number', example: 2,        description: '₹ per sq ft. Bill = sq_ft × rate' },
        due_day_of_month:    { type: 'number', example: 5,        description: 'Day of month bill is due (1–28)' },
        late_fee_percentage: { type: 'number', example: 5,        description: '% of maintenance amount charged as late fee. Used if late_fee_fixed = 0.' },
        late_fee_fixed:      { type: 'number', example: 0,        description: 'Fixed ₹ late fee. Overrides percentage if > 0.' },
        grace_period_days:   { type: 'number', example: 3,        description: 'Days after due date before late fee kicks in' },
        effective_from:      { type: 'string', example: '2025-05', description: 'YYYY-MM' },
      },
    },
  })
  setConfig(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.pay.send('billing.set_config', { user_id: user._id || user.id, dto: body }));
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current active billing config' })
  getConfig() {
    return firstValueFrom(this.pay.send('billing.get_config', {}));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Get('config/history')
  @ApiOperation({ summary: 'Billing config change history' })
  configHistory() {
    return firstValueFrom(this.pay.send('billing.config_history', {}));
  }

  // ── Resident Units ────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_ACCOUNT, Role.ADMIN)
  @Post('units')
  @ApiOperation({
    summary: 'Register a resident unit with sq_ft for billing',
    description: 'Must be done for each resident before bills can be generated. sq_ft × rate_per_sqft = monthly maintenance charge.',
  })
  @ApiBody({
    schema: {
      required: ['resident_id', 'resident_name', 'email', 'unit_number', 'sq_ft'],
      properties: {
        resident_id:   { type: 'string', example: '665f...', description: 'User _id from auth service' },
        resident_name: { type: 'string', example: 'Sunita Sharma' },
        email:         { type: 'string', example: 'sunita@gmail.com' },
        mobile:        { type: 'string', example: '9876500005' },
        block:         { type: 'string', example: 'A' },
        floor:         { type: 'string', example: '3' },
        unit_number:   { type: 'string', example: '301' },
        sq_ft:         { type: 'number', example: 850, description: 'Square footage — determines monthly bill amount' },
      },
    },
  })
  registerUnit(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.pay.send('billing.register_unit', { user_id: user._id || user.id, dto: body }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ADMIN)
  @Put('units/:residentId')
  @ApiOperation({ summary: 'Update resident unit sq_ft or location' })
  @ApiParam({ name: 'residentId', description: 'Resident user _id' })
  updateUnit(@Param('residentId') residentId: string, @Body() body: any) {
    return firstValueFrom(this.pay.send('billing.update_unit', { resident_id: residentId, dto: body }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Get('units')
  @ApiOperation({ summary: 'List all registered resident units with sq_ft' })
  allUnits() {
    return firstValueFrom(this.pay.send('billing.all_units', {}));
  }

  @Get('units/:residentId')
  @ApiOperation({ summary: 'Get a specific resident unit details' })
  @ApiParam({ name: 'residentId' })
  getUnit(@Param('residentId') id: string) {
    return firstValueFrom(this.pay.send('billing.get_unit', { resident_id: id }));
  }

  // ── Bills ─────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Post('bills/generate')
  @ApiOperation({
    summary: 'Generate monthly bills for all registered residents',
    description: 'Creates one bill per resident for the given billing_month. Idempotent — skips any resident already billed for that month.',
  })
  @ApiBody({
    schema: {
      required: ['billing_month'],
      properties: {
        billing_month: { type: 'string', example: '2025-05', description: 'YYYY-MM' },
      },
    },
  })
  generateBills(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.pay.send('billing.generate_bills', { user_id: user._id || user.id, dto: body }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Post('bills/apply-late-fees')
  @ApiOperation({ summary: 'Apply late fees to all overdue bills (run after due date)' })
  applyLateFees() {
    return firstValueFrom(this.pay.send('billing.apply_late_fees', {}));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Get('bills/unpaid')
  @ApiOperation({ summary: 'List all unpaid/overdue bills' })
  @ApiQuery({ name: 'billing_month', required: false, example: '2025-05' })
  unpaidBills(@Query('billing_month') month?: string) {
    return firstValueFrom(this.pay.send('billing.unpaid_bills', { billing_month: month }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Get('bills/summary')
  @ApiOperation({ summary: 'Monthly collection summary — total billed, collected, pending, overdue' })
  @ApiQuery({ name: 'billing_month', required: false })
  monthlySummary(@Query('billing_month') month?: string) {
    return firstValueFrom(this.pay.send('billing.monthly_summary', { billing_month: month }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Get('bills')
  @ApiOperation({ summary: 'List bills with filters (accountant sees all)' })
  @ApiQuery({ name: 'billing_month', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Pending', 'Partial', 'Paid', 'Overdue'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listBills(@Query() query: any) {
    return firstValueFrom(this.pay.send('billing.get_bills', { filter: query }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Post('bills/:id/extra-charges')
  @ApiOperation({ summary: 'Add extra charges to a bill (e.g. event levy, repair cost)' })
  @ApiParam({ name: 'id', description: 'Bill _id' })
  @ApiBody({
    schema: {
      required: ['charges'],
      properties: {
        charges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string', example: 'Club house renovation levy' },
              amount:      { type: 'number', example: 500 },
            },
          },
        },
      },
    },
  })
  addExtraCharges(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.pay.send('billing.add_extra_charges', { bill_id: id, dto: body }));
  }

  @Get('bills/:id')
  @ApiOperation({ summary: 'Get full bill details' })
  @ApiParam({ name: 'id' })
  getBillById(@Param('id') id: string) {
    return firstValueFrom(this.pay.send('billing.get_bill_by_id', { bill_id: id }));
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  @Roles(Role.RESIDENT)
  @Post('pay')
  @ApiOperation({
    summary: 'Resident submits a payment (UPI or Cash)',
    description: `**UPI:** include transaction_id (required) + upi_id + proof_url (screenshot)\n**Cash/Cheque:** include cheque_number and bank_name if applicable\n\nPayment goes to Pending status. Accountant verifies before bill is updated.`,
  })
  @ApiBody({
    schema: {
      required: ['bill_id', 'payment_mode', 'amount', 'payment_date'],
      properties: {
        bill_id:        { type: 'string', example: '665f...' },
        payment_mode:   { type: 'string', enum: ['UPI', 'Cash', 'Cheque', 'Bank Transfer'] },
        amount:         { type: 'number', example: 1700 },
        payment_date:   { type: 'string', example: '2025-05-03', description: 'Date you paid (can be past date)' },
        payment_time:   { type: 'string', example: '14:30' },
        transaction_id: { type: 'string', example: 'TXN123456789', description: 'Required for UPI' },
        upi_id:         { type: 'string', example: 'sunita@okicici' },
        cheque_number:  { type: 'string', example: '004521' },
        bank_name:      { type: 'string', example: 'HDFC Bank' },
        proof_url:      { type: 'string', example: 'https://storage.ams.com/proof/abc.jpg' },
        resident_notes: { type: 'string', example: 'May 2025 maintenance' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Payment submitted. Awaiting accountant verification.' })
  submitPayment(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.pay.send('payments.submit', {
      user_id: user._id || user.id,
      user_name: user.full_name,
      dto: body,
    }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Post('offline')
  @ApiOperation({
    summary: 'Accountant records cash/cheque payment directly (auto-verified)',
    description: 'Used when resident pays in person. Accountant enters the details. Payment is auto-verified and bill updated immediately.',
  })
  @ApiBody({
    schema: {
      required: ['bill_id', 'payment_mode', 'amount', 'payment_date'],
      properties: {
        bill_id:      { type: 'string' },
        payment_mode: { type: 'string', enum: ['Cash', 'Cheque', 'Bank Transfer'] },
        amount:       { type: 'number', example: 1700 },
        payment_date: { type: 'string', example: '2025-05-03' },
        cheque_number: { type: 'string' },
        bank_name:    { type: 'string' },
        notes:        { type: 'string' },
      },
    },
  })
  recordOffline(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(this.pay.send('payments.record_offline', {
      user_id: user._id || user.id,
      user_name: user.full_name,
      dto: body,
    }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Put('verify/:paymentId')
  @ApiOperation({ summary: 'Verify or reject a pending payment submission' })
  @ApiParam({ name: 'paymentId' })
  @ApiBody({
    schema: {
      required: ['status'],
      properties: {
        status:           { type: 'string', enum: ['Verified', 'Rejected'] },
        rejection_reason: { type: 'string', description: 'Required when status = Rejected' },
      },
    },
  })
  verifyPayment(@CurrentUser() user: any, @Param('paymentId') id: string, @Body() body: any) {
    return firstValueFrom(this.pay.send('payments.verify', {
      payment_id: id,
      accountant_id: user._id || user.id,
      accountant_name: user.full_name,
      dto: body,
    }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Get('pending')
  @ApiOperation({ summary: 'List all payments awaiting accountant verification' })
  pendingVerifications() {
    return firstValueFrom(this.pay.send('payments.pending_verifications', {}));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT, Role.ADMIN)
  @Get('history')
  @ApiOperation({ summary: 'Payment history (accountant sees all, resident sees own via /my-bills)' })
  @ApiQuery({ name: 'billing_month', required: false })
  @ApiQuery({ name: 'payment_mode', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  paymentHistory(@Query() query: any) {
    return firstValueFrom(this.pay.send('payments.history', { filter: query }));
  }

  // ── Reminders ─────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Post('reminder/:billId')
  @ApiOperation({ summary: 'Send reminder for a single unpaid bill' })
  @ApiParam({ name: 'billId' })
  sendReminder(@CurrentUser() user: any, @Param('billId') billId: string) {
    return firstValueFrom(this.pay.send('payments.send_reminder', {
      bill_id: billId,
      user_id: user._id || user.id,
      user_name: user.full_name,
    }));
  }

  @Roles(Role.ADMIN_ACCOUNT, Role.ACCOUNTANT)
  @Post('reminder/bulk')
  @ApiOperation({ summary: 'Send reminders to ALL unpaid residents for a billing month' })
  @ApiBody({
    schema: {
      required: ['billing_month'],
      properties: { billing_month: { type: 'string', example: '2025-05' } },
    },
  })
  sendBulkReminders(@CurrentUser() user: any, @Body() body: { billing_month: string }) {
    return firstValueFrom(this.pay.send('payments.bulk_reminders', {
      billing_month: body.billing_month,
      user_id: user._id || user.id,
      user_name: user.full_name,
    }));
  }

  // ── Resident dashboard ────────────────────────────────────────────────────

  @Roles(Role.RESIDENT)
  @Get('my-bills')
  @ApiOperation({ summary: 'Resident: view all own bills with payment history' })
  @ApiQuery({ name: 'billing_month', required: false, description: 'Filter by YYYY-MM' })
  getMyBills(@CurrentUser() user: any, @Query('billing_month') month?: string) {
    return firstValueFrom(this.pay.send('payments.resident_bill_status', {
      resident_id: user._id || user.id,
      billing_month: month,
    }));
  }
}
