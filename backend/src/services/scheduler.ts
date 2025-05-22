import { PrismaClient } from '@prisma/client';
import { Queue } from 'bull';
import logger from '../utils/logger';
import { cache } from '../utils/cache';

const prisma = new PrismaClient();

// Create a Bull queue for scheduled calls
const scheduledCallsQueue = new Queue('scheduled-calls', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
});

export class CallScheduler {
  private static instance: CallScheduler;

  private constructor() {
    this.initializeQueue();
  }

  public static getInstance(): CallScheduler {
    if (!CallScheduler.instance) {
      CallScheduler.instance = new CallScheduler();
    }
    return CallScheduler.instance;
  }

  private initializeQueue() {
    scheduledCallsQueue.process(async (job) => {
      try {
        const { scheduledCallId } = job.data;
        const scheduledCall = await prisma.scheduledCall.findUnique({
          where: { id: scheduledCallId },
          include: { user: true },
        });

        if (!scheduledCall) {
          throw new Error('Scheduled call not found');
        }

        // Create a new call from the scheduled call
        const call = await prisma.call.create({
          data: {
            userId: scheduledCall.userId,
            phoneNumber: scheduledCall.phoneNumber,
            status: 'pending',
            templateId: scheduledCall.templateId,
            contactId: scheduledCall.contactId,
          },
        });

        // Update scheduled call status
        await prisma.scheduledCall.update({
          where: { id: scheduledCallId },
          data: { status: 'completed' },
        });

        // Clear cache for user's scheduled calls
        await cache.del(`scheduled-calls:${scheduledCall.userId}`);

        logger.info(`Scheduled call ${scheduledCallId} processed successfully`);
        return call;
      } catch (error) {
        logger.error('Error processing scheduled call:', error);
        throw error;
      }
    });
  }

  async scheduleCall(data: {
    userId: string;
    phoneNumber: string;
    scheduledAt: Date;
    templateId?: string;
    contactId?: string;
  }) {
    try {
      const scheduledCall = await prisma.scheduledCall.create({
        data: {
          userId: data.userId,
          phoneNumber: data.phoneNumber,
          scheduledAt: data.scheduledAt,
          templateId: data.templateId,
          contactId: data.contactId,
        },
      });

      // Add job to queue
      await scheduledCallsQueue.add(
        { scheduledCallId: scheduledCall.id },
        {
          delay: data.scheduledAt.getTime() - Date.now(),
        }
      );

      // Clear cache for user's scheduled calls
      await cache.del(`scheduled-calls:${data.userId}`);

      return scheduledCall;
    } catch (error) {
      logger.error('Error scheduling call:', error);
      throw error;
    }
  }

  async getScheduledCalls(userId: string) {
    try {
      // Try to get from cache first
      const cachedCalls = await cache.get(`scheduled-calls:${userId}`);
      if (cachedCalls) {
        return cachedCalls;
      }

      const calls = await prisma.scheduledCall.findMany({
        where: { userId },
        orderBy: { scheduledAt: 'asc' },
      });

      // Cache the results for 5 minutes
      await cache.set(`scheduled-calls:${userId}`, calls, 300);

      return calls;
    } catch (error) {
      logger.error('Error fetching scheduled calls:', error);
      throw error;
    }
  }

  async cancelScheduledCall(scheduledCallId: string, userId: string) {
    try {
      const scheduledCall = await prisma.scheduledCall.findUnique({
        where: { id: scheduledCallId },
      });

      if (!scheduledCall || scheduledCall.userId !== userId) {
        throw new Error('Scheduled call not found or unauthorized');
      }

      // Remove job from queue
      const jobs = await scheduledCallsQueue.getJobs(['delayed']);
      const job = jobs.find((j) => j.data.scheduledCallId === scheduledCallId);
      if (job) {
        await job.remove();
      }

      // Update scheduled call status
      await prisma.scheduledCall.update({
        where: { id: scheduledCallId },
        data: { status: 'cancelled' },
      });

      // Clear cache
      await cache.del(`scheduled-calls:${userId}`);

      return true;
    } catch (error) {
      logger.error('Error cancelling scheduled call:', error);
      throw error;
    }
  }
}

export const callScheduler = CallScheduler.getInstance(); 