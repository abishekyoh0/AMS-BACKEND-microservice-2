import { Module } from '@nestjs/common';
import { VisitorService } from '../services/visitor-service';
import { VisitorController } from '../controller/visitor-controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Visitor, VisitorSchema } from '../schema/visitor-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visitor.name, schema: VisitorSchema }
    ])
  ],
  controllers: [VisitorController],
  providers: [VisitorService],
})
export class VisitorModule {}