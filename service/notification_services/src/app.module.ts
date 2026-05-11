
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './config/config.module';
import { NotificationModule } from './notification/module/notification.module';
import { AccessRequestModule } from './access/modules/access-request.module';

@Module({
  imports: [
     ConfigModule, 
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS-microservices',
      { dbName: process.env.MONGODB_DB || 'notification-service' },
    ),
    NotificationModule,
    AccessRequestModule 
  ],
})
export class AppModule {} 
