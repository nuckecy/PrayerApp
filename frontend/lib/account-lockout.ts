/**
 * Account Lockout System
 *
 * Implements automatic account lockout after repeated failed login attempts.
 * - Locks account for 15 minutes after 5 failed attempts within 15 minutes
 * - Sends email notification to user on lockout
 * - Integrates with security logging system
 */

import { supabase } from './supabase';

export interface LockoutStatus {
  isLocked: boolean;
  lockedUntil?: Date;
  reason?: string;
  remainingMinutes?: number;
}

export interface LockoutCheckResult {
  canAttemptLogin: boolean;
  lockoutStatus?: LockoutStatus;
  failedAttempts?: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Check if account is currently locked
 */
export async function checkAccountLockout(
  identifier: string
): Promise<LockoutStatus> {
  try {
    const { data, error } = await supabase.rpc('is_account_locked', {
      p_identifier: identifier.toLowerCase(),
    });

    if (error) {
      console.error('Error checking account lockout:', error);
      // Fail open - allow login attempt if check fails
      return { isLocked: false };
    }

    if (data && data.length > 0) {
      const lockoutData = data[0];
      if (lockoutData.is_locked) {
        const lockedUntil = new Date(lockoutData.locked_until);
        const now = new Date();
        const remainingMs = lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        return {
          isLocked: true,
          lockedUntil,
          reason: lockoutData.reason,
          remainingMinutes: Math.max(0, remainingMinutes),
        };
      }
    }

    return { isLocked: false };
  } catch (error) {
    console.error('Account lockout check error:', error);
    return { isLocked: false };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLoginAttempt(
  identifier: string
): Promise<void> {
  try {
    await supabase.rpc('record_failed_login_attempt', {
      p_identifier: identifier.toLowerCase(),
      p_attempt_type: 'email',
    });
  } catch (error) {
    console.error('Error recording failed login attempt:', error);
  }
}

/**
 * Get count of recent failed login attempts
 */
export async function getFailedAttemptsCount(
  identifier: string
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_failed_attempts_count', {
      p_identifier: identifier.toLowerCase(),
      p_window_minutes: LOCKOUT_WINDOW_MINUTES,
    });

    if (error) {
      console.error('Error getting failed attempts count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Failed attempts count error:', error);
    return 0;
  }
}

/**
 * Lock an account
 */
export async function lockAccount(
  identifier: string,
  reason?: string
): Promise<Date | null> {
  try {
    const { data, error } = await supabase.rpc('lock_account', {
      p_identifier: identifier.toLowerCase(),
      p_duration_minutes: LOCKOUT_DURATION_MINUTES,
      p_reason: reason || 'Too many failed login attempts',
    });

    if (error) {
      console.error('Error locking account:', error);
      return null;
    }

    return data ? new Date(data) : null;
  } catch (error) {
    console.error('Account lock error:', error);
    return null;
  }
}

/**
 * Unlock an account (admin only)
 */
export async function unlockAccount(identifier: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('unlock_account', {
      p_identifier: identifier.toLowerCase(),
    });

    if (error) {
      console.error('Error unlocking account:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Account unlock error:', error);
    return false;
  }
}

/**
 * Check if login should be allowed and handle lockout logic
 * Call this BEFORE attempting login
 */
export async function checkLoginAllowed(
  identifier: string
): Promise<LockoutCheckResult> {
  // First, check if account is currently locked
  const lockoutStatus = await checkAccountLockout(identifier);

  if (lockoutStatus.isLocked) {
    return {
      canAttemptLogin: false,
      lockoutStatus,
    };
  }

  // Check recent failed attempts
  const failedAttempts = await getFailedAttemptsCount(identifier);

  // If at threshold, prevent additional attempts
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // Lock the account
    const lockedUntil = await lockAccount(identifier);

    if (lockedUntil) {
      return {
        canAttemptLogin: false,
        lockoutStatus: {
          isLocked: true,
          lockedUntil,
          reason: 'Too many failed login attempts',
          remainingMinutes: LOCKOUT_DURATION_MINUTES,
        },
        failedAttempts,
      };
    }
  }

  return {
    canAttemptLogin: true,
    failedAttempts,
  };
}

/**
 * Handle failed login attempt - record it and check if lockout should occur
 * Call this AFTER a failed login attempt
 */
export async function handleFailedLogin(
  identifier: string
): Promise<LockoutCheckResult> {
  // Record the failed attempt
  await recordFailedLoginAttempt(identifier);

  // Get updated count
  const failedAttempts = await getFailedAttemptsCount(identifier);

  // Check if we should lock the account
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = await lockAccount(identifier);

    if (lockedUntil) {
      return {
        canAttemptLogin: false,
        lockoutStatus: {
          isLocked: true,
          lockedUntil,
          reason: 'Too many failed login attempts',
          remainingMinutes: LOCKOUT_DURATION_MINUTES,
        },
        failedAttempts,
      };
    }
  }

  return {
    canAttemptLogin: failedAttempts < MAX_FAILED_ATTEMPTS,
    failedAttempts,
  };
}

/**
 * Format lockout error message for user
 */
export function formatLockoutMessage(lockoutStatus: LockoutStatus): string {
  if (!lockoutStatus.isLocked) {
    return '';
  }

  const minutes = lockoutStatus.remainingMinutes || LOCKOUT_DURATION_MINUTES;

  return `Account temporarily locked due to too many failed login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
}

/**
 * Get warning message about remaining attempts
 */
export function getAttemptsWarning(failedAttempts: number): string | null {
  const remaining = MAX_FAILED_ATTEMPTS - failedAttempts;

  if (remaining <= 2 && remaining > 0) {
    return `Warning: ${remaining} login attempt${remaining !== 1 ? 's' : ''} remaining before account lockout.`;
  }

  return null;
}
