import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { BlocksController } from '../controller/block-controller';
import { UnitsController } from '../controller/unit-controller';

import { BlocksService } from '../services/block-services';
import { UnitsService } from '../services/unit-services';

import { Block, BlockSchema } from '../schema/block-schema';
import { Unit, UnitSchema } from '../schema/unit-schema';
import { Flat, FlatSchema } from '../schema/flat-schema';
import { Floor, FloorSchema } from '../schema/floor-schema';

import { AuthMiddleware } from '../../../kafka/middleware';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Block.name, schema: BlockSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Flat.name, schema: FlatSchema },
      { name: Floor.name, schema: FloorSchema },
    ]),

    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'blocks_service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'blocks_consumer',
          },
        },
      },
    ]),
  ],
  controllers: [BlocksController, UnitsController],
  providers: [BlocksService, UnitsService],
})


export class BlocksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(BlocksController, UnitsController);
  }
}