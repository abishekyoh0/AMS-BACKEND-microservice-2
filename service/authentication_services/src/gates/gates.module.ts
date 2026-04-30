import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GatesService } from './gates.service';
import { GatesController } from './gates.controller';
import { Gate, GateSchema, GateSchedule, GateScheduleSchema, GatekeeperSession, GatekeeperSessionSchema } from '../schemas/gate.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gate.name, schema: GateSchema },
      { name: GateSchedule.name, schema: GateScheduleSchema },
      { name: GatekeeperSession.name, schema: GatekeeperSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GatesController],
  providers: [GatesService],
  exports: [GatesService],
})
export class GatesModule {}
