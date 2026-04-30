import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags, ApiOperation, ApiBody, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';
import { Public, Roles, CurrentUser } from './auth.decorators';
import { Role } from '../common/enums/roles.enum';
import {
  AdminLoginBody, SecurityLoginBody, MaintenanceLoginBody,
  AccountLoginBody, ResidentLoginBody, VerifyOtpBody, CompleteProfileBody,
} from '../common/swagger/api-bodies.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthGatewayController {
  constructor(@Inject('AUTH_SERVICE') private readonly auth: ClientProxy) {}

  // ── Panel 1: Admin ───────────────────────────────────────────────────────

  @Public()
  @Post('login/admin')
  @ApiOperation({ summary: 'Admin panel login', description: 'For roles: super_admin, admin' })
  @ApiBody({ type: AdminLoginBody })
  @ApiResponse({ status: 200, description: 'Returns access_token + user' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Wrong panel — role not allowed here' })
  loginAdmin(@Body() body: { email: string; password: string }) {
    return firstValueFrom(this.auth.send('auth.login.admin', body));
  }

  // ── Panel 2: Security ────────────────────────────────────────────────────

  @Public()
  @Post('login/security')
  @ApiOperation({
    summary: 'Security panel login',
    description: 'For roles: admin_security (email+pw only), gatekeeper (email+pw+gate_id required)',
  })
  @ApiBody({ type: SecurityLoginBody })
  @ApiResponse({ status: 200, description: 'Returns access_token + user. Gatekeeper also gets gate_session.' })
  @ApiResponse({ status: 200, description: 'If gatekeeper omits gate_id, returns { requires_gate_selection, available_gates }' })
  loginSecurity(@Body() body: { email: string; password: string; gate_id?: string }) {
    return firstValueFrom(this.auth.send('auth.login.security', body));
  }

  // ── Panel 3: Maintenance ─────────────────────────────────────────────────

  @Public()
  @Post('login/maintenance')
  @ApiOperation({ summary: 'Maintenance panel login', description: 'For role: admin_maintenance' })
  @ApiBody({ type: MaintenanceLoginBody })
  @ApiResponse({ status: 200, description: 'Returns access_token + user' })
  loginMaintenance(@Body() body: { email: string; password: string }) {
    return firstValueFrom(this.auth.send('auth.login.maintenance', body));
  }

  // ── Panel 4: Account ─────────────────────────────────────────────────────

  @Public()
  @Post('login/account')
  @ApiOperation({ summary: 'Account panel login', description: 'For roles: admin_account, accountant' })
  @ApiBody({ type: AccountLoginBody })
  @ApiResponse({ status: 200, description: 'Returns access_token + user' })
  loginAccount(@Body() body: { email: string; password: string }) {
    return firstValueFrom(this.auth.send('auth.login.account', body));
  }

  // ── Panel 5: Resident ─────────────────────────────────────────────────────
  // First login (no password) → OTP flow
  // Later logins (with password) → normal token

  @Public()
  @Post('login/resident')
  @ApiOperation({
    summary: 'Resident panel login',
    description: `Two modes:\n
    **First ever login** — send only { email }. System detects is_first_login=true, sends OTP, returns { requires_otp: true, user_id }.\n
    **Subsequent login** — send { email, password }. Returns access_token normally.`,
  })
  @ApiBody({ type: ResidentLoginBody })
  @ApiResponse({ status: 200, description: 'access_token OR { requires_otp: true, user_id }' })
  loginResident(@Body() body: { email: string; password?: string }) {
    return firstValueFrom(this.auth.send('auth.login.resident', body));
  }

  // ── Resident OTP verify (step 2 of first-login) ───────────────────────────

  @Public()
  @Post('resident/verify-otp')
  @ApiOperation({
    summary: 'Verify OTP — resident first-login step 2',
    description: 'Submit the OTP received by email/SMS. Returns a temp_token to use for completing profile.',
  })
  @ApiBody({ type: VerifyOtpBody })
  @ApiResponse({ status: 200, description: '{ requires_profile: true, temp_token }' })
  verifyResidentOtp(@Body() body: { user_id: string; otp: string }) {
    return firstValueFrom(this.auth.send('auth.resident.verify_otp', body));
  }

  // ── Resident complete profile (step 3 of first-login) ────────────────────
  // Uses the temp_token from step 2 as Bearer

  @ApiBearerAuth()
  @Post('resident/complete-profile')
  @ApiOperation({
    summary: 'Complete move-in profile — resident first-login step 3',
    description: 'Resident fills move-in form and sets their password. Uses the temp_token from verify-otp as Bearer. Activates the account.',
  })
  @ApiBody({ type: CompleteProfileBody })
  @ApiResponse({ status: 200, description: 'Account activated. Returns final access_token.' })
  completeResidentProfile(@CurrentUser() user: any, @Body() body: any) {
    return firstValueFrom(
      this.auth.send('auth.resident.complete_profile', {
        user_id: user._id || user.id,
        dto: body,
      }),
    );
  }

  // ── Pre-login gate schedule (public) ─────────────────────────────────────

  @Public()
  @Get('today-schedule/:gatekeeperId')
  @ApiOperation({
    summary: "Get gatekeeper's gate schedule for today",
    description: "Call before security login to pre-fill gate dropdown. Returns scheduled gate or list of all available gates.",
  })
  @ApiParam({ name: 'gatekeeperId', description: 'MongoDB _id of the gatekeeper' })
  @ApiResponse({ status: 200, description: '{ scheduled: true, gate, shift_start, shift_end } OR { scheduled: false, available_gates }' })
  getTodaySchedule(@Param('gatekeeperId') id: string) {
    return firstValueFrom(this.auth.send('auth.today_schedule', { gatekeeper_id: id }));
  }

  // ── Current user ──────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  // ── OTP (general) ─────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to current user (for profile updates etc.)' })
  sendOtp(@CurrentUser() user: any) {
    return firstValueFrom(this.auth.send('auth.send_otp', { user_id: user._id || user.id }));
  }

  @ApiBearerAuth()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP (general)' })
  verifyOtp(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return firstValueFrom(
      this.auth.send('auth.verify_otp', { user_id: user._id || user.id, otp: body.otp }),
    );
  }

  // ── Gatekeeper end shift ──────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.GATEKEEPER)
  @Post('gate-session/end')
  @ApiOperation({ summary: 'End gatekeeper shift session' })
  endGateSession(@CurrentUser() user: any) {
    return firstValueFrom(
      this.auth.send('auth.end_gate_session', { user_id: user._id || user.id }),
    );
  }
}
