import { createServer } from 'node:http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { initializeSocketServer } from './socket/socketServer.js';

try {
  await connectDatabase();

  const server = createServer(app);
  initializeSocketServer(server);
  server.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
}
