@echo off

echo 🎯 Starting Quiz App in development mode...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

REM Start PostgreSQL
echo 🐘 Starting PostgreSQL...
docker run -d --name quiz-postgres -e POSTGRES_DB=quiz_db -e POSTGRES_USER=quiz_user -e POSTGRES_PASSWORD=quiz_password -p 5432:5432 postgres:15-alpine >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL already running or failed to start
)

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

REM Start backend
echo 🚀 Starting backend...
cd backend
if not exist .env (
    copy env.example .env >nul
    echo 📝 Created .env file from template
)

start "Backend" cmd /k "npm run dev"

REM Start frontend
echo 🌐 Starting frontend...
cd ..\frontend
start "Frontend" cmd /k "npm run dev"

echo ✅ Development environment started!
echo 🌐 Frontend: http://localhost:3000
echo 🚀 Backend: http://localhost:5000
echo 📊 Database: localhost:5432
echo.
echo Press any key to stop PostgreSQL and exit...
pause >nul

REM Stop PostgreSQL
echo 🛑 Stopping PostgreSQL...
docker stop quiz-postgres >nul 2>&1
docker rm quiz-postgres >nul 2>&1