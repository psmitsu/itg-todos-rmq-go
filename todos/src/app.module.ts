import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ProjectModule } from './project/project.module';
import { ListModule } from './list/list.module';
import { CardModule } from './card/card.module';
import { CardFieldModule } from './card-field/card-field.module';
import { FieldvaluesModule } from './fieldvalues/fieldvalues.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      port: <any>process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      synchronize: true,
      autoLoadEntities: true,
      // entities: [User, Project, List, Card],
    }),
    ClientsModule.register([
      {
        name: 'FIELDVALUE_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    ProjectModule,
    ListModule,
    CardModule,
    CardFieldModule,
    FieldvaluesModule,
  ],
})
export class AppModule {}
