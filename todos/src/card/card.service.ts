import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

import { ProjectService } from 'src/project/project.service';
import { ListService } from 'src/list/list.service';
import { CardFieldService } from 'src/card-field/card-field.service';

import { Card } from './card.entity';
import { List } from 'src/list/list.entity';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FieldValuesService } from 'src/fieldvalues/fieldvalues.service';

// import { PositionBadRangeError } from 'src/position-bad-range.error';

@Injectable()
export class CardService {
  constructor(
    private fieldService: CardFieldService,
    private listService: ListService,
    private projectService: ProjectService,
    private fvService: FieldValuesService,
    // @Inject('FIELDVALUE_SERVICE') private fieldValueClient: ClientProxy,
    @InjectRepository(Card) private cardRepository: Repository<Card>,
  ) {}

  async create(authorId: number, createCardDto: CreateCardDto) {
    const list = await this.listService.findOne(
      authorId,
      createCardDto.listId,
      false,
    );

    const card = new Card();

    card.name = createCardDto.name;
    createCardDto.description && (card.description = createCardDto.description);
    card.list = list;
    card.createdAt = new Date();

    // TODO: this should be in transaction
    const maxPosition = await this.getMaxPositionWithinList(list);
    card.position = maxPosition + 1;

    console.log('saving card:', card);
    await this.cardRepository.save(card);

    // TODO: no check of field id currently
    if (createCardDto.stringFields !== undefined) {
      const fields = this.fvService.saveStrings(
        card.list.project.id,
        card.id,
        createCardDto.stringFields,
      );
      return {
        ...card,
        fields: fields,
      };
    }

    return card;
  }

  async findOne(authorId: number, id: number) {
    const card = await this.cardRepository.findOneOrFail({
      relations: {
        list: {
          project: true,
        },
      },
      where: { id },
    });

    this.projectService.checkAuthor(authorId, card.list.project);
    const fieldValues = await this.fvService.findStrings(
      card.list.project.id,
      card.id,
    );

    return { 
      ...card,
      fieldValues,
    };
  }

  async update(authorId: number, id: number, updateCardDto: UpdateCardDto) {
    console.log('update');

    // TODO: rethink cardService.findOne
    // it triggers call to service to fetch the field values
    const card = await this.findOne(authorId, id);

    updateCardDto.name && (card.name = updateCardDto.name);
    updateCardDto.description && (card.description = updateCardDto.description);

    if (
      updateCardDto.listId !== undefined &&
      updateCardDto.listId !== card.list.id
    ) {
      const list = await this.listService.findOne(
        authorId,
        updateCardDto.listId,
        false,
      );
      card.list = list;
    }

    // TODO: probably this should be in transaction
    if (updateCardDto.position !== undefined) {
      await this.checkPositionUpdateAll(card, updateCardDto.position);
      card.position = updateCardDto.position;
    }

    // BUG: due to TypeORM issues with circular relations, have to save without fieldValues
    await this.cardRepository.save({
      ...card,
      // stringFields: undefined,
      // enumFields: undefined,
    });

    // TODO: no check of field currently
    if (updateCardDto.stringFields !== undefined) {
      const fields = await this.fvService.saveStrings(
        card.list.project.id,
        card.id,
        updateCardDto.stringFields,
      );
      console.log('fields', fields);
      return {
        ...card,
        fieldsValues: fields,
      };
    }

    return card;
  }

  async remove(authorId: number, id: number): Promise<Card> {
    const card = await this.findOne(authorId, id);

    // fix positions
    await this.cardRepository
      .createQueryBuilder()
      .update(Card)
      .set({
        position: () => 'position - 1',
      })
      .where('listId = :listId AND position > :removedPosition', {
        listId: card.list.id,
        removedPosition: card.position,
      })
      .execute();

    // TODO: remove field values via service too

    return this.cardRepository.remove(card);
  }

  private async checkPositionUpdateAll(
    card: Card,
    newPosition: number,
  ): Promise<void> {
    const { position: oldPosition } = card;
    if (newPosition < 0) {
      // throw new PositionBadRangeError();
      throw new RpcException('Wrong Position Value');
    }

    const maxPosition = await this.getMaxPositionWithinList(card.list);
    console.log('maxPos', maxPosition);
    if (newPosition > maxPosition) {
      // throw new PositionBadRangeError();
      throw new RpcException('Wrong Position Value');
    }

    console.log('newPos', newPosition, 'oldPos', oldPosition);

    // right: move all with (position <= newPosition and position > oldPosition) to position-1
    // left: move all with (position >= newPosition and position < oldPosition) to position+1
    let whereClause = 'listId = :listId';
    whereClause += ` AND position ${newPosition > oldPosition ? '<=' : '>='} :newPosition`;
    whereClause += ` AND position ${newPosition > oldPosition ? '>' : '<'} :oldPosition`;
    const setClause = `position ${newPosition > oldPosition ? '-' : '+'} 1`;

    console.log('where', whereClause);
    console.log('set', setClause);

    await this.cardRepository
      .createQueryBuilder()
      .update(Card)
      .set({
        position: () => setClause,
      })
      .where(whereClause, {
        listId: card.list.id,
        newPosition,
        oldPosition,
      })
      .execute();
  }

  private async getMaxPositionWithinList(list: List): Promise<number> {
    const res = await this.cardRepository
      .createQueryBuilder('card')
      .select('MAX(card.position)', 'max')
      .where('card.listId = :listId', { listId: list.id })
      .getRawOne();

    if (res.max !== null) {
      return res.max;
    }

    return -1;
  }
}
