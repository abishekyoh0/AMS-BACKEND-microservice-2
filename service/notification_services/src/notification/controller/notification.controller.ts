import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from '../service/notification.service';

/**
 * HTTP controller — for Swagger docs only.
 * Actual calls come through the TCP controller via API Gateway.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications (use via gateway: GET /api/notifications)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['UNREAD', 'READ'] })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMine(@Query() query: any) {
    return { message: 'Use via API Gateway at /api/notifications/mine', query };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id' })
  markRead(@Param('id') id: string) {
    return { message: 'Use via API Gateway at /api/notifications/:id/read' };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead() {
    return { message: 'Use via API Gateway at /api/notifications/mark-all-read' };
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get unread badge counts' })
  counts() {
    return { message: 'Use via API Gateway at /api/notifications/counts' };
  }
}
