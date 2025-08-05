/**
 * Socket.io client service for real-time game communication
 */
class SocketService {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.eventHandlers = new Map();
        this.isConnected = false;
    }

    connect(serverUrl = window.location.origin) {
        if (this.socket) {
            this.disconnect();
        }

        // Import socket.io client (assuming it's loaded via CDN or bundled)
        if (typeof io === 'undefined') {
            console.error('Socket.io client not loaded');
            return;
        }

        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.emit('connection-status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.emit('connection-status', { connected: false, reason });
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('socket-error', error);
        });

        // Game-specific event listeners
        this.setupGameEventListeners();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.gameId = null;
        }
    }

    setupGameEventListeners() {
        if (!this.socket) return;

        // Game state events
        this.socket.on('game-state', (gameState) => {
            this.emit('game-state-updated', gameState);
        });

        this.socket.on('game-state-updated', (updateData) => {
            this.emit('game-state-updated', updateData);
        });

        // Question events
        this.socket.on('question-selected', (data) => {
            this.emit('question-selected', data);
        });

        this.socket.on('random-question-selected', (data) => {
            this.emit('random-question-selected', data);
        });

        // Timer events
        this.socket.on('timer-updated', (data) => {
            this.emit('timer-updated', data);
        });

        // Score events
        this.socket.on('score-updated', (data) => {
            this.emit('score-updated', data);
        });

        // Card flip events
        this.socket.on('card-flipped', (data) => {
            this.emit('card-flipped', data);
        });

        // Log events
        this.socket.on('log-added', (data) => {
            this.emit('log-added', data);
        });

        // Participant events
        this.socket.on('participant-joined', (data) => {
            this.emit('participant-joined', data);
        });

        this.socket.on('participant-left', (data) => {
            this.emit('participant-left', data);
        });
    }

    // Event management
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    off(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) return;
        
        const handlers = this.eventHandlers.get(eventName);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    emit(eventName, data) {
        if (!this.eventHandlers.has(eventName)) return;
        
        const handlers = this.eventHandlers.get(eventName);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
            }
        });
    }

    // Game-specific methods
    joinGame(gameId, userName = null, role = 'observer') {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected');
            return;
        }

        this.gameId = gameId;
        this.socket.emit('join-game', { gameId, userName, role });
    }

    leaveGame() {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('leave-game', { gameId: this.gameId });
        this.gameId = null;
    }

    selectQuestion(questionNumber) {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('select-question', {
            gameId: this.gameId,
            questionNumber
        });
    }

    selectRandomQuestion() {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('random-question', {
            gameId: this.gameId
        });
    }

    controlTimer(action, time = null) {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('timer-control', {
            gameId: this.gameId,
            action,
            time
        });
    }

    updateScore(team, score) {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('update-score', {
            gameId: this.gameId,
            team,
            score
        });
    }

    flipCard() {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('flip-card', {
            gameId: this.gameId
        });
    }

    addLog(message) {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('add-log', {
            gameId: this.gameId,
            message
        });
    }

    updateGameState(updateData) {
        if (!this.socket || !this.gameId) return;

        this.socket.emit('update-game-state', {
            gameId: this.gameId,
            ...updateData
        });
    }
}

export default SocketService;