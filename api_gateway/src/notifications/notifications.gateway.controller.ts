import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/auth.decorators';

/**
 * Notifications Gateway  (base: /api/notifications)
 *
 * GET  /api/notifications/mine               → my notifications (user + role + all)
 * GET  /api/notifications/counts             → unread badge count
 * PATCH /api/notifications/:id/read          → mark one read
 * PATCH /api/notifications/mark-all-read     → mark all read
 * POST  /api/notifications/admin/broadcast   → admin sends to role or all
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsGatewayController {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly notif: ClientProxy,
  ) {}

  @Get('mine')
  @ApiOperation({ summary: 'Get my notifications (personal + role-based + broadcast)' })
  @ApiQuery({ name: 'category', required: false, enum: ['PAYMENT','VISITOR','SECURITY_ALERT','MAINTENANCE','SYSTEM','EMERGENCY','COMPLAINT','BILL'] })
  @ApiQuery({ name: 'status',   required: false, enum: ['UNREAD', 'READ'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW','MEDIUM','HIGH','CRITICAL'] })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'limit',    required: false, type: Number })
  getMine(@CurrentUser() user: any, @Query() query: any) {
    return firstValueFrom(
      this.notif.send('notifications.find_mine', {
        user_id:   user._id || user.id,
        user_role: user.role,
        query,
      }),
    );
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get unread badge counts for the current user' })
  getCounts(@CurrentUser() user: any) {
    return firstValueFrom(
      this.notif.send('notifications.counts', {
        user_id:   user._id || user.id,
        user_role: user.role,
      }),
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id' })
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return firstValueFrom(
      this.notif.send('notifications.mark_read', {
        id,
        user_id:   user._id || user.id,
        user_role: user.role,
      }),
    );
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  markAllRead(@CurrentUser() user: any) {
    return firstValueFrom(
      this.notif.send('notifications.mark_all_read', {
        user_id:   user._id || user.id,
        user_role: user.role,
      }),
    );
  }

  @Post('admin/broadcast')
  @ApiOperation({
    summary: 'Admin broadcasts notification to a role or everyone',
    description: `Set targetType:\n
    - "role" + targetRole (e.g. "resident") → all residents\n
    - "all" → everyone\n
    - "user" + receiverId → one specific user`,
  })
  @ApiBody({
    schema: {
      properties: {
        targetType:  { type: 'string', enum: ['user','role','all'], example: 'role' },
        targetRole:  { type: 'string', example: 'resident', description: 'Required if targetType=role' },
        receiverId:  { type: 'string', description: 'Required if targetType=user' },
        title:       { type: 'string', example: 'Society Meeting Tomorrow' },
        message:     { type: 'string', example: 'Monthly society meeting at 6 PM in Club House.' },
        category:    { type: 'string', example: 'SYSTEM' },
        priority:    { type: 'string', enum: ['LOW','MEDIUM','HIGH','CRITICAL'], example: 'MEDIUM' },
        actionRequired: { type: 'boolean', example: false },
      },
      required: ['targetType', 'title', 'message'],
    },
  })
  adminBroadcast(@CurrentUser() user: any, @Body() body: any) {
    const senderId = user._id || user.id;
    if (body.targetType === 'user') {
      return firstValueFrom(
        this.notif.send('notifications.create_for_user', {
          receiverId: body.receiverId,
          title: body.title,
          message: body.message,
          category: body.category,
          priority: body.priority,
          senderId,
          senderType: 'ADMIN',
          actionRequired: body.actionRequired,
        }),
      );
    }
    if (body.targetType === 'role') {
      return firstValueFrom(
        this.notif.send('notifications.broadcast_role', {
          targetRole: body.targetRole,
          title: body.title,
          message: body.message,
          category: body.category,
          priority: body.priority,
          senderId,
          senderType: 'ADMIN',
          actionRequired: body.actionRequired,
        }),
      );
    }
    // all
    return firstValueFrom(
      this.notif.send('notifications.broadcast_all', {
        title: body.title,
        message: body.message,
        category: body.category,
        priority: body.priority,
        senderId,
        actionRequired: body.actionRequired,
      }),
    );
  }
}
