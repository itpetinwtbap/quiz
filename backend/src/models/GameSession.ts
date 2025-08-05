import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Game } from './Game';

export enum SessionRole {
  HOST = 'host',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer'
}

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  socketId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userName?: string;

  @Column({ type: 'enum', enum: SessionRole, default: SessionRole.OBSERVER })
  role: SessionRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivity: Date;

  @ManyToOne(() => Game, game => game.sessions, { onDelete: 'CASCADE' })
  game: Game;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}