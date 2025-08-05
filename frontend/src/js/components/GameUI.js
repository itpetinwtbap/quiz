/**
 * Game UI Controller - manages DOM interactions and visual updates
 */
class GameUI {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.timerInterval = null;
        this.elements = {};
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupGameManagerListeners();
    }

    initializeElements() {
        // Card elements
        this.elements.cardInner = document.getElementById('cardInner');
        this.elements.cardFront = document.getElementById('cardFront');
        this.elements.cardBack = document.getElementById('cardBack');
        this.elements.questionCard = document.querySelector('.question-card');

        // Number buttons grid
        this.elements.numbersGrid = document.getElementById('numbersGrid');

        // Score elements
        this.elements.team1Name = document.getElementById('team1Name');
        this.elements.team2Name = document.getElementById('team2Name');
        this.elements.team1Score = document.getElementById('team1Score');
        this.elements.team2Score = document.getElementById('team2Score');

        // Timer elements
        this.elements.timerDisplay = document.getElementById('timerDisplay');
        this.elements.timeButtons = document.querySelectorAll('.time-btn');

        // Log elements
        this.elements.logList = document.getElementById('logList');

        // Image elements
        this.elements.imageFrame = document.getElementById('imageFrame');
        this.elements.imageUpload = document.getElementById('imageUpload');
        this.elements.previewImage = document.getElementById('previewImage');
    }

    setupEventListeners() {
        // Card click
        if (this.elements.questionCard) {
            this.elements.questionCard.addEventListener('click', () => {
                this.gameManager.flipCard();
            });
        }

        // Score inputs
        if (this.elements.team1Score) {
            this.elements.team1Score.addEventListener('change', (e) => {
                this.gameManager.updateScore('team1', parseInt(e.target.value) || 0);
            });
        }

        if (this.elements.team2Score) {
            this.elements.team2Score.addEventListener('change', (e) => {
                this.gameManager.updateScore('team2', parseInt(e.target.value) || 0);
            });
        }

        // Timer buttons
        this.elements.timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const time = parseInt(e.target.dataset.time);
                if (time) {
                    this.setActiveTimeButton(e.target);
                    this.gameManager.setTime(time);
                }
            });
        });

        // Timer controls
        const startBtn = document.querySelector('.start-btn');
        const pauseBtn = document.querySelector('.pause-btn');
        const resetBtn = document.querySelector('.reset-btn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.gameManager.startTimer());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.gameManager.pauseTimer());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.gameManager.resetTimer());
        }

        // Quick select buttons
        const randomBtn = document.getElementById('randomQuestionBtn');
        const shuffleBtn = document.getElementById('shuffleQuestionsBtn');

        if (randomBtn) {
            randomBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.gameManager.selectRandomQuestion();
            });
        }

        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.gameManager.shuffleQuestions();
            });
        }

        // Image upload
        if (this.elements.imageUpload) {
            this.elements.imageUpload.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }

        if (this.elements.imageFrame) {
            this.elements.imageFrame.addEventListener('click', () => {
                this.elements.imageUpload?.click();
            });

            this.elements.imageFrame.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            });

            this.elements.imageFrame.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) {
                    this.displayImage(file);
                }
            });
        }
    }

    setupGameManagerListeners() {
        // Game state changes
        this.gameManager.on('game-state-changed', (gameState) => {
            this.updateUI(gameState);
        });

        this.gameManager.on('game-initialized', (gameState) => {
            this.generateNumberButtons(gameState.questions.length);
            this.updateUI(gameState);
        });

        // Question events
        this.gameManager.on('question-selected', (data) => {
            this.updateQuestionDisplay(data.question);
            this.markQuestionAsUsed(data.questionNumber);
        });

        // Card flip
        this.gameManager.on('card-flipped', (data) => {
            this.updateCardFlip(data.isCardFlipped);
        });

        // Timer events
        this.gameManager.on('timer-started', () => {
            this.startTimerDisplay();
        });

        this.gameManager.on('timer-paused', () => {
            this.stopTimerDisplay();
        });

        this.gameManager.on('timer-reset', () => {
            this.stopTimerDisplay();
            this.updateTimerDisplay();
        });

        this.gameManager.on('timer-time-set', (data) => {
            this.updateTimerDisplay();
        });

        // Score updates
        this.gameManager.on('score-updated', (data) => {
            this.updateScoreDisplay(data.team, data.score);
        });

        // Log updates
        this.gameManager.on('log-added', (logEntry) => {
            this.addLogEntry(logEntry);
        });

        // Questions shuffled
        this.gameManager.on('questions-shuffled', () => {
            this.resetNumberButtons();
        });

        // Multiplayer status
        this.gameManager.on('multiplayer-status-changed', (data) => {
            this.updateMultiplayerStatus(data.connected);
        });

        // Errors
        this.gameManager.on('game-error', (error) => {
            this.showError(error.message || 'Произошла ошибка');
        });
    }

    updateUI(gameState) {
        // Update team names and scores
        if (this.elements.team1Name) {
            this.elements.team1Name.value = gameState.team1Name || 'Знатоки';
        }
        if (this.elements.team2Name) {
            this.elements.team2Name.value = gameState.team2Name || 'Магистры';
        }
        if (this.elements.team1Score) {
            this.elements.team1Score.value = gameState.team1Score || 0;
        }
        if (this.elements.team2Score) {
            this.elements.team2Score.value = gameState.team2Score || 0;
        }

        // Update timer
        this.updateTimerDisplay();

        // Update used questions
        if (gameState.usedQuestions) {
            gameState.usedQuestions.forEach(questionNum => {
                this.markQuestionAsUsed(parseInt(questionNum));
            });
        }

        // Update current question
        if (gameState.currentQuestion) {
            this.updateQuestionDisplay(gameState.currentQuestion);
        }

        // Update card flip state
        this.updateCardFlip(gameState.isCardFlipped);
    }

    generateNumberButtons(count = 12) {
        if (!this.elements.numbersGrid) return;

        this.elements.numbersGrid.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('used')) {
                    this.gameManager.selectQuestion(i);
                }
            });
            this.elements.numbersGrid.appendChild(btn);
        }
    }

    updateQuestionDisplay(question) {
        if (this.elements.cardFront && question) {
            this.elements.cardFront.innerHTML = `<p>${question.question}</p>`;
        }
        if (this.elements.cardBack && question) {
            this.elements.cardBack.innerHTML = `<p>${question.answer}</p>`;
        }
    }

    updateCardFlip(isFlipped) {
        if (this.elements.cardInner) {
            this.elements.cardInner.classList.toggle('flipped', isFlipped);
        }
    }

    markQuestionAsUsed(questionNumber) {
        const btn = this.elements.numbersGrid?.querySelector(`.number-btn:nth-child(${questionNumber})`);
        if (btn) {
            btn.classList.add('used');
        }
    }

    resetNumberButtons() {
        const buttons = this.elements.numbersGrid?.querySelectorAll('.number-btn');
        if (buttons) {
            buttons.forEach(btn => btn.classList.remove('used'));
        }
    }

    setActiveTimeButton(activeBtn) {
        this.elements.timeButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    startTimerDisplay() {
        this.stopTimerDisplay(); // Clear any existing interval
        
        this.timerInterval = setInterval(() => {
            const gameState = this.gameManager.getGameState();
            if (gameState.isTimerRunning && gameState.currentTime > 0) {
                this.gameManager.updateGameState({
                    currentTime: gameState.currentTime - 1
                });
                this.updateTimerDisplay();
                
                if (gameState.currentTime <= 1) {
                    this.gameManager.pauseTimer();
                    this.gameManager.addGameLog('Время вышло!');
                }
            }
        }, 1000);
    }

    stopTimerDisplay() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        if (!this.elements.timerDisplay) return;

        const gameState = this.gameManager.getGameState();
        const minutes = Math.floor(gameState.currentTime / 60);
        const seconds = gameState.currentTime % 60;
        this.elements.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateScoreDisplay(team, score) {
        const element = this.elements[team + 'Score'];
        if (element) {
            element.value = score;
        }
    }

    addLogEntry(logEntry) {
        if (!this.elements.logList) return;

        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.textContent = `${logEntry.timestamp}: ${logEntry.message}`;
        
        this.elements.logList.appendChild(logItem);
        this.elements.logList.scrollTop = this.elements.logList.scrollHeight;
    }

    updateMultiplayerStatus(connected) {
        // Add visual indicator for multiplayer status
        const indicator = document.querySelector('.multiplayer-indicator') || this.createMultiplayerIndicator();
        indicator.textContent = connected ? '🌐 Онлайн' : '📴 Оффлайн';
        indicator.className = `multiplayer-indicator ${connected ? 'connected' : 'disconnected'}`;
    }

    createMultiplayerIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'multiplayer-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #f56565;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1001;
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.displayImage(file);
        }
    }

    displayImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.elements.previewImage) {
                this.elements.previewImage.src = e.target.result;
                this.elements.previewImage.style.display = 'block';
            }
            const placeholder = document.querySelector('.image-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}

export default GameUI;