import { ValidationError } from './errors';

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

export const validateDateTime = (dateTime: string): boolean => {
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)Z$/;
  if (!dateTimeRegex.test(dateTime)) return false;
  const d = new Date(dateTime);
  return d instanceof Date && !isNaN(d.getTime());
};

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError({ fieldName: [`${fieldName} is required`] });
  }
};

export const validateLength = (value: string, fieldName: string, min: number, max: number): void => {
  if (value.length < min || value.length > max) {
    throw new ValidationError({ fieldName: [`${fieldName} must be between ${min} and ${max} characters`] });
  }
};

export const validateEnum = (value: string, fieldName: string, enumValues: string[]): void => {
  if (!enumValues.includes(value)) {
    throw new ValidationError({ fieldName: [`${fieldName} must be one of: ${enumValues.join(', ')}`] });
  }
};

export const validateNumber = (value: number, fieldName: string, min?: number, max?: number): void => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError({ fieldName: [`${fieldName} must be a number`] });
  }
  if (min !== undefined && value < min) {
    throw new ValidationError({ fieldName: [`${fieldName} must be greater than or equal to ${min}`] });
  }
  if (max !== undefined && value > max) {
    throw new ValidationError({ fieldName: [`${fieldName} must be less than or equal to ${max}`] });
  }
};

export const validateArray = (value: any[], fieldName: string, minLength?: number, maxLength?: number): void => {
  if (!Array.isArray(value)) {
    throw new ValidationError({ fieldName: [`${fieldName} must be an array`] });
  }
  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError({ fieldName: [`${fieldName} must have at least ${minLength} items`] });
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError({ fieldName: [`${fieldName} must have at most ${maxLength} items`] });
  }
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const validatePagination = (page: number, limit: number): boolean => {
  return page > 0 && limit > 0 && limit <= 100;
};

export const validateCallStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
  return validStatuses.includes(status);
};

export const validateBulkCallStatus = (status: string): boolean => {
  const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
  return validStatuses.includes(status);
};

export const validateSubscriptionStatus = (status: string): boolean => {
  const validStatuses = ['active', 'canceled', 'past_due', 'trialing'];
  return validStatuses.includes(status);
};

export const validateSubscriptionPlan = (plan: string): boolean => {
  const validPlans = ['free', 'basic', 'premium', 'enterprise'];
  return validPlans.includes(plan);
};

export const validateAnalyticsInterval = (interval: string): boolean => {
  const validIntervals = ['day', 'week', 'month'];
  return validIntervals.includes(interval);
};

export const validateSentiment = (sentiment: string): boolean => {
  const validSentiments = ['positive', 'neutral', 'negative'];
  return validSentiments.includes(sentiment);
};

export const validateUserSettings = (settings: any): void => {
  const errors: Record<string, string[]> = {};

  if (settings.language && typeof settings.language !== 'string') {
    errors.language = ['Language must be a string'];
  }

  if (settings.timezone && typeof settings.timezone !== 'string') {
    errors.timezone = ['Timezone must be a string'];
  }

  if (settings.notificationEmail && !validateEmail(settings.notificationEmail)) {
    errors.notificationEmail = ['Invalid email format'];
  }

  if (settings.notificationPhone && !validatePhoneNumber(settings.notificationPhone)) {
    errors.notificationPhone = ['Invalid phone number format'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
};

export const validateUserProfile = (profile: any): void => {
  const errors: Record<string, string[]> = {};

  if (!profile.name || typeof profile.name !== 'string') {
    errors.name = ['Name is required and must be a string'];
  }

  if (!profile.email || !validateEmail(profile.email)) {
    errors.email = ['Valid email is required'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}; 