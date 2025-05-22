import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              plan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: {
        users,
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

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `user:${id}`;
    const cachedUser = await cache.get(cacheKey);

    if (cachedUser) {
      return res.json({
        status: 'success',
        data: {
          user: cachedUser,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        settings: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await cache.set(cacheKey, user, config.cache.ttl.medium);

    res.json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        settings: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    await cache.del(`user:${id}`);

    res.json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.delete({
      where: { id },
    });

    await cache.del(`user:${id}`);

    res.json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router; 