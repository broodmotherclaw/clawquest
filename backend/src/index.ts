import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp, runStartupChecks } from './app';
import { setSocketServer } from './realtime';

const app = createApp();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

setSocketServer(io);

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-hex-updates', () => {
    socket.join('hex-updates');
    console.log(`Client ${socket.id} joined hex updates`);
  });

  socket.on('join-wafer-updates', () => {
    socket.join('wafer-updates');
    console.log(`Client ${socket.id} joined wafer updates`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🦞 ClawQuest API running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`🤖 Mode: OpenClaw Agents\n`);

  // Run startup checks
  await runStartupChecks();
});
