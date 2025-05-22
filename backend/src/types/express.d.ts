import { Auth0Request } from 'express-oauth2-jwt-bearer';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
      startTime?: number;
    }
  }
} 