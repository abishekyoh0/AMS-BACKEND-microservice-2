import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlatsController } from '../controller/flat-controller';
import { FlatsService } from '../services/flat-services';
import { Flat, FlatSchema } from '../schema/flat-schema';
import { AuthMiddleware } from '../../../kafka/middleware';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
  MongooseModule.forFeature([
      { name: Flat.name, schema: FlatSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'flats_service',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'flats-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [FlatsController],
  providers: [FlatsService, JwtService],
})

export class FlatsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(FlatsController);
  }
}