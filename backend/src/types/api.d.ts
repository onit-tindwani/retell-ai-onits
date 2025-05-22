import { User, UserSettings, Subscription, Call, Recording, Payment, Analytics, BulkCall } from './database';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  status: string;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleResponse<T> {
  status: string;
  data: {
    item: T;
  };
}

export interface MessageResponse {
  status: string;
  message: string;
}

export interface ErrorResponse {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
}

// Auth
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User
export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface UpdateUserSettingsRequest {
  language?: string;
  timezone?: string;
  notificationEmail?: boolean;
  notificationPhone?: boolean;
}

// Call
export interface CreateCallRequest {
  phoneNumber: string;
}

export interface UpdateCallStatusRequest {
  status: string;
  duration?: number;
  transcript?: string;
}

// Recording
export interface CreateRecordingRequest {
  callId: string;
  url: string;
  duration?: number;
}

// Bulk Call
export interface CreateBulkCallRequest {
  phoneNumbers: string[];
  message: string;
}

export interface UpdateBulkCallStatusRequest {
  status: string;
  completed?: number;
  failed?: number;
}

// Analytics
export interface GetAnalyticsRequest extends DateRangeParams {
  interval?: string;
}

// Subscription
export interface CreateSubscriptionRequest {
  plan: string;
}

export interface UpdateSubscriptionRequest {
  status?: string;
  plan?: string;
}

// Payment
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
}

export interface UpdatePaymentRequest {
  status: string;
} 