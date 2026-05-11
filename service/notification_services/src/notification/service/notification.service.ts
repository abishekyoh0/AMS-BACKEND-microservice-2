// notification.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from '../schema/notification.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private model: Model<Notification>,
    @InjectModel('User') private userModel: Model<any>,
  ) {}

  //  Create single notification
  async create(dto: any) {
    try {
      if (!dto.receiverId) {
        throw new BadRequestException('receiverId is required');
      }

      return await this.model.create({
        ...dto,
        receiverId: new Types.ObjectId(dto.receiverId),
        senderId: dto.senderId
          ? new Types.ObjectId(dto.senderId)
          : undefined,
        senderType: dto.senderId ? 'USER' : 'SYSTEM',
        receiverType: 'USER',
      });
    } catch (error) {
      console.error('CREATE ERROR:', error);
      throw error;
    }
  }

  //  Admin broadcast / targeted send
  async sendFromAdmin(dto: any) {
    const adminId = dto.senderId;

    let users: any[] = [];

    //  direct users
    if (dto.userIds?.length) {
      users = dto.userIds;
    }

    // role-based
    else if (dto.roles?.length) {
      const roleUsers = await this.userModel.find({
        role: { $in: dto.roles },
      });

      users = roleUsers.map((u) => u._id);
    }

    // panel-based (FIXED → using role)
    
    else if (dto.targetPanel) {
      const panelUsers = await this.userModel.find({
        role: dto.targetPanel, // 🔥 FIXED
      });

      console.log('FOUND USERS:', panelUsers);

      users = panelUsers.map((u) => u._id);
    }

    //  broadcast 

    else {
      const all = await this.userModel.find({});
      users = all.map((u) => u._id);
    }

    //  prevent empty insert
    if (users.length === 0) {
      throw new BadRequestException(
        'No users found for given criteria',
      );
    }

    const notifications = users.map((userId) => ({
      title: dto.title,
      message: dto.message,
      category: dto.category,
      priority: dto.priority,
      actionRequired: dto.actionRequired || false,
      tags: dto.tags || [],
      meta: dto.meta || {},

      senderId: adminId ? new Types.ObjectId(adminId) : undefined, 
      receiverId: new Types.ObjectId(userId),

      senderType: 'ADMIN',
      receiverType: 'USER',

      panelType: dto.targetPanel ?? 'ADMIN',
    }));

    return this.model.insertMany(notifications);
  }

  //  Get notifications
  async findAll(userId: string, query: any) {
    const filter: any = {
      receiverId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    };

    if (query.panelType) filter.panelType = query.panelType;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.category) filter.category = query.category;
    if (query.actionRequired !== undefined)
      filter.actionRequired = query.actionRequired;

    return this.model.find(filter).sort({ createdAt: -1 });
  }

  //  Mark read
  async markRead(id: string, userId: string) {
  return this.model.findOneAndUpdate(
    {
      _id: id,
      receiverId: new Types.ObjectId(userId),
    },
    {
      status: 'READ',
      isRead: true,
      isSeen: true,
    },
    { new: true },
  );
}

  //  Mark all read
 async markAll(userId: string, panelType: string) {
  return this.model.updateMany(
    {
      receiverId: new Types.ObjectId(userId),
      panelType,
      status: 'UNREAD',
    },
    {
      status: 'READ',
      isRead: true,
      isSeen: true,
    },
  );
}

  //  Soft delete
  async remove(id: string, userId: string) {
    return this.model.findOneAndUpdate(
      {
        _id: id,
        receiverId: new Types.ObjectId(userId),
      },
      { isDeleted: true },
      { new: true },
    );
  }

  //  Badge counts
  async getCounts(userId: string, panelType: string) {
    const base = {
      receiverId: new Types.ObjectId(userId),
      panelType,
      isDeleted: { $ne: true },
    };

    return {
      total: await this.model.countDocuments(base),
      unread: await this.model.countDocuments({
        ...base,
        status: 'UNREAD',
      }),
      actionRequired: await this.model.countDocuments({
        ...base,
        status: 'UNREAD',
        actionRequired: true,
      }),
    };
  }
} 

