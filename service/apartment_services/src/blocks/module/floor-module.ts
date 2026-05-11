import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FloorsController } from '../controller/floor-controller';
import { FloorsService } from '../services/floor-services';
import { Floor, FloorSchema } from '../schema/floor-schema';
import { AuthMiddleware } from '../../../kafka/middleware';
import { JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Floor.name, schema: FloorSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'floors_service',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'floors-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [FloorsController],
  providers: [FloorsService, JwtService],
})

export class FloorsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(FloorsController);
  }
}