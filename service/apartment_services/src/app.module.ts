import { Module } from '@nestjs/common';

import { BlocksModule } from './blocks/module/block-module';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from './config/config.module';
import { FloorsModule } from './blocks/module/floor-module';
import { FlatsModule } from './blocks/module/flat-module';
import { UnitsModule } from './blocks/module/unit-module';  // FIX 7: UnitsModule was never imported here — unit routes were completely dead
import { VisitorModule } from './visitors/module/visitor-module';

@Module({
   imports: [
    ConfigModule, 
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS-microservices',
      { dbName: process.env.MONGODB_DB || 'apartment-service' },
    ),
  BlocksModule,
  FloorsModule,
  FlatsModule,
  UnitsModule,    
  VisitorModule,
],
})
export class AppModule {}