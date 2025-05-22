import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config';

// Security headers middleware
export const securityHeaders = helmet();

// CORS middleware
export const corsMiddleware = cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// XSS protection middleware
export const xssProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

// Content Security Policy middleware
export const contentSecurityPolicy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );
  next();
};

// Prevent clickjacking middleware
export const preventClickjacking = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// Prevent MIME type sniffing middleware
export const preventMimeSniffing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// Referrer Policy middleware
export const referrerPolicy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// Feature Policy middleware
export const featurePolicy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  next();
}; 