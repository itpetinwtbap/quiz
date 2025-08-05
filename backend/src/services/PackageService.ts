import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { QuestionPackage } from '../models/QuestionPackage';
import { Question, QuestionType } from '../models/Question';
import { QuestionService } from './QuestionService';

interface SIGamePackage {
  name: string;
  author?: string;
  version?: string;
  description?: string;
  rounds: Array<{
    name: string;
    themes: Array<{
      name: string;
      questions: Array<{
        price: number;
        question: string;
        answer: string;
        type?: string;
        sources?: string[];
        comments?: string;
      }>;
    }>;
  }>;
}

export class PackageService {
  private packageRepository: Repository<QuestionPackage>;
  private questionService: QuestionService;

  constructor() {
    this.packageRepository = AppDataSource.getRepository(QuestionPackage);
    this.questionService = new QuestionService();
  }

  public async getPackages(): Promise<QuestionPackage[]> {
    return this.packageRepository.find({
      relations: ['questions'],
      order: { createdAt: 'DESC' }
    });
  }

  public async getPackageById(id: string): Promise<QuestionPackage | null> {
    return this.packageRepository.findOne({
      where: { id },
      relations: ['questions']
    });
  }

  public async getPackageWithQuestions(id: string): Promise<QuestionPackage | null> {
    return this.packageRepository.findOne({
      where: { id },
      relations: ['questions'],
      order: { questions: { orderIndex: 'ASC' } }
    });
  }

  public async createPackage(packageData: Partial<QuestionPackage>): Promise<QuestionPackage> {
    const pkg = this.packageRepository.create(packageData);
    return this.packageRepository.save(pkg);
  }

  public async updatePackage(id: string, updateData: Partial<QuestionPackage>): Promise<QuestionPackage | null> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      return null;
    }

    Object.assign(pkg, updateData);
    return this.packageRepository.save(pkg);
  }

  public async deletePackage(id: string): Promise<boolean> {
    const result = await this.packageRepository.delete(id);
    return result.affected !== 0;
  }

  public async importSIGamePackage(siGameData: SIGamePackage): Promise<QuestionPackage> {
    // Create package
    const packageData: Partial<QuestionPackage> = {
      name: siGameData.name,
      author: siGameData.author,
      version: siGameData.version,
      description: siGameData.description,
      tags: ['imported', 'sigame'],
      metadata: {
        source: 'SIGame',
        importedAt: new Date().toISOString()
      }
    };

    const pkg = await this.createPackage(packageData);

    // Convert SIGame structure to questions
    const questions: Partial<Question>[] = [];
    let orderIndex = 0;

    for (const round of siGameData.rounds) {
      for (const theme of round.themes) {
        for (const siQuestion of theme.questions) {
          const question: Partial<Question> = {
            question: siQuestion.question,
            answer: siQuestion.answer,
            comment: siQuestion.comments,
            type: this.mapSIGameQuestionType(siQuestion.type),
            orderIndex: orderIndex++,
            timeLimit: 60, // Default time limit
            package: pkg,
            metadata: {
              round: round.name,
              theme: theme.name,
              price: siQuestion.price,
              sources: siQuestion.sources
            }
          };

          questions.push(question);
        }
      }
    }

    // Create all questions
    await this.questionService.bulkCreateQuestions(questions);

    // Return package with questions
    return this.getPackageWithQuestions(pkg.id) as Promise<QuestionPackage>;
  }

  private mapSIGameQuestionType(siType?: string): QuestionType {
    switch (siType?.toLowerCase()) {
      case 'image':
        return QuestionType.IMAGE;
      case 'audio':
        return QuestionType.AUDIO;
      case 'video':
        return QuestionType.VIDEO;
      default:
        return QuestionType.TEXT;
    }
  }

  public async getActivePackages(): Promise<QuestionPackage[]> {
    return this.packageRepository.find({
      where: { isActive: true },
      relations: ['questions'],
      order: { createdAt: 'DESC' }
    });
  }

  public async togglePackageStatus(id: string): Promise<QuestionPackage | null> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      return null;
    }

    pkg.isActive = !pkg.isActive;
    return this.packageRepository.save(pkg);
  }
}