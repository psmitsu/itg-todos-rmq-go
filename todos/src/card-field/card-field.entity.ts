import { ApiProperty } from '@nestjs/swagger';
import { Project } from 'src/project/project.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  ENUM = 'enum',
}

@Entity()
export class CardField {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ type: () => Project })
  @ManyToOne(() => Project, { nullable: true })
  project: Project;

  @ApiProperty({ enum: ['STRING', 'NUMBER'] })
  @Column({
    type: 'enum',
    enum: FieldType,
    default: FieldType.STRING,
  })
  type: FieldType;
}
