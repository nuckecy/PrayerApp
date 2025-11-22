/**
 * Multi-Factor Authentication (MFA) Helper Utilities
 *
 * Supabase supports TOTP (Time-based One-Time Password) MFA out of the box.
 * These utilities help with enrolling, verifying, and managing MFA for users.
 *
 * Prerequisites:
 * - MFA must be enabled in Supabase dashboard (Authentication > Settings > MFA)
 * - Users need an authenticator app (Google Authenticator, Authy, etc.)
 */

import { supabase } from './supabase';

export interface MFAEnrollmentResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  factorId?: string;
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
}

export interface MFAStatus {
  enabled: boolean;
  factors: MFAFactor[];
}

export interface MFAFactor {
  id: string;
  friendlyName: string;
  factorType: 'totp';
  status: 'verified' | 'unverified';
  createdAt: string;
  updatedAt: string;
}

/**
 * Enroll user in MFA (Step 1)
 * Returns QR code and secret for authenticator app
 */
export async function enrollMFA(
  friendlyName: string = 'Authenticator App'
): Promise<MFAEnrollmentResult> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No enrollment data returned',
      };
    }

    return {
      success: true,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'MFA enrollment failed',
    };
  }
}

/**
 * Verify MFA enrollment (Step 2)
 * User must provide code from authenticator app
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<MFAVerificationResult> {
  try {
    const challenge = await supabase.auth.mfa.challenge({ factorId });

    if (challenge.error) {
      return {
        success: false,
        error: challenge.error.message,
      };
    }

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (verify.error) {
      return {
        success: false,
        error: verify.error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'MFA verification failed',
    };
  }
}

/**
 * Challenge user for MFA code during login
 */
export async function challengeMFA(factorId: string): Promise<{
  success: boolean;
  challengeId?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      challengeId: data.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'MFA challenge failed',
    };
  }
}

/**
 * Verify MFA code during login
 */
export async function verifyMFACode(
  factorId: string,
  challengeId: string,
  code: string
): Promise<MFAVerificationResult> {
  try {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

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
      error: error.message || 'MFA verification failed',
    };
  }
}

/**
 * Get user's MFA status and enrolled factors
 */
export async function getMFAStatus(): Promise<MFAStatus> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      console.error('Failed to get MFA status:', error);
      return {
        enabled: false,
        factors: [],
      };
    }

    const verifiedFactors = data.totp.filter((f) => f.status === 'verified');

    return {
      enabled: verifiedFactors.length > 0,
      factors: data.totp.map((factor) => ({
        id: factor.id,
        friendlyName: factor.friendly_name || 'Authenticator',
        factorType: factor.factor_type as 'totp',
        status: factor.status,
        createdAt: factor.created_at,
        updatedAt: factor.updated_at,
      })),
    };
  } catch (error) {
    console.error('MFA status error:', error);
    return {
      enabled: false,
      factors: [],
    };
  }
}

/**
 * Unenroll (remove) an MFA factor
 */
export async function unenrollMFA(factorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

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
      error: error.message || 'Failed to remove MFA',
    };
  }
}

/**
 * Get Assurance Level (AAL)
 * AAL1 = single factor (password only)
 * AAL2 = multi-factor (password + MFA)
 */
export async function getAssuranceLevel(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
}> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      console.error('Failed to get AAL:', error);
      return {
        currentLevel: null,
        nextLevel: null,
      };
    }

    return {
      currentLevel: data.currentLevel,
      nextLevel: data.nextLevel,
    };
  } catch (error) {
    console.error('AAL check error:', error);
    return {
      currentLevel: null,
      nextLevel: null,
    };
  }
}

/**
 * Format MFA code (add hyphen for readability: 123-456)
 */
export function formatMFACode(code: string): string {
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
}

/**
 * Validate MFA code format
 */
export function isValidMFACode(code: string): boolean {
  const cleaned = code.replace(/\D/g, '');
  return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
}
