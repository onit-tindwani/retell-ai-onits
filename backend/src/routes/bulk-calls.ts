import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { bulkCallService } from '../services/bulkCall';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all bulk calls for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const bulkCalls = await prisma.bulkCall.findMany({
      where: { userId },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.bulkCall.count({
      where: { userId },
    });

    res.json({
      status: 'success',
      data: {
        bulkCalls,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get bulk call by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bulkCall = await prisma.bulkCall.findUnique({
      where: { id },
    });

    if (!bulkCall) {
      throw new NotFoundError('Bulk call not found');
    }

    if (bulkCall.userId !== userId) {
      throw new NotFoundError('Bulk call not found');
    }

    res.json({
      status: 'success',
      data: {
        bulkCall,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new bulk call
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { contacts, templateId, delayBetweenCalls } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new BadRequestError('Contacts array is required');
    }

    const calls = await bulkCallService.startBulkCall({
      userId,
      contacts,
      templateId,
      delayBetweenCalls,
    });

    res.status(201).json({
      status: 'success',
      data: {
        calls,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get bulk call status
router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bulkCall = await prisma.bulkCall.findUnique({
      where: { id },
    });

    if (!bulkCall) {
      throw new NotFoundError('Bulk call not found');
    }

    if (bulkCall.userId !== userId) {
      throw new NotFoundError('Bulk call not found');
    }

    const status = await bulkCallService.getBulkCallStatus([id]);

    res.json({
      status: 'success',
      data: {
        status: status[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Cancel bulk call
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bulkCall = await prisma.bulkCall.findUnique({
      where: { id },
    });

    if (!bulkCall) {
      throw new NotFoundError('Bulk call not found');
    }

    if (bulkCall.userId !== userId) {
      throw new NotFoundError('Bulk call not found');
    }

    const result = await bulkCallService.cancelBulkCall([id]);

    res.json({
      status: 'success',
      data: {
        result: result[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get bulk call stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const stats = await bulkCallService.getBulkCallStats(userId);

    res.json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 