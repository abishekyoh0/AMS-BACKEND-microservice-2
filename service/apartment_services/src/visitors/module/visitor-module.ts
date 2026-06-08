import { Module } from '@nestjs/common';
import { VisitorService } from '../services/visitor-service';
// import { VisitorController } from '../controller/visitor-controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Visitor, VisitorSchema } from '../schema/visitor-schema';
import { VisitorTcpController } from '../controller/visitor.tcp.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visitor.name, schema: VisitorSchema }
    ])
  ],
  controllers: [
    // VisitorController, 
    VisitorTcpController],
  providers: [VisitorService],
})
export class VisitorModule { }