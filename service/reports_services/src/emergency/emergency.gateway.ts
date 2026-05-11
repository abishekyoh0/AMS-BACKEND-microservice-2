import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/emergency',
})
export class EmergencyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EmergencyGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_room')
  handleSubscribeRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    this.logger.log(`Client ${client.id} joined room: ${data.room}`);
    return { event: 'subscribed', room: data.room };
  }

  @SubscribeMessage('subscribe_role')
  handleSubscribeRole(
    @MessageBody() data: { role: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `role_${data.role}`;
    client.join(room);
    client.join(`user_${data.userId}`);
    this.logger.log(`Client ${client.id} joined role room: ${room}`);
    return { event: 'subscribed', room };
  }


  broadcastEmergencyCreated(emergency: any) {
    this.server.emit('emergency_created', { emergency });

    if (emergency.sendTo) {
      this.server.to(emergency.sendTo).emit('emergency_created', { emergency });
    }

    this.server.to('role_admin').emit('emergency_created', { emergency });
    this.logger.log(`Broadcast emergency_created: ${emergency.alertId}`);
  }

  broadcastEmergencyResolved(emergencyId: string, resolvedAt: Date) {
    this.server.emit('emergency_resolved', { emergencyId, resolvedAt });
    this.logger.log(`Broadcast emergency_resolved: ${emergencyId}`);
  }

  broadcastEscalation(emergencyId: string, priority: string, escalatedAt: Date) {
    this.server.emit('emergency_escalated', { emergencyId, priority, escalatedAt });
    this.server.to('role_admin').emit('emergency_escalated', { emergencyId, priority, escalatedAt });
    this.logger.log(`Broadcast emergency_escalated: ${emergencyId} → ${priority}`);
  }

  broadcastAcknowledgement(emergencyId: string, acknowledged: number) {
    this.server.emit('emergency_ack', { emergencyId, acknowledged });
  }

  broadcastReportStatus(reportId: string, status: string, downloadUrl?: string) {
    this.server.emit('report_status', { reportId, status, downloadUrl });
    this.logger.log(`Broadcast report_status: ${reportId} → ${status}`);
  }
}