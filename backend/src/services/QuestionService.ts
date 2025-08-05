import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Question } from '../models/Question';
import { QuestionPackage } from '../models/QuestionPackage';

export class QuestionService {
  private questionRepository: Repository<Question>;
  private packageRepository: Repository<QuestionPackage>;

  constructor() {
    this.questionRepository = AppDataSource.getRepository(Question);
    this.packageRepository = AppDataSource.getRepository(QuestionPackage);
  }

  public async getQuestions(packageId?: string): Promise<Question[]> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.package', 'package')
      .orderBy('question.orderIndex', 'ASC');

    if (packageId) {
      queryBuilder.where('question.package.id = :packageId', { packageId });
    }

    return queryBuilder.getMany();
  }

  public async getQuestionById(id: string): Promise<Question | null> {
    return this.questionRepository.findOne({
      where: { id },
      relations: ['package']
    });
  }

  public async createQuestion(questionData: Partial<Question>): Promise<Question> {
    const question = this.questionRepository.create(questionData);
    return this.questionRepository.save(question);
  }

  public async updateQuestion(id: string, updateData: Partial<Question>): Promise<Question | null> {
    const question = await this.questionRepository.findOne({ where: { id } });
    if (!question) {
      return null;
    }

    Object.assign(question, updateData);
    return this.questionRepository.save(question);
  }

  public async deleteQuestion(id: string): Promise<boolean> {
    const result = await this.questionRepository.delete(id);
    return result.affected !== 0;
  }

  public async getRandomQuestion(packageId?: string, excludeIds: string[] = []): Promise<Question | null> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.package', 'package')
      .orderBy('RANDOM()');

    if (packageId) {
      queryBuilder.where('question.package.id = :packageId', { packageId });
    }

    if (excludeIds.length > 0) {
      queryBuilder.andWhere('question.id NOT IN (:...excludeIds)', { excludeIds });
    }

    return queryBuilder.getOne();
  }

  public async getQuestionsByPackage(packageId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { package: { id: packageId } },
      relations: ['package'],
      order: { orderIndex: 'ASC' }
    });
  }

  public async bulkCreateQuestions(questionsData: Partial<Question>[]): Promise<Question[]> {
    const questions = this.questionRepository.create(questionsData);
    return this.questionRepository.save(questions);
  }
}