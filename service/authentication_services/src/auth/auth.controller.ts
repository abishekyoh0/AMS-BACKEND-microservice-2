import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  SecurityLoginDto,
  MaintenanceLoginDto,
  AccountLoginDto,
  ResidentLoginDto,
  VerifyResidentOtpDto,
} from './dto/login.dto';

import { 
  ForgotPasswordDto, 
  VerifyResetOtpDto, 
  ResetPasswordDto,
  ChangePasswordDto 
} from './dto/passwordreset.dto';


import { CompleteResidentProfileDto } from './dto/complete-profile.dto';

/**
 * TCP Message Patterns — consumed by the API Gateway
 *
 * auth.login.admin              Panel 1 — super_admin, admin
 * auth.login.security           Panel 2 — admin_security, gatekeeper
 * auth.login.maintenance        Panel 3 — admin_maintenance
 * auth.login.account            Panel 4 — admin_account, accountant
 * auth.login.resident           Panel 5 — resident (OTP or password)
 * auth.resident.verify_otp      Step 2 of resident first-login
 * auth.resident.complete_profile Step 3 of resident first-login
 * auth.verify_token             JWT validation (called by gateway guard)
 * auth.today_schedule           Pre-login gate check for gatekeeper
 * auth.end_gate_session         Gatekeeper ends shift
 * auth.send_otp                 General OTP send
 * auth.verify_otp               General OTP verify
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.login.admin')
  loginAdmin(@Payload() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @MessagePattern('auth.login.security')
  loginSecurity(@Payload() dto: SecurityLoginDto) {
    return this.authService.loginSecurity(dto);
  }

  @MessagePattern('auth.login.maintenance')
  loginMaintenance(@Payload() dto: MaintenanceLoginDto) {
    return this.authService.loginMaintenance(dto);
  }

  @MessagePattern('auth.login.account')
  loginAccount(@Payload() dto: AccountLoginDto) {
    return this.authService.loginAccount(dto);
  }

  @MessagePattern('auth.login.resident')
  loginResident(@Payload() dto: ResidentLoginDto) {
    return this.authService.loginResident(dto);
  }

  @MessagePattern('auth.resident.verify_otp')
  verifyResidentOtp(@Payload() dto: VerifyResidentOtpDto) {
    return this.authService.verifyResidentOtp(dto);
  }

  @MessagePattern('auth.resident.complete_profile')
  completeResidentProfile(@Payload() data: { user_id: string; dto: CompleteResidentProfileDto }) {
    return this.authService.completeResidentProfile(data.user_id, data.dto);
  }

  @MessagePattern('auth.verify_token')
  verifyToken(@Payload() data: { token: string }) {
    return this.authService.verifyToken(data.token);
  }

  @MessagePattern('auth.today_schedule')
  getTodaySchedule(@Payload() data: { gatekeeper_id: string }) {
    return this.authService.getTodaySchedule(data.gatekeeper_id);
  }

  @MessagePattern('auth.end_gate_session')
  endGateSession(@Payload() data: { user_id: string }) {
    return this.authService.endGatekeeperSession(data.user_id);
  }

  @MessagePattern('auth.send_otp')
  sendOtp(@Payload() data: { user_id: string }) {
    return this.authService.sendOtp(data.user_id);
  }

  @MessagePattern('auth.verify_otp')
  verifyOtp(@Payload() data: { user_id: string; otp: string }) {
    return this.authService.verifyOtp(data.user_id, data.otp);
  }
  

  @MessagePattern('auth.forgot_password')
forgotPassword(@Payload() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto.email);
}

@MessagePattern('auth.verify_reset_otp')
verifyResetOtp(@Payload() dto: VerifyResetOtpDto) {
  return this.authService.verifyResetOtp(dto.email, dto.otp);
}

@MessagePattern('auth.reset_password')
resetPassword(@Payload() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.email, dto.otp, dto.new_password);
}

@MessagePattern('auth.change_password')
changePassword(@Payload() data: { user_id: string; dto: ChangePasswordDto }) {
  return this.authService.changePassword(data.user_id, data.dto.current_password, data.dto.new_password);
}

@MessagePattern('auth.test_email')
async testEmail(@Payload() data: { email: string }) {
  try {
    await this.authService.testEmailSending(data.email);
    return { success: true, message: 'Test email sent' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
}
