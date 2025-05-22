export interface User {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  aiPersonality: string;
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
  sentiment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recording {
  id: string;
  userId: string;
  callId: string;
  url: string;
  duration: number;
  format: string;
  size: number;
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
  cancelAtPeriodEnd: boolean;
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

export interface Auth0User {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  completedCalls: number;
  failedCalls: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface CallTrend {
  timestamp: Date;
  count: number;
  averageDuration: number;
}

export interface SentimentAnalysis {
  overall: string;
  score: number;
  details: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface BulkCallJob {
  id: string;
  userId: string;
  phoneNumbers: string[];
  template?: string;
  status: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  content: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledCall {
  id: string;
  userId: string;
  phoneNumber: string;
  scheduledAt: Date;
  status: string;
  templateId?: string;
  contactId?: string;
  createdAt: Date;
  updatedAt: Date;
} 