import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { Gate, GateSchema, GateSchedule, GateScheduleSchema, GatekeeperSession, GatekeeperSessionSchema } from '../schemas/gate.schema';
import { ResidentProfile, ResidentProfileSchema } from '../schemas/resident-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Gate.name, schema: GateSchema },
      { name: GateSchedule.name, schema: GateScheduleSchema },
      { name: GatekeeperSession.name, schema: GatekeeperSessionSchema },
      { name: ResidentProfile.name, schema: ResidentProfileSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (): JwtModuleOptions => ({   
        secret: process.env.JWT_SECRET || 'ams_jwt_secret_change_in_prod',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }