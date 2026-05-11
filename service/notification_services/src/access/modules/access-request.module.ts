import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AccessRequest,
  AccessRequestSchema,
} from '../schema/access-request.schema';

// import {
//   AccessCard,
//   AccessCardSchema,
// } from '../schema/access-card.schema'; 

import { AccessRequestService } from '../service/access-request.service';
import { AccessRequestController } from '../controller/access-request.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccessRequest.name, schema: AccessRequestSchema },
      // { name: AccessCard.name, schema: AccessCardSchema }, 
    ]),
  ],
  controllers: [AccessRequestController],
  providers: [AccessRequestService],
  exports: [AccessRequestService],
})
export class AccessRequestModule {}