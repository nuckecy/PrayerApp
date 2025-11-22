/**
 * Consent Management System
 *
 * Manages user consent for:
 * - Essential cookies (always required)
 * - Analytics cookies
 * - Marketing/advertising
 * - Email communications
 *
 * GDPR/CCPA compliant consent tracking
 */

export type ConsentCategory = 'essential' | 'analytics' | 'marketing' | 'email';

export interface ConsentPreferences {
  essential: boolean; // Always true (required for app to function)
  analytics: boolean;
  marketing: boolean;
  email: boolean;
  lastUpdated: string;
  version: string; // Privacy policy version
}

export interface ConsentBanner {
  shown: boolean;
  accepted: boolean;
  timestamp: string;
}

const CONSENT_KEY = 'user_consent_preferences';
const CONSENT_BANNER_KEY = 'consent_banner_status';
const CURRENT_POLICY_VERSION = '1.0';

/**
 * Get default consent preferences (only essential enabled)
 */
export function getDefaultConsent(): ConsentPreferences {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    email: false,
    lastUpdated: new Date().toISOString(),
    version: CURRENT_POLICY_VERSION,
  };
}

/**
 * Load consent preferences from localStorage
 */
export function loadConsentPreferences(): ConsentPreferences {
  if (typeof window === 'undefined') {
    return getDefaultConsent();
  }

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      return getDefaultConsent();
    }

    const preferences = JSON.parse(stored) as ConsentPreferences;

    // If policy version has changed, reset to defaults
    if (preferences.version !== CURRENT_POLICY_VERSION) {
      return getDefaultConsent();
    }

    // Ensure essential is always true
    preferences.essential = true;

    return preferences;
  } catch (error) {
    console.error('Failed to load consent preferences:', error);
    return getDefaultConsent();
  }
}

/**
 * Save consent preferences to localStorage
 */
export function saveConsentPreferences(preferences: Partial<ConsentPreferences>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = loadConsentPreferences();
    const updated: ConsentPreferences = {
      ...current,
      ...preferences,
      essential: true, // Always true
      lastUpdated: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(updated));

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('consentUpdated', { detail: updated }));
  } catch (error) {
    console.error('Failed to save consent preferences:', error);
  }
}

/**
 * Accept all non-essential consent categories
 */
export function acceptAllConsent(): void {
  saveConsentPreferences({
    analytics: true,
    marketing: true,
    email: true,
  });
}

/**
 * Reject all non-essential consent categories
 */
export function rejectAllConsent(): void {
  saveConsentPreferences({
    analytics: false,
    marketing: false,
    email: false,
  });
}

/**
 * Check if user has given consent for a specific category
 */
export function hasConsent(category: ConsentCategory): boolean {
  const preferences = loadConsentPreferences();
  return preferences[category] === true;
}

/**
 * Get consent banner status
 */
export function getConsentBannerStatus(): ConsentBanner | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_BANNER_KEY);
    if (!stored) return null;

    return JSON.parse(stored) as ConsentBanner;
  } catch (error) {
    console.error('Failed to load consent banner status:', error);
    return null;
  }
}

/**
 * Mark consent banner as shown
 */
export function markConsentBannerShown(accepted: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    const status: ConsentBanner = {
      shown: true,
      accepted,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_BANNER_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save consent banner status:', error);
  }
}

/**
 * Check if consent banner should be shown
 */
export function shouldShowConsentBanner(): boolean {
  if (typeof window === 'undefined') return false;

  const status = getConsentBannerStatus();

  // Show if never shown before
  if (!status) return true;

  // Show if policy version has changed
  const preferences = loadConsentPreferences();
  if (preferences.version !== CURRENT_POLICY_VERSION) {
    return true;
  }

  return false;
}

/**
 * Clear all consent data (for testing or user request)
 */
export function clearConsentData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_BANNER_KEY);
    window.dispatchEvent(new CustomEvent('consentCleared'));
  } catch (error) {
    console.error('Failed to clear consent data:', error);
  }
}

/**
 * Get consent summary for display
 */
export function getConsentSummary(): {
  category: string;
  label: string;
  description: string;
  enabled: boolean;
  required: boolean;
}[] {
  const preferences = loadConsentPreferences();

  return [
    {
      category: 'essential',
      label: 'Essential Cookies',
      description: 'Required for the app to function properly (authentication, security)',
      enabled: preferences.essential,
      required: true,
    },
    {
      category: 'analytics',
      label: 'Analytics Cookies',
      description: 'Help us understand how you use the app to improve user experience',
      enabled: preferences.analytics,
      required: false,
    },
    {
      category: 'marketing',
      label: 'Marketing Cookies',
      description: 'Used to show you relevant content and advertisements',
      enabled: preferences.marketing,
      required: false,
    },
    {
      category: 'email',
      label: 'Email Communications',
      description: 'Receive product updates, tips, and promotional emails',
      enabled: preferences.email,
      required: false,
    },
  ];
}

/**
 * Export consent history for GDPR data export
 */
export function exportConsentHistory(): {
  preferences: ConsentPreferences;
  banner: ConsentBanner | null;
  policyVersion: string;
} {
  return {
    preferences: loadConsentPreferences(),
    banner: getConsentBannerStatus(),
    policyVersion: CURRENT_POLICY_VERSION,
  };
}

/**
 * React hook for consent preferences
 */
export function useConsentPreferences() {
  if (typeof window === 'undefined') {
    return {
      preferences: getDefaultConsent(),
      updatePreferences: () => {},
      acceptAll: () => {},
      rejectAll: () => {},
    };
  }

  const [preferences, setPreferences] = React.useState<ConsentPreferences>(loadConsentPreferences());

  React.useEffect(() => {
    const handleConsentUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentPreferences>;
      setPreferences(customEvent.detail);
    };

    window.addEventListener('consentUpdated', handleConsentUpdated);

    return () => {
      window.removeEventListener('consentUpdated', handleConsentUpdated);
    };
  }, []);

  const updatePreferences = (updates: Partial<ConsentPreferences>) => {
    saveConsentPreferences(updates);
    setPreferences(loadConsentPreferences());
  };

  const acceptAll = () => {
    acceptAllConsent();
    setPreferences(loadConsentPreferences());
  };

  const rejectAll = () => {
    rejectAllConsent();
    setPreferences(loadConsentPreferences());
  };

  return {
    preferences,
    updatePreferences,
    acceptAll,
    rejectAll,
  };
}

// Add React import at top if not using in a React file
import React from 'react';
