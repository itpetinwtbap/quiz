import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Question } from './Question';

@Entity('question_packages')
export class QuestionPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  version?: string;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Question, question => question.package, { cascade: true })
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property to get questions count
  get questionsCount(): number {
    return this.questions?.length || 0;
  }
}