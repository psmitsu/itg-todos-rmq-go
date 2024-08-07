import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { FieldValuesService } from 'src/fieldvalues/fieldvalues.service';
import { FieldvaluesModule } from 'src/fieldvalues/fieldvalues.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), FieldvaluesModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
