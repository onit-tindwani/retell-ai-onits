import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import analyticsRouter from '../analytics';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    call: {
      findMany: jest.fn(),
    },
  })),
}));

describe('Analytics Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRouter);
  });

  describe('GET /api/analytics/calls', () => {
    it('should return call statistics', async () => {
      const mockCalls = [
        {
          id: '1',
          userId: 'user123',
          phoneNumber: '+1234567890',
          status: 'completed',
          duration: 300,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId: 'user123',
          phoneNumber: '+1987654321',
          status: 'completed',
          duration: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/calls')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalCalls: 2,
        totalDuration: 900,
        averageDuration: 450,
        statusBreakdown: {
          completed: 2,
        },
      });
    });

    it('should handle date range filters', async () => {
      const mockCalls = [
        {
          id: '1',
          userId: 'user123',
          phoneNumber: '+1234567890',
          status: 'completed',
          duration: 300,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/calls')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.totalCalls).toBe(1);
    });

    it('should handle errors when fetching call statistics', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/calls')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch call statistics' });
    });
  });

  describe('GET /api/analytics/sentiment', () => {
    it('should return sentiment analysis', async () => {
      const mockCalls = [
        {
          transcript: 'This is a great service! I am very happy with it.',
        },
        {
          transcript: 'The service was terrible and I am dissatisfied.',
        },
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/sentiment')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        positive: 2,
        negative: 2,
        neutral: 12,
      });
    });

    it('should handle empty transcripts', async () => {
      const mockCalls = [
        {
          transcript: null,
        },
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/sentiment')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        positive: 0,
        negative: 0,
        neutral: 0,
      });
    });

    it('should handle errors when analyzing sentiment', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/sentiment')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to analyze sentiment' });
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return call trends', async () => {
      const mockCalls = [
        {
          id: '1',
          userId: 'user123',
          phoneNumber: '+1234567890',
          status: 'completed',
          duration: 300,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          userId: 'user123',
          phoneNumber: '+1987654321',
          status: 'completed',
          duration: 600,
          createdAt: new Date('2024-01-01T11:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
        },
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/trends')
        .query({ period: 'hourly' })
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body['2024-01-01T10']).toEqual({
        count: 1,
        duration: 300,
      });
    });

    it('should handle different time periods', async () => {
      const mockCalls = [
        {
          id: '1',
          userId: 'user123',
          phoneNumber: '+1234567890',
          status: 'completed',
          duration: 300,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const periods = ['hourly', 'daily', 'weekly', 'monthly'];
      for (const period of periods) {
        const response = await request(app)
          .get('/api/analytics/trends')
          .query({ period })
          .set('Authorization', 'Bearer mock-token');

        expect(response.status).toBe(200);
        expect(Object.keys(response.body)).toHaveLength(1);
      }
    });

    it('should handle errors when fetching trends', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch call trends' });
    });
  });
}); 