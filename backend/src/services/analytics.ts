import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { cache } from '../utils/cache';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async getCallStats(userId: string, timeRange: {
    start: Date;
    end: Date;
  }) {
    try {
      const cacheKey = `call-stats:${userId}:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}`;
      const cachedStats = await cache.get(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const calls = await prisma.call.findMany({
        where: {
          userId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      });

      const stats = {
        totalCalls: calls.length,
        completedCalls: calls.filter(call => call.status === 'completed').length,
        totalDuration: calls.reduce((sum, call) => sum + (call.duration || 0), 0),
        averageDuration: calls.length > 0
          ? calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length
          : 0,
        statusDistribution: calls.reduce((acc, call) => {
          acc[call.status] = (acc[call.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      // Cache the results for 5 minutes
      await cache.set(cacheKey, stats, 300);

      return stats;
    } catch (error) {
      logger.error('Error getting call stats:', error);
      throw error;
    }
  }

  async getSentimentAnalysis(userId: string, timeRange: {
    start: Date;
    end: Date;
  }) {
    try {
      const cacheKey = `sentiment:${userId}:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}`;
      const cachedAnalysis = await cache.get(cacheKey);
      if (cachedAnalysis) {
        return cachedAnalysis;
      }

      const calls = await prisma.call.findMany({
        where: {
          userId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
          transcript: {
            not: null,
          },
        },
        select: {
          transcript: true,
        },
      });

      const sentiments = await Promise.all(
        calls.map(async (call) => {
          try {
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: 'Analyze the sentiment of the following conversation transcript. Return a JSON object with the following fields: overall_sentiment (positive, negative, or neutral), confidence (0-1), key_points (array of main topics discussed), and emotions (array of emotions detected).',
                },
                {
                  role: 'user',
                  content: call.transcript || '',
                },
              ],
            });

            return JSON.parse(response.choices[0].message.content || '{}');
          } catch (error) {
            logger.error('Error analyzing sentiment:', error);
            return null;
          }
        })
      );

      const analysis = {
        totalCalls: calls.length,
        averageSentiment: sentiments.reduce((sum, s) => {
          if (!s) return sum;
          const score = s.overall_sentiment === 'positive' ? 1
            : s.overall_sentiment === 'negative' ? -1
            : 0;
          return sum + score;
        }, 0) / calls.length,
        sentimentDistribution: sentiments.reduce((acc, s) => {
          if (!s) return acc;
          acc[s.overall_sentiment] = (acc[s.overall_sentiment] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        keyPoints: Array.from(new Set(
          sentiments
            .filter(s => s)
            .flatMap(s => s.key_points || [])
        )),
        emotions: Array.from(new Set(
          sentiments
            .filter(s => s)
            .flatMap(s => s.emotions || [])
        )),
      };

      // Cache the results for 5 minutes
      await cache.set(cacheKey, analysis, 300);

      return analysis;
    } catch (error) {
      logger.error('Error getting sentiment analysis:', error);
      throw error;
    }
  }

  async getCallTrends(userId: string, timeRange: {
    start: Date;
    end: Date;
  }, interval: 'hour' | 'day' | 'week' | 'month' = 'day') {
    try {
      const cacheKey = `call-trends:${userId}:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}:${interval}`;
      const cachedTrends = await cache.get(cacheKey);
      if (cachedTrends) {
        return cachedTrends;
      }

      const calls = await prisma.call.findMany({
        where: {
          userId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const trends = calls.reduce((acc, call) => {
        const date = new Date(call.createdAt);
        let key: string;

        switch (interval) {
          case 'hour':
            key = date.toISOString().slice(0, 13);
            break;
          case 'day':
            key = date.toISOString().slice(0, 10);
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().slice(0, 10);
            break;
          case 'month':
            key = date.toISOString().slice(0, 7);
            break;
        }

        if (!acc[key]) {
          acc[key] = {
            totalCalls: 0,
            completedCalls: 0,
            totalDuration: 0,
            averageDuration: 0,
          };
        }

        acc[key].totalCalls++;
        if (call.status === 'completed') {
          acc[key].completedCalls++;
        }
        acc[key].totalDuration += call.duration || 0;
        acc[key].averageDuration = acc[key].totalDuration / acc[key].totalCalls;

        return acc;
      }, {} as Record<string, {
        totalCalls: number;
        completedCalls: number;
        totalDuration: number;
        averageDuration: number;
      }>);

      // Cache the results for 5 minutes
      await cache.set(cacheKey, trends, 300);

      return trends;
    } catch (error) {
      logger.error('Error getting call trends:', error);
      throw error;
    }
  }

  async generateReport(userId: string, timeRange: {
    start: Date;
    end: Date;
  }) {
    try {
      const [stats, sentiment, trends] = await Promise.all([
        this.getCallStats(userId, timeRange),
        this.getSentimentAnalysis(userId, timeRange),
        this.getCallTrends(userId, timeRange),
      ]);

      const report = {
        timeRange,
        stats,
        sentiment,
        trends,
        summary: await this.generateSummary(stats, sentiment, trends),
      };

      return report;
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  private async generateSummary(
    stats: any,
    sentiment: any,
    trends: any
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise summary of the call analytics data. Focus on key insights and trends.',
          },
          {
            role: 'user',
            content: JSON.stringify({ stats, sentiment, trends }),
          },
        ],
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('Error generating summary:', error);
      return 'Error generating summary';
    }
  }
}

export const analyticsService = AnalyticsService.getInstance(); 