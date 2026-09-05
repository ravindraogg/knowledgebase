import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().url(),
  NEO4J_URI: z.string(),
  NEO4J_USER: z.string(),
  NEO4J_PASSWORD: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRY: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().length(64), // Hex string representing 32 bytes
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
  HUGGINGFACE_API_TOKEN: z.string().min(1).optional(),
  HUGGINGFACE_MODEL: z.string().default('Qwen/Qwen2.5-7B-Instruct'),
  GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash-lite'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
