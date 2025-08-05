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
        }
    }

    async initializeGame() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('game');
        const packageId = urlParams.get('package');

        try {
            if (gameId) {
                console.log('Loading existing game:', gameId);
                await this.gameManager.initializeGame(gameId);
            } else if (packageId) {
                console.log('Creating new game with package:', packageId);
                await this.gameManager.initializeGame(null, packageId);
            } else {
                console.log('Starting default game');
                await this.gameManager.initializeGame();
            }
        } catch (error) {
            console.error('Failed to initialize game:', error);
            await this.initializeOfflineMode();
        }
    }

    async initializeOfflineMode() {
        console.log('Initializing offline mode...');
        try {
            await this.gameManager.initializeGame();
        } catch (error) {
            console.error('Failed to initialize offline mode:', error);
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
    });
}

// Start initialization
initializeApp();

// Export for module systems
export default QuizApp;