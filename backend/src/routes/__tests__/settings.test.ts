import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import settingsRouter from '../settings';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    settings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

describe('Settings Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/settings', settingsRouter);
  });

  describe('GET /api/settings', () => {
    it('should return user settings', async () => {
      const mockSettings = {
        id: '1',
        userId: 'user123',
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        settings: {
          findUnique: jest.fn().mockResolvedValue(mockSettings),
        },
      }));

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
    });

    it('should create default settings if none exist', async () => {
      const defaultSettings = {
        id: '1',
        userId: 'user123',
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        settings: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(defaultSettings),
        },
      }));

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(defaultSettings);
    });

    it('should handle errors when fetching settings', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        settings: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch settings' });
    });
  });

  describe('PUT /api/settings', () => {
    it('should update user settings', async () => {
      const updatedSettings = {
        id: '1',
        userId: 'user123',
        theme: 'dark',
        language: 'es',
        timezone: 'America/New_York',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        settings: {
          upsert: jest.fn().mockResolvedValue(updatedSettings),
        },
      }));

      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', 'Bearer mock-token')
        .send({
          theme: 'dark',
          language: 'es',
          timezone: 'America/New_York',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSettings);
    });

    it('should handle errors when updating settings', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        settings: {
          upsert: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', 'Bearer mock-token')
        .send({
          theme: 'dark',
          language: 'es',
          timezone: 'America/New_York',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update settings' });
    });
  });

  describe('GET /api/settings/profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        aiPersonality: 'friendly',
        notifications: true,
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockResolvedValue(mockUser),
        },
      }));

      const response = await request(app)
        .get('/api/settings/profile')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should handle non-existent user', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .get('/api/settings/profile')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should handle errors when fetching profile', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/settings/profile')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch user profile' });
    });
  });

  describe('PUT /api/settings/profile', () => {
    it('should update user profile', async () => {
      const updatedUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Jane Doe',
        phoneNumber: '+1987654321',
        aiPersonality: 'professional',
        notifications: false,
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          update: jest.fn().mockResolvedValue(updatedUser),
        },
      }));

      const response = await request(app)
        .put('/api/settings/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Jane Doe',
          phoneNumber: '+1987654321',
          aiPersonality: 'professional',
          notifications: false,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
    });

    it('should handle errors when updating profile', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          update: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .put('/api/settings/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Jane Doe',
          phoneNumber: '+1987654321',
          aiPersonality: 'professional',
          notifications: false,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update user profile' });
    });
  });
}); 