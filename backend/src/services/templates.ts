import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';

const prisma = new PrismaClient();

export class TemplateService {
  private static instance: TemplateService;

  private constructor() {}

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  async createTemplate(data: {
    userId: string;
    name: string;
    description?: string;
    content: string;
    variables: Record<string, string>;
  }) {
    try {
      const template = await prisma.template.create({
        data: {
          userId: data.userId,
          name: data.name,
          description: data.description,
          content: data.content,
          variables: data.variables,
        },
      });

      // Clear cache
      await cache.del(`templates:${data.userId}`);

      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  async getTemplates(userId: string, filters?: {
    search?: string;
    isActive?: boolean;
  }) {
    try {
      // Try to get from cache first
      const cacheKey = `templates:${userId}:${JSON.stringify(filters)}`;
      const cachedTemplates = await cache.get(cacheKey);
      if (cachedTemplates) {
        return cachedTemplates;
      }

      const where = {
        userId,
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters?.isActive !== undefined && {
          isActive: filters.isActive,
        }),
      };

      const templates = await prisma.template.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      // Cache the results for 5 minutes
      await cache.set(cacheKey, templates, 300);

      return templates;
    } catch (error) {
      logger.error('Error fetching templates:', error);
      throw error;
    }
  }

  async updateTemplate(
    templateId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      variables?: Record<string, string>;
      isActive?: boolean;
    }
  ) {
    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template || template.userId !== userId) {
        throw new Error('Template not found or unauthorized');
      }

      const updatedTemplate = await prisma.template.update({
        where: { id: templateId },
        data,
      });

      // Clear cache
      await cache.del(`templates:${userId}`);

      return updatedTemplate;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string, userId: string) {
    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template || template.userId !== userId) {
        throw new Error('Template not found or unauthorized');
      }

      await prisma.template.delete({
        where: { id: templateId },
      });

      // Clear cache
      await cache.del(`templates:${userId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  async processTemplate(templateId: string, variables: Record<string, string>) {
    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      let processedContent = template.content;

      // Replace variables in the template
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, value);
      });

      return processedContent;
    } catch (error) {
      logger.error('Error processing template:', error);
      throw error;
    }
  }

  async duplicateTemplate(templateId: string, userId: string) {
    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template || template.userId !== userId) {
        throw new Error('Template not found or unauthorized');
      }

      const duplicatedTemplate = await prisma.template.create({
        data: {
          userId,
          name: `${template.name} (Copy)`,
          description: template.description,
          content: template.content,
          variables: template.variables,
          isActive: false,
        },
      });

      // Clear cache
      await cache.del(`templates:${userId}`);

      return duplicatedTemplate;
    } catch (error) {
      logger.error('Error duplicating template:', error);
      throw error;
    }
  }
}

export const templateService = TemplateService.getInstance(); 