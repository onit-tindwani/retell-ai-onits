import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import config from '../config';
import logger from '../utils/logger';

export const initializeWebSocket = (httpServer: HttpServer) => {
  if (!config.features.websocket) {
    return null;
  }

  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);

    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.info('Client joined room:', userId);
    });

    socket.on('leave', (userId: string) => {
      socket.leave(userId);
      logger.info('Client left room:', userId);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const emitCallStatus = (
  io: Server,
  userId: string,
  callId: string,
  status: string,
  data?: any
) => {
  if (!config.features.websocket) {
    return;
  }

  io.to(userId).emit('call:status', {
    callId,
    status,
    data,
  });
};

export const emitBulkCallStatus = (
  io: Server,
  userId: string,
  bulkCallId: string,
  status: string,
  data?: any
) => {
  if (!config.features.websocket) {
    return;
  }

  io.to(userId).emit('bulkCall:status', {
    bulkCallId,
    status,
    data,
  });
};

export const emitAnalyticsUpdate = (
  io: Server,
  userId: string,
  data: any
) => {
  if (!config.features.websocket) {
    return;
  }

  io.to(userId).emit('analytics:update', data);
}; 