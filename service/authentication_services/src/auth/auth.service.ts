import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../schemas/user.schema';
import { Gate, GateDocument, GateSchedule, GateScheduleDocument, GatekeeperSession, GatekeeperSessionDocument } from '../schemas/gate.schema';
import { ResidentProfile, ResidentProfileDocument } from '../schemas/resident-profile.schema';

import { Role } from '../common/enums/roles.enum';
import { UserStatus, SessionStatus } from '../common/enums/status.enum';

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
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Gate.name) private gateModel: Model<GateDocument>,
    @InjectModel(GateSchedule.name) private scheduleModel: Model<GateScheduleDocument>,
    @InjectModel(GatekeeperSession.name) private sessionModel: Model<GatekeeperSessionDocument>,
    @InjectModel(ResidentProfile.name) private profileModel: Model<ResidentProfileDocument>,
    private readonly jwtService: JwtService,
  ) { }

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
      const gates = await this.gateModel.find({ status: 'active' }).select('gate_name location').lean();
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
      const gates = await this.gateModel.find({ status: 'active' }).select('gate_name location').lean();
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
        $or: [{ specific_date: today }, { day_of_week: dayName }],
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
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async sendOtpInternal(userId: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userModel.findByIdAndUpdate(userId, {
      otp,
      otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });
    // TODO: call notification_service via TCP to dispatch SMS/email
    console.log(`[OTP] user=${userId} otp=${otp}`); // remove in production
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
}
