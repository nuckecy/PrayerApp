/**
 * Anti-Cheating Detection System
 *
 * Detects suspicious patterns in goal completion behavior:
 * - Impossibly fast completions
 * - Bulk completions
 * - Completion times outside user's typical pattern
 * - Automated/bot-like behavior
 */

export interface CompletionRecord {
  dayIndex: number;
  completedAt: Date;
}

export interface CompletionPattern {
  enrollmentId: string;
  userId: string;
  completions: CompletionRecord[];
  userTimezone?: string;
}

export interface SuspiciousActivityResult {
  suspicious: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  details: Record<string, any>;
}

// Configuration constants
const MIN_COMPLETION_TIME_SECONDS = 30; // Minimum time to complete a day (30 seconds)
const MAX_COMPLETIONS_PER_HOUR = 10; // Max completions per hour
const BULK_COMPLETION_THRESHOLD = 5; // Completing 5+ days in quick succession
const BULK_COMPLETION_WINDOW_MINUTES = 5; // Within 5 minutes

/**
 * Check for impossibly fast completions
 */
function checkImpossiblyFastCompletions(
  completions: CompletionRecord[]
): { suspicious: boolean; details: any[] } {
  const suspicious: any[] = [];

  for (let i = 1; i < completions.length; i++) {
    const prev = completions[i - 1];
    const curr = completions[i];

    const timeDiff = curr.completedAt.getTime() - prev.completedAt.getTime();
    const secondsDiff = timeDiff / 1000;

    if (secondsDiff < MIN_COMPLETION_TIME_SECONDS) {
      suspicious.push({
        dayIndex1: prev.dayIndex,
        dayIndex2: curr.dayIndex,
        timeDiffSeconds: secondsDiff,
        threshold: MIN_COMPLETION_TIME_SECONDS,
      });
    }
  }

  return {
    suspicious: suspicious.length > 0,
    details: suspicious,
  };
}

/**
 * Check for bulk completions
 */
function checkBulkCompletions(
  completions: CompletionRecord[]
): { suspicious: boolean; details: any } {
  // Sort by completion time
  const sorted = [...completions].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime()
  );

  let maxBulk = 0;
  let currentBulk = 1;
  let bulkDetails: any[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const timeDiff = sorted[i].completedAt.getTime() - sorted[i - 1].completedAt.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff <= BULK_COMPLETION_WINDOW_MINUTES) {
      currentBulk++;
    } else {
      if (currentBulk >= BULK_COMPLETION_THRESHOLD) {
        bulkDetails.push({
          count: currentBulk,
          startIndex: sorted[i - currentBulk].dayIndex,
          endIndex: sorted[i - 1].dayIndex,
        });
      }
      maxBulk = Math.max(maxBulk, currentBulk);
      currentBulk = 1;
    }
  }

  // Check last batch
  if (currentBulk >= BULK_COMPLETION_THRESHOLD) {
    bulkDetails.push({
      count: currentBulk,
      startIndex: sorted[sorted.length - currentBulk].dayIndex,
      endIndex: sorted[sorted.length - 1].dayIndex,
    });
  }
  maxBulk = Math.max(maxBulk, currentBulk);

  return {
    suspicious: maxBulk >= BULK_COMPLETION_THRESHOLD,
    details: {
      maxBulkCount: maxBulk,
      threshold: BULK_COMPLETION_THRESHOLD,
      bulkBatches: bulkDetails,
    },
  };
}

/**
 * Check for excessive completions in short time period
 */
function checkExcessiveCompletions(
  completions: CompletionRecord[]
): { suspicious: boolean; details: any } {
  const sorted = [...completions].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime()
  );

  let maxPerHour = 0;
  const hourlyWindows: any[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const windowStart = sorted[i].completedAt.getTime();
    const windowEnd = windowStart + 60 * 60 * 1000; // 1 hour window

    let count = 0;
    for (let j = i; j < sorted.length; j++) {
      if (sorted[j].completedAt.getTime() <= windowEnd) {
        count++;
      } else {
        break;
      }
    }

    if (count > maxPerHour) {
      maxPerHour = count;
    }

    if (count > MAX_COMPLETIONS_PER_HOUR) {
      hourlyWindows.push({
        startTime: new Date(windowStart),
        count,
        threshold: MAX_COMPLETIONS_PER_HOUR,
      });
    }
  }

  return {
    suspicious: maxPerHour > MAX_COMPLETIONS_PER_HOUR,
    details: {
      maxPerHour,
      threshold: MAX_COMPLETIONS_PER_HOUR,
      violatingWindows: hourlyWindows,
    },
  };
}

/**
 * Check for out-of-order completions (completing future days before current)
 */
function checkOutOfOrderCompletions(
  completions: CompletionRecord[]
): { suspicious: boolean; details: any[] } {
  const suspicious: any[] = [];

  // Sort by completion time
  const byTime = [...completions].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime()
  );

  for (let i = 1; i < byTime.length; i++) {
    // If earlier completion has higher day index, that's suspicious
    if (byTime[i - 1].dayIndex > byTime[i].dayIndex) {
      suspicious.push({
        earlierCompletion: {
          dayIndex: byTime[i - 1].dayIndex,
          completedAt: byTime[i - 1].completedAt,
        },
        laterCompletion: {
          dayIndex: byTime[i].dayIndex,
          completedAt: byTime[i].completedAt,
        },
      });
    }
  }

  return {
    suspicious: suspicious.length > 0,
    details: suspicious,
  };
}

/**
 * Check for unusual completion times (e.g., 3 AM consistently)
 */
function checkUnusualCompletionTimes(
  completions: CompletionRecord[],
  userTimezone?: string
): { suspicious: boolean; details: any } {
  const hourCounts = new Array(24).fill(0);
  const lateNightCount = { count: 0, hours: [] };

  for (const completion of completions) {
    const hour = completion.completedAt.getHours();
    hourCounts[hour]++;

    // Late night hours: 2 AM - 5 AM
    if (hour >= 2 && hour <= 5) {
      lateNightCount.count++;
      lateNightCount.hours.push(hour);
    }
  }

  // If more than 30% of completions are in late night hours, flag as suspicious
  const lateNightPercentage = (lateNightCount.count / completions.length) * 100;

  return {
    suspicious: lateNightPercentage > 30,
    details: {
      lateNightPercentage,
      lateNightCount: lateNightCount.count,
      totalCompletions: completions.length,
      hourDistribution: hourCounts,
    },
  };
}

/**
 * Main detection function - analyzes completion pattern for suspicious activity
 */
export function detectSuspiciousActivity(
  pattern: CompletionPattern
): SuspiciousActivityResult {
  const reasons: string[] = [];
  const details: Record<string, any> = {};
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Need at least 2 completions to analyze
  if (pattern.completions.length < 2) {
    return {
      suspicious: false,
      severity: 'low',
      reasons: [],
      details: {},
    };
  }

  // Check 1: Impossibly fast completions
  const fastCheck = checkImpossiblyFastCompletions(pattern.completions);
  if (fastCheck.suspicious) {
    reasons.push(
      `Impossibly fast completions detected (${fastCheck.details.length} instances)`
    );
    details.fastCompletions = fastCheck.details;
    severity = 'critical';
  }

  // Check 2: Bulk completions
  const bulkCheck = checkBulkCompletions(pattern.completions);
  if (bulkCheck.suspicious) {
    reasons.push(
      `Bulk completion pattern detected (${bulkCheck.details.maxBulkCount} days in ${BULK_COMPLETION_WINDOW_MINUTES} minutes)`
    );
    details.bulkCompletions = bulkCheck.details;
    if (severity !== 'critical') severity = 'high';
  }

  // Check 3: Excessive completions per hour
  const excessiveCheck = checkExcessiveCompletions(pattern.completions);
  if (excessiveCheck.suspicious) {
    reasons.push(
      `Excessive completions detected (${excessiveCheck.details.maxPerHour} in 1 hour)`
    );
    details.excessiveCompletions = excessiveCheck.details;
    if (severity === 'low') severity = 'medium';
  }

  // Check 4: Out of order completions
  const orderCheck = checkOutOfOrderCompletions(pattern.completions);
  if (orderCheck.suspicious) {
    reasons.push(
      `Out of order completions detected (${orderCheck.details.length} instances)`
    );
    details.outOfOrder = orderCheck.details;
    if (severity === 'low') severity = 'medium';
  }

  // Check 5: Unusual completion times
  const timeCheck = checkUnusualCompletionTimes(pattern.completions, pattern.userTimezone);
  if (timeCheck.suspicious) {
    reasons.push(
      `Unusual completion times (${timeCheck.details.lateNightPercentage.toFixed(1)}% late night)`
    );
    details.unusualTimes = timeCheck.details;
    if (severity === 'low') severity = 'low'; // Don't elevate severity for this alone
  }

  return {
    suspicious: reasons.length > 0,
    severity,
    reasons,
    details,
  };
}

/**
 * Generate a summary message for suspicious activity
 */
export function getSuspiciousActivitySummary(result: SuspiciousActivityResult): string {
  if (!result.suspicious) {
    return '';
  }

  const severityLabel = result.severity.toUpperCase();
  const reasonsList = result.reasons.join('; ');

  return `[${severityLabel}] Suspicious completion pattern detected: ${reasonsList}`;
}
