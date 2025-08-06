/**
 * Main application entry point
 * Initializes and coordinates all game components
 */

import ApiClient from './api/apiClient.js';
import SocketService from './services/socketService.js';
import GameManager from './components/GameManager.js';
import GameUI from './components/GameUI.js';

class QuizApp {
    constructor() {
        this.apiClient = null;
        this.socketService = null;
        this.gameManager = null;
        this.gameUI = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            console.log('Initializing Quiz App...');

            // Initialize services
            this.apiClient = new ApiClient();
            this.socketService = new SocketService();
            
            // Initialize game manager
            this.gameManager = new GameManager(this.apiClient, this.socketService);
            
            // Initialize UI
            this.gameUI = new GameUI(this.gameManager);

            // Try to connect to socket server
            await this.connectToServer();

            // Initialize game (try to load from URL params or create default)
            await this.initializeGame();

            // Setup page unload handler for state saving
            this.setupPageUnloadHandler();

            // Setup URL change handler
            this.setupUrlChangeHandler();

            this.initialized = true;
            console.log('Quiz App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Quiz App:', error);
            // Continue with offline mode
            await this.initializeOfflineMode();
        }
    }

    async connectToServer() {
        try {
            // Try to connect to the socket server
            this.socketService.connect();
            
            // Wait a bit to see if connection succeeds
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve();
                }, 2000);

                this.socketService.on('connection-status', (data) => {
                    if (data.connected) {
                        clearTimeout(timeout);
                        resolve();
                    }
                });
            });

        } catch (error) {
            console.warn('Could not connect to server, running in offline mode:', error);
            // Don't throw error, continue with offline mode
        }
    }

    async initializeGame() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('game');
        const packageId = urlParams.get('package');

        console.log('Initializing game with params:', { gameId, packageId, url: window.location.href });

        try {
            if (gameId) {
                console.log('Loading existing game:', gameId);
                await this.gameManager.initializeGame(gameId);
            } else if (packageId) {
                console.log('Creating new game with package:', packageId);
                await this.gameManager.initializeGame(null, packageId);
            } else {
                console.log('Starting default game (will create on backend)');
                await this.gameManager.initializeGame();
            }
        } catch (error) {
            console.error('Failed to initialize game:', error);
            // Try to continue with offline mode
            try {
                await this.initializeOfflineMode();
            } catch (offlineError) {
                console.error('Failed to initialize offline mode:', offlineError);
                // Show error to user
                this.showErrorMessage('Не удалось загрузить игру. Попробуйте обновить страницу.');
            }
        }
    }

    showErrorMessage(message) {
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    async initializeOfflineMode() {
        console.log('Initializing offline mode...');
        try {
            await this.gameManager.initializeGame();
        } catch (error) {
            console.error('Failed to initialize offline mode:', error);
            throw error; // Re-throw to be handled by caller
        }
    }

    // Public API for external access
    getApiClient() {
        return this.apiClient;
    }

    getSocketService() {
        return this.socketService;
    }

    getGameManager() {
        return this.gameManager;
    }

    getGameUI() {
        return this.gameUI;
    }

    // Utility methods for integration with existing code
    async createMultiplayerGame(packageId = null) {
        try {
            if (!this.socketService.isConnected) {
                throw new Error('Not connected to server');
            }

            const game = await this.gameManager.initializeGame(null, packageId);
            const gameUrl = `${window.location.origin}${window.location.pathname}?game=${game.id}`;
            
            console.log('Multiplayer game created:', gameUrl);
            return {
                gameId: game.id,
                gameUrl: gameUrl
            };
        } catch (error) {
            console.error('Failed to create multiplayer game:', error);
            this.showErrorMessage('Не удалось создать мультиплеерную игру. Проверьте подключение к серверу.');
            throw error;
        }
    }

    async joinMultiplayerGame(gameId, userName = null) {
        try {
            if (!this.socketService.isConnected) {
                throw new Error('Not connected to server');
            }

            await this.gameManager.initializeGame(gameId);
            this.socketService.joinGame(gameId, userName);
            
            console.log('Joined multiplayer game:', gameId);
            return true;
        } catch (error) {
            console.error('Failed to join multiplayer game:', error);
            this.showErrorMessage('Не удалось присоединиться к игре. Проверьте подключение к серверу.');
            throw error;
        }
    }

    async importSIGamePackage(siGameData) {
        try {
            const result = await this.apiClient.importPackage(siGameData);
            console.log('Package imported successfully:', result.data);
            return result.data;
        } catch (error) {
            console.error('Failed to import package:', error);
            this.showErrorMessage('Не удалось импортировать пакет. Проверьте подключение к серверу.');
            throw error;
        }
    }

    // Legacy function compatibility (for existing onclick handlers)
    setupLegacyCompatibility() {
        // Make functions available globally for existing onclick handlers
        window.selectQuestion = (num) => this.gameManager.selectQuestion(num);
        window.flipCard = () => this.gameManager.flipCard();
        window.selectRandomQuestion = () => this.gameManager.selectRandomQuestion();
        window.shuffleAllQuestions = () => this.gameManager.shuffleQuestions();
        window.setTime = (seconds) => this.gameManager.setTime(seconds);
        window.startTimer = () => this.gameManager.startTimer();
        window.pauseTimer = () => this.gameManager.pauseTimer();
        window.resetTimer = () => this.gameManager.resetTimer();

        // Make app instance available globally
        window.quizApp = this;
    }

    // Export/Import functionality
    exportGameState() {
        const gameState = this.gameManager.getGameState();
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            gameState: {
                ...gameState,
                // Remove any sensitive or runtime-specific data
                id: null,
                sessions: null
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `quiz-game-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    // Save state before page unload
    setupPageUnloadHandler() {
        // Save state before page unload
        window.addEventListener('beforeunload', async () => {
            if (this.gameManager && this.gameManager.gameState.id) {
                try {
                    // Try to force save state first
                    await this.gameManager.forceSaveState();
                } catch (error) {
                    console.warn('Failed to force save state, using sendBeacon:', error);
                    
                    // Fallback to sendBeacon
                    const stateToSave = {
                        team1Score: this.gameManager.gameState.team1Score,
                        team2Score: this.gameManager.gameState.team2Score,
                        currentQuestionId: this.gameManager.gameState.currentQuestion?.id,
                        usedQuestions: this.gameManager.gameState.usedQuestions,
                        isTimerRunning: this.gameManager.gameState.isTimerRunning,
                        currentTimeLeft: this.gameManager.gameState.currentTime,
                        isCardFlipped: this.gameManager.gameState.isCardFlipped,
                        selectedTime: this.gameManager.gameState.selectedTime,
                        currentQuestion: this.gameManager.gameState.currentQuestion
                    };
                    
                    navigator.sendBeacon(
                        `http://localhost:5000/api/games/${this.gameManager.gameState.id}/save-state`,
                        JSON.stringify(stateToSave)
                    );
                }
            }
        });

        // Save state when page becomes hidden (tab switch, minimize, etc.)
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'hidden' && this.gameManager && this.gameManager.gameState.id) {
                try {
                    await this.gameManager.forceSaveState();
                } catch (error) {
                    console.warn('Failed to save state on visibility change:', error);
                }
            }
        });
    }

    setupUrlChangeHandler() {
        window.addEventListener('popstate', async () => {
            if (this.gameManager) {
                const urlParams = new URLSearchParams(window.location.search);
                const gameId = urlParams.get('game');
                
                if (gameId && gameId !== this.gameManager.gameState.id) {
                    console.log('URL changed, reloading game:', gameId);
                    try {
                        await this.gameManager.initializeGame(gameId);
                    } catch (error) {
                        console.error('Failed to reload game from URL:', error);
                    }
                }
            }
        });
    }

    async importGameState(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (importData.version !== '1.0') {
                throw new Error('Unsupported file version');
            }

            await this.gameManager.updateGameState(importData.gameState);
            console.log('Game state imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import game state:', error);
            this.showErrorMessage('Не удалось импортировать состояние игры. Проверьте формат файла.');
            throw error;
        }
    }
}

// Initialize app when DOM is loaded
let app = null;

function initializeApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
        return;
    }

    app = new QuizApp();
    app.setupLegacyCompatibility();
    app.init().catch(error => {
        console.error('App initialization failed:', error);
        // Show error message to user
        if (app && app.showErrorMessage) {
            app.showErrorMessage('Не удалось инициализировать приложение. Попробуйте обновить страницу.');
        }
    });
}

// Start initialization
initializeApp();

// Export for module systems
export default QuizApp;