class SpinWheel {
    constructor(container, gameManager) {
        console.log('🎰 SpinWheel constructor called!', container);
        this.container = container;
        this.gameManager = gameManager;
        this.segments = 12;
        this.selectedQuestion = null;
        this.isSpinning = false;
        this.isCompleted = false;
        
        this.setupWheel();
    }

    setupWheel() {
        console.log('🔧 setupWheel() called, container:', this.container);
        
        // Очищаем контейнер
        this.container.innerHTML = '';
        
        // Создаем контейнер для колеса
        const wheelContainer = document.createElement('div');
        wheelContainer.className = 'wheel-container';
        
        // Создаем колесо
        const wheel = document.createElement('ul');
        wheel.className = 'wheel';
        wheel.id = 'wheel';
        
        // Создаем сегменты
        for (let i = 0; i < this.segments; i++) {
            const segment = document.createElement('li');
            segment.className = `segment position-${i + 1}-${this.segments}`;
            segment.textContent = (i + 1).toString();
            wheel.appendChild(segment);
        }
        
        // Создаем указатель
        const pointer = document.createElement('div');
        pointer.className = 'wheel-pointer';
        pointer.innerHTML = '▼';
        
        // Создаем кнопку спина
        const spinButton = document.createElement('button');
        spinButton.className = 'spin-button';
        spinButton.textContent = 'КРУТИТЬ';
        spinButton.addEventListener('click', () => this.spin());
        
        // Создаем контейнер для кнопок подтверждения
        const confirmationContainer = document.createElement('div');
        confirmationContainer.className = 'confirmation-container';
        confirmationContainer.style.display = 'none';
        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'confirmation-button accept-button';
        acceptButton.textContent = 'ПРИНЯТЬ';
        acceptButton.addEventListener('click', () => this.acceptQuestion());
        
        const rerollButton = document.createElement('button');
        rerollButton.className = 'confirmation-button reroll-button';
        rerollButton.textContent = 'ПЕРЕКРУТИТЬ';
        rerollButton.addEventListener('click', () => this.rerollQuestion());
        
        confirmationContainer.appendChild(acceptButton);
        confirmationContainer.appendChild(rerollButton);
        
        // Собираем все вместе
        wheelContainer.appendChild(wheel);
        wheelContainer.appendChild(pointer);
        wheelContainer.appendChild(spinButton);
        wheelContainer.appendChild(confirmationContainer);
        
        this.container.appendChild(wheelContainer);
        
        // Добавляем стили
        this.addWheelStyles();
        
        console.log('✅ Wheel initialized successfully');
    }

    addWheelStyles() {
        if (document.getElementById('wheel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'wheel-styles';
        style.textContent = `
            .wheel-container {
                position: relative;
                width: 350px;
                height: 350px;
                margin: 10px auto;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .wheel {
                list-style: none;
                position: relative;
                transform-origin: center;
                width: 300px;
                height: 300px;
                border-radius: 50%;
                border: 4px solid #8B4513;
                background: conic-gradient(
                    #ff6b6b 0deg 30deg,
                    #4ecdc4 30deg 60deg,
                    #45b7d1 60deg 90deg,
                    #96ceb4 90deg 120deg,
                    #ffeaa7 120deg 150deg,
                    #dda0dd 150deg 180deg,
                    #98d8c8 180deg 210deg,
                    #f7dc6f 210deg 240deg,
                    #bb8fce 240deg 270deg,
                    #85c1e9 270deg 300deg,
                    #f8c471 300deg 330deg,
                    #82e0aa 330deg 360deg
                );
                transition: transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .wheel.rotate {
                animation: spin 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            @keyframes spin {
                100% {
                    transform: rotate(var(--rotate-angle));
                }
            }

            .segment {
                position: absolute;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 20px;
                color: white;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(2px);
                border: 2px solid rgba(255, 255, 255, 0.3);
                /* ВАЖНО: сегменты крутятся вместе с колесом! */
                transform-origin: center;
            }

            /* Позиции для 12 сегментов - относительно центра колеса */
            .position-1-12 { transform: translate(0px, -120px); }
            .position-2-12 { transform: translate(60px, -104px); }
            .position-3-12 { transform: translate(104px, -60px); }
            .position-4-12 { transform: translate(120px, 0px); }
            .position-5-12 { transform: translate(104px, 60px); }
            .position-6-12 { transform: translate(60px, 104px); }
            .position-7-12 { transform: translate(0px, 120px); }
            .position-8-12 { transform: translate(-60px, 104px); }
            .position-9-12 { transform: translate(-104px, 60px); }
            .position-10-12 { transform: translate(-120px, 0px); }
            .position-11-12 { transform: translate(-104px, -60px); }
            .position-12-12 { transform: translate(-60px, -104px); }

            .wheel-pointer {
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 40px;
                color: #ff0000;
                z-index: 10;
                text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
                font-weight: bold;
            }

            .spin-button {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 4px solid #fff;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: bold;
                font-size: 12px;
                cursor: pointer;
                z-index: 5;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }

            .spin-button:hover {
                transform: translate(-50%, -50%) scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            }

            .spin-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: translate(-50%, -50%) scale(1);
            }

            .confirmation-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                gap: 10px;
                z-index: 15;
            }

            .confirmation-button {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }

            .accept-button {
                background: #4CAF50;
                color: white;
            }

            .accept-button:hover {
                background: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            }

            .reroll-button {
                background: #f44336;
                color: white;
            }

            .reroll-button:hover {
                background: #da190b;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
            }

            .segment.used {
                background: rgba(128, 128, 128, 0.8) !important;
                color: #ccc !important;
            }
        `;
        document.head.appendChild(style);
    }

    async spin() {
        if (this.isSpinning) {
            console.log('🎰 Wheel is already spinning');
            return;
        }

        // Скрываем кнопки подтверждения
        this.hideConfirmationButtons();

        // Получаем доступные вопросы
        const gameState = this.gameManager.getGameState();
        const allQuestions = gameState.questions || [];
        const usedQuestions = gameState.usedQuestions || [];
        
        // Фильтруем доступные вопросы
        const availableQuestions = allQuestions.filter(q => 
            !usedQuestions.includes(q.id.toString())
        );
        
        if (availableQuestions.length === 0) {
            this.showMessage('Все вопросы использованы!');
            return;
        }

        const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        const questionNumber = parseInt(randomQuestion.id);
        
        console.log('🎰 Spinning wheel to question:', questionNumber);

        // Устанавливаем CSS переменную для угла поворота
        // Указатель сверху (12 часов), сегмент 1 тоже сверху
        // Нужно повернуть колесо так, чтобы нужный сегмент оказался сверху под указателем
        const segmentAngle = 360 / this.segments; // 30 градусов на сегмент
        const targetAngle = (questionNumber - 1) * segmentAngle;
        
        // Добавляем 4 полных оборота + точный угол для нужного сегмента
        const totalRotation = 4 * 360 + targetAngle;
        
        console.log(`🎯 Target angle: ${targetAngle}°, Total rotation: ${totalRotation}°`);
        
        const wheel = this.container.querySelector('.wheel');
        wheel.style.setProperty('--rotate-angle', `${totalRotation}deg`);
        
        // Запускаем анимацию
        this.isSpinning = true;
        wheel.classList.add('rotate');
        
        // Отключаем кнопку
        const spinButton = this.container.querySelector('.spin-button');
        spinButton.disabled = true;
        
        // Ждем окончания анимации
        setTimeout(() => {
            this.isSpinning = false;
            this.isCompleted = true;
            this.selectedQuestion = questionNumber;
            
            console.log('🎯 Spin completed, selected question:', this.selectedQuestion);
            
            // Показываем кнопки подтверждения
            this.showConfirmationButtons();
            
            // Включаем кнопку обратно
            spinButton.disabled = false;
        }, 4000);
    }

    showConfirmationButtons() {
        const confirmationContainer = this.container.querySelector('.confirmation-container');
        if (confirmationContainer) {
            confirmationContainer.style.display = 'flex';
        }
    }

    hideConfirmationButtons() {
        const confirmationContainer = this.container.querySelector('.confirmation-container');
        if (confirmationContainer) {
            confirmationContainer.style.display = 'none';
        }
    }

    async acceptQuestion() {
        if (!this.selectedQuestion) {
            console.log('❌ No question selected');
            return;
        }

        console.log('🎯 ACCEPT QUESTION DEBUG:');
        console.log('  - Selected question from wheel:', this.selectedQuestion);

        // Выбираем вопрос
        this.gameManager.selectQuestion(this.selectedQuestion);
        
        // Отмечаем как использованный
        this.gameManager.markQuestionAsUsed(this.selectedQuestion);
        
        // Обновляем визуально использованный сегмент
        this.updateUsedSegments();
        
        // Переключаемся к отображению вопроса
        this.switchToQuestionView();
        
        // Скрываем кнопки подтверждения
        this.hideConfirmationButtons();
        
        // Сбрасываем состояние
        this.isCompleted = false;
        this.selectedQuestion = null;
    }

    async rerollQuestion() {
        console.log('🔄 Rerolling question');
        this.hideConfirmationButtons();
        this.isCompleted = false;
        this.selectedQuestion = null;
        
        // Убираем класс rotate и сбрасываем transform
        const wheel = this.container.querySelector('.wheel');
        wheel.classList.remove('rotate');
        wheel.style.transform = 'rotate(0deg)';
        
        // Ждем немного и запускаем новый спин
        setTimeout(() => {
            this.spin();
        }, 100);
    }

    switchToQuestionView() {
        // Скрываем колесо
        this.container.style.display = 'none';
        
        // Показываем карточку вопроса
        const questionCard = document.getElementById('questionCard');
        if (questionCard) {
            questionCard.style.display = 'block';
        }
        
        // Показываем кнопку "Вернуться к колесу"
        const backToWheelBtn = document.getElementById('backToWheelBtn');
        if (backToWheelBtn) {
            backToWheelBtn.style.display = 'block';
        }
    }

    resetWheelState() {
        this.selectedQuestion = null;
        this.isSpinning = false;
        this.isCompleted = false;
        this.hideConfirmationButtons();
        
        // Показываем колесо снова
        this.container.style.display = 'block';
        
        // Скрываем карточку вопроса
        const questionCard = document.getElementById('questionCard');
        if (questionCard) {
            questionCard.style.display = 'none';
        }
        
        // Скрываем кнопку "Вернуться к колесу"
        const backToWheelBtn = document.getElementById('backToWheelBtn');
        if (backToWheelBtn) {
            backToWheelBtn.style.display = 'none';
        }
    }

    updateUsedSegments() {
        const gameState = this.gameManager.getGameState();
        const usedQuestions = gameState.usedQuestions || [];
        
        usedQuestions.forEach(questionId => {
            const segment = this.container.querySelector(`.position-${questionId}-${this.segments}`);
            if (segment) {
                segment.classList.add('used');
            }
        });
    }

    showMessage(message) {
        alert(message);
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

export default SpinWheel;