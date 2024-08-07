import { Module } from '@nestjs/common';
import { CardFieldService } from './card-field.service';
import { CardFieldController } from './card-field.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardField } from './card-field.entity';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([CardField]), ProjectModule],
  controllers: [CardFieldController],
  providers: [CardFieldService],
  exports: [CardFieldService],
})
export class CardFieldModule {}
