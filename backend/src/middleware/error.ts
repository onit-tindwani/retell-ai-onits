import { Request, Response, NextFunction } from 'express';
import { handleError } from '../utils/errors';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = handleError(err);

  // Log error
  logger.error('Error:', {
    error: err,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    status: 'error',
    message: `Not found - ${req.originalUrl}`,
  });
}; 