import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all calls for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId,
      ...(status && { status: status as string }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      }),
    };

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          recording: true,
          analytics: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.call.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: {
        calls,
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

// Get call by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cacheKey = `call:${id}`;
    const cachedCall = await cache.get(cacheKey);

    if (cachedCall) {
      return res.json({
        status: 'success',
        data: {
          call: cachedCall,
        },
      });
    }

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        recording: true,
        analytics: true,
      },
    });

    if (!call) {
      throw new NotFoundError('Call not found');
    }

    if (call.userId !== userId) {
      throw new NotFoundError('Call not found');
    }

    await cache.set(cacheKey, call, config.cache.ttl.medium);

    res.json({
      status: 'success',
      data: {
        call,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create new call
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new BadRequestError('Phone number is required');
    }

    const call = await prisma.call.create({
      data: {
        userId,
        phoneNumber,
        status: 'pending',
      },
      include: {
        recording: true,
        analytics: true,
      },
    });

    await cache.del(`calls:${userId}`);

    res.status(201).json({
      status: 'success',
      data: {
        call,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update call status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, duration, transcript } = req.body;

    if (!status) {
      throw new BadRequestError('Status is required');
    }

    const call = await prisma.call.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFoundError('Call not found');
    }

    if (call.userId !== userId) {
      throw new NotFoundError('Call not found');
    }

    const updatedCall = await prisma.call.update({
      where: { id },
      data: {
        status,
        ...(duration && { duration }),
        ...(transcript && { transcript }),
      },
      include: {
        recording: true,
        analytics: true,
      },
    });

    await cache.del(`call:${id}`);
    await cache.del(`calls:${userId}`);

    res.json({
      status: 'success',
      data: {
        call: updatedCall,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete call
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const call = await prisma.call.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFoundError('Call not found');
    }

    if (call.userId !== userId) {
      throw new NotFoundError('Call not found');
    }

    await prisma.call.delete({
      where: { id },
    });

    await cache.del(`call:${id}`);
    await cache.del(`calls:${userId}`);

    res.json({
      status: 'success',
      message: 'Call deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router; 