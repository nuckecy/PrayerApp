/**
 * Password Strength Validator
 *
 * Validates password strength and provides user-friendly feedback.
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (for strong passwords)
 * - No common passwords
 */

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordValidation {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-4
  feedback: string[];
  suggestions: string[];
}

// Common passwords to reject
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567890',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  'superman',
  'qazwsx',
  'michael',
  'football',
];

/**
 * Check if password contains sequential characters
 */
function hasSequentialCharacters(password: string): boolean {
  const sequences = ['012', '123', '234', '345', '456', '567', '678', '789', 'abc', 'bcd', 'cde', 'def'];
  const lowerPassword = password.toLowerCase();

  return sequences.some((seq) => lowerPassword.includes(seq));
}

/**
 * Check if password has repeated characters
 */
function hasRepeatedCharacters(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/**
 * Calculate password entropy (rough estimation)
 */
function calculateEntropy(password: string): number {
  let charSpace = 0;

  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSpace += 32;

  return password.length * Math.log2(charSpace);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const feedback: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
    return {
      isValid: false,
      strength: 'weak',
      score: 0,
      feedback,
      suggestions: ['Use at least 8 characters'],
    };
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    feedback.push('This password is too common');
    return {
      isValid: false,
      strength: 'weak',
      score: 0,
      feedback,
      suggestions: ['Avoid common passwords', 'Use a unique combination'],
    };
  }

  // Score based on length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Check for character types
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

  // Requirement checks
  if (!hasLowercase) {
    feedback.push('Missing lowercase letters');
    suggestions.push('Add lowercase letters');
  } else {
    score += 1;
  }

  if (!hasUppercase) {
    feedback.push('Missing uppercase letters');
    suggestions.push('Add uppercase letters');
  } else {
    score += 1;
  }

  if (!hasNumbers) {
    feedback.push('Missing numbers');
    suggestions.push('Add numbers');
  } else {
    score += 1;
  }

  if (!hasSpecialChars) {
    suggestions.push('Add special characters (!@#$%^&*)');
  } else {
    score += 2; // Extra points for special chars
  }

  // Penalties for weak patterns
  if (hasSequentialCharacters(password)) {
    feedback.push('Avoid sequential characters (e.g., 123, abc)');
    score = Math.max(0, score - 1);
  }

  if (hasRepeatedCharacters(password)) {
    feedback.push('Avoid repeated characters (e.g., aaa, 111)');
    score = Math.max(0, score - 1);
  }

  // Calculate entropy
  const entropy = calculateEntropy(password);
  if (entropy < 40) {
    suggestions.push('Make your password more complex');
  }

  // Determine strength based on score
  let strength: PasswordStrength;
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'fair';
  } else if (score <= 6) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  // Must meet minimum requirements to be valid
  const isValid = hasLowercase && hasUppercase && hasNumbers && password.length >= 8;

  return {
    isValid,
    strength,
    score: Math.min(4, Math.floor(score / 2)), // Normalize to 0-4
    feedback,
    suggestions,
  };
}

/**
 * Get password strength color for UI
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'red';
    case 'fair':
      return 'orange';
    case 'good':
      return 'yellow';
    case 'strong':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get password strength label
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
}

/**
 * Get password strength percentage (for progress bar)
 */
export function getStrengthPercentage(score: number): number {
  return (score / 4) * 100;
}

/**
 * Check if password meets minimum requirements
 */
export function meetsMinimumRequirements(password: string): boolean {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const minLength = password.length >= 8;

  return hasLowercase && hasUppercase && hasNumbers && minLength;
}
