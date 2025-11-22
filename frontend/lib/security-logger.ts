/**
 * Security Event Logger
 *
 * Tracks authentication and security-related events for monitoring and incident response.
 * All events are stored in the security_logs table with proper severity classification.
 */

import { supabase } from './supabase';

export type SecurityEventType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'registration'
  | 'registration_failed'
  | 'password_change'
  | 'password_reset'
  | 'password_reset_failed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'session_expired';

export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityLogData {
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  userId?: string;
  details?: Record<string, any>;
}

/**
 * Get client information for logging
 */
function getClientInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server-side',
      requestPath: '',
    };
  }

  return {
    userAgent: window.navigator.userAgent,
    requestPath: window.location.pathname,
  };
}

/**
 * Determine severity based on event type
 */
function determineSeverity(eventType: SecurityEventType): SecuritySeverity {
  const severityMap: Record<SecurityEventType, SecuritySeverity> = {
    login: 'info',
    logout: 'info',
    login_failed: 'warning',
    registration: 'info',
    registration_failed: 'warning',
    password_change: 'info',
    password_reset: 'info',
    password_reset_failed: 'warning',
    mfa_enabled: 'info',
    mfa_disabled: 'warning',
    suspicious_activity: 'critical',
    rate_limit_exceeded: 'error',
    unauthorized_access: 'critical',
    session_expired: 'warning',
  };

  return severityMap[eventType] || 'info';
}

/**
 * Log a security event
 */
export async function logSecurityEvent(data: SecurityLogData): Promise<void> {
  try {
    const { eventType, severity, userId, details = {} } = data;
    const clientInfo = getClientInfo();

    // Use provided severity or determine from event type
    const eventSeverity = severity || determineSeverity(eventType);

    // Insert log entry (service role policy allows insertion)
    const { error } = await supabase.from('security_logs').insert({
      user_id: userId || null,
      event_type: eventType,
      severity: eventSeverity,
      user_agent: clientInfo.userAgent,
      request_path: clientInfo.requestPath,
      details,
    });

    if (error) {
      // Fallback: log to console if database logging fails
      console.error('Failed to log security event:', error);
      console.warn('Security event:', { eventType, severity: eventSeverity, userId, details });
    }
  } catch (error) {
    // Silent failure - don't break app if logging fails
    console.error('Security logger error:', error);
  }
}

/**
 * Log successful login
 */
export async function logLogin(userId: string, method: string = 'password'): Promise<void> {
  await logSecurityEvent({
    eventType: 'login',
    userId,
    details: { method },
  });
}

/**
 * Log failed login attempt
 */
export async function logLoginFailed(email: string, reason: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'login_failed',
    severity: 'warning',
    details: { email, reason },
  });
}

/**
 * Log successful logout
 */
export async function logLogout(userId: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'logout',
    userId,
  });
}

/**
 * Log successful registration
 */
export async function logRegistration(userId: string, email: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'registration',
    userId,
    details: { email },
  });
}

/**
 * Log failed registration attempt
 */
export async function logRegistrationFailed(email: string, reason: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'registration_failed',
    severity: 'warning',
    details: { email, reason },
  });
}

/**
 * Log password change
 */
export async function logPasswordChange(userId: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'password_change',
    userId,
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  identifier: string,
  limitType: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'rate_limit_exceeded',
    severity: 'error',
    details: { identifier, limitType },
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | undefined,
  activityType: string,
  details: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'suspicious_activity',
    severity: 'critical',
    userId,
    details: { activityType, ...details },
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  userId: string | undefined,
  attemptedPath: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'unauthorized_access',
    severity: 'critical',
    userId,
    details: { attemptedPath },
  });
}

/**
 * Batch log multiple events (for performance)
 */
export async function logSecurityEventsBatch(
  events: SecurityLogData[]
): Promise<void> {
  try {
    const clientInfo = getClientInfo();

    const logEntries = events.map((data) => ({
      user_id: data.userId || null,
      event_type: data.eventType,
      severity: data.severity || determineSeverity(data.eventType),
      user_agent: clientInfo.userAgent,
      request_path: clientInfo.requestPath,
      details: data.details || {},
    }));

    const { error } = await supabase.from('security_logs').insert(logEntries);

    if (error) {
      console.error('Failed to batch log security events:', error);
    }
  } catch (error) {
    console.error('Security batch logger error:', error);
  }
}

/**
 * React hook for security logging with automatic user context
 */
export function useSecurityLogger() {
  const logEventWithUser = async (
    eventType: SecurityEventType,
    details?: Record<string, any>
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logSecurityEvent({
      eventType,
      userId: user?.id,
      details,
    });
  };

  return { logEvent: logEventWithUser };
}
