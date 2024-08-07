import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCardFieldDto } from './dto/create-card-field.dto';
import { UpdateCardFieldDto } from './dto/update-card-field.dto';
import { CardField, FieldType } from './card-field.entity';

import { ProjectService } from 'src/project/project.service';

@Injectable()
export class CardFieldService {
  constructor(
    @InjectRepository(CardField)
    private cardFieldRepository: Repository<CardField>,
    private projectService: ProjectService,
  ) {}

  async create(authorId, createCardFieldDto: CreateCardFieldDto) {
    console.log('createField dto', createCardFieldDto);

    if (createCardFieldDto.type === FieldType.ENUM) {
      return this.createEnumField(authorId, createCardFieldDto);
    }

    const project = await this.projectService.findOne(
      authorId,
      createCardFieldDto.projectId,
      false,
    );

    let cardField = new CardField();
    cardField = {
      ...cardField,
      name: createCardFieldDto.name,
      type: createCardFieldDto.type,
      project: project,
    };

    // console.log('cardField', cardField);

    return this.cardFieldRepository.save(cardField);
  }

  // TODO: update card-field
  update(authorId: number, id: number, updateCardFieldDto: UpdateCardFieldDto) {
    return `This action updates a #${id} cardField`;
  }

  async createEnumField(
    authorId: number,
    createCardFieldDto: CreateCardFieldDto,
  ) {
    if (createCardFieldDto.enumValues === undefined) {
      throw new BadRequestException(
        'List of available enum values not specified',
      );
    }

    const project = await this.projectService.findOne(
      authorId,
      createCardFieldDto.projectId,
      false,
    );

    let field = new CardField();
    field = {
      ...field,
      name: createCardFieldDto.name,
      type: createCardFieldDto.type,
      project: project,
    };

    await this.cardFieldRepository.save(field);

    return field;
  }

  // TODO: updateEnumField
  async updateEnum(
    authorId: number,
    updateEnumCardFieldDto: UpdateCardFieldDto,
  ) {
    return 'This action updates enum card field';
  }

  // TODO: findAll cardField. Do I need it?
  findAll(authorId: number) {
    return `This action returns all cardField`;
  }

  async findOne(authorId: number, id: number) {
    // will throw 404 if not found
    const cardField = await this.cardFieldRepository.findOneOrFail({
      where: { id },
      relations: { project: true },
    });

    // will throw Forbidden if project belongs to other person
    this.projectService.checkAuthor(authorId, cardField.project);

    // TODO: should it check whether it belongs to the project?

    return cardField;
  }

  // TODO: remove cardfield. It should also call the service to remove
  remove(authorId: number, id: number) {
    return `This action removes a #${id} cardField`;
  }
}
