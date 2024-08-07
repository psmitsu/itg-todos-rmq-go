import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './card.entity';
import { ListModule } from 'src/list/list.module';
import { ProjectModule } from 'src/project/project.module';
import { CardFieldModule } from 'src/card-field/card-field.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FieldvaluesModule } from 'src/fieldvalues/fieldvalues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card]),
    CardFieldModule,
    CardFieldModule,
    ListModule,
    ProjectModule,
    FieldvaluesModule,
  ],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
