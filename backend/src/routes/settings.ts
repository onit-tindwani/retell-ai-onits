import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { validateEnum } from '../utils/validation';
import { THEME, LANGUAGE, TIMEZONE, AI_PERSONALITY } from '../utils/constants';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get user settings
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cacheKey = `settings:${userId}`;
    const cachedSettings = await cache.get(cacheKey);

    if (cachedSettings) {
      return res.json(cachedSettings);
    }

    let settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {
          userId,
          theme: THEME.LIGHT,
          language: LANGUAGE.EN,
          timezone: TIMEZONE.UTC,
          aiPersonality: AI_PERSONALITY.PROFESSIONAL,
        },
      });
    }

    await cache.set(cacheKey, settings, config.cache.ttl.medium);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Update user settings
router.put('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { theme, language, timezone, aiPersonality } = req.body;

    if (theme) {
      validateEnum(theme, 'theme', Object.values(THEME));
    }
    if (language) {
      validateEnum(language, 'language', Object.values(LANGUAGE));
    }
    if (timezone) {
      validateEnum(timezone, 'timezone', Object.values(TIMEZONE));
    }
    if (aiPersonality) {
      validateEnum(aiPersonality, 'AI personality', Object.values(AI_PERSONALITY));
    }

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: {
        theme,
        language,
        timezone,
        aiPersonality,
      },
      create: {
        userId,
        theme: theme || THEME.LIGHT,
        language: language || LANGUAGE.EN,
        timezone: timezone || TIMEZONE.UTC,
        aiPersonality: aiPersonality || AI_PERSONALITY.PROFESSIONAL,
      },
    });

    await cache.del(`settings:${userId}`);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cacheKey = `profile:${userId}`;
    const cachedProfile = await cache.get(cacheKey);

    if (cachedProfile) {
      return res.json(cachedProfile);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await cache.set(cacheKey, user, config.cache.ttl.medium);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phoneNumber } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phoneNumber,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await cache.del(`profile:${userId}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router; 