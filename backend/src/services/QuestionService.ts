import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Question, QuestionType } from '../models/Question';
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

  public async getDefaultPackage(): Promise<QuestionPackage | null> {
    return this.packageRepository.findOne({
      where: { name: 'Базовый пакет' }
    });
  }

  public async createDefaultPackage(): Promise<QuestionPackage> {
    const packageData = {
      name: 'Базовый пакет',
      description: 'Первоначальный набор вопросов для игры Что Где Когда',
      author: 'System',
      version: '1.0',
      isActive: true,
      tags: ['default', 'basic'],
      metadata: { source: 'original', type: 'built-in' }
    };

    const packageEntity = this.packageRepository.create(packageData);
    const savedPackage = await this.packageRepository.save(packageEntity);

    // Create default questions one by one to avoid TypeScript issues
    const questionData = [
      { question: 'Что такое черная дыра?', answer: 'Область пространства-времени, гравитационное притяжение которой настолько велико, что покинуть её не могут даже объекты, движущиеся со скоростью света', type: QuestionType.TEXT, orderIndex: 1, timeLimit: 60 },
      { question: 'Кто написал "Войну и мир"?', answer: 'Лев Николаевич Толстой', type: QuestionType.TEXT, orderIndex: 2, timeLimit: 60 },
      { question: 'Какой химический элемент обозначается символом Au?', answer: 'Золото (Aurum)', type: QuestionType.TEXT, orderIndex: 3, timeLimit: 60 },
      { question: 'В каком году был основан Google?', answer: '1998 год', type: QuestionType.TEXT, orderIndex: 4, timeLimit: 60 },
      { question: 'Какая планета самая большая в Солнечной системе?', answer: 'Юпитер', type: QuestionType.TEXT, orderIndex: 5, timeLimit: 60 },
      { question: 'Кто изобрел телефон?', answer: 'Александр Грэм Белл', type: QuestionType.TEXT, orderIndex: 6, timeLimit: 60 },
      { question: 'Сколько костей в теле взрослого человека?', answer: '206 костей', type: QuestionType.TEXT, orderIndex: 7, timeLimit: 60 },
      { question: 'Какой город является столицей Австралии?', answer: 'Канберра', type: QuestionType.TEXT, orderIndex: 8, timeLimit: 60 },
      { question: 'В каком году закончилась Вторая мировая война?', answer: '1945 год', type: QuestionType.TEXT, orderIndex: 9, timeLimit: 60 },
      { question: 'Кто написал "Гамлета"?', answer: 'Уильям Шекспир', type: QuestionType.TEXT, orderIndex: 10, timeLimit: 60 },
      { question: 'Какое самое глубокое место на Земле?', answer: 'Марианская впадина', type: QuestionType.TEXT, orderIndex: 11, timeLimit: 60 },
      { question: 'Сколько сердец у осьминога?', answer: 'Три сердца', type: QuestionType.TEXT, orderIndex: 12, timeLimit: 60 }
    ];

    // Create questions one by one
    for (const data of questionData) {
      const question = this.questionRepository.create({
        ...data,
        package: savedPackage
      });
      await this.questionRepository.save(question);
    }

    return savedPackage;
  }
}