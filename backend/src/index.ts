import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { setupSocketHandlers } from './services/socket.service.js';

const httpServer = createServer(app);

// Socket.io setup for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

// Setup socket handlers
setupSocketHandlers(io);

// Export io for use in other modules
export { io };

// Start server
const start = async () => {
  // Start HTTP server FIRST so healthcheck can pass
  httpServer.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });

  // Connect to database in background
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Don't exit - let healthcheck fail naturally if DB is down
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
