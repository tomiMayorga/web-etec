import 'dotenv/config';
import { z } from 'zod';

const base64Key = z.string().refine(
  (value) => {
    try {
      return Buffer.from(value, 'base64').length === 32;
    } catch {
      return false;
    }
  },
  'debe contener exactamente 32 bytes codificados en Base64'
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  PII_ENCRYPTION_KEY: base64Key,
  PII_LOOKUP_KEY: base64Key,
  AUDIT_IP_KEY: base64Key,
  PRIVACY_NOTICE_VERSION: z.string().min(1),
  DATA_RETENTION_MONTHS: z.coerce.number().int().min(1).max(120).default(24),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);
