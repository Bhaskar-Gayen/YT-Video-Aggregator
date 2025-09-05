import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  YOUTUBE_API_KEYS: z.string(),
  SEARCH_QUERY: z.string().default('official music video'),
  FETCH_INTERVAL_SECONDS: z.string().default('10'),
});

const parsedConfig = configSchema.parse(process.env);

export const config = {
  port: parseInt(parsedConfig.PORT),
  nodeEnv: parsedConfig.NODE_ENV,
  database: {
    url: parsedConfig.DATABASE_URL,
  },
  redis: {
    url: parsedConfig.REDIS_URL,
  },
  youtube: {
    apiKeys: parsedConfig.YOUTUBE_API_KEYS.split(',').map(key => key.trim()),
    searchQuery: parsedConfig.SEARCH_QUERY,
    fetchInterval: parseInt(parsedConfig.FETCH_INTERVAL_SECONDS) * 1000,
  },
};