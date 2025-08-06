# 🎯 Что Где Когда - Инструкция по запуску

## 🚀 Быстрый старт

### Автоматический запуск (рекомендуется)

**Windows:**
```bash
scripts/start-dev.bat
```

**Linux/macOS:**
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Ручной запуск

1. **Запустить PostgreSQL:**
```bash
docker run -d --name quiz-postgres \
  -e POSTGRES_DB=quiz_db \
  -e POSTGRES_USER=quiz_user \
  -e POSTGRES_PASSWORD=quiz_password \
  -p 5432:5432 \
  postgres:15-alpine
```

2. **Запустить Backend:**
```bash
cd backend
cp env.example .env  # и настроить при необходимости
npm install
npm run dev
```

3. **Запустить Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📱 Доступ к приложению

- **Игра**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🐳 Продакшен (Docker)

```bash
# Создать .env файлы
cp backend/env.example backend/.env

# Запустить все сервисы
docker-compose up -d

# Приложение будет доступно на http://localhost
```

## 📦 Импорт пакетов SIGame

### Через API:
```bash
curl -X POST http://localhost:5000/api/packages/import \
  -H "Content-Type: application/json" \
  -d @examples/sigame-package-example.json
```

### Через браузер:
```javascript
// В консоли браузера на странице игры
const siGameData = { /* ваш JSON пакет */ };
const result = await quizApp.importSIGamePackage(siGameData);
console.log('Импорт завершен:', result);
```

## 🎮 Мультиплеер

1. **Создать игру:**
```javascript
const game = await quizApp.createMultiplayerGame();
console.log('Ссылка для игроков:', game.gameUrl);
```

2. **Присоединиться к игре:**
- Открыть ссылку вида: `http://localhost:3000?game=GAME_ID`
- Или использовать: `quizApp.joinMultiplayerGame(gameId, userName)`

## 🔧 Разработка

### Структура проекта
```
quiz/
├── backend/          # Node.js + Express + TypeScript
├── frontend/         # Модульный JavaScript
├── nginx/           # Reverse proxy
├── scripts/         # Скрипты запуска
├── examples/        # Примеры API и пакетов
└── docker-compose.yml
```

### Горячие клавиши для разработки

1. **Backend изменения**: Автоперезагрузка через nodemon
2. **Frontend изменения**: Автообновление через live-server
3. **TypeScript**: Автокомпиляция при сохранении

### Добавление новых функций

1. **Backend**: Создать контроллер → сервис → маршрут
2. **Frontend**: Добавить модуль в `frontend/src/js/`
3. **API**: Обновить `apiClient.js`
4. **WebSocket**: Добавить события в `socketService.js`

## 🗄️ База данных

### Модели:
- `question_packages` - Пакеты вопросов
- `questions` - Вопросы  
- `games` - Игровые сессии
- `game_sessions` - Участники игр

### Подключение:
```bash
# Прямое подключение к PostgreSQL
docker exec -it quiz-postgres psql -U quiz_user -d quiz_db
```

## 🎯 Особенности

### Совместимость
- ✅ Обратная совместимость с оригинальным интерфейсом
- ✅ Работает как в онлайн, так и в оффлайн режиме
- ✅ Автоматическое переключение между режимами

### Импорт данных
- ✅ Полная поддержка формата SIGame
- ✅ Сохранение метаданных (авторы, темы, раунды)
- ✅ Автоматическое преобразование типов вопросов

### Мультиплеер
- ✅ Синхронизация в реальном времени
- ✅ Управление ролями (хост, участник, наблюдатель)
- ✅ Автоматическое переподключение

## 🔒 Безопасность

### Продакшен настройки:
1. Изменить пароли в `.env`
2. Настроить SSL сертификаты
3. Обновить CORS настройки
4. Настроить rate limiting

### Переменные окружения:
```env
# В backend/.env
NODE_ENV=production
DB_PASSWORD=secure_password
JWT_SECRET=long_random_string
CORS_ORIGIN=https://yourdomain.com
```

## 🚨 Устранение неполадок

### Backend не запускается:
- Проверить порт 5000: `netstat -tulpn | grep 5000`
- Проверить подключение к БД: `docker logs quiz-postgres`
- Проверить .env файл

### Frontend не загружается:
- Проверить порт 3000: `netstat -tulpn | grep 3000`
- Очистить кеш браузера
- Проверить консоль браузера на ошибки

### Мультиплеер не работает:
- Проверить WebSocket подключение в консоли браузера
- Убедиться что backend запущен
- Проверить настройки CORS

### Docker проблемы:
- Очистить контейнеры: `docker system prune`
- Пересобрать образы: `docker-compose build --no-cache`
- Проверить логи: `docker-compose logs`

## 📚 Дополнительные ресурсы

- [API Examples](examples/api-examples.md) - Примеры использования API
- [SIGame Package Example](examples/sigame-package-example.json) - Пример пакета
- [Project README](README-PROJECT.md) - Подробная документация

## 🎉 Готово!

Приложение готово к использованию. Наслаждайтесь игрой! 🎯