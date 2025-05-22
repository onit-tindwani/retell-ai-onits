import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { cache } from '../utils/cache';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateResponse(data: {
    userId: string;
    callId: string;
    transcript: string;
    context?: string;
  }) {
    try {
      // Get user's AI personality
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { aiPersonality: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get conversation history from cache or database
      const historyKey = `conversation:${data.callId}`;
      let history = await cache.get(historyKey) || [];

      // Prepare messages for OpenAI
      const messages = [
        {
          role: 'system',
          content: this.getPersonalityPrompt(user.aiPersonality),
        },
        ...history,
        {
          role: 'user',
          content: data.transcript,
        },
      ];

      // Generate response
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 150,
      });

      const aiResponse = response.choices[0].message.content;

      // Update conversation history
      history = [
        ...history,
        { role: 'user', content: data.transcript },
        { role: 'assistant', content: aiResponse },
      ];

      // Keep only last 10 messages
      if (history.length > 10) {
        history = history.slice(-10);
      }

      // Cache updated history
      await cache.set(historyKey, history, 3600); // Cache for 1 hour

      return aiResponse;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  async analyzeSentiment(transcript: string) {
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
            content: transcript,
          },
        ],
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  async summarizeCall(transcript: string) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise summary of the following conversation transcript. Focus on key points, decisions made, and action items.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Error summarizing call:', error);
      throw error;
    }
  }

  async detectIntent(transcript: string) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze the following conversation transcript and identify the main intent or purpose of the conversation. Return a JSON object with the following fields: primary_intent (string), confidence (0-1), and supporting_evidence (array of relevant quotes from the transcript).',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('Error detecting intent:', error);
      throw error;
    }
  }

  private getPersonalityPrompt(personality: string): string {
    const personalities: Record<string, string> = {
      default: 'You are a helpful and professional AI assistant. Maintain a friendly but business-like tone. Focus on being clear, concise, and solution-oriented.',
      friendly: 'You are a warm and friendly AI assistant. Use a casual, conversational tone while maintaining professionalism. Show empathy and understanding.',
      formal: 'You are a highly professional AI assistant. Use formal language and maintain a serious, business-focused tone. Prioritize clarity and precision.',
      technical: 'You are a technical expert AI assistant. Use precise, technical language while ensuring explanations are clear and accessible. Focus on accuracy and detail.',
      sales: 'You are a persuasive sales-focused AI assistant. Use engaging language and focus on understanding customer needs and providing relevant solutions.',
    };

    return personalities[personality] || personalities.default;
  }
}

export const aiService = AIService.getInstance(); 