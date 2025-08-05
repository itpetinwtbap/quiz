import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import { AppDataSource } from './config/database';
import questionRoutes from './routes/questionRoutes';
import packageRoutes from './routes/packageRoutes';
import gameRoutes from './routes/gameRoutes';
import { initializeSocket } from './services/socketService';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // For development
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (for images, assets)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/questions', questionRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/games', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize Socket.io
initializeSocket(io);

// Initialize database and start server
async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();