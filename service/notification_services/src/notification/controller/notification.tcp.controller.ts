import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from '../service/notification.service';

/**
 * NotificationTcpController
 *
 * TCP patterns consumed by:
 *   - API Gateway (user reads, mark read)
 *   - Reports service (complaint events)
 *   - Emergency service (emergency alerts)
 *   - Payment service (bill due, receipt)
 *   - Any service that needs to send a notification
 *
 * Patterns:
 *   notifications.create_for_user      → one specific user
 *   notifications.broadcast_role       → all users with one role
 *   notifications.broadcast_roles      → multiple roles at once
 *   notifications.broadcast_all        → everyone
 *   notifications.find_mine            → user reads their notifications
 *   notifications.mark_read            → mark one read
 *   notifications.mark_all_read        → mark all read
 *   notifications.counts               → badge counts for UI
 */
@Controller()
export class NotificationTcpController {
  constructor(private readonly service: NotificationService) {}

  @MessagePattern('notifications.create_for_user')
  createForUser(@Payload() d: any) {
    return this.service.createForUser(d);
  }

  @MessagePattern('notifications.broadcast_role')
  broadcastToRole(@Payload() d: any) {
    return this.service.broadcastToRole(d);
  }

  @MessagePattern('notifications.broadcast_roles')
  broadcastToRoles(@Payload() d: any) {
    return this.service.broadcastToRoles(d);
  }

  @MessagePattern('notifications.broadcast_all')
  broadcastToAll(@Payload() d: any) {
    return this.service.broadcastToAll(d);
  }

  @MessagePattern('notifications.find_mine')
  findMine(@Payload() d: any) {
    return this.service.findMine(d.user_id, d.user_role, d.query || {});
  }

  @MessagePattern('notifications.mark_read')
  markRead(@Payload() d: any) {
    return this.service.markRead(d.id, d.user_id, d.user_role);
  }

  @MessagePattern('notifications.mark_all_read')
  markAllRead(@Payload() d: any) {
    return this.service.markAllRead(d.user_id, d.user_role);
  }

  @MessagePattern('notifications.counts')
  getCounts(@Payload() d: any) {
    return this.service.getCounts(d.user_id, d.user_role);
  }
}
