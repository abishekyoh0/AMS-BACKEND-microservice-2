import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ComplaintsModule } from './complaints/complaints.module';
import { EmergencyModule } from './emergency/modules/emergency.modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({

        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/ams_reports'),
      }),
      inject: [ConfigService],
    }),
    ComplaintsModule,
    EmergencyModule,
  ],
})
export class AppModule {}
