
import { Module } from '@nestjs/common';
import { NotificationService } from '../service/notification.service';
import { NotificationController } from '../controller/notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '../schema/notification.schema';

  @Module({
  imports: [
    MongooseModule.forFeature([ 
      { name: Notification.name, schema: NotificationSchema },
      { name: 'User', schema: {} }, // replace with real schema
    ]),
  ], 
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {} 
