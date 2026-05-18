import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

import { User, UserDocument } from '../schemas/user.schema';
import { Gate, GateDocument, GateSchedule, GateScheduleDocument, GatekeeperSession, GatekeeperSessionDocument } from '../schemas/gate.schema';
import { ResidentProfile, ResidentProfileDocument } from '../schemas/resident-profile.schema';

import { Role } from '../common/enums/roles.enum';
import { UserStatus, SessionStatus, GateStatus, ShiftDay } from '../common/enums/status.enum';

import {
  AdminLoginDto,
  SecurityLoginDto,
  MaintenanceLoginDto,
  AccountLoginDto,
  ResidentLoginDto,
  VerifyResidentOtpDto,
} from './dto/login.dto';
import { CompleteResidentProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  private transporter!: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Gate.name) private gateModel: Model<GateDocument>,
    @InjectModel(GateSchedule.name) private scheduleModel: Model<GateScheduleDocument>,
    @InjectModel(GatekeeperSession.name) private sessionModel: Model<GatekeeperSessionDocument>,
    @InjectModel(ResidentProfile.name) private profileModel: Model<ResidentProfileDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Initialize email transporter if SMTP config exists
    if (this.configService.get('SMTP_HOST')) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
      });
      console.log('📧 Email service initialized');
    } else {
      console.log('📧 Email service disabled (SMTP not configured) - OTPs will be logged to console');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PANEL 1 — Admin login
  // Roles: super_admin, admin
  // ─────────────────────────────────────────────────────────────────────────

  async loginAdmin(dto: AdminLoginDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const allowed = [Role.SUPER_ADMIN, Role.ADMIN];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('This login is for admin panel only');
    }

    await this.checkActive(user);
    await this.checkPassword(dto.password, user.password);
    await this.stampLogin(user._id);

    return { access_token: this.sign(user), user: this.safe(user) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PANEL 2 — Security login
  // admin_security  → email + password (no gate required)
  // gatekeeper      → email + password + gate_id (required)
  // ─────────────────────────────────────────────────────────────────────────

  async loginSecurity(dto: SecurityLoginDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const allowed = [Role.ADMIN_SECURITY, Role.GATEKEEPER];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('This login is for the security panel only');
    }

    await this.checkActive(user);
    await this.checkPassword(dto.password, user.password);

    // admin_security: simple login, no gate session
    if (user.role === Role.ADMIN_SECURITY) {
      await this.stampLogin(user._id);
      return { access_token: this.sign(user), user: this.safe(user) };
    }

    // gatekeeper: gate_id is mandatory 
    if (!dto.gate_id) {
      const gates = await this.gateModel.find({ status: GateStatus.ACTIVE }).select('gate_name location').lean();
      return {
        requires_gate_selection: true,
        available_gates: gates,
        message: 'Select your assigned gate to continue',
      };
    }

    const gate = await this.gateModel.findById(dto.gate_id).lean();
    if (!gate) throw new BadRequestException('Invalid gate selected');

    const today = this.todayStr();

    // Resume existing active session
    const existing = await this.sessionModel
      .findOne({ gatekeeper: user._id, session_date: today, status: SessionStatus.ACTIVE })
      .populate('gate', 'gate_name location')
      .lean();

    if (existing) {
      await this.stampLogin(user._id);
      return {
        access_token: this.sign(user),
        user: this.safe(user),
        gate_session: {
          session_id: existing._id,
          gate: existing.gate,
          login_time: (existing as any).login_time,
          status: 'resumed',
        },
      };
    }

    // Check today's schedule
    const schedule = await this.findTodaySchedule(String(user._id));
    const isScheduled =
      schedule?.scheduled && String((schedule.gate as any)?._id) === dto.gate_id;

    const session = await this.sessionModel.create({
      gatekeeper: user._id,
      gate: new Types.ObjectId(dto.gate_id),
      schedule: schedule?.schedule_id ? new Types.ObjectId(schedule.schedule_id) : undefined,
      session_date: today,
      login_time: new Date(),
      status: SessionStatus.ACTIVE,
      notes: isScheduled ? 'Per schedule' : 'Manual selection',
    });

    await this.stampLogin(user._id);

    return {
      access_token: this.sign(user),
      user: this.safe(user),
      gate_session: {
        session_id: session._id,
        gate: { _id: gate._id, gate_name: (gate as any).gate_name, location: (gate as any).location },
        login_time: session.login_time,
        status: 'started',
        scheduled: isScheduled,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PANEL 3 — Maintenance login
  // Role: admin_maintenance
  // ─────────────────────────────────────────────────────────────────────────

  async loginMaintenance(dto: MaintenanceLoginDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (user.role !== Role.ADMIN_MAINTENANCE) {
      throw new ForbiddenException('This login is for the maintenance panel only');
    }

    await this.checkActive(user);
    await this.checkPassword(dto.password, user.password);
    await this.stampLogin(user._id);

    return { access_token: this.sign(user), user: this.safe(user) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PANEL 4 — Account login
  // Roles: admin_account, accountant
  // ─────────────────────────────────────────────────────────────────────────

  async loginAccount(dto: AccountLoginDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const allowed = [Role.ADMIN_ACCOUNT, Role.ACCOUNTANT];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('This login is for the accounts panel only');
    }

    await this.checkActive(user);
    await this.checkPassword(dto.password, user.password);
    await this.stampLogin(user._id);

    return { access_token: this.sign(user), user: this.safe(user) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PANEL 5 — Resident login (3 states)
  //
  //  State A: first login — password omitted
  //    → send OTP, return { requires_otp: true, user_id }
  //
  //  State B: subsequent login — email + password
  //    → normal token response
  // ─────────────────────────────────────────────────────────────────────────

  async loginResident(dto: ResidentLoginDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (user.role !== Role.RESIDENT) {
      throw new ForbiddenException('This login is for the resident panel only');
    }

    // ── State A: first login (no password provided OR is_first_login flag) ──
    if (!dto.password || user.is_first_login) {
      if (user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Account is deactivated. Contact admin');
      }

      await this.sendOtpInternal(String(user._id));

      return {
        requires_otp: true,
        user_id: String(user._id),
        message: 'OTP sent to your registered email / mobile',
      };
    }

    // ── State B: subsequent login ────────────────────────────────────────────
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException('Account pending admin approval');
    }
    await this.checkActive(user);
    await this.checkPassword(dto.password, user.password);
    await this.stampLogin(user._id);

    return { access_token: this.sign(user), user: this.safe(user) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resident OTP verify — step 2 of first-login flow
  // Returns a short-lived temp token for completing the profile
  // ─────────────────────────────────────────────────────────────────────────

  async verifyResidentOtp(dto: VerifyResidentOtpDto) {
    const user = await this.userModel
      .findById(dto.user_id)
      .select('+otp +otp_expires_at')
      .lean<any>();

    if (!user) throw new BadRequestException('User not found');
    if (user.role !== Role.RESIDENT) throw new ForbiddenException('Not a resident account');
    if (!user.otp || user.otp !== dto.otp) throw new BadRequestException('Invalid OTP');
    if (new Date() > user.otp_expires_at) throw new BadRequestException('OTP has expired. Request a new one');

    await this.userModel.findByIdAndUpdate(dto.user_id, {
      is_verified: true,
      otp: null,
      otp_expires_at: null,
    });

    // Short-lived temp token (1 hour) scoped only to complete-profile
    const temp_token = this.jwtService.sign(
      { sub: String(user._id), role: user.role, scope: 'complete_profile' },
      { expiresIn: '1h' },
    );

    return {
      requires_profile: true,
      temp_token,
      message: 'OTP verified. Please complete your move-in profile to activate your account.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resident complete profile — step 3 of first-login flow
  // Requires the temp_token from step 2
  // Sets password, fills move-in form, activates account
  // ─────────────────────────────────────────────────────────────────────────

  async completeResidentProfile(userId: string, dto: CompleteResidentProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.role !== Role.RESIDENT) throw new ForbiddenException('Only residents can complete a move-in profile');
    if (!user.is_first_login) throw new BadRequestException('Profile already completed');

    // Hash and set password
    const hashed = await bcrypt.hash(dto.password, 10);

    await this.userModel.findByIdAndUpdate(userId, {
      password: hashed,
      status: UserStatus.ACTIVE,
      is_first_login: false,
      profile_completed: true,
    });

    // Upsert resident profile with all move-in form data
    const { password: _pw, ...profileFields } = dto;

    await this.profileModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      {
        $set: {
          resident_type: profileFields.resident_type,
          id_proof_type: profileFields.id_proof_type,
          id_proof_number: profileFields.id_proof_number,
          id_proof_url: profileFields.id_proof_url,
          address_proof_url: profileFields.address_proof_url,
          permanent_address: profileFields.permanent_address,
          emergency_contact_name: profileFields.emergency_contact_name,
          emergency_contact_relation: profileFields.emergency_contact_relation,
          emergency_contact_mobile: profileFields.emergency_contact_mobile,
          move_in_date: profileFields.move_in_date,
          vehicle_number: profileFields.vehicle_number,
          vehicle_type: profileFields.vehicle_type,
          vehicle_model: profileFields.vehicle_model,
          vehicle_color: profileFields.vehicle_color,
          family_members: profileFields.family_members || [],
        },
      },
      { upsert: true, new: true },
    );

    // Issue full access token
    const updatedUser = await this.userModel.findById(userId).lean();
    return {
      access_token: this.sign(updatedUser),
      user: this.safe(updatedUser),
      message: 'Profile completed. Welcome!',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Today's gate schedule (called before security login)
  // ─────────────────────────────────────────────────────────────────────────

  async getTodaySchedule(gatekeeperId: string) {
    const result = await this.findTodaySchedule(gatekeeperId);
    if (!result?.scheduled) {
      const gates = await this.gateModel.find({ status: GateStatus.ACTIVE }).select('gate_name location').lean();
      return { scheduled: false, available_gates: gates };
    }
    return result;
  }

  private async findTodaySchedule(gatekeeperId: string) {
    const today = this.todayStr();
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const schedule = await this.scheduleModel
      .findOne({
        gatekeeper: new Types.ObjectId(gatekeeperId),
        is_active: true,
        $or: [
          { specific_date: today },
          { day_of_week: dayName as ShiftDay }  // Cast to ShiftDay enum
        ],
      })
      .sort({ specific_date: -1 })
      .populate('gate', 'gate_name location status')
      .lean();

    if (!schedule) return { scheduled: false };
    return {
      scheduled: true,
      schedule_id: schedule._id,
      gate: schedule.gate,
      shift_start: (schedule as any).shift_start,
      shift_end: (schedule as any).shift_end,
      shift_name: (schedule as any).shift_name,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // End gatekeeper session
  // ─────────────────────────────────────────────────────────────────────────

  async endGatekeeperSession(userId: string) {
    const session = await this.sessionModel.findOneAndUpdate(
      { gatekeeper: new Types.ObjectId(userId), session_date: this.todayStr(), status: SessionStatus.ACTIVE },
      { logout_time: new Date(), status: SessionStatus.ENDED },
      { new: true },
    );
    if (!session) throw new BadRequestException('No active session found for today');
    return { message: 'Session ended', session_id: session._id };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Token verify (called by API Gateway guard on every request)
  // ─────────────────────────────────────────────────────────────────────────

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userModel
        .findById(payload.sub)
        .select('full_name email mobile role status is_first_login profile_completed')
        .lean();
      if (!user || user.status !== UserStatus.ACTIVE) return { valid: false, user: null };
      return { valid: true, user: { ...user, id: String((user as any)._id) } };
    } catch {
      return { valid: false, user: null };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTP (general — for profile updates, etc.)
  // ─────────────────────────────────────────────────────────────────────────

  async sendOtp(userId: string) {
    await this.sendOtpInternal(userId);
    return { message: 'OTP sent', expires_in: '10 minutes' };
  }

  async verifyOtp(userId: string, otp: string) {
    const user = await this.userModel.findById(userId).select('+otp +otp_expires_at').lean<any>();
    if (!user || user.otp !== otp) throw new BadRequestException('Invalid OTP');
    if (new Date() > user.otp_expires_at) throw new BadRequestException('OTP expired');
    await this.userModel.findByIdAndUpdate(userId, { is_verified: true, otp: null, otp_expires_at: null });
    return { message: 'OTP verified' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORD RESET FLOW
  // ─────────────────────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists
      return { message: 'If your email is registered, you will receive an OTP' };
    }

    // Don't allow password reset for pending/inactive users
    if (user.status === UserStatus.PENDING) {
      throw new BadRequestException('Account pending approval. Please contact admin.');
    }
    if (user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is deactivated. Contact admin.');
    }

    // Generate and send OTP
    await this.generateAndSendOtp(user._id, user.email, user.full_name, 'reset');

    return {
      message: 'OTP sent to your registered email',
      expires_in: '10 minutes',
    };
  }

  async verifyResetOtp(email: string, otp: string) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+otp +otp_expires_at')
      .lean<any>();

    if (!user) throw new BadRequestException('Invalid request');

    // Check if OTP exists and is valid
    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }
    await this.userModel.findByIdAndUpdate(user._id, {
      otp: null,
      otp_expires_at: null,
    });

    // Generate a temporary token for password reset (valid 15 minutes)
    const reset_token = this.jwtService.sign(
      { sub: String(user._id), purpose: 'password_reset', email: user.email },
      { expiresIn: '15m' },
    );


    return {
      valid: true,
      reset_token,
      message: 'OTP verified. You can now reset your password.',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+otp +otp_expires_at')
      .lean<any>();

    if (!user) throw new BadRequestException('Invalid request');

    // Verify OTP one more time
    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: null,
      otp_expires_at: null,
    });

    // Send confirmation email
    await this.sendPasswordResetConfirmationEmail(user.email, user.full_name);

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and set new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Email Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.log(`[DEV MODE] Would send email to: ${to}`);
      console.log(`[DEV MODE] Subject: ${subject}`);
      console.log(`[DEV MODE] HTML: ${html.substring(0, 200)}...`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@ams.com'),
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${to}: ${error.message}`);
    }
  }

  private async sendOtpEmail(to: string, name: string, otp: string, purpose: string) {
    const templates = {
      login: {
        subject: '🔐 AMS Login OTP',
        body: `Your OTP for logging into AMS is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.`,
      },
      reset: {
        subject: '🔑 AMS Password Reset OTP',
        body: `Your OTP to reset your password is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.<br/><br/>If you didn't request this, please ignore this email.`,
      },
      verify: {
        subject: '✅ AMS Email Verification OTP',
        body: `Your OTP to verify your email address is: <strong>${otp}</strong><br/>This OTP is valid for 10 minutes.`,
      },
    };

    const template = templates[purpose] || templates.login;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a56db; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🏢 AMS Society</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>${template.body}</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This OTP will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this OTP, please ignore this email or contact support.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© ${new Date().getFullYear()} AMS Society Management System. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendEmail(to, template.subject, html);
  }

  private async sendPasswordResetConfirmationEmail(to: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a56db; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">🏢 AMS Society</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">This is a system notification, please do not reply to this email.</p>
        </div>
      </div>
    `;

    await this.sendEmail(to, '🔒 Password Reset Confirmation - AMS', html);
  }

  private async generateAndSendOtp(userId: Types.ObjectId | string, email: string, name: string, purpose: 'login' | 'reset' | 'verify' = 'login') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.userModel.findByIdAndUpdate(userId, {
      otp,
      otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email
    await this.sendOtpEmail(email, name, otp, purpose);
    console.log(`[OTP] Generated for ${email}: ${otp}`);

    return otp;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async sendOtpInternal(userId: string) {
    const user = await this.userModel.findById(userId).select('email full_name');
    if (!user) throw new BadRequestException('User not found');
    return this.generateAndSendOtp(user._id, user.email, user.full_name, 'login');
  }

  private async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean<any>();
  }

  private async checkActive(user: any) {
    if (user.status === UserStatus.PENDING)
      throw new ForbiddenException('Account is pending admin approval');
    if ([UserStatus.INACTIVE, UserStatus.SUSPENDED].includes(user.status))
      throw new ForbiddenException('Account is deactivated. Contact admin');
  }

  private async checkPassword(plain: string, hashed: string) {
    const ok = await bcrypt.compare(plain, hashed);
    if (!ok) throw new UnauthorizedException('Invalid email or password');
  }

  private async stampLogin(id: any) {
    await this.userModel.findByIdAndUpdate(id, { last_login: new Date() });
  }

  private sign(user: any): string {
    return this.jwtService.sign({
      sub: String(user._id),
      role: user.role,
      email: user.email,
      mobile: user.mobile,
    });
  }

  private safe(user: any) {
    return {
      id: String(user._id),
      full_name: user.full_name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
    };
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }


  async testEmailSending(to: string) {
    const testHtml = `
    <div style="font-family: Arial, sans-serif;">
      <h2>AMS Email Test</h2>
      <p>If you're reading this, your email configuration is working correctly!</p>
      <p>SMTP Host: ${this.configService.get('SMTP_HOST')}</p>
      <p>Port: ${this.configService.get('SMTP_PORT')}</p>
      <p>Time: ${new Date().toISOString()}</p>
    </div>
  `;

    await this.sendEmail(to, 'AMS Email Configuration Test', testHtml);
    console.log(`Test email sent to ${to}`);
  }
}