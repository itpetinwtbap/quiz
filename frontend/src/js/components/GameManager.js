/**
 * Game Manager - handles game state and coordination between components
 */
class GameManager {
    constructor(apiClient, socketService) {
        this.api = apiClient;
        this.socket = socketService;
        this.gameState = {
            id: null,
            name: '',
            status: 'waiting',
            team1Name: 'Знатоки',
            team2Name: 'Магистры',
            team1Score: 0,
            team2Score: 0,
            currentQuestion: null,
            isCardFlipped: false,
            usedQuestions: [],
            isTimerRunning: false,
            currentTime: 60,
            selectedTime: 60,
            gameLog: [],
            questions: [],
            package: null
        };

        this.eventHandlers = new Map();
        this.isMultiplayer = false;

        this.setupSocketEventHandlers();
    }

    setupSocketEventHandlers() {
        // Game state synchronization
        this.socket.on('game-state-updated', (gameState) => {
            this.updateGameState(gameState);
        });

        // Question selection
        this.socket.on('question-selected', (data) => {
            this.handleQuestionSelected(data);
        });

        this.socket.on('random-question-selected', (data) => {
            this.handleRandomQuestionSelected(data);
        });

        // Timer events
        this.socket.on('timer-updated', (data) => {
            this.handleTimerUpdate(data);
        });

        // Score updates
        this.socket.on('score-updated', (data) => {
            this.handleScoreUpdate(data);
        });

        // Card flip
        this.socket.on('card-flipped', (data) => {
            this.handleCardFlip(data);
        });

        // Log updates
        this.socket.on('log-added', (data) => {
            this.handleLogAdded(data);
        });

        // Connection status
        this.socket.on('connection-status', (data) => {
            this.isMultiplayer = data.connected;
            this.emit('multiplayer-status-changed', data);
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

    // Game initialization
    async initializeGame(gameId = null, packageId = null) {
        try {
            if (gameId) {
                // Load existing game
                const response = await this.api.getGameState(gameId);
                this.updateGameState(response.data);
                
                // Join multiplayer if socket connected
                if (this.socket.isConnected) {
                    this.socket.joinGame(gameId);
                }
            } else if (packageId) {
                // Create new game with package
                const packageResponse = await this.api.getPackageWithQuestions(packageId);
                const gameResponse = await this.api.createGame({
                    name: `Game with ${packageResponse.data.name}`,
                    package: { id: packageId }
                });

                this.updateGameState({
                    ...gameResponse.data,
                    questions: packageResponse.data.questions,
                    package: packageResponse.data
                });

                if (this.socket.isConnected) {
                    this.socket.joinGame(this.gameState.id);
                }
            } else {
                // Initialize with default questions (offline mode)
                this.initializeOfflineGame();
            }

            this.emit('game-initialized', this.gameState);
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.emit('game-error', error);
            // Fallback to offline mode
            this.initializeOfflineGame();
        }
    }

    initializeOfflineGame() {
        // Default questions from original game
        const defaultQuestions = [
            { id: '1', question: "Что такое черная дыра?", answer: "Область пространства-времени, гравитационное притяжение которой настолько велико, что покинуть её не могут даже объекты, движущиеся со скоростью света" },
            { id: '2', question: "Кто написал 'Войну и мир'?", answer: "Лев Николаевич Толстой" },
            { id: '3', question: "Какой химический элемент обозначается символом Au?", answer: "Золото (Aurum)" },
            { id: '4', question: "В каком году был основан Google?", answer: "1998 год" },
            { id: '5', question: "Какая планета самая большая в Солнечной системе?", answer: "Юпитер" },
            { id: '6', question: "Кто изобрел телефон?", answer: "Александр Грэм Белл" },
            { id: '7', question: "Сколько костей в теле взрослого человека?", answer: "206 костей" },
            { id: '8', question: "Какой город является столицей Австралии?", answer: "Канберра" },
            { id: '9', question: "В каком году закончилась Вторая мировая война?", answer: "1945 год" },
            { id: '10', question: "Кто написал 'Гамлета'?", answer: "Уильям Шекспир" },
            { id: '11', question: "Какое самое глубокое место на Земле?", answer: "Марианская впадина" },
            { id: '12', question: "Сколько сердец у осьминога?", answer: "Три сердца" }
        ];

        this.updateGameState({
            questions: defaultQuestions,
            package: {
                name: 'Базовый пакет',
                description: 'Стандартные вопросы'
            }
        });

        this.emit('game-initialized', this.gameState);
    }

    updateGameState(newState) {
        this.gameState = { ...this.gameState, ...newState };
        this.emit('game-state-changed', this.gameState);
    }

    // Question management
    async selectQuestion(questionNumber) {
        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.selectQuestion(questionNumber);
        } else {
            await this.handleQuestionSelection(questionNumber);
        }
    }

    async handleQuestionSelection(questionNumber) {
        const question = this.gameState.questions[questionNumber - 1];
        if (!question) return;

        this.updateGameState({
            currentQuestion: question
        });

        if (this.gameState.isCardFlipped) {
            this.flipCard();
        }

        this.addGameLog(`Выбран вопрос ${questionNumber}`);
        this.emit('question-selected', { questionNumber, question });
    }

    handleQuestionSelected(data) {
        this.handleQuestionSelection(data.questionNumber);
    }

    async selectRandomQuestion() {
        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.selectRandomQuestion();
        } else {
            await this.handleRandomSelection();
        }
    }

    async handleRandomSelection() {
        const availableNumbers = [];
        for (let i = 1; i <= this.gameState.questions.length; i++) {
            if (!this.gameState.usedQuestions.includes(i.toString())) {
                availableNumbers.push(i);
            }
        }

        if (availableNumbers.length === 0) {
            this.addGameLog('Все вопросы уже использованы!');
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const selectedNumber = availableNumbers[randomIndex];
        
        await this.selectQuestion(selectedNumber);
        this.markQuestionAsUsed(selectedNumber);
        this.addGameLog(`Случайно выбран вопрос ${selectedNumber}`);
    }

    handleRandomQuestionSelected(data) {
        this.handleQuestionSelection(data.questionNumber);
        this.markQuestionAsUsed(data.questionNumber);
    }

    markQuestionAsUsed(questionNumber) {
        const usedQuestions = [...this.gameState.usedQuestions];
        if (!usedQuestions.includes(questionNumber.toString())) {
            usedQuestions.push(questionNumber.toString());
            this.updateGameState({ usedQuestions });
        }
    }

    // Card management
    flipCard() {
        if (!this.gameState.currentQuestion) return;

        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.flipCard();
        } else {
            this.handleCardFlip();
        }
    }

    handleCardFlip(data = null) {
        const isCardFlipped = !this.gameState.isCardFlipped;
        this.updateGameState({ isCardFlipped });
        this.emit('card-flipped', { isCardFlipped });
    }

    // Timer management
    setTime(seconds) {
        if (this.gameState.isTimerRunning) return;

        this.updateGameState({
            selectedTime: seconds,
            currentTime: seconds
        });

        this.emit('timer-time-set', { time: seconds });
    }

    startTimer() {
        if (this.gameState.isTimerRunning) return;

        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.controlTimer('start');
        } else {
            this.handleTimerStart();
        }
    }

    pauseTimer() {
        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.controlTimer('pause');
        } else {
            this.handleTimerPause();
        }
    }

    resetTimer() {
        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.controlTimer('reset', this.gameState.selectedTime);
        } else {
            this.handleTimerReset();
        }
    }

    handleTimerStart() {
        this.updateGameState({ isTimerRunning: true });
        this.addGameLog('Таймер запущен');
        this.emit('timer-started');
    }

    handleTimerPause() {
        this.updateGameState({ isTimerRunning: false });
        this.addGameLog('Таймер остановлен');
        this.emit('timer-paused');
    }

    handleTimerReset() {
        this.updateGameState({
            isTimerRunning: false,
            currentTime: this.gameState.selectedTime
        });
        this.addGameLog('Таймер сброшен');
        this.emit('timer-reset');
    }

    handleTimerUpdate(data) {
        switch (data.action) {
            case 'start':
                this.handleTimerStart();
                break;
            case 'pause':
                this.handleTimerPause();
                break;
            case 'reset':
                this.handleTimerReset();
                break;
        }
    }

    // Score management
    updateScore(team, score) {
        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.updateScore(team, score);
        } else {
            this.handleScoreUpdate({ team, score });
        }
    }

    handleScoreUpdate(data) {
        const { team, score } = data;
        this.updateGameState({ [team + 'Score']: score });
        this.addGameLog(`${team} счет изменен на ${score}`);
        this.emit('score-updated', data);
    }

    // Game log
    addGameLog(message) {
        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message
        };

        const gameLog = [...this.gameState.gameLog, logEntry];
        this.updateGameState({ gameLog });

        if (this.isMultiplayer && this.socket.isConnected) {
            this.socket.addLog(message);
        }

        this.emit('log-added', logEntry);
    }

    handleLogAdded(data) {
        const logEntry = {
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
            message: data.message
        };

        const gameLog = [...this.gameState.gameLog, logEntry];
        this.updateGameState({ gameLog });
        this.emit('log-added', logEntry);
    }

    // Utility methods
    shuffleQuestions() {
        this.updateGameState({
            usedQuestions: [],
            currentQuestion: null
        });
        this.addGameLog('Все вопросы перемешаны и доступны снова');
        this.emit('questions-shuffled');
    }

    getGameState() {
        return { ...this.gameState };
    }
}

export default GameManager;