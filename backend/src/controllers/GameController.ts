import { Request, Response } from 'express';
import { GameService } from '../services/GameService';

export class GameController {
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  public createGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const gameData = req.body;
      const game = await this.gameService.createGame(gameData);
      res.status(201).json({ success: true, data: game });
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({ success: false, error: 'Failed to create game' });
    }
  };

  public getGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const game = await this.gameService.getGameById(id);
      
      if (!game) {
        res.status(404).json({ success: false, error: 'Game not found' });
        return;
      }

      res.json({ success: true, data: game });
    } catch (error) {
      console.error('Error getting game:', error);
      res.status(500).json({ success: false, error: 'Failed to get game' });
    }
  };

  public getGameState = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const gameState = await this.gameService.getGameState(id);
      res.json({ success: true, data: gameState });
    } catch (error) {
      console.error('Error getting game state:', error);
      res.status(500).json({ success: false, error: 'Failed to get game state' });
    }
  };

  public updateGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const game = await this.gameService.updateGameState(id, updateData);
      res.json({ success: true, data: game });
    } catch (error) {
      console.error('Error updating game:', error);
      res.status(500).json({ success: false, error: 'Failed to update game' });
    }
  };

  public deleteGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.gameService.deleteGame(id);
      
      if (!success) {
        res.status(404).json({ success: false, error: 'Game not found' });
        return;
      }

      res.json({ success: true, message: 'Game deleted successfully' });
    } catch (error) {
      console.error('Error deleting game:', error);
      res.status(500).json({ success: false, error: 'Failed to delete game' });
    }
  };

  public getActiveGames = async (req: Request, res: Response): Promise<void> => {
    try {
      const games = await this.gameService.getActiveGames();
      res.json({ success: true, data: games });
    } catch (error) {
      console.error('Error getting active games:', error);
      res.status(500).json({ success: false, error: 'Failed to get active games' });
    }
  };

  public selectQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { questionNumber } = req.body;
      
      const question = await this.gameService.selectQuestion(id, questionNumber);
      res.json({ success: true, data: question });
    } catch (error) {
      console.error('Error selecting question:', error);
      res.status(500).json({ success: false, error: 'Failed to select question' });
    }
  };

  public selectRandomQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.gameService.selectRandomQuestion(id);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error selecting random question:', error);
      res.status(500).json({ success: false, error: 'Failed to select random question' });
    }
  };

  public controlTimer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, time } = req.body;
      
      await this.gameService.controlTimer(id, action, time);
      res.json({ success: true, message: `Timer ${action} successful` });
    } catch (error) {
      console.error('Error controlling timer:', error);
      res.status(500).json({ success: false, error: 'Failed to control timer' });
    }
  };

  public updateScore = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { team, score } = req.body;
      
      await this.gameService.updateScore(id, team, score);
      res.json({ success: true, message: 'Score updated successfully' });
    } catch (error) {
      console.error('Error updating score:', error);
      res.status(500).json({ success: false, error: 'Failed to update score' });
    }
  };

  public addGameLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { message, details } = req.body;
      
      await this.gameService.addGameLog(id, message, details);
      res.json({ success: true, message: 'Log added successfully' });
    } catch (error) {
      console.error('Error adding game log:', error);
      res.status(500).json({ success: false, error: 'Failed to add game log' });
    }
  };

  public resetGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const game = await this.gameService.resetGame(id);
      res.json({ success: true, data: game });
    } catch (error) {
      console.error('Error resetting game:', error);
      res.status(500).json({ success: false, error: 'Failed to reset game' });
    }
  };

  public shuffleQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.gameService.shuffleQuestions(id);
      res.json({ success: true, message: 'Questions shuffled successfully' });
    } catch (error) {
      console.error('Error shuffling questions:', error);
      res.status(500).json({ success: false, error: 'Failed to shuffle questions' });
    }
  };
}