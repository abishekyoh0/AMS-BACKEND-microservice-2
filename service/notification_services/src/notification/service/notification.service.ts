import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument, NotifStatus } from '../schema/notification.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private model: Model<NotificationDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Create for a specific user (complaint assigned, bill due, etc.)
  // Called via TCP from other services or gateway
  // ─────────────────────────────────────────────────────────────────────────
  async createForUser(dto: {
    receiverId: string;
    title: string;
    message: string;
    category?: string;
    priority?: string;
    senderId?: string;
    senderType?: string;
    referenceId?: string;
    referenceType?: string;
    redirectUrl?: string;
    meta?: Record<string, any>;
    actionRequired?: boolean;
  }) {
    if (!dto.receiverId) throw new BadRequestException('receiverId is required');

    return this.model.create({
      targetType: 'user',
      receiverId: new Types.ObjectId(dto.receiverId),
      title: dto.title,
      message: dto.message,
      category: dto.category,
      priority: dto.priority || 'LOW',
      senderId: dto.senderId ? new Types.ObjectId(dto.senderId) : undefined,
      senderType: dto.senderType || 'SYSTEM',
      referenceId: dto.referenceId || undefined,
      referenceType: dto.referenceType || undefined,
      redirectUrl: dto.redirectUrl || undefined,
      meta: dto.meta || {},
      actionRequired: dto.actionRequired || false,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Broadcast to a role (all residents, all security, etc.)
  // targetRole matches auth service role values:
  //   'resident', 'admin', 'admin_security', 'admin_maintenance',
  //   'gatekeeper', 'accountant', 'admin_account'
  // ─────────────────────────────────────────────────────────────────────────
  async broadcastToRole(dto: {
    targetRole: string;         // e.g. 'resident'
    title: string;
    message: string;
    category?: string;
    priority?: string;
    senderId?: string;
    senderType?: string;
    referenceId?: string;
    referenceType?: string;
    actionRequired?: boolean;
    meta?: Record<string, any>;
  }) {
    return this.model.create({
      targetType: 'role',
      targetRole: dto.targetRole,
      title: dto.title,
      message: dto.message,
      category: dto.category || 'SYSTEM',
      priority: dto.priority || 'MEDIUM',
      senderId: dto.senderId ? new Types.ObjectId(dto.senderId) : undefined,
      senderType: dto.senderType || 'SYSTEM',
      referenceId: dto.referenceId || undefined,
      referenceType: dto.referenceType || undefined,
      actionRequired: dto.actionRequired || false,
      meta: dto.meta || {},
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Broadcast to multiple roles at once (emergency: residents + maintenance + admin)
  // Creates one notification document per role
  // ─────────────────────────────────────────────────────────────────────────
  async broadcastToRoles(dto: {
    roles: string[];            // e.g. ['resident', 'admin_maintenance', 'admin']
    title: string;
    message: string;
    category?: string;
    priority?: string;
    senderId?: string;
    referenceId?: string;
    referenceType?: string;
    actionRequired?: boolean;
  }) {
    const docs = dto.roles.map(role => ({
      targetType: 'role',
      targetRole: role,
      title: dto.title,
      message: dto.message,
      category: dto.category || 'SYSTEM',
      priority: dto.priority || 'HIGH',
      senderId: dto.senderId ? new Types.ObjectId(dto.senderId) : null,
      senderType: 'SYSTEM',
      referenceId: dto.referenceId || null,
      referenceType: dto.referenceType || null,
      actionRequired: dto.actionRequired || false,
    }));

    return this.model.insertMany(docs);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Broadcast to ALL users
  // ─────────────────────────────────────────────────────────────────────────
  async broadcastToAll(dto: {
    title: string;
    message: string;
    category?: string;
    priority?: string;
    senderId?: string;
    referenceId?: string;
    referenceType?: string;
    actionRequired?: boolean;
  }) {
    return this.model.create({
      targetType: 'all',
      title: dto.title,
      message: dto.message,
      category: dto.category || 'SYSTEM',
      priority: dto.priority || 'HIGH',
      senderId: dto.senderId ? new Types.ObjectId(dto.senderId) : undefined,
      senderType: 'SYSTEM',
      referenceId: dto.referenceId || undefined,
      referenceType: dto.referenceType || undefined,
      actionRequired: dto.actionRequired || true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Get notifications for a user
  // Matches: user-specific OR role-based for user's role OR all-type
  // ─────────────────────────────────────────────────────────────────────────
  async findMine(userId: string, userRole: string, query: {
    category?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: any = {
      isDeleted: { $ne: true },
      $or: [
        { targetType: 'user', receiverId: new Types.ObjectId(userId) },
        { targetType: 'role', targetRole: userRole },
        { targetType: 'all' },
      ],
    };

    if (query.category) filter.category = query.category;
    if (query.status)   filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mark one notification as read
  // ─────────────────────────────────────────────────────────────────────────
  async markRead(id: string, userId: string, userRole: string) {
    return this.model.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
        $or: [
          { targetType: 'user', receiverId: new Types.ObjectId(userId) },
          { targetType: 'role', targetRole: userRole },
          { targetType: 'all' },
        ],
      },
      { status: NotifStatus.READ, isRead: true, isSeen: true },
      { new: true },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mark all as read for a user
  // ─────────────────────────────────────────────────────────────────────────
  async markAllRead(userId: string, userRole: string) {
    return this.model.updateMany(
      {
        isDeleted: { $ne: true },
        status: NotifStatus.UNREAD,
        $or: [
          { targetType: 'user', receiverId: new Types.ObjectId(userId) },
          { targetType: 'role', targetRole: userRole },
          { targetType: 'all' },
        ],
      },
      { status: NotifStatus.READ, isRead: true, isSeen: true },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Badge counts for UI
  // ─────────────────────────────────────────────────────────────────────────
  async getCounts(userId: string, userRole: string) {
    const base: any = {
      isDeleted: { $ne: true },
      $or: [
        { targetType: 'user', receiverId: new Types.ObjectId(userId) },
        { targetType: 'role', targetRole: userRole },
        { targetType: 'all' },
      ],
    };

    const [total, unread, actionRequired] = await Promise.all([
      this.model.countDocuments(base),
      this.model.countDocuments({ ...base, status: NotifStatus.UNREAD }),
      this.model.countDocuments({ ...base, status: NotifStatus.UNREAD, actionRequired: true }),
    ]);

    return { total, unread, actionRequired };
  }
}
