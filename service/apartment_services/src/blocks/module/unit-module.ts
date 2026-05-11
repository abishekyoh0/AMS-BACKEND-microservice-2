import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Unit, UnitSchema } from '../schema/unit-schema';
import { Block, BlockSchema } from '../schema/block-schema';  
import { UnitsController } from '../controller/unit-controller';
import { UnitsService } from '../services/unit-services';
import { JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthMiddleware } from '../../../kafka/middleware';



@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Unit.name, schema: UnitSchema },
      { name: Block.name, schema: BlockSchema }, 
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'units_service',
            brokers: ['localhost:9092'], 
          },
          consumer: {
            groupId: 'units-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [UnitsController],
  providers: [UnitsService, JwtService],
  exports: [UnitsService],
})

export class UnitsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UnitsController); 
  }
}