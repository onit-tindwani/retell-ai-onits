import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, name, auth0Id } = req.body;

    if (!email || !auth0Id) {
      throw new BadRequestError('Email and Auth0 ID are required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        auth0Id,
        settings: {
          create: {
            language: 'en',
            timezone: 'UTC',
            aiPersonality: 'professional',
          },
        },
      },
    });

    await cache.del(`user:${user.id}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cacheKey = `user:${userId}`;
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
      where: { id: userId },
      include: {
        settings: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      settings: user.settings,
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            plan: user.subscription.plan,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
          }
        : null,
    };

    await cache.set(cacheKey, userData, config.cache.ttl.medium);

    res.json({
      status: 'success',
      data: {
        user: userData,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    await cache.del(`user:${userId}`);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.user.delete({
      where: { id: userId },
    });

    await cache.del(`user:${userId}`);

    res.json({
      status: 'success',
      message: 'User account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router; 