import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { Complaint, ComplaintSchema } from '../schemas/complaint.schema';
import { ComplaintAssignment, ComplaintAssignmentSchema } from '../schemas/complaint-assignment.schema';
import { ComplaintCounter, ComplaintCounterSchema } from '../schemas/complaint-counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Complaint.name,           schema: ComplaintSchema },
      { name: ComplaintAssignment.name, schema: ComplaintAssignmentSchema },
      { name: ComplaintCounter.name,    schema: ComplaintCounterSchema },
    ]),
  ],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
