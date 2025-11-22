/**
 * Client-Side Rate Limiter
 *
 * Provides protection against abuse by limiting the frequency of operations.
 * This is a client-side implementation for immediate feedback.
 * Server-side rate limiting (Supabase) provides the ultimate protection.
 *
 * Security Benefits:
 * - Prevents brute force attacks
 * - Reduces API abuse
 * - Improves user experience with clear error messages
 * - Reduces unnecessary server load
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up old entries every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if an operation is allowed
   * @param key - Unique identifier for the operation (e.g., email address, IP, user ID)
   * @returns Object with allowed status and optional error message
   */
  async checkLimit(key: string): Promise<{
    allowed: boolean;
    error?: string;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const entry = this.storage.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        error: `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      };
    }

    // No previous attempts or window expired
    if (!entry || now - entry.firstAttemptTime > this.config.windowMs) {
      this.storage.set(key, {
        attempts: 1,
        firstAttemptTime: now,
      });
      return { allowed: true };
    }

    // Increment attempts
    entry.attempts++;

    // Check if limit exceeded
    if (entry.attempts > this.config.maxAttempts) {
      entry.blockedUntil = now + this.config.blockDurationMs;
      const retryAfterSeconds = Math.ceil(this.config.blockDurationMs / 1000);

      return {
        allowed: false,
        error: `Rate limit exceeded. Blocked for ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      };
    }

    return { allowed: true };
  }

  /**
   * Reset the rate limit for a specific key
   * @param key - Unique identifier to reset
   */
  reset(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      const isExpired =
        now - entry.firstAttemptTime > this.config.windowMs &&
        (!entry.blockedUntil || entry.blockedUntil < now);

      if (isExpired) {
        this.storage.delete(key);
      }
    }
  }
}

/**
 * Pre-configured rate limiters for common operations
 */

// Login attempts: 5 attempts per 5 minutes, blocked for 15 minutes
export const loginLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
});

// Registration attempts: 3 attempts per 10 minutes, blocked for 30 minutes
export const registrationLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
});

// Password reset: 3 attempts per hour, blocked for 1 hour
export const passwordResetLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000, // 1 hour
});

// Goal creation: 10 goals per minute, blocked for 5 minutes
export const goalCreationLimiter = new RateLimiter({
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 5 * 60 * 1000, // 5 minutes
});

// API query: 100 requests per minute, blocked for 1 minute
export const apiQueryLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 60 * 1000, // 1 minute
});

/**
 * Helper function to handle rate-limited operations
 *
 * Usage:
 * ```typescript
 * const result = await withRateLimit(
 *   loginLimiter,
 *   userEmail,
 *   async () => {
 *     return await supabase.auth.signInWithPassword({
 *       email,
 *       password
 *     });
 *   }
 * );
 *
 * if (!result.success) {
 *   setError(result.error);
 * }
 * ```
 */
export async function withRateLimit<T>(
  limiter: RateLimiter,
  key: string,
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; retryAfter?: number }> {
  const limitCheck = await limiter.checkLimit(key);

  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error,
      retryAfter: limitCheck.retryAfter,
    };
  }

  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
    };
  }
}

/**
 * Get client identifier for rate limiting
 * Uses email if available, otherwise falls back to session storage ID
 */
export function getClientIdentifier(email?: string): string {
  if (email) {
    return email.toLowerCase();
  }

  // Generate or retrieve a client ID from session storage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    let clientId = sessionStorage.getItem('rate_limit_client_id');

    if (!clientId) {
      clientId = generateClientId();
      sessionStorage.setItem('rate_limit_client_id', clientId);
    }

    return clientId;
  }

  // Fallback for server-side rendering
  return 'anonymous';
}

/**
 * Generate a unique client identifier
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * React hook for rate limiting (optional)
 */
export function useRateLimit(limiter: RateLimiter, key: string) {
  return {
    checkLimit: () => limiter.checkLimit(key),
    reset: () => limiter.reset(key),
    withLimit: <T,>(operation: () => Promise<T>) =>
      withRateLimit(limiter, key, operation),
  };
}
