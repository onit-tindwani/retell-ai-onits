import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit',
  points: 100, // Number of requests
  duration: 60, // Per minute
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.sub || req.ip;
    await rateLimiter.consume(userId);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for user: ${req.user?.sub || req.ip}`);
    res.status(429).json({
      message: 'Too many requests, please try again later',
      retryAfter: error.msBeforeNext / 1000,
    });
  }
}; 