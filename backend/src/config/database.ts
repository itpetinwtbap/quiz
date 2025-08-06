import { DataSource } from 'typeorm';
import { Question } from '../models/Question';
import { QuestionPackage } from '../models/QuestionPackage';
import { Game } from '../models/Game';
import { GameSession } from '../models/GameSession';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'quiz_user',
  password: process.env.DB_PASSWORD || 'quiz_password',
  database: process.env.DB_NAME || 'quiz_db',
  synchronize: true, // Force synchronization for development
  logging: process.env.NODE_ENV === 'development',
  entities: [Question, QuestionPackage, Game, GameSession],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});