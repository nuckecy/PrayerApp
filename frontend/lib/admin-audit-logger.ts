/**
 * Admin Audit Logger
 *
 * Tracks all administrative actions for compliance, accountability, and security monitoring.
 * All admin actions are logged to the admin_audit_log table.
 */

import { supabase } from './supabase';

export type AdminActionType =
  | 'goal_approved'
  | 'goal_rejected'
  | 'goal_deleted'
  | 'goal_updated'
  | 'user_role_changed'
  | 'user_suspended'
  | 'user_activated'
  | 'user_deleted'
  | 'author_application_approved'
  | 'author_application_rejected'
  | 'content_deleted'
  | 'notification_sent'
  | 'settings_updated'
  | 'bulk_operation';

export type TargetType = 'goal' | 'user' | 'enrollment' | 'notification' | 'setting' | 'author_application';

export interface AuditLogData {
  action: AdminActionType;
  targetType?: TargetType;
  targetId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

/**
 * Get client information for audit trail
 */
function getClientInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server-side',
    };
  }

  return {
    userAgent: window.navigator.userAgent,
  };
}

/**
 * Log an admin action
 */
export async function logAdminAction(data: AuditLogData): Promise<void> {
  try {
    const { action, targetType, targetId, changes } = data;
    const clientInfo = getClientInfo();

    // Get current admin user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('Cannot log admin action: No authenticated user');
      return;
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      console.error('Cannot log admin action: User is not an admin');
      return;
    }

    // Insert audit log entry
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      changes: changes || {},
      user_agent: clientInfo.userAgent,
    });

    if (error) {
      // Log error but don't break the app
      console.error('Failed to log admin action:', error);
      console.warn('Admin action:', { action, targetType, targetId, changes });
    }
  } catch (error) {
    // Silent failure - critical that admin actions succeed even if logging fails
    console.error('Admin audit logger error:', error);
  }
}

/**
 * Log goal approval
 */
export async function logGoalApproved(goalId: string, goalTitle: string): Promise<void> {
  await logAdminAction({
    action: 'goal_approved',
    targetType: 'goal',
    targetId: goalId,
    changes: {
      before: { status: 'pending' },
      after: { status: 'published', title: goalTitle },
    },
  });
}

/**
 * Log goal rejection
 */
export async function logGoalRejected(
  goalId: string,
  goalTitle: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    action: 'goal_rejected',
    targetType: 'goal',
    targetId: goalId,
    changes: {
      before: { status: 'pending' },
      after: { status: 'rejected', reason },
    },
  });
}

/**
 * Log goal deletion
 */
export async function logGoalDeleted(
  goalId: string,
  goalTitle: string
): Promise<void> {
  await logAdminAction({
    action: 'goal_deleted',
    targetType: 'goal',
    targetId: goalId,
    changes: {
      before: { title: goalTitle, deleted: false },
      after: { deleted: true },
    },
  });
}

/**
 * Log user role change
 */
export async function logUserRoleChanged(
  userId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAdminAction({
    action: 'user_role_changed',
    targetType: 'user',
    targetId: userId,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
  });
}

/**
 * Log user suspension
 */
export async function logUserSuspended(
  userId: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    action: 'user_suspended',
    targetType: 'user',
    targetId: userId,
    changes: {
      before: { status: 'active' },
      after: { status: 'suspended', reason },
    },
  });
}

/**
 * Log user deletion
 */
export async function logUserDeleted(userId: string, email: string): Promise<void> {
  await logAdminAction({
    action: 'user_deleted',
    targetType: 'user',
    targetId: userId,
    changes: {
      before: { email, deleted: false },
      after: { deleted: true },
    },
  });
}

/**
 * Log author application approval
 */
export async function logAuthorApplicationApproved(
  applicationId: string,
  userId: string
): Promise<void> {
  await logAdminAction({
    action: 'author_application_approved',
    targetType: 'author_application',
    targetId: applicationId,
    changes: {
      before: { status: 'pending', user_role: 'user' },
      after: { status: 'approved', user_role: 'author' },
    },
  });
}

/**
 * Log author application rejection
 */
export async function logAuthorApplicationRejected(
  applicationId: string,
  reason: string
): Promise<void> {
  await logAdminAction({
    action: 'author_application_rejected',
    targetType: 'author_application',
    targetId: applicationId,
    changes: {
      before: { status: 'pending' },
      after: { status: 'rejected', reason },
    },
  });
}

/**
 * Log settings update
 */
export async function logSettingsUpdated(
  settingKey: string,
  oldValue: any,
  newValue: any
): Promise<void> {
  await logAdminAction({
    action: 'settings_updated',
    targetType: 'setting',
    changes: {
      before: { [settingKey]: oldValue },
      after: { [settingKey]: newValue },
    },
  });
}

/**
 * Log bulk operation
 */
export async function logBulkOperation(
  operationType: string,
  targetType: TargetType,
  affectedCount: number,
  details: Record<string, any>
): Promise<void> {
  await logAdminAction({
    action: 'bulk_operation',
    targetType,
    changes: {
      before: { count: 0 },
      after: {
        operationType,
        affectedCount,
        ...details,
      },
    },
  });
}

/**
 * Batch log multiple admin actions
 */
export async function logAdminActionsBatch(actions: AuditLogData[]): Promise<void> {
  try {
    const clientInfo = getClientInfo();

    // Get current admin user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('Cannot batch log admin actions: No authenticated user');
      return;
    }

    const logEntries = actions.map((data) => ({
      admin_user_id: user.id,
      action: data.action,
      target_type: data.targetType || null,
      target_id: data.targetId || null,
      changes: data.changes || {},
      user_agent: clientInfo.userAgent,
    }));

    const { error } = await supabase.from('admin_audit_log').insert(logEntries);

    if (error) {
      console.error('Failed to batch log admin actions:', error);
    }
  } catch (error) {
    console.error('Admin audit batch logger error:', error);
  }
}

/**
 * React hook for admin audit logging with automatic context
 */
export function useAdminAuditLogger() {
  const logAction = async (data: AuditLogData) => {
    await logAdminAction(data);
  };

  return { logAction };
}
