import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { UnauthorizedError } from '../utils/errors';
import config from '../config';

const prisma = new PrismaClient();

// Auth0 JWT validation middleware
const checkJwt = auth({
  audience: config.auth0.audience,
  issuerBaseURL: config.auth0.issuer,
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await checkJwt(req, res, (err) => {
      if (err) {
        throw new UnauthorizedError();
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.auth) {
      throw new UnauthorizedError();
    }
    next();
  } catch (error) {
    next(error);
  }
};

// User existence check middleware
export const checkUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.payload.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create user if they don't exist
      const newUser = await prisma.user.create({
        data: {
          auth0Id: userId,
          email: req.auth?.payload.email as string,
          name: req.auth?.payload.name as string,
        },
      });
      req.user = newUser;
    } else {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Subscription check middleware
export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.payload.sub;
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.plan === 'free') {
      return res.status(403).json({ error: 'Subscription required' });
    }

    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
} 