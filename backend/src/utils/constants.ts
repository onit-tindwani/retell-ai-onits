export const CALL_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const BULK_CALL_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
} as const;

export const SUBSCRIPTION_PLAN = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const ANALYTICS_INTERVAL = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const;

export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_SETTINGS: (id: string) => `user:${id}:settings`,
  CALL: (id: string) => `call:${id}`,
  CALLS: (userId: string) => `calls:${userId}`,
  RECORDING: (id: string) => `recording:${id}`,
  RECORDINGS: (userId: string) => `recordings:${userId}`,
  BULK_CALL: (id: string) => `bulkCall:${id}`,
  BULK_CALLS: (userId: string) => `bulkCalls:${userId}`,
  ANALYTICS: (userId: string) => `analytics:${userId}`,
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const DEFAULT_SETTINGS = {
  LANGUAGE: 'en',
  TIMEZONE: 'UTC',
  NOTIFICATION_EMAIL: true,
  NOTIFICATION_PHONE: false,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['audio/mpeg', 'audio/wav', 'audio/mp4'],
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
} as const;

export const JWT = {
  EXPIRES_IN: '1d',
  REFRESH_EXPIRES_IN: '7d',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  SUBSCRIPTION_CREATED: 'Subscription created successfully',
  SUBSCRIPTION_CANCELED: 'Subscription canceled successfully',
  PAYMENT_SUCCEEDED: 'Payment succeeded',
} as const;

export const PAYMENT_STATUS = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const LANGUAGE = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
} as const;

export const TIMEZONE = {
  UTC: 'UTC',
  PST: 'PST',
  EST: 'EST',
} as const;

export const AI_PERSONALITY = {
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  CASUAL: 'casual',
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
} as const; 