import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { QuestionPackage } from './QuestionPackage';

export enum QuestionType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video'
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.TEXT })
  type: QuestionType;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ type: 'text', nullable: true })
  audioUrl?: string;

  @Column({ type: 'text', nullable: true })
  videoUrl?: string;

  @Column({ type: 'integer', default: 0 })
  orderIndex: number;

  @Column({ type: 'integer', default: 60 })
  timeLimit: number; // in seconds

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => QuestionPackage, pkg => pkg.questions, { onDelete: 'CASCADE' })
  package: QuestionPackage;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}