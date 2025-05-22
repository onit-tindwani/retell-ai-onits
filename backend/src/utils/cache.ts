import Redis from 'ioredis';
import config from '../config';
import { CacheError } from './errors';
import logger from './logger';

class Cache {
  private client: Redis;
  private static instance: Cache;

  private constructor() {
    this.client = new Redis(config.redis.url);
    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
    });
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      throw new CacheError('Failed to get data from cache');
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
      throw new CacheError('Failed to set data in cache');
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
      throw new CacheError('Failed to delete data from cache');
    }
  }

  public async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      throw new CacheError('Failed to delete pattern from cache');
    }
  }

  public async flush(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      logger.error('Cache flush error:', error);
      throw new CacheError('Failed to flush cache');
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check error:', error);
      return false;
    }
  }
}

export const cache = Cache.getInstance(); 