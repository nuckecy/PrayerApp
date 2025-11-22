/**
 * Environment Variable Validation
 *
 * This module validates all environment variables at build/runtime
 * to ensure the application fails fast with clear error messages
 * rather than failing with cryptic errors later.
 *
 * Security Benefits:
 * - Prevents deployment with missing/invalid configuration
 * - Type-safe environment variable access
 * - Clear error messages for misconfiguration
 * - No silent fallbacks to empty strings
 */

import { z } from 'zod';

const envSchema = z.object({
  // Supabase Configuration (required for all deployments)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .startsWith('https://', 'NEXT_PUBLIC_SUPABASE_URL must use HTTPS'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional()
    .default('http://localhost:3000'),

  // API Configuration (legacy, may not be used)
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .optional()
    .default('http://localhost:3001'),
});

/**
 * Validate and parse environment variables
 *
 * This function is called at module load time, so it will
 * fail immediately if environment variables are misconfigured.
 */
function validateEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Invalid environment variables:\n${formattedErrors}\n\n` +
          `Please check your .env.local file and ensure all required variables are set correctly.\n` +
          `See .env.example for reference.`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 *
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env';
 *
 * const supabase = createClient(
 *   env.NEXT_PUBLIC_SUPABASE_URL,
 *   env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 * );
 * ```
 */
export const env = validateEnv();

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;
