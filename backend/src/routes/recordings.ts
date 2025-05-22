import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { recordingService } from '../services/recordings';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all recordings for current user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, callId, format } = req.query;

    const recordings = await recordingService.getRecordings(userId, {
      callId: callId as string,
      format: format as string,
    });

    res.json({
      status: 'success',
      data: {
        recordings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get recording by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        call: true,
      },
    });

    if (!recording) {
      throw new NotFoundError('Recording not found');
    }

    if (recording.userId !== userId) {
      throw new NotFoundError('Recording not found');
    }

    const url = await recordingService.getRecordingUrl(id, userId);

    res.json({
      status: 'success',
      data: {
        recording: {
          ...recording,
          url,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Upload recording
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { callId, file, format } = req.body;

    if (!callId || !file || !format) {
      throw new BadRequestError('Call ID, file, and format are required');
    }

    const recording = await recordingService.uploadRecording({
      userId,
      callId,
      file: Buffer.from(file),
      format,
    });

    res.status(201).json({
      status: 'success',
      data: {
        recording,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete recording
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await recordingService.deleteRecording(id, userId);

    res.json({
      status: 'success',
      message: 'Recording deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update recording metadata
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { duration, format } = req.body;

    const recording = await recordingService.updateRecordingMetadata(id, userId, {
      duration,
      format,
    });

    res.json({
      status: 'success',
      data: {
        recording,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 