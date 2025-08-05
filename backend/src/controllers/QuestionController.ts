import { Request, Response } from 'express';
import { QuestionService } from '../services/QuestionService';

export class QuestionController {
  private questionService: QuestionService;

  constructor() {
    this.questionService = new QuestionService();
  }

  public getQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { packageId } = req.query;
      const questions = await this.questionService.getQuestions(packageId as string);
      res.json({ success: true, data: questions });
    } catch (error) {
      console.error('Error getting questions:', error);
      res.status(500).json({ success: false, error: 'Failed to get questions' });
    }
  };

  public getQuestionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const question = await this.questionService.getQuestionById(id);
      
      if (!question) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      res.json({ success: true, data: question });
    } catch (error) {
      console.error('Error getting question by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to get question' });
    }
  };

  public createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const questionData = req.body;
      const question = await this.questionService.createQuestion(questionData);
      res.status(201).json({ success: true, data: question });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ success: false, error: 'Failed to create question' });
    }
  };

  public updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const question = await this.questionService.updateQuestion(id, updateData);
      
      if (!question) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      res.json({ success: true, data: question });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ success: false, error: 'Failed to update question' });
    }
  };

  public deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.questionService.deleteQuestion(id);
      
      if (!success) {
        res.status(404).json({ success: false, error: 'Question not found' });
        return;
      }

      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ success: false, error: 'Failed to delete question' });
    }
  };

  public getRandomQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { packageId, excludeIds } = req.query;
      const excludeArray = excludeIds ? (excludeIds as string).split(',') : [];
      
      const question = await this.questionService.getRandomQuestion(
        packageId as string,
        excludeArray
      );
      
      if (!question) {
        res.status(404).json({ success: false, error: 'No available questions found' });
        return;
      }

      res.json({ success: true, data: question });
    } catch (error) {
      console.error('Error getting random question:', error);
      res.status(500).json({ success: false, error: 'Failed to get random question' });
    }
  };
}