import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateDateRange,
  validatePagination,
  validateCallStatus,
  validateBulkCallStatus,
  validateSubscriptionStatus,
  validateSubscriptionPlan,
  validateAnalyticsInterval,
  validateSentiment,
  validateUserSettings,
  validateUserProfile,
} from '../utils/validation';

export const validatePhoneNumberMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phoneNumber } = req.body;
  if (!validatePhoneNumber(phoneNumber)) {
    throw new ValidationError({
      phoneNumber: ['Invalid phone number format'],
    });
  }
  next();
};

export const validateEmailMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  if (!validateEmail(email)) {
    throw new ValidationError({
      email: ['Invalid email format'],
    });
  }
  next();
};

export const validatePasswordMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body;
  if (!validatePassword(password)) {
    throw new ValidationError({
      password: [
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ],
    });
  }
  next();
};

export const validateDateRangeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { startDate, endDate } = req.query;
  if (startDate && endDate && !validateDateRange(startDate as string, endDate as string)) {
    throw new ValidationError({
      dateRange: ['Invalid date range'],
    });
  }
  next();
};

export const validatePaginationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page, limit } = req.query;
  if (
    !validatePagination(Number(page) || 1, Number(limit) || 10)
  ) {
    throw new ValidationError({
      pagination: ['Invalid pagination parameters'],
    });
  }
  next();
};

export const validateCallStatusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status } = req.body;
  if (!validateCallStatus(status)) {
    throw new ValidationError({
      status: ['Invalid call status'],
    });
  }
  next();
};

export const validateBulkCallStatusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status } = req.body;
  if (!validateBulkCallStatus(status)) {
    throw new ValidationError({
      status: ['Invalid bulk call status'],
    });
  }
  next();
};

export const validateSubscriptionStatusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status } = req.body;
  if (!validateSubscriptionStatus(status)) {
    throw new ValidationError({
      status: ['Invalid subscription status'],
    });
  }
  next();
};

export const validateSubscriptionPlanMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { plan } = req.body;
  if (!validateSubscriptionPlan(plan)) {
    throw new ValidationError({
      plan: ['Invalid subscription plan'],
    });
  }
  next();
};

export const validateAnalyticsIntervalMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { interval } = req.query;
  if (!validateAnalyticsInterval(interval as string)) {
    throw new ValidationError({
      interval: ['Invalid analytics interval'],
    });
  }
  next();
};

export const validateSentimentMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sentiment } = req.body;
  if (!validateSentiment(sentiment)) {
    throw new ValidationError({
      sentiment: ['Invalid sentiment value'],
    });
  }
  next();
};

export const validateUserSettingsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateUserSettings(req.body);
  next();
};

export const validateUserProfileMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateUserProfile(req.body);
  next();
}; 