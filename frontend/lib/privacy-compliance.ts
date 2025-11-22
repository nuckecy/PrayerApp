/**
 * Privacy & GDPR Compliance Utilities
 *
 * Implements user data rights:
 * - Right to Access (GDPR Article 15)
 * - Right to Erasure / Right to be Forgotten (GDPR Article 17)
 * - Data Portability (GDPR Article 20)
 */

import { supabase } from './supabase';

export interface DataExportResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface DataDeletionResult {
  success: boolean;
  message?: string;
  deletedCounts?: {
    enrollments: number;
    completions: number;
    notifications: number;
    goals_archived: number;
    security_logs: number;
  };
  error?: string;
}

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  reason?: string;
}

/**
 * Export all user data (GDPR Article 15 - Right of Access)
 * Returns complete data in JSON format
 */
export async function exportUserData(): Promise<DataExportResult> {
  try {
    const { data, error } = await supabase.rpc('export_user_data');

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to export user data',
    };
  }
}

/**
 * Download user data as JSON file
 */
export async function downloadUserData(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await exportUserData();

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'No data to export',
      };
    }

    // Create blob and download
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to download data',
    };
  }
}

/**
 * Delete all user data (GDPR Article 17 - Right to Erasure)
 * Warning: This is irreversible!
 */
export async function deleteUserData(): Promise<DataDeletionResult> {
  try {
    const { data, error } = await supabase.rpc('delete_user_data');

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        message: result.message,
        deletedCounts: result.deleted_counts,
      };
    }

    return {
      success: false,
      error: 'No response from deletion function',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete user data',
    };
  }
}

/**
 * Request data deletion (creates a deletion request with 30-day grace period)
 */
export async function requestDataDeletion(
  reason?: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('request_data_deletion', {
      p_reason: reason || null,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      requestId: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to request data deletion',
    };
  }
}

/**
 * Get deletion request status
 */
export async function getDeletionRequestStatus(): Promise<{
  success: boolean;
  request?: DeletionRequest;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: true,
        request: undefined,
      };
    }

    return {
      success: true,
      request: {
        id: data.id,
        status: data.status,
        requestedAt: data.requested_at,
        processedAt: data.processed_at,
        reason: data.reason,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get deletion request status',
    };
  }
}

/**
 * Cancel pending deletion request
 */
export async function cancelDeletionRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('data_deletion_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('status', 'pending'); // Only cancel pending requests

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to cancel deletion request',
    };
  }
}

/**
 * Format exported data for display
 */
export function formatExportedData(data: any): string {
  if (!data) return '';

  const summary = `
Data Export Summary
==================
Export Date: ${new Date(data.export_date).toLocaleString()}
User ID: ${data.user_id}
Format Version: ${data.export_format_version}

Profile Information:
-------------------
Name: ${data.profile?.name}
Email: ${data.profile?.email}
Role: ${data.profile?.role}
Timezone: ${data.profile?.timezone}
Account Created: ${new Date(data.profile?.created_at).toLocaleString()}

Enrollments: ${data.enrollments?.length || 0}
Completions: ${data.completions?.length || 0}
Notifications: ${data.notifications?.length || 0}
Authored Goals: ${data.authored_goals?.length || 0}
Security Logs: ${data.security_logs?.length || 0}
  `.trim();

  return summary;
}

/**
 * Get data retention period information
 */
export function getDataRetentionInfo(): {
  [key: string]: { period: string; description: string };
} {
  return {
    profile: {
      period: 'Until account deletion',
      description: 'Basic profile information (name, email, timezone)',
    },
    enrollments: {
      period: 'Until account deletion',
      description: 'Goal enrollments and progress',
    },
    completions: {
      period: 'Until account deletion',
      description: 'Day completion records',
    },
    notifications: {
      period: 'Until account deletion',
      description: 'Notification history',
    },
    security_logs: {
      period: '90 days',
      description: 'Security event logs (login, failed attempts, etc.)',
    },
    admin_audit_logs: {
      period: '2 years',
      description: 'Admin action audit trail (compliance requirement)',
    },
    failed_login_attempts: {
      period: '7 days',
      description: 'Failed login attempt records',
    },
  };
}

/**
 * Validate data export integrity
 */
export function validateExportIntegrity(data: any): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!data) {
    issues.push('Export data is null or undefined');
    return { valid: false, issues };
  }

  if (!data.export_date) {
    issues.push('Missing export date');
  }

  if (!data.user_id) {
    issues.push('Missing user ID');
  }

  if (!data.profile) {
    issues.push('Missing profile data');
  }

  if (!data.export_format_version) {
    issues.push('Missing format version');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
