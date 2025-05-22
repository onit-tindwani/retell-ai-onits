import rateLimit from 'express-rate-limit';
import config from '../config';
import { BadRequestError } from '../utils/errors';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  handler: (req, res) => {
    throw new BadRequestError('Rate limit exceeded');
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 