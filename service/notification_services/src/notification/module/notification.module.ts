import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from '../service/notification.service';
import { NotificationController } from '../controller/notification.controller';
import { NotificationTcpController } from '../controller/notification.tcp.controller';
import { Notification, NotificationSchema } from '../schema/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [
    NotificationController,      // HTTP routes (for Swagger docs)
    NotificationTcpController,   // TCP patterns (for microservice calls)
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
