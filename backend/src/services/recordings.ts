import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { cache } from '../utils/cache';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const prisma = new PrismaClient();
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class RecordingService {
  private static instance: RecordingService;

  private constructor() {}

  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  async uploadRecording(data: {
    userId: string;
    callId: string;
    file: Buffer;
    format: string;
  }) {
    try {
      const key = `recordings/${data.userId}/${data.callId}.${data.format}`;

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: data.file,
          ContentType: `audio/${data.format}`,
        })
      );

      // Create recording record
      const recording = await prisma.recording.create({
        data: {
          userId: data.userId,
          callId: data.callId,
          url: key,
          duration: 0, // Will be updated when processing is complete
          size: data.file.length,
          format: data.format,
        },
      });

      // Clear cache
      await cache.del(`recordings:${data.userId}`);

      return recording;
    } catch (error) {
      logger.error('Error uploading recording:', error);
      throw error;
    }
  }

  async getRecordingUrl(recordingId: string, userId: string) {
    try {
      const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
      });

      if (!recording || recording.userId !== userId) {
        throw new Error('Recording not found or unauthorized');
      }

      // Generate signed URL
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: recording.url,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // URL expires in 1 hour
      });

      return signedUrl;
    } catch (error) {
      logger.error('Error getting recording URL:', error);
      throw error;
    }
  }

  async getRecordings(userId: string, filters?: {
    callId?: string;
    format?: string;
  }) {
    try {
      // Try to get from cache first
      const cacheKey = `recordings:${userId}:${JSON.stringify(filters)}`;
      const cachedRecordings = await cache.get(cacheKey);
      if (cachedRecordings) {
        return cachedRecordings;
      }

      const where = {
        userId,
        ...(filters?.callId && { callId: filters.callId }),
        ...(filters?.format && { format: filters.format }),
      };

      const recordings = await prisma.recording.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          call: {
            select: {
              phoneNumber: true,
              status: true,
              duration: true,
              createdAt: true,
            },
          },
        },
      });

      // Cache the results for 5 minutes
      await cache.set(cacheKey, recordings, 300);

      return recordings;
    } catch (error) {
      logger.error('Error fetching recordings:', error);
      throw error;
    }
  }

  async deleteRecording(recordingId: string, userId: string) {
    try {
      const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
      });

      if (!recording || recording.userId !== userId) {
        throw new Error('Recording not found or unauthorized');
      }

      // Delete from S3
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: recording.url,
        })
      );

      // Delete from database
      await prisma.recording.delete({
        where: { id: recordingId },
      });

      // Clear cache
      await cache.del(`recordings:${userId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting recording:', error);
      throw error;
    }
  }

  async updateRecordingMetadata(
    recordingId: string,
    userId: string,
    data: {
      duration?: number;
      format?: string;
    }
  ) {
    try {
      const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
      });

      if (!recording || recording.userId !== userId) {
        throw new Error('Recording not found or unauthorized');
      }

      const updatedRecording = await prisma.recording.update({
        where: { id: recordingId },
        data,
      });

      // Clear cache
      await cache.del(`recordings:${userId}`);

      return updatedRecording;
    } catch (error) {
      logger.error('Error updating recording metadata:', error);
      throw error;
    }
  }
}

export const recordingService = RecordingService.getInstance(); 