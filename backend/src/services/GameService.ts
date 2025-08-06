import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../models/Game';
import { GameSession, SessionRole } from '../models/GameSession';
import { Question } from '../models/Question';
import { QuestionService } from './QuestionService';

export class GameService {
  private gameRepository: Repository<Game>;
  private sessionRepository: Repository<GameSession>;
  private questionService: QuestionService;

  constructor() {
    this.gameRepository = AppDataSource.getRepository(Game);
    this.sessionRepository = AppDataSource.getRepository(GameSession);
    this.questionService = new QuestionService();
  }

  public async createGame(gameData: Partial<Game>): Promise<Game> {
    // Find default package if no package specified
    let packageToUse = gameData.package;
    if (!packageToUse) {
      const defaultPackage = await this.questionService.getDefaultPackage();
      if (defaultPackage) {
        packageToUse = defaultPackage;
      } else {
        // Create default package if it doesn't exist
        packageToUse = await this.questionService.createDefaultPackage();
      }
    }

    const game = this.gameRepository.create({
      ...gameData,
      package: packageToUse,
      status: GameStatus.WAITING,
      team1Score: 0,
      team2Score: 0,
      usedQuestions: [],
      gameLog: [{
        timestamp: new Date().toISOString(),
        action: 'Game created'
      }],
      gameState: {
        isCardFlipped: false,
        selectedTime: gameData.defaultTimeLimit || 60,
        currentQuestion: null,
        lastActivity: new Date().toISOString()
      }
    });
    
    return this.gameRepository.save(game);
  }

  public async getGameById(id: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id },
      relations: ['package', 'sessions']
    });
  }

  public async getGameState(gameId: string): Promise<any> {
    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    let questions: Question[] = [];
    if (game.package) {
      questions = await this.questionService.getQuestionsByPackage(game.package.id);
    }

    // Get current question if exists
    let currentQuestion = null;
    if (game.currentQuestionId) {
      currentQuestion = questions.find(q => q.id === game.currentQuestionId);
    }

    // Calculate current time if timer is running
    let currentTimeLeft = game.currentTimeLeft;
    if (game.isTimerRunning && game.gameState?.timerStartTime) {
      const startTime = new Date(game.gameState.timerStartTime);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const initialTime = game.gameState.selectedTime || game.defaultTimeLimit;
      currentTimeLeft = Math.max(0, initialTime - elapsedSeconds);
      
      // If time is up, stop the timer
      if (currentTimeLeft <= 0) {
        game.isTimerRunning = false;
        game.currentTimeLeft = 0;
        const currentGameState = game.gameState || {};
        currentGameState.timerStartTime = undefined;
        game.gameState = {
          ...currentGameState,
          lastActivity: new Date().toISOString()
        };
        await this.gameRepository.save(game);
      }
    }

    return {
      id: game.id,
      name: game.name,
      status: game.status,
      team1Name: game.team1Name,
      team2Name: game.team2Name,
      team1Score: game.team1Score,
      team2Score: game.team2Score,
      defaultTimeLimit: game.defaultTimeLimit,
      usedQuestions: game.usedQuestions || [],
      currentQuestionId: game.currentQuestionId,
      currentQuestion: currentQuestion,
      isTimerRunning: game.isTimerRunning,
      currentTimeLeft: currentTimeLeft,
      gameLog: game.gameLog || [],
      package: game.package,
      questions: questions,
      activeSessions: game.sessions?.filter(s => s.isActive).length || 0,
      // Restore additional state
      isCardFlipped: game.gameState?.isCardFlipped || false,
      selectedTime: game.gameState?.selectedTime || game.defaultTimeLimit,
      lastActivity: game.gameState?.lastActivity || game.updatedAt.toISOString()
    };
  }

  public async updateGameState(gameId: string, updateData: Partial<Game>): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    Object.assign(game, updateData);
    return this.gameRepository.save(game);
  }

  public async saveGameState(gameId: string, stateData: any): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    // Update main game fields
    if (stateData.team1Score !== undefined) game.team1Score = stateData.team1Score;
    if (stateData.team2Score !== undefined) game.team2Score = stateData.team2Score;
    if (stateData.currentQuestionId !== undefined) game.currentQuestionId = stateData.currentQuestionId;
    if (stateData.usedQuestions !== undefined) game.usedQuestions = stateData.usedQuestions;
    if (stateData.isTimerRunning !== undefined) game.isTimerRunning = stateData.isTimerRunning;
    if (stateData.currentTimeLeft !== undefined) game.currentTimeLeft = stateData.currentTimeLeft;

    // Update game state object
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      isCardFlipped: stateData.isCardFlipped !== undefined ? stateData.isCardFlipped : currentGameState.isCardFlipped,
      selectedTime: stateData.selectedTime !== undefined ? stateData.selectedTime : currentGameState.selectedTime,
      currentQuestion: stateData.currentQuestion !== undefined ? stateData.currentQuestion : currentGameState.currentQuestion,
      lastActivity: new Date().toISOString()
    };

    return this.gameRepository.save(game);
  }

  public async selectQuestion(gameId: string, questionNumber: number): Promise<Question | null> {
    const game = await this.getGameById(gameId);
    if (!game || !game.package) {
      throw new Error('Game or package not found');
    }

    const questions = await this.questionService.getQuestionsByPackage(game.package.id);
    const question = questions[questionNumber - 1];

    if (!question) {
      throw new Error('Question not found');
    }

    // Update game state
    game.currentQuestionId = question.id;
    const usedQuestions = game.usedQuestions || [];
    if (!usedQuestions.includes(question.id)) {
      usedQuestions.push(question.id);
      game.usedQuestions = usedQuestions;
    }

    // Update game state object
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      currentQuestion: question,
      lastActivity: new Date().toISOString()
    };

    await this.gameRepository.save(game);
    return question;
  }

  public async selectRandomQuestion(gameId: string): Promise<{ question: Question; questionNumber: number }> {
    const game = await this.getGameById(gameId);
    if (!game || !game.package) {
      throw new Error('Game or package not found');
    }

    const questions = await this.questionService.getQuestionsByPackage(game.package.id);
    const usedQuestions = game.usedQuestions || [];
    const availableQuestions = questions.filter(q => !usedQuestions.includes(q.id));

    if (availableQuestions.length === 0) {
      throw new Error('No available questions');
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    const questionNumber = questions.findIndex(q => q.id === selectedQuestion.id) + 1;

    // Update game state
    game.currentQuestionId = selectedQuestion.id;
    usedQuestions.push(selectedQuestion.id);
    game.usedQuestions = usedQuestions;

    // Update game state object
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      currentQuestion: selectedQuestion,
      lastActivity: new Date().toISOString()
    };

    await this.gameRepository.save(game);
    
    return { question: selectedQuestion, questionNumber };
  }

  public async controlTimer(gameId: string, action: 'start' | 'pause' | 'reset', time?: number): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    const currentGameState = game.gameState || {};

    switch (action) {
      case 'start':
        game.isTimerRunning = true;
        // Set timer start time
        currentGameState.timerStartTime = new Date().toISOString();
        break;
      case 'pause':
        game.isTimerRunning = false;
        // Calculate elapsed time and update currentTimeLeft
        if (currentGameState.timerStartTime) {
          const startTime = new Date(currentGameState.timerStartTime);
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const initialTime = currentGameState.selectedTime || game.defaultTimeLimit;
          game.currentTimeLeft = Math.max(0, initialTime - elapsedSeconds);
        }
        // Clear timer start time
        currentGameState.timerStartTime = undefined;
        break;
      case 'reset':
        game.isTimerRunning = false;
        game.currentTimeLeft = time || game.defaultTimeLimit;
        // Clear timer start time
        currentGameState.timerStartTime = undefined;
        break;
    }

    // Update game state object
    game.gameState = {
      ...currentGameState,
      lastActivity: new Date().toISOString()
    };

    await this.gameRepository.save(game);
  }

  public async updateTimerTime(gameId: string, currentTime: number): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    game.currentTimeLeft = currentTime;
    
    // Update game state object
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      lastActivity: new Date().toISOString()
    };

    await this.gameRepository.save(game);
  }

  public async updateScore(gameId: string, team: 'team1' | 'team2', score: number): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    if (team === 'team1') {
      game.team1Score = score;
    } else {
      game.team2Score = score;
    }

    // Update game state object
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      lastActivity: new Date().toISOString()
    };

    await this.gameRepository.save(game);
  }

  public async addGameLog(gameId: string, message: string, details?: any): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    const gameLog = game.gameLog || [];
    gameLog.push({
      timestamp: new Date().toISOString(),
      action: message,
      details
    });

    game.gameLog = gameLog;
    
    // Update game state object
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      lastActivity: new Date().toISOString()
    };
    
    await this.gameRepository.save(game);
  }

  public async createGameSession(gameId: string, socketId: string, userName?: string, role: SessionRole = SessionRole.OBSERVER): Promise<GameSession> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if session already exists for this socket
    let session = await this.sessionRepository.findOne({
      where: { socketId, game: { id: gameId } }
    });

    if (session) {
      // Update existing session
      session.userName = userName;
      session.role = role;
      session.isActive = true;
      session.lastActivity = new Date();
    } else {
      // Create new session
      session = this.sessionRepository.create({
        socketId,
        userName,
        role,
        isActive: true,
        game
      });
    }

    return this.sessionRepository.save(session);
  }

  public async endGameSession(socketId: string): Promise<void> {
    const sessions = await this.sessionRepository.find({ where: { socketId, isActive: true } });
    
    for (const session of sessions) {
      session.isActive = false;
      await this.sessionRepository.save(session);
    }
  }

  public async getActiveGames(): Promise<Game[]> {
    return this.gameRepository.find({
      where: { status: GameStatus.ACTIVE },
      relations: ['package', 'sessions'],
      order: { createdAt: 'DESC' }
    });
  }

  public async resetGame(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    game.status = GameStatus.WAITING;
    game.team1Score = 0;
    game.team2Score = 0;
    game.usedQuestions = [];
    game.currentQuestionId = undefined;
    game.isTimerRunning = false;
    game.currentTimeLeft = game.defaultTimeLimit;
    game.gameLog = [{
      timestamp: new Date().toISOString(),
      action: 'Game reset'
    }];
    game.gameState = {
      isCardFlipped: false,
      selectedTime: game.defaultTimeLimit,
      currentQuestion: null,
      lastActivity: new Date().toISOString()
    };

    return this.gameRepository.save(game);
  }

  public async deleteGame(gameId: string): Promise<boolean> {
    const result = await this.gameRepository.delete(gameId);
    return result.affected !== 0;
  }

  public async shuffleQuestions(gameId: string): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    game.usedQuestions = [];
    game.currentQuestionId = undefined;
    
    // Update game state
    const currentGameState = game.gameState || {};
    game.gameState = {
      ...currentGameState,
      currentQuestion: null,
      lastActivity: new Date().toISOString()
    };
    
    await this.gameRepository.save(game);
  }
}