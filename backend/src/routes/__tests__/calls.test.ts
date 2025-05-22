import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import callsRouter from '../calls';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    call: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

// Mock Twilio client
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    calls: {
      create: jest.fn(),
      update: jest.fn(),
    },
    twiml: {
      VoiceResponse: jest.fn().mockImplementation(() => ({
        say: jest.fn().mockReturnThis(),
        toString: jest.fn().mockReturnValue('<Response><Say>Hello</Say></Response>'),
      })),
    },
  }));
});

// Mock OpenAI client
jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn().mockImplementation(() => ({
    createChatCompletion: jest.fn().mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: 'Hello, this is an AI assistant.',
            },
          },
        ],
      },
    }),
  })),
}));

describe('Calls Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/calls', callsRouter);
  });

  describe('GET /api/calls', () => {
    it('should return all calls for a user', async () => {
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
      ];

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockResolvedValue(mockCalls),
        },
      }));

      const response = await request(app)
        .get('/api/calls')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCalls);
    });

    it('should handle errors when fetching calls', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .get('/api/calls')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch calls' });
    });
  });

  describe('POST /api/calls', () => {
    it('should create a new call', async () => {
      const mockCall = {
        id: '1',
        userId: 'user123',
        phoneNumber: '+1234567890',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          create: jest.fn().mockResolvedValue(mockCall),
          update: jest.fn().mockResolvedValue(mockCall),
        },
      }));

      const response = await request(app)
        .post('/api/calls')
        .set('Authorization', 'Bearer mock-token')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCall);
    });

    it('should handle errors when creating a call', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          create: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      }));

      const response = await request(app)
        .post('/api/calls')
        .set('Authorization', 'Bearer mock-token')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create call' });
    });
  });

  describe('POST /api/calls/:callId/end', () => {
    it('should end a call', async () => {
      const mockCall = {
        id: '1',
        userId: 'user123',
        phoneNumber: '+1234567890',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findFirst: jest.fn().mockResolvedValue(mockCall),
          update: jest.fn().mockResolvedValue(mockCall),
        },
      }));

      const response = await request(app)
        .post('/api/calls/1/end')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Call ended successfully' });
    });

    it('should handle non-existent call', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .post('/api/calls/1/end')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Call not found' });
    });
  });

  describe('GET /api/calls/:callId/twiml', () => {
    it('should return TwiML for a call', async () => {
      const mockCall = {
        id: '1',
        userId: 'user123',
        phoneNumber: '+1234567890',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findUnique: jest.fn().mockResolvedValue(mockCall),
        },
      }));

      const response = await request(app)
        .get('/api/calls/1/twiml')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');
      expect(response.text).toContain('<Response>');
    });

    it('should handle non-existent call', async () => {
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        call: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }));

      const response = await request(app)
        .get('/api/calls/1/twiml')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Call not found' });
    });
  });
}); 