import {
  Injectable, BadRequestException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Worker, WorkerDocument } from '../schemas/worker.schema';
import { ResidentProfile, ResidentProfileDocument } from '../schemas/resident-profile.schema';
import { Role, ROLE_CREATION_POLICY } from '../common/enums/roles.enum';
import { UserStatus } from '../common/enums/status.enum';
import {
  CreateAdminDto, CreateSubAdminDto, CreateGatekeeperDto,
  CreateAccountantDto, CreateResidentDto, CreateWorkerDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)   private userModel: Model<UserDocument>,
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
    @InjectModel(ResidentProfile.name) private profileModel: Model<ResidentProfileDocument>,
  ) {}

  private canCreate(creatorRole: Role, targetRole: Role) {
    const allowed = ROLE_CREATION_POLICY[creatorRole] || [];
    if (!allowed.includes(targetRole))
      throw new ForbiddenException(`A ${creatorRole} cannot create a ${targetRole}`);
  }

  private async checkUnique(email?: string, mobile?: string) {
    if (!email && !mobile) throw new BadRequestException('Provide email or mobile');
    if (email && await this.userModel.findOne({ email: email.toLowerCase() }))
      throw new BadRequestException('Email already registered');
    if (mobile && await this.userModel.findOne({ mobile }))
      throw new BadRequestException('Mobile already registered');
  }

  async createAdmin(creatorId: string, creatorRole: Role, dto: CreateAdminDto) {
    this.canCreate(creatorRole, Role.ADMIN);
    await this.checkUnique(dto.email, dto.mobile);
    const user = await this.userModel.create({
      ...dto, email: dto.email.toLowerCase(),
      role: Role.ADMIN, status: UserStatus.ACTIVE,
      is_verified: true, created_by: new Types.ObjectId(creatorId),
    });
    return this.safe(user);
  }

  async createSubAdmin(creatorId: string, creatorRole: Role, dto: CreateSubAdminDto) {
    this.canCreate(creatorRole, dto.role);
    await this.checkUnique(dto.email, dto.mobile);
    const user = await this.userModel.create({
      ...dto, email: dto.email.toLowerCase(),
      status: UserStatus.ACTIVE, is_verified: true,
      created_by: new Types.ObjectId(creatorId),
    });
    return this.safe(user);
  }

  async createGatekeeper(creatorId: string, creatorRole: Role, dto: CreateGatekeeperDto) {
    this.canCreate(creatorRole, Role.GATEKEEPER);
    await this.checkUnique(dto.email, dto.mobile);
    const user = await this.userModel.create({
      ...dto, email: dto.email.toLowerCase(),
      role: Role.GATEKEEPER, status: UserStatus.ACTIVE,
      is_verified: true, created_by: new Types.ObjectId(creatorId),


    });
    return this.safe(user);
  }

  async createAccountant(creatorId: string, creatorRole: Role, dto: CreateAccountantDto) {
    this.canCreate(creatorRole, Role.ACCOUNTANT);
    await this.checkUnique(dto.email, dto.mobile);
    const user = await this.userModel.create({
      ...dto, email: dto.email.toLowerCase(),
      role: Role.ACCOUNTANT, status: UserStatus.ACTIVE,
      is_verified: true, created_by: new Types.ObjectId(creatorId),
    });
    return this.safe(user);
  }

  async createResident(creatorId: string, creatorRole: Role, dto: CreateResidentDto) {
    this.canCreate(creatorRole, Role.RESIDENT);
    await this.checkUnique(dto.email, dto.mobile);
    const user = await this.userModel.create({
      full_name: dto.full_name,
      email: dto.email.toLowerCase(),
      mobile: dto.mobile,
      role: Role.RESIDENT,
      status: UserStatus.PENDING,   
      is_verified: false,
      is_first_login: true,
      profile_completed: false,
      created_by: new Types.ObjectId(creatorId),
    });

    // Create resident profile skeleton with admin-supplied info
    await this.profileModel.create({
      user: user._id,
      resident_type: dto.resident_type,
      flat_id: dto.flat_id ? new Types.ObjectId(dto.flat_id) : undefined,
      block: dto.block || undefined,
      unit_number: dto.unit_number,
    });

    return this.safe(user);
  }

  async createWorker(creatorId: string, creatorRole: Role, dto: CreateWorkerDto) {
    if (creatorRole !== Role.ADMIN_MAINTENANCE)
      throw new ForbiddenException('Only ADMIN_MAINTENANCE can add workers');
    return this.workerModel.create({ ...dto, created_by: new Types.ObjectId(creatorId) });
  }

  async approveResident(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.RESIDENT) throw new BadRequestException('Only residents can be approved');
    await this.userModel.findByIdAndUpdate(userId, { status: UserStatus.ACTIVE });
    return { message: 'Resident approved' };
  }

  async getByCreator(creatorId: string) {
    return this.userModel.find({ created_by: new Types.ObjectId(creatorId) })
      .select('-password -otp -otp_expires_at').lean();
  }

  async getWorkersByCreator(creatorId: string) {
    return this.workerModel.find({ created_by: new Types.ObjectId(creatorId) }).lean();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id)
      .select('-password -otp -otp_expires_at').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deactivate(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { status: UserStatus.INACTIVE });
    return { message: 'User deactivated' };
  }

  private safe(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password; delete obj.otp; delete obj.otp_expires_at;
    return obj;
  }
}
