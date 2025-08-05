#!/bin/bash

# Development startup script for Quiz App

echo "🎯 Starting Quiz App in development mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker run -d \
    --name quiz-postgres \
    -e POSTGRES_DB=quiz_db \
    -e POSTGRES_USER=quiz_user \
    -e POSTGRES_PASSWORD=quiz_password \
    -p 5432:5432 \
    postgres:15-alpine 2>/dev/null || echo "PostgreSQL already running"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Start backend
echo "🚀 Starting backend..."
cd backend
if [ ! -f .env ]; then
    cp env.example .env
    echo "📝 Created .env file from template"
fi

npm run dev &
BACKEND_PID=$!

# Start frontend
echo "🌐 Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🚀 Backend: http://localhost:5000"
echo "📊 Database: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker stop quiz-postgres; exit" INT
wait