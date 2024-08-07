import { Module } from '@nestjs/common';
import { FieldValuesService } from './fieldvalues.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FIELDVALUE_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
          queue: process.env.FV_QUEUE,
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  providers: [FieldValuesService],
  exports: [FieldValuesService],
})
export class FieldvaluesModule {}
