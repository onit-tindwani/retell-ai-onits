import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import billingRouter from '../billing';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    billing: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_123' }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_123',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [
            {
              price: {
                unit_amount: 2000,
              },
            },
          ],
        },
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_123_secret',
          },
        },
      }),
      del: jest.fn().mockResolvedValue({ id: 'sub_123' }),
    },
    paymentIntents: {
      list: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'pi_123',
            amount: 2000,
            status: 'succeeded',
            created: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    },
  }));
});

describe('Billing Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/billing', billingRouter);
  });

  describe('GET /api/billing', () => {
    it('should return billing information', async () => {
      const mockBilling = {
        id: '1',
        userId: 'user123',
        plan: 'pro',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        nextBillingDate: new Date(),
        amount: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockResolvedValue(mockBilling),
        },
      }));

      const response = await request(app)
        .get('/api/billing')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBilling);
    });

    it('should handle non-existent billing information', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .get('/api/billing')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Billing information not found' });
    });

    it('should handle errors when fetching billing information', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/billing')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch billing information' });
    });
  });

  describe('POST /api/billing/subscription', () => {
    it('should create a new subscription', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
      };

      const mockBilling = {
        id: '1',
        userId: 'user123',
        plan: 'pro',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        nextBillingDate: new Date(),
        amount: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockResolvedValue(mockUser),
        },
        billing: {
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue(mockBilling),
        },
      }));

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', 'Bearer mock-token')
        .send({
          plan: 'price_123',
          paymentMethodId: 'pm_123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        subscriptionId: 'sub_123',
        clientSecret: 'pi_123_secret',
      });
    });

    it('should handle non-existent user', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', 'Bearer mock-token')
        .send({
          plan: 'price_123',
          paymentMethodId: 'pm_123',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should handle errors when creating subscription', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', 'Bearer mock-token')
        .send({
          plan: 'price_123',
          paymentMethodId: 'pm_123',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create subscription' });
    });
  });

  describe('POST /api/billing/subscription/cancel', () => {
    it('should cancel a subscription', async () => {
      const mockBilling = {
        id: '1',
        userId: 'user123',
        plan: 'pro',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        nextBillingDate: new Date(),
        amount: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockResolvedValue(mockBilling),
          update: jest.fn().mockResolvedValue({
            ...mockBilling,
            plan: 'free',
            stripeSubscriptionId: null,
            nextBillingDate: null,
            amount: 0,
          }),
        },
      }));

      const response = await request(app)
        .post('/api/billing/subscription/cancel')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Subscription cancelled successfully' });
    });

    it('should handle non-existent subscription', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .post('/api/billing/subscription/cancel')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'No active subscription found' });
    });

    it('should handle errors when cancelling subscription', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .post('/api/billing/subscription/cancel')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to cancel subscription' });
    });
  });

  describe('GET /api/billing/payments', () => {
    it('should return payment history', async () => {
      const mockBilling = {
        id: '1',
        userId: 'user123',
        stripeCustomerId: 'cus_123',
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockResolvedValue(mockBilling),
        },
      }));

      const response = await request(app)
        .get('/api/billing/payments')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 'pi_123',
          amount: 2000,
          status: 'succeeded',
          created: expect.any(Number),
        },
      ]);
    });

    it('should return empty array for non-existent customer', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .get('/api/billing/payments')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle errors when fetching payment history', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        billing: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/billing/payments')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch payment history' });
    });
  });
}); 