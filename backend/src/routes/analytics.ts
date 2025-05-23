import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { cache } from '../utils/cache';
import { BadRequestError } from '../utils/errors';
import { CACHE_TTL } from '../utils/constants';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get call statistics
router.get('/calls', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    const cacheKey = `analytics:calls:${userId}:${startDate}:${endDate}`;
    const cachedStats = await cache.get(cacheKey);

    if (cachedStats) {
      return res.json(cachedStats);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const calls = await prisma.call.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const stats = {
      totalCalls: calls.length,
      totalDuration: calls.reduce((sum, call) => sum + (call.duration || 0), 0),
      averageDuration: calls.length
        ? calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length
        : 0,
      completedCalls: calls.filter((call) => call.status === 'completed').length,
      failedCalls: calls.filter((call) => call.status === 'failed').length,
      sentimentDistribution: {
        positive: calls.filter((call) => call.sentiment === 'positive').length,
        neutral: calls.filter((call) => call.sentiment === 'neutral').length,
        negative: calls.filter((call) => call.sentiment === 'negative').length,
      },
    };

    await cache.set(cacheKey, stats, CACHE_TTL.SHORT);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get sentiment analysis
router.get('/sentiment', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    const cacheKey = `analytics:sentiment:${userId}:${startDate}:${endDate}`;
    const cachedAnalysis = await cache.get(cacheKey);

    if (cachedAnalysis) {
      return res.json(cachedAnalysis);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const calls = await prisma.call.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
        sentiment: {
          not: null,
        },
      },
    });

    const sentimentCounts = {
      positive: calls.filter((call) => call.sentiment === 'positive').length,
      neutral: calls.filter((call) => call.sentiment === 'neutral').length,
      negative: calls.filter((call) => call.sentiment === 'negative').length,
    };

    const total = calls.length;
    const analysis = {
      overall: total
        ? sentimentCounts.positive > sentimentCounts.negative
          ? 'positive'
          : sentimentCounts.negative > sentimentCounts.positive
          ? 'negative'
          : 'neutral'
        : 'neutral',
      score: total
        ? (sentimentCounts.positive - sentimentCounts.negative) / total
        : 0,
      details: sentimentCounts,
    };

    await cache.set(cacheKey, analysis, CACHE_TTL.SHORT);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// Get call trends
router.get('/trends', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, interval = 'day' } = req.query;

    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    const cacheKey = `analytics:trends:${userId}:${startDate}:${endDate}:${interval}`;
    const cachedTrends = await cache.get(cacheKey);

    if (cachedTrends) {
      return res.json(cachedTrends);
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const calls = await prisma.call.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const trends = [];
    let currentDate = new Date(start);
    const intervalMs = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
    }[interval as string] || 86400000;

    while (currentDate <= end) {
      const nextDate = new Date(currentDate.getTime() + intervalMs);
      const periodCalls = calls.filter(
        (call) =>
          call.createdAt >= currentDate && call.createdAt < nextDate,
      );

      trends.push({
        timestamp: new Date(currentDate),
        count: periodCalls.length,
        averageDuration:
          periodCalls.length
            ? periodCalls.reduce(
                (sum, call) => sum + (call.duration || 0),
                0,
              ) / periodCalls.length
            : 0,
      });

      currentDate = nextDate;
    }

    await cache.set(cacheKey, trends, CACHE_TTL.SHORT);
    res.json(trends);
  } catch (error) {
    next(error);
  }
});

export default router; 