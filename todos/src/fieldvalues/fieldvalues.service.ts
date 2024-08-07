import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CardFieldStringDto } from 'src/card/dto/create-card.dto';

@Injectable()
export class FieldValuesService {
  @Inject('FIELDVALUE_SERVICE') private fvClient: ClientProxy;
  constructor() {}

  async saveStrings(
    projectId: number,
    cardId: number,
    fields: CardFieldStringDto[],
  ) {
    const savedFields = await Promise.all(
      fields.map(async (field) => {
        const payload = {
          ...field,
          cardId,
          projectId,
        };
        const ret = await this.fvClient
          .send<FvResponseOk | FvResponseErr>({ cmd: 'save' }, payload)
          .toPromise();
        if (ret!.error === false) {
          return {
            value: ret.message.value,
            fieldId: ret.message.fieldId,
            cardId: ret.message.cardId,
          };
        }
      }),
    );
    console.log('recieved fields:', savedFields);
    return savedFields;
  }

  async findStrings(projectId: number, cardId?: number) {
    const payload: any = { projectId };
    if (cardId != undefined) {
      payload.cardId = cardId;
    }
    const resp = await this.fvClient
      .send<FvResponseFindOk | FvResponseErr>({ cmd: 'find' }, payload)
      .toPromise();
    if (resp.error === true) {
      console.error(resp.message);
      return [];
    }
    return resp.message;
  }
}

interface FvResponseOk {
  error: false;
  message: FvEntity;
}

interface FvResponseFindOk {
  error: false;
  message: FvEntity[];
}

interface FvResponseErr {
  error: true;
  message: string;
}

interface FvEntity {
  projectId: number;
  fieldId: number;
  cardId: number;
  value: string;
}
