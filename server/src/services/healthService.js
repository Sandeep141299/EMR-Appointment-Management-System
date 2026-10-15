import mongoose from 'mongoose';

const databaseStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function getHealth() {
  const databaseState = databaseStates[mongoose.connection.readyState] || 'unknown';

  return {
    status: databaseState === 'connected' ? 'ok' : 'unavailable',
    database: databaseState,
    timestamp: new Date().toISOString(),
  };
}
