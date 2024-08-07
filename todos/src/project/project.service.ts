import {
  Injectable,
  Inject,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './project.entity';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FieldValuesService } from 'src/fieldvalues/fieldvalues.service';

@Injectable({ scope: Scope.REQUEST })
export class ProjectService {
  constructor(
    @InjectRepository(Project) private projectsRepository: Repository<Project>,
    @Inject(REQUEST) private request: Request,
    private fvService: FieldValuesService,
  ) {}

  async create(authorId: number, createProjectDto: CreateProjectDto) {
    let project = new Project();

    project = {
      ...project,
      ...createProjectDto,
      authorId,
      createdAt: new Date(),
    };

    return this.projectsRepository.save(project);
  }

  async findAll(authorId: number) {
    const results = await this.projectsRepository.find({
      where: {
        authorId,
      },
    });

    return results;
  }

  async findOne(authorId: number, id: number, withRelations = true) {
    console.log('project findOne');
    const project = await this.projectsRepository.findOneOrFail({
      relations: {
        lists: withRelations && {
          cards: true,
        },
        fields: withRelations,
      },
      where: { id },
    });

    await this.checkAuthor(authorId, project);

    // field values
    if (withRelations) {
      const values = await this.fvService.findStrings(id);
      console.log('got values from fvService:', values);
      project.lists.forEach((l) =>
        l.cards.forEach(
          (c) =>
            ((c as any).fieldValues = values.filter((v) => v.cardId == c.id)),
        ),
      );
    }

    return project;
  }

  async update(
    authorId: number,
    id: number,
    updateProjectDto: UpdateProjectDto,
  ) {
    let project = await this.findOne(authorId, id);

    project = {
      ...project,
      ...updateProjectDto,
    };

    return this.projectsRepository.save(project);
  }

  async remove(authorId: number, id: number) {
    const project = await this.findOne(authorId, id);
    return this.projectsRepository.remove(project);
  }

  // TODO: Promise<void>
  async checkAuthor(authorId: number, project: Project) {
    console.log('checkAuthor, project:');
    console.log(project);
    console.log('checkAuthor, authorId:');
    console.log(authorId);

    if (project.authorId !== authorId) {
      throw new RpcException('Unauthorized');
    }
  }
}
