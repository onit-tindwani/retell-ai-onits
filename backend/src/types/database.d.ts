export interface User {
  id: string;
  email: string;
  name: string;
  auth0Id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  notificationEmail: boolean;
  notificationPhone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeId: string;
  status: string;
  plan: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Call {
  id: string;
  userId: string;
  phoneNumber: string;
  status: string;
  duration?: number;
  transcript?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recording {
  id: string;
  callId: string;
  url: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  stripeId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  id: string;
  callId: string;
  sentiment: string;
  topics: string[];
  keywords: string[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkCall {
  id: string;
  userId: string;
  phoneNumbers: string[];
  message: string;
  status: string;
  totalCalls: number;
  completed: number;
  failed: number;
  createdAt: Date;
  updatedAt: Date;
} 