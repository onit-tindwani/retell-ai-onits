import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { cache } from '../utils/cache';

const prisma = new PrismaClient();

export class ContactService {
  private static instance: ContactService;

  private constructor() {}

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  async createContact(data: {
    userId: string;
    name: string;
    phone: string;
    email?: string;
  }) {
    try {
      const contact = await prisma.contact.create({
        data: {
          userId: data.userId,
          name: data.name,
          phone: data.phone,
          email: data.email,
        },
      });

      // Clear cache
      await cache.del(`contacts:${data.userId}`);

      return contact;
    } catch (error) {
      logger.error('Error creating contact:', error);
      throw error;
    }
  }

  async getContacts(userId: string, filters?: {
    search?: string;
  }) {
    try {
      // Try to get from cache first
      const cacheKey = `contacts:${userId}:${JSON.stringify(filters)}`;
      const cachedContacts = await cache.get(cacheKey);
      if (cachedContacts) {
        return cachedContacts;
      }

      const where = {
        userId,
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const contacts = await prisma.contact.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      // Cache the results for 5 minutes
      await cache.set(cacheKey, contacts, 300);

      return contacts;
    } catch (error) {
      logger.error('Error fetching contacts:', error);
      throw error;
    }
  }

  async updateContact(
    contactId: string,
    userId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
    }
  ) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact || contact.userId !== userId) {
        throw new Error('Contact not found or unauthorized');
      }

      const updatedContact = await prisma.contact.update({
        where: { id: contactId },
        data,
      });

      // Clear cache
      await cache.del(`contacts:${userId}`);

      return updatedContact;
    } catch (error) {
      logger.error('Error updating contact:', error);
      throw error;
    }
  }

  async deleteContact(contactId: string, userId: string) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact || contact.userId !== userId) {
        throw new Error('Contact not found or unauthorized');
      }

      await prisma.contact.delete({
        where: { id: contactId },
      });

      // Clear cache
      await cache.del(`contacts:${userId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting contact:', error);
      throw error;
    }
  }

  async importContacts(userId: string, contacts: Array<{
    name: string;
    phone: string;
    email?: string;
  }>) {
    try {
      const createdContacts = await prisma.$transaction(
        contacts.map((contact) =>
          prisma.contact.create({
            data: {
              userId,
              name: contact.name,
              phone: contact.phone,
              email: contact.email,
            },
          })
        )
      );

      // Clear cache
      await cache.del(`contacts:${userId}`);

      return createdContacts;
    } catch (error) {
      logger.error('Error importing contacts:', error);
      throw error;
    }
  }

  async exportContacts(userId: string) {
    try {
      const contacts = await prisma.contact.findMany({
        where: { userId },
        select: {
          name: true,
          phone: true,
          email: true,
        },
      });

      return contacts;
    } catch (error) {
      logger.error('Error exporting contacts:', error);
      throw error;
    }
  }
}

export const contactService = ContactService.getInstance(); 