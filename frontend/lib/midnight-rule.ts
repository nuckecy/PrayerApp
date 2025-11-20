/**
 * The Midnight Rule - Timezone-Aware Implementation
 *
 * Core Principle: Users can complete ONE day per 24-hour period in their local timezone.
 * The day resets at midnight in the user's timezone.
 *
 * Rules:
 * 1. Cannot complete the same day twice
 * 2. Cannot complete more than one day per calendar day (user's timezone)
 * 3. Can pause and resume without penalty
 * 4. Projected end date extends when days are skipped
 */

import { startOfDay, differenceInCalendarDays, addDays, isBefore, isAfter } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface MidnightRuleResult {
  canComplete: boolean;
  reason: string;
  nextAvailableAt?: Date;
  hoursUntilNext?: number;
  isWarningPeriod?: boolean; // True if 20+ hours since last completion
}

/**
 * Check if user can complete a day today based on The Midnight Rule
 */
export function canCompleteToday(
  lastCompletedAt: string | Date | null,
  userTimezone: string = 'UTC'
): MidnightRuleResult {
  // No previous completion - can complete
  if (!lastCompletedAt) {
    return {
      canComplete: true,
      reason: 'No previous completion. Start your streak!',
    };
  }

  try {
    const now = new Date();
    const lastCompleted = typeof lastCompletedAt === 'string'
      ? new Date(lastCompletedAt)
      : lastCompletedAt;

    // Convert dates to user's timezone
    const userNow = toZonedTime(now, userTimezone);
    const userLastCompleted = toZonedTime(lastCompleted, userTimezone);

    // Get start of day (midnight) in user's timezone
    const todayStart = startOfDay(userNow);
    const lastCompletedDayStart = startOfDay(userLastCompleted);

    // Check if last completion was today
    if (todayStart.getTime() === lastCompletedDayStart.getTime()) {
      // Already completed today - calculate next available time (tomorrow at midnight)
      const tomorrowStart = addDays(todayStart, 1);
      const nextAvailable = fromZonedTime(tomorrowStart, userTimezone);
      const hoursUntil = Math.ceil((nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60));

      return {
        canComplete: false,
        reason: `Already completed today. Come back tomorrow at midnight (${userTimezone})!`,
        nextAvailableAt: nextAvailable,
        hoursUntilNext: hoursUntil,
      };
    }

    // Check if it's been 20+ hours since last completion (warning period for streak)
    const hoursSinceCompletion = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);
    const isWarningPeriod = hoursSinceCompletion >= 20;

    return {
      canComplete: true,
      reason: 'Ready to complete today\'s goal!',
      isWarningPeriod,
    };
  } catch (error) {
    console.error('Error in canCompleteToday:', error);
    // Default to allowing completion if there's an error
    return {
      canComplete: true,
      reason: 'Ready to complete today\'s goal!',
    };
  }
}

/**
 * Calculate days skipped since last completion
 */
export function calculateSkippedDays(
  lastCompletedAt: string | Date | null,
  userTimezone: string = 'UTC'
): number {
  if (!lastCompletedAt) return 0;

  try {
    const now = new Date();
    const lastCompleted = typeof lastCompletedAt === 'string'
      ? new Date(lastCompletedAt)
      : lastCompletedAt;

    const userNow = toZonedTime(now, userTimezone);
    const userLastCompleted = toZonedTime(lastCompleted, userTimezone);

    const todayStart = startOfDay(userNow);
    const lastCompletedDayStart = startOfDay(userLastCompleted);

    // Calculate calendar days between last completion and today
    const daysDiff = differenceInCalendarDays(todayStart, lastCompletedDayStart);

    // If completed today (0 days) or yesterday (1 day), no skip
    // If 2+ days, then daysDiff - 1 are skipped days
    return Math.max(0, daysDiff - 1);
  } catch (error) {
    console.error('Error in calculateSkippedDays:', error);
    return 0;
  }
}

/**
 * Calculate projected end date based on current progress and skip pattern
 */
export function calculateProjectedEndDate(
  startDate: string | Date,
  totalDays: number,
  completedDays: number,
  lastCompletedAt: string | Date | null,
  userTimezone: string = 'UTC'
): Date {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const skippedDays = calculateSkippedDays(lastCompletedAt, userTimezone);
    const remainingDays = totalDays - completedDays;

    // Projected end = start + total days + skipped days
    const projectedEnd = addDays(start, totalDays + skippedDays);

    return projectedEnd;
  } catch (error) {
    console.error('Error in calculateProjectedEndDate:', error);
    // Fallback: start + total days
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    return addDays(start, totalDays);
  }
}

/**
 * Check if user's streak is at risk (20+ hours since last completion)
 */
export function isStreakAtRisk(
  lastCompletedAt: string | Date | null,
  userTimezone: string = 'UTC'
): {
  atRisk: boolean;
  hoursRemaining?: number;
  message?: string;
} {
  if (!lastCompletedAt) {
    return { atRisk: false };
  }

  try {
    const now = new Date();
    const lastCompleted = typeof lastCompletedAt === 'string'
      ? new Date(lastCompletedAt)
      : lastCompletedAt;

    const userNow = toZonedTime(now, userTimezone);
    const userLastCompleted = toZonedTime(lastCompleted, userTimezone);

    const todayStart = startOfDay(userNow);
    const lastCompletedDayStart = startOfDay(userLastCompleted);

    // If last completion was yesterday or earlier
    if (isBefore(lastCompletedDayStart, todayStart)) {
      const hoursSinceCompletion = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);

      // After 24 hours, streak is broken
      if (hoursSinceCompletion >= 24) {
        return {
          atRisk: true,
          hoursRemaining: 0,
          message: 'Your streak has been broken. Complete today to start a new streak!',
        };
      }

      // Between 20-24 hours, streak is at risk
      if (hoursSinceCompletion >= 20) {
        const hoursRemaining = Math.ceil(24 - hoursSinceCompletion);
        return {
          atRisk: true,
          hoursRemaining,
          message: `Streak at risk! Complete within ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} to maintain your streak.`,
        };
      }
    }

    return { atRisk: false };
  } catch (error) {
    console.error('Error in isStreakAtRisk:', error);
    return { atRisk: false };
  }
}

/**
 * Format next available time in a user-friendly way
 */
export function formatNextAvailable(
  nextAvailableAt: Date,
  userTimezone: string = 'UTC'
): string {
  try {
    return formatInTimeZone(nextAvailableAt, userTimezone, 'EEEE, MMM d \'at\' h:mm a zzz');
  } catch (error) {
    console.error('Error formatting next available time:', error);
    return nextAvailableAt.toLocaleString();
  }
}

/**
 * Calculate optimal completion time based on user's past completion patterns
 */
export function suggestOptimalCompletionTime(
  completions: Array<{ completed_at: string }>,
  userTimezone: string = 'UTC'
): {
  hour: number;
  message: string;
} | null {
  if (completions.length < 3) return null;

  try {
    // Extract hour from each completion
    const hours = completions.map(c => {
      const date = toZonedTime(new Date(c.completed_at), userTimezone);
      return date.getHours();
    });

    // Calculate average hour
    const avgHour = Math.round(hours.reduce((sum, h) => sum + h, 0) / hours.length);

    // Format message
    const period = avgHour < 12 ? 'morning' : avgHour < 17 ? 'afternoon' : 'evening';
    const timeStr = formatHour(avgHour);

    return {
      hour: avgHour,
      message: `You typically complete goals in the ${period} around ${timeStr}. Keep it consistent!`,
    };
  } catch (error) {
    console.error('Error calculating optimal time:', error);
    return null;
  }
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
