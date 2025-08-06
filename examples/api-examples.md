# API Examples

Примеры использования API веб-приложения "Что Где Когда".

## Импорт пакета вопросов

### Импорт SIGame пакета

```bash
curl -X POST http://localhost:5000/api/packages/import \
  -H "Content-Type: application/json" \
  -d @examples/sigame-package-example.json
```

### Создание простого пакета

```bash
curl -X POST http://localhost:5000/api/packages \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Мой пакет",
    "description": "Описание пакета",
    "author": "Автор"
  }'
```

## Работа с вопросами

### Получить все пакеты

```bash
curl http://localhost:5000/api/packages
```

### Получить пакет с вопросами

```bash
curl http://localhost:5000/api/packages/{package-id}/with-questions
```

### Создать вопрос

```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Вопрос?",
    "answer": "Ответ",
    "type": "text",
    "timeLimit": 60,
    "package": {"id": "package-id"}
  }'
```

## Управление играми

### Создать игру

```bash
curl -X POST http://localhost:5000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Моя игра",
    "team1Name": "Знатоки",
    "team2Name": "Магистры",
    "package": {"id": "package-id"}
  }'
```

### Получить состояние игры

```bash
curl http://localhost:5000/api/games/{game-id}/state
```

### Выбрать вопрос

```bash
curl -X POST http://localhost:5000/api/games/{game-id}/select-question \
  -H "Content-Type: application/json" \
  -d '{"questionNumber": 1}'
```

### Случайный вопрос

```bash
curl -X POST http://localhost:5000/api/games/{game-id}/random-question
```

### Управление таймером

```bash
# Запустить таймер
curl -X POST http://localhost:5000/api/games/{game-id}/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Остановить таймер
curl -X POST http://localhost:5000/api/games/{game-id}/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'

# Сбросить таймер
curl -X POST http://localhost:5000/api/games/{game-id}/timer \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "time": 120}'
```

### Обновить счет

```bash
curl -X POST http://localhost:5000/api/games/{game-id}/score \
  -H "Content-Type: application/json" \
  -d '{"team": "team1", "score": 5}'
```

## WebSocket Events

### Подключение к игре (JavaScript)

```javascript
const socket = io('http://localhost:5000');

// Присоединиться к игре
socket.emit('join-game', {
  gameId: 'game-id',
  userName: 'Игрок',
  role: 'participant'
});

// Слушать события
socket.on('game-state', (gameState) => {
  console.log('Game state:', gameState);
});

socket.on('question-selected', (data) => {
  console.log('Question selected:', data);
});

socket.on('timer-updated', (data) => {
  console.log('Timer updated:', data);
});

// Выбрать вопрос
socket.emit('select-question', {
  gameId: 'game-id',
  questionNumber: 1
});

// Управление таймером
socket.emit('timer-control', {
  gameId: 'game-id',
  action: 'start'
});
```

## Использование в браузере

### Прямое использование API

```javascript
// Импорт пакета
const importPackage = async (siGameData) => {
  const response = await fetch('/api/packages/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(siGameData)
  });
  return response.json();
};

// Создание игры
const createGame = async (packageId) => {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Новая игра',
      package: { id: packageId }
    })
  });
  return response.json();
};
```

### Использование с модульной системой

```javascript
import ApiClient from './src/js/api/apiClient.js';

const api = new ApiClient();

// Получить пакеты
const packages = await api.getPackages();

// Создать игру
const game = await api.createGame({
  name: 'Моя игра',
  package: { id: packages.data[0].id }
});

// Импорт пакета
const importedPackage = await api.importPackage(siGameData);
```

## Мультиплеер

### Создание мультиплеер игры

```javascript
// Создать игру
const game = await quizApp.createMultiplayerGame(packageId);
console.log('Game URL:', game.gameUrl);

// Поделиться ссылкой с другими игроками
// Они могут присоединиться по ссылке: 
// http://localhost:3000?game={game-id}
```

### Присоединение к существующей игре

```javascript
const gameId = new URLSearchParams(window.location.search).get('game');
if (gameId) {
  await quizApp.joinMultiplayerGame(gameId, 'Мое имя');
}
```