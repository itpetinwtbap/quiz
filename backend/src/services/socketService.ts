import { Server, Socket } from 'socket.io';
import { GameService } from './GameService';

interface GameRoom {
  gameId: string;
  participants: Map<string, {
    socketId: string;
    userName?: string;
    role: 'host' | 'participant' | 'observer';
  }>;
}

export class SocketService {
  private io: Server;
  private gameService: GameService;
  private gameRooms: Map<string, GameRoom> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.gameService = new GameService();
  }

  public initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join game room
      socket.on('join-game', async (data: { gameId: string; userName?: string; role?: string }) => {
        await this.handleJoinGame(socket, data);
      });

      // Leave game room
      socket.on('leave-game', async (data: { gameId: string }) => {
        await this.handleLeaveGame(socket, data);
      });

      // Game state updates
      socket.on('update-game-state', async (data: any) => {
        await this.handleGameStateUpdate(socket, data);
      });

      // Question selection
      socket.on('select-question', async (data: { gameId: string; questionNumber: number }) => {
        await this.handleQuestionSelection(socket, data);
      });

      // Timer controls
      socket.on('timer-control', async (data: { gameId: string; action: 'start' | 'pause' | 'reset'; time?: number }) => {
        await this.handleTimerControl(socket, data);
      });

      // Timer time update
      socket.on('timer-time-update', async (data: { gameId: string; currentTime: number }) => {
        await this.handleTimerTimeUpdate(socket, data);
      });

      // Score updates
      socket.on('update-score', async (data: { gameId: string; team: 'team1' | 'team2'; score: number }) => {
        await this.handleScoreUpdate(socket, data);
      });

      // Card flip
      socket.on('flip-card', async (data: { gameId: string }) => {
        await this.handleCardFlip(socket, data);
      });

      // Random question selection
      socket.on('random-question', async (data: { gameId: string }) => {
        await this.handleRandomQuestion(socket, data);
      });

      // Game log
      socket.on('add-log', async (data: { gameId: string; message: string }) => {
        await this.handleAddLog(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinGame(socket: Socket, data: { gameId: string; userName?: string; role?: string }): Promise<void> {
    try {
      const { gameId, userName, role = 'observer' } = data;
      
      // Join socket room
      socket.join(gameId);

      // Update game room data
      if (!this.gameRooms.has(gameId)) {
        this.gameRooms.set(gameId, {
          gameId,
          participants: new Map()
        });
      }

      const gameRoom = this.gameRooms.get(gameId)!;
      gameRoom.participants.set(socket.id, {
        socketId: socket.id,
        userName,
        role: role as any
      });

      // Create or update game session in database
      await this.gameService.createGameSession(gameId, socket.id, userName, role as any);

      // Send current game state to the new participant
      const gameState = await this.gameService.getGameState(gameId);
      socket.emit('game-state', gameState);

      // Notify other participants
      socket.to(gameId).emit('participant-joined', {
        socketId: socket.id,
        userName,
        role,
        participantsCount: gameRoom.participants.size
      });

      console.log(`User ${socket.id} joined game ${gameId} as ${role}`);
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  }

  private async handleLeaveGame(socket: Socket, data: { gameId: string }): Promise<void> {
    try {
      const { gameId } = data;
      
      socket.leave(gameId);

      const gameRoom = this.gameRooms.get(gameId);
      if (gameRoom) {
        gameRoom.participants.delete(socket.id);
        
        if (gameRoom.participants.size === 0) {
          this.gameRooms.delete(gameId);
        }
      }

      // Update database
      await this.gameService.endGameSession(socket.id);

      // Notify other participants
      socket.to(gameId).emit('participant-left', {
        socketId: socket.id,
        participantsCount: gameRoom?.participants.size || 0
      });

      console.log(`User ${socket.id} left game ${gameId}`);
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }

  private async handleGameStateUpdate(socket: Socket, data: any): Promise<void> {
    try {
      const { gameId, ...updateData } = data;
      
      await this.gameService.updateGameState(gameId, updateData);
      
      // Broadcast to all participants in the game
      this.io.to(gameId).emit('game-state-updated', updateData);
    } catch (error) {
      console.error('Error updating game state:', error);
      socket.emit('error', { message: 'Failed to update game state' });
    }
  }

  private async handleQuestionSelection(socket: Socket, data: { gameId: string; questionNumber: number }): Promise<void> {
    try {
      const { gameId, questionNumber } = data;
      
      const question = await this.gameService.selectQuestion(gameId, questionNumber);
      
      this.io.to(gameId).emit('question-selected', {
        questionNumber,
        question,
        selectedBy: socket.id
      });

      await this.gameService.addGameLog(gameId, `Question ${questionNumber} selected`);
    } catch (error) {
      console.error('Error selecting question:', error);
      socket.emit('error', { message: 'Failed to select question' });
    }
  }

  private async handleTimerControl(socket: Socket, data: { gameId: string; action: 'start' | 'pause' | 'reset'; time?: number }): Promise<void> {
    try {
      const { gameId, action, time } = data;
      
      await this.gameService.controlTimer(gameId, action, time);
      
      this.io.to(gameId).emit('timer-updated', {
        action,
        time,
        controlledBy: socket.id
      });

      await this.gameService.addGameLog(gameId, `Timer ${action}${time ? ` (${time}s)` : ''}`);
    } catch (error) {
      console.error('Error controlling timer:', error);
      socket.emit('error', { message: 'Failed to control timer' });
    }
  }

  private async handleTimerTimeUpdate(socket: Socket, data: { gameId: string; currentTime: number }): Promise<void> {
    try {
      const { gameId, currentTime } = data;
      
      await this.gameService.updateTimerTime(gameId, currentTime);
      
      this.io.to(gameId).emit('timer-time-updated', {
        currentTime,
        updatedBy: socket.id
      });
    } catch (error) {
      console.error('Error updating timer time:', error);
      socket.emit('error', { message: 'Failed to update timer time' });
    }
  }

  private async handleScoreUpdate(socket: Socket, data: { gameId: string; team: 'team1' | 'team2'; score: number }): Promise<void> {
    try {
      const { gameId, team, score } = data;
      
      await this.gameService.updateScore(gameId, team, score);
      
      this.io.to(gameId).emit('score-updated', {
        team,
        score,
        updatedBy: socket.id
      });

      await this.gameService.addGameLog(gameId, `${team} score updated to ${score}`);
    } catch (error) {
      console.error('Error updating score:', error);
      socket.emit('error', { message: 'Failed to update score' });
    }
  }

  private async handleCardFlip(socket: Socket, data: { gameId: string }): Promise<void> {
    try {
      const { gameId } = data;
      
      this.io.to(gameId).emit('card-flipped', {
        flippedBy: socket.id
      });

      await this.gameService.addGameLog(gameId, 'Card flipped');
    } catch (error) {
      console.error('Error flipping card:', error);
    }
  }

  private async handleRandomQuestion(socket: Socket, data: { gameId: string }): Promise<void> {
    try {
      const { gameId } = data;
      
      const result = await this.gameService.selectRandomQuestion(gameId);
      
      this.io.to(gameId).emit('random-question-selected', {
        ...result,
        selectedBy: socket.id
      });

      await this.gameService.addGameLog(gameId, `Random question ${result.questionNumber} selected`);
    } catch (error) {
      console.error('Error selecting random question:', error);
      socket.emit('error', { message: 'Failed to select random question' });
    }
  }

  private async handleAddLog(socket: Socket, data: { gameId: string; message: string }): Promise<void> {
    try {
      const { gameId, message } = data;
      
      await this.gameService.addGameLog(gameId, message);
      
      this.io.to(gameId).emit('log-added', {
        message,
        timestamp: new Date().toISOString(),
        addedBy: socket.id
      });
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    // Clean up any game rooms the user was in
    for (const [gameId, gameRoom] of this.gameRooms.entries()) {
      if (gameRoom.participants.has(socket.id)) {
        gameRoom.participants.delete(socket.id);
        
        // Notify other participants
        socket.to(gameId).emit('participant-left', {
          socketId: socket.id,
          participantsCount: gameRoom.participants.size
        });

        // Remove empty game rooms
        if (gameRoom.participants.size === 0) {
          this.gameRooms.delete(gameId);
        }
      }
    }

    // Update database
    this.gameService.endGameSession(socket.id).catch(console.error);
  }
}

// Initialize socket service
export function initializeSocket(io: Server): void {
  const socketService = new SocketService(io);
  socketService.initialize();
}