import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import logger from '../utils/logger';
import { cache } from '../utils/cache';
import { templateService } from './templates';

const prisma = new PrismaClient();

// Create a Bull queue for bulk calls
const bulkCallsQueue = new Queue('bulk-calls', process.env.REDIS_URL!);

export class BulkCallService {
  private static instance: BulkCallService;

  private constructor() {
    this.initializeQueue();
  }

  public static getInstance(): BulkCallService {
    if (!BulkCallService.instance) {
      BulkCallService.instance = new BulkCallService();
    }
    return BulkCallService.instance;
  }

  private initializeQueue() {
    bulkCallsQueue.process(async (job: any) => {
      try {
        const { userId, phoneNumber, templateId, variables } = job.data;

        // Process template if provided
        let content = '';
        if (templateId) {
          content = await templateService.processTemplate(templateId, variables);
        }

        // Create call record
        const call = await prisma.call.create({
          data: {
            userId,
            phoneNumber,
            status: 'pending',
            templateId,
          },
        });

        // TODO: Integrate with actual calling service (e.g., Twilio)
        // For now, we'll just simulate a successful call
        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: 'completed',
            duration: Math.floor(Math.random() * 300), // Random duration between 0-5 minutes
          },
        });

        logger.info(`Bulk call processed successfully: ${call.id}`);
        return call;
      } catch (error) {
        logger.error('Error processing bulk call:', error);
        throw error;
      }
    });
  }

  async startBulkCall(data: {
    userId: string;
    contacts: Array<{
      phoneNumber: string;
      variables?: Record<string, string>;
    }>;
    templateId?: string;
    delayBetweenCalls?: number; // in milliseconds
  }) {
    try {
      const calls: any[] = [];

      // Add jobs to queue with specified delay
      for (let i = 0; i < data.contacts.length; i++) {
        const contact = data.contacts[i];
        const delay = i * (data.delayBetweenCalls || 0);

        const job = await bulkCallsQueue.add(
          {
            userId: data.userId,
            phoneNumber: contact.phoneNumber,
            templateId: data.templateId,
            variables: contact.variables,
          },
          { delay }
        );

        calls.push({
          jobId: job.id,
          phoneNumber: contact.phoneNumber,
          status: 'queued',
        });
      }

      return calls;
    } catch (error) {
      logger.error('Error starting bulk call:', error);
      throw error;
    }
  }

  async getBulkCallStatus(jobIds: string[]) {
    try {
      const jobs = await Promise.all(
        jobIds.map(async (jobId) => {
          const job = await bulkCallsQueue.getJob(jobId);
          if (!job) {
            return { jobId, status: 'not_found' };
          }

          const state = await job.getState();
          return {
            jobId,
            status: state,
            progress: job.progress(),
            result: job.returnvalue,
            error: job.failedReason,
          };
        })
      );

      return jobs;
    } catch (error) {
      logger.error('Error getting bulk call status:', error);
      throw error;
    }
  }

  async cancelBulkCall(jobIds: string[]) {
    try {
      const results = await Promise.all(
        jobIds.map(async (jobId) => {
          const job = await bulkCallsQueue.getJob(jobId);
          if (!job) {
            return { jobId, success: false, error: 'Job not found' };
          }

          await job.remove();
          return { jobId, success: true };
        })
      );

      return results;
    } catch (error) {
      logger.error('Error cancelling bulk call:', error);
      throw error;
    }
  }

  async getBulkCallStats(userId: string) {
    try {
      const stats = await prisma.call.groupBy({
        by: ['status'],
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        _count: true,
      });

      return stats;
    } catch (error) {
      logger.error('Error getting bulk call stats:', error);
      throw error;
    }
  }
}

export const bulkCallService = BulkCallService.getInstance(); 