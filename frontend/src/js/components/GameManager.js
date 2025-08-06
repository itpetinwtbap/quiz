/**
 * Game Manager - handles game state and coordination between components
 */
class GameManager {
    constructor(apiClient, socketService) {
        this.api = apiClient;
        this.socketService = socketService;
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
        this.saveStateTimeout = null;

        this.setupSocketEventHandlers();
    }

    setupSocketEventHandlers() {
        // Game state synchronization
        this.socketService.on('game-state-updated', (gameState) => {
            this.updateGameState(gameState);
        });

        // Question selection
        this.socketService.on('question-selected', (data) => {
            this.handleQuestionSelected(data);
        });

        this.socketService.on('random-question-selected', (data) => {
            this.handleRandomQuestionSelected(data);
        });

        // Timer events
        this.socketService.on('timer-updated', (data) => {
            this.handleTimerUpdate(data);
        });

        // Score updates
        this.socketService.on('score-updated', (data) => {
            this.handleScoreUpdate(data);
        });

        // Card flip
        this.socketService.on('card-flipped', (data) => {
            this.handleCardFlip(data);
        });

        // Log updates
        this.socketService.on('log-added', (data) => {
            this.handleLogAdded(data);
        });

        // Connection status
        this.socketService.on('connection-status', (data) => {
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
        console.log('GameManager.initializeGame called with:', { gameId, packageId });
        
        try {
            if (gameId) {
                // Load existing game
                const response = await this.api.getGameState(gameId);
                const restoredState = response.data;
                
                // Restore complete game state
                this.updateGameState({
                    ...restoredState,
                    // Ensure we have all required fields
                    currentQuestion: restoredState.currentQuestion || null,
                    isCardFlipped: restoredState.isCardFlipped || false,
                    selectedTime: restoredState.selectedTime || restoredState.defaultTimeLimit,
                    currentTime: restoredState.currentTimeLeft || restoredState.defaultTimeLimit,
                    usedQuestions: restoredState.usedQuestions || []
                });
                
                console.log('Game state restored:', this.gameState);
                
                // Load additional UI state from localStorage
                const localUIState = this.loadUIStateFromLocal();
                if (localUIState) {
                    // Merge localStorage state with backend state
                    this.updateGameState({
                        isCardFlipped: localUIState.isCardFlipped !== undefined ? localUIState.isCardFlipped : (this.gameState.isCardFlipped || false),
                        usedQuestions: localUIState.usedQuestions || this.gameState.usedQuestions || [],
                        team1Score: localUIState.team1Score !== undefined ? localUIState.team1Score : this.gameState.team1Score,
                        team2Score: localUIState.team2Score !== undefined ? localUIState.team2Score : this.gameState.team2Score,
                        selectedTime: localUIState.selectedTime || this.gameState.selectedTime,
                        gameLog: localUIState.gameLog || this.gameState.gameLog || []
                    });
                    
                    // Restore current question if it exists
                    if (localUIState.currentQuestionId && this.gameState.questions) {
                        const question = this.gameState.questions.find(q => q.id === localUIState.currentQuestionId);
                        if (question) {
                            this.updateGameState({
                                currentQuestion: question,
                                currentQuestionId: question.id
                            });
                        }
                    }
                    
                    console.log('UI state merged from localStorage');
                }
                
                // Restore timer state from backend
                if (this.gameState.isTimerRunning && this.gameState.currentTime !== undefined) {
                    console.log('Restoring timer state from backend:', {
                        isTimerRunning: this.gameState.isTimerRunning,
                        currentTime: this.gameState.currentTime,
                        selectedTime: this.gameState.selectedTime
                    });
                    
                    // Emit timer state to UI for restoration
                    this.emit('timer-state-restored', {
                        isRunning: this.gameState.isTimerRunning,
                        currentTime: this.gameState.currentTime,
                        selectedTime: this.gameState.selectedTime
                    });
                }
                
                // Force UI update after state restoration
                this.emit('game-state-changed', this.gameState);
                
                // Update URL with game ID (in case it was missing)
                this.updateUrlWithGameId(this.gameState.id);
                
                // Join multiplayer if socket connected
                        if (this.socketService.isConnected) {
            this.socketService.joinGame(gameId);
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

                // Update URL with game ID
                this.updateUrlWithGameId(this.gameState.id);

                if (this.socketService.isConnected) {
                    this.socketService.joinGame(this.gameState.id);
                }
            } else {
                // Create new game on backend even for offline mode
                try {
                    console.log('Creating new game on backend...');
                    const gameResponse = await this.api.createGame({
                        name: 'Новая игра',
                        defaultTimeLimit: 60
                    });
                    console.log('Game created successfully:', gameResponse);

                    this.updateGameState({
                        ...gameResponse.data,
                        questions: this.getDefaultQuestions(),
                        package: {
                            name: 'Базовый пакет',
                            description: 'Стандартные вопросы'
                        },
                        gameLog: [{
                            timestamp: new Date().toISOString(),
                            action: 'Игра началась'
                        }]
                    });

                    // Update URL with game ID
                    this.updateUrlWithGameId(this.gameState.id);

                                if (this.socketService.isConnected) {
                this.socketService.joinGame(this.gameState.id);
            }
                } catch (error) {
                    console.warn('Failed to create game on backend, using offline mode:', error);
                    this.initializeOfflineGame();
                }
            }

            this.emit('game-initialized', this.gameState);
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.emit('game-error', error);
            
            // If we have a gameId but failed to load, try to create a new game
            if (gameId && !packageId) {
                console.log('Trying to create new game as fallback...');
                this.initializeOfflineGame();
            } else {
                // Fallback to offline mode
                this.initializeOfflineGame();
            }
        }
    }

    getDefaultQuestions() {
        return [
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
    }

    updateUrlWithGameId(gameId) {
        if (gameId && window.history && window.history.pushState) {
            const url = new URL(window.location);
            url.searchParams.set('game', gameId);
            window.history.pushState({}, '', url);
            console.log('URL updated with game ID:', gameId, 'New URL:', url.toString());
        }
    }

    initializeOfflineGame() {
        this.updateGameState({
            questions: this.getDefaultQuestions(),
            package: {
                name: 'Базовый пакет',
                description: 'Стандартные вопросы'
            },
            gameLog: [{
                timestamp: new Date().toISOString(),
                action: 'Игра началась'
            }]
        });

        this.emit('game-initialized', this.gameState);
    }

    updateGameState(newState) {
        this.gameState = { ...this.gameState, ...newState };
        this.emit('game-state-changed', this.gameState);
        
        // Auto-save state to backend if we have a game ID
        if (this.gameState.id && this.api) {
            this.debouncedSaveState();
        }
    }

    debouncedSaveState() {
        // Clear existing timeout
        if (this.saveStateTimeout) {
            clearTimeout(this.saveStateTimeout);
        }
        
        // Set new timeout for saving state
        this.saveStateTimeout = setTimeout(() => {
            this.saveStateToBackend();
        }, 1000); // Save after 1 second of inactivity
    }

    async saveStateToBackend() {
        try {
            if (!this.gameState.id || !this.api) {
                return;
            }

            const stateToSave = {
                team1Score: this.gameState.team1Score,
                team2Score: this.gameState.team2Score,
                currentQuestionId: this.gameState.currentQuestion?.id,
                usedQuestions: this.gameState.usedQuestions,
                isTimerRunning: this.gameState.isTimerRunning,
                currentTimeLeft: this.gameState.currentTime,
                isCardFlipped: this.gameState.isCardFlipped,
                selectedTime: this.gameState.selectedTime,
                currentQuestion: this.gameState.currentQuestion
            };
            
            console.log('Saving state to backend:', stateToSave);
            await this.api.saveGameState(this.gameState.id, stateToSave);
            console.log('Game state saved to backend');
            
            // Also save to localStorage for better UX
            this.saveUIStateToLocal();
        } catch (error) {
            console.warn('Failed to save game state to backend:', error);
            // Don't throw error to avoid breaking the game flow
            // The game will continue to work in offline mode
        }
    }

    // Save UI state to localStorage for better UX
    saveUIStateToLocal() {
        try {
            const uiState = {
                isCardFlipped: this.gameState.isCardFlipped,
                currentQuestionId: this.gameState.currentQuestion?.id,
                usedQuestions: this.gameState.usedQuestions,
                team1Score: this.gameState.team1Score,
                team2Score: this.gameState.team2Score,
                selectedTime: this.gameState.selectedTime,
                gameLog: this.gameState.gameLog || [],
                lastSaved: new Date().toISOString()
            };
            
            console.log('Saving UI state to localStorage:', uiState);
            localStorage.setItem(`quiz-ui-state-${this.gameState.id}`, JSON.stringify(uiState));
        } catch (error) {
            console.warn('Failed to save UI state to localStorage:', error);
        }
    }

    // Load UI state from localStorage
    loadUIStateFromLocal() {
        try {
            const savedState = localStorage.getItem(`quiz-ui-state-${this.gameState.id}`);
            if (savedState) {
                const uiState = JSON.parse(savedState);
                console.log('Loaded UI state from localStorage:', uiState);
                return uiState;
            }
        } catch (error) {
            console.warn('Failed to load UI state from localStorage:', error);
        }
        return null;
    }

    // Question management
    async selectQuestion(questionNumber) {
        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.selectQuestion(questionNumber);
        } else {
            await this.handleQuestionSelection(questionNumber);
        }
    }

    async handleQuestionSelection(questionNumber) {
        const question = this.gameState.questions[questionNumber - 1];
        if (!question) return;

        this.updateGameState({
            currentQuestion: question,
            currentQuestionId: question.id
        });

        // Mark question as used
        this.markQuestionAsUsed(questionNumber);

        // If card is flipped (showing answer), flip it back to show new question
        if (this.gameState.isCardFlipped) {
            this.updateGameState({ isCardFlipped: false });
            this.emit('card-flipped', { isCardFlipped: false });
        }

        this.addGameLog(`Выбран вопрос ${questionNumber}`);
        this.emit('question-selected', { questionNumber, question });
    }

    handleQuestionSelected(data) {
        this.handleQuestionSelection(data.questionNumber);
    }

    async selectRandomQuestion() {
        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.selectRandomQuestion();
        } else {
            await this.handleRandomSelection();
        }
    }

    async handleRandomSelection() {
        const availableQuestions = this.gameState.questions.filter(q => 
            !this.gameState.usedQuestions.includes(q.id)
        );

        if (availableQuestions.length === 0) {
            this.addGameLog('Все вопросы уже использованы!');
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        const questionNumber = this.gameState.questions.findIndex(q => q.id === selectedQuestion.id) + 1;
        
        await this.selectQuestion(questionNumber);
        this.markQuestionAsUsed(questionNumber);
        
        // If card is flipped (showing answer), flip it back to show new question
        if (this.gameState.isCardFlipped) {
            this.updateGameState({ isCardFlipped: false });
            this.emit('card-flipped', { isCardFlipped: false });
        }
        
        this.addGameLog(`Случайно выбран вопрос ${questionNumber}`);
    }

    handleRandomQuestionSelected(data) {
        this.handleQuestionSelection(data.questionNumber);
        this.markQuestionAsUsed(data.questionNumber);
    }

    markQuestionAsUsed(questionNumber) {
        const usedQuestions = [...this.gameState.usedQuestions];
        const questionId = this.gameState.questions[questionNumber - 1]?.id;
        
        if (questionId && !usedQuestions.includes(questionId)) {
            usedQuestions.push(questionId);
            console.log('Marking question as used:', questionNumber, 'ID:', questionId, 'Used questions:', usedQuestions);
            this.updateGameState({ usedQuestions });
        }
    }

    // Card management
    flipCard() {
        // Allow flipping even without current question (for state restoration)
        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.flipCard();
        } else {
            this.handleCardFlip();
        }
    }

    // Game restart
    restartGame() {
        console.log('Restarting game...');
        
        // Reset all game state
        this.updateGameState({
            team1Score: 0,
            team2Score: 0,
            currentQuestion: null,
            currentQuestionId: null,
            usedQuestions: [],
            isCardFlipped: false,
            isTimerRunning: false,
            currentTime: this.gameState.selectedTime || 60,
            gameLog: [{
                timestamp: new Date().toISOString(),
                action: 'Игра перезапущена'
            }]
        });

        // Clear localStorage for this game
        if (this.gameState.id) {
            try {
                localStorage.removeItem(`quiz-ui-state-${this.gameState.id}`);
                console.log('Cleared localStorage for game:', this.gameState.id);
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
            }
        }

        // Save reset state to backend
        this.forceSaveState();

        // Reset UI
        this.emit('game-restarted');
        
        console.log('Game restarted successfully');
    }

    handleCardFlip(data = null) {
        const currentState = this.gameState.isCardFlipped || false;
        const isCardFlipped = data && data.isCardFlipped !== undefined ? data.isCardFlipped : !currentState;
        console.log('Flipping card from', currentState, 'to', isCardFlipped);
        this.updateGameState({ isCardFlipped });
        this.emit('card-flipped', { isCardFlipped });
    }

    // Timer management
    setTime(seconds) {
        if (this.gameState.isTimerRunning) return;

        this.updateGameState({
            selectedTime: seconds,
            currentTime: seconds,
            currentTimeLeft: seconds
        });

        this.emit('timer-time-set', { time: seconds });
    }

    startTimer() {
        if (this.gameState.isTimerRunning) return;

        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.controlTimer('start');
        } else {
            this.handleTimerStart();
        }
    }

    pauseTimer() {
        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.controlTimer('pause');
        } else {
            this.handleTimerPause();
        }
    }

    resetTimer() {
        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.controlTimer('reset', this.gameState.selectedTime);
        } else {
            this.handleTimerReset();
        }
    }

    handleTimerStart() {
        this.updateGameState({ 
            isTimerRunning: true,
            currentTime: this.gameState.currentTime || this.gameState.selectedTime
        });
        this.addGameLog('Таймер запущен');
        this.emit('timer-started');
        
        // Send timer start command to backend
        this.socketService.emit('timer-control', {
            gameId: this.gameState.id,
            action: 'start',
            time: this.gameState.selectedTime
        });
    }

    handleTimerPause() {
        this.updateGameState({ isTimerRunning: false });
        this.addGameLog('Таймер остановлен');
        this.emit('timer-paused');
        
        // Send timer pause command to backend
        this.socketService.emit('timer-control', {
            gameId: this.gameState.id,
            action: 'pause'
        });
    }

    handleTimerReset() {
        this.updateGameState({
            isTimerRunning: false,
            currentTime: this.gameState.selectedTime
        });
        this.addGameLog('Таймер сброшен');
        this.emit('timer-reset');
        
        // Send timer reset command to backend
        this.socketService.emit('timer-control', {
            gameId: this.gameState.id,
            action: 'reset',
            time: this.gameState.selectedTime
        });
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
    
    // Update timer time (called from UI when timer ticks)
    updateTimerTime(currentTime) {
        this.updateGameState({ currentTime });
        
        // Send time update to backend every 5 seconds
        if (currentTime % 5 === 0) {
            this.socketService.emit('timer-time-update', {
                gameId: this.gameState.id,
                currentTime: currentTime
            });
        }
    }

    // Score management
    updateScore(team, score) {
        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.updateScore(team, score);
        } else {
            this.handleScoreUpdate({ team, score });
        }
    }

    handleScoreUpdate(data) {
        const { team, score } = data;
        const scoreField = team === 'team1' ? 'team1Score' : 'team2Score';
        
        // Update only the score without affecting other state
        this.gameState[scoreField] = score;
        this.emit('score-updated', data);
        
        // Add log entry
        this.addGameLog(`${team} счет изменен на ${score}`);
    }

    // Game log
    addGameLog(message) {
        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message
        };

        const gameLog = [...this.gameState.gameLog, logEntry];
        this.updateGameState({ gameLog });

        if (this.isMultiplayer && this.socketService.isConnected) {
            this.socketService.addLog(message);
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
            currentQuestion: null,
            currentQuestionId: null
        });
        this.addGameLog('Все вопросы перемешаны и доступны снова');
        this.emit('questions-shuffled');
    }

    getGameState() {
        return { ...this.gameState };
    }

    async forceSaveState() {
        if (this.saveStateTimeout) {
            clearTimeout(this.saveStateTimeout);
        }
        await this.saveStateToBackend();
    }
}

export default GameManager;