import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { QuestionPackage } from './QuestionPackage';
import { GameSession } from './GameSession';

export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FINISHED = 'finished'
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.WAITING })
  status: GameStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  team1Name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  team2Name?: string;

  @Column({ type: 'integer', default: 0 })
  team1Score: number;

  @Column({ type: 'integer', default: 0 })
  team2Score: number;

  @Column({ type: 'integer', default: 60 })
  defaultTimeLimit: number;

  @Column({ type: 'json', nullable: true })
  usedQuestions?: string[]; // Array of question IDs

  @Column({ type: 'varchar', length: 255, nullable: true })
  currentQuestionId?: string;

  @Column({ type: 'boolean', default: false })
  isTimerRunning: boolean;

  @Column({ type: 'integer', default: 0 })
  currentTimeLeft: number;

  @Column({ type: 'json', nullable: true })
  gameLog?: Array<{
    timestamp: string;
    action: string;
    details?: any;
  }>;

  @Column({ type: 'json', nullable: true })
  gameState?: {
    isCardFlipped?: boolean;
    selectedTime?: number;
    currentQuestion?: any;
    lastActivity?: string;
    timerStartTime?: string; // ISO string when timer was started
  };

  @ManyToOne(() => QuestionPackage, { nullable: true })
  package?: QuestionPackage;

  @OneToMany(() => GameSession, session => session.game)
  sessions: GameSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}