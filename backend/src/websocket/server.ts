import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export function initializeWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = await verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.sub;
    logger.info(`User connected: ${userId}`);

    // Join user's room for private messages
    socket.join(`user:${userId}`);

    // Handle call status updates
    socket.on('call:status', async (data) => {
      try {
        const { callId, status } = data;
        const call = await prisma.call.update({
          where: { id: callId },
          data: { status },
        });

        io.to(`user:${userId}`).emit('call:updated', call);
      } catch (error) {
        logger.error('Error updating call status:', error);
        socket.emit('error', { message: 'Failed to update call status' });
      }
    });

    // Handle real-time transcript updates
    socket.on('call:transcript', async (data) => {
      try {
        const { callId, transcript } = data;
        const call = await prisma.call.update({
          where: { id: callId },
          data: { transcript },
        });

        io.to(`user:${userId}`).emit('call:transcript:updated', call);
      } catch (error) {
        logger.error('Error updating transcript:', error);
        socket.emit('error', { message: 'Failed to update transcript' });
      }
    });

    // Handle recording status updates
    socket.on('recording:status', async (data) => {
      try {
        const { callId, recordingUrl } = data;
        const recording = await prisma.recording.create({
          data: {
            callId,
            userId,
            url: recordingUrl,
            duration: 0, // Will be updated when recording is complete
            size: 0, // Will be updated when recording is complete
            format: 'mp3',
          },
        });

        io.to(`user:${userId}`).emit('recording:created', recording);
      } catch (error) {
        logger.error('Error creating recording:', error);
        socket.emit('error', { message: 'Failed to create recording' });
      }
    });

    // Handle scheduled call reminders
    socket.on('scheduled:reminder', async (data) => {
      try {
        const { scheduledCallId } = data;
        const scheduledCall = await prisma.scheduledCall.findUnique({
          where: { id: scheduledCallId },
        });

        if (scheduledCall) {
          io.to(`user:${userId}`).emit('scheduled:reminder', scheduledCall);
        }
      } catch (error) {
        logger.error('Error sending scheduled call reminder:', error);
        socket.emit('error', { message: 'Failed to send reminder' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
} 