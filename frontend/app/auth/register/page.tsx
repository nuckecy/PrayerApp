'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { registrationLimiter, withRateLimit } from '@/lib/rate-limiter';
import { logRegistration, logRegistrationFailed, logRateLimitExceeded } from '@/lib/security-logger';
import {
  validatePasswordStrength,
  getStrengthColor,
  getStrengthLabel,
  getStrengthPercentage,
  type PasswordValidation,
} from '@/lib/password-strength';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);

  // Validate password strength in real-time
  useEffect(() => {
    if (formData.password) {
      const validation = validatePasswordStrength(formData.password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password strength before submission
    if (passwordValidation && !passwordValidation.isValid) {
      setError('Password does not meet minimum requirements: ' + passwordValidation.feedback.join(', '));
      setLoading(false);
      return;
    }

    try {
      // Apply rate limiting to prevent spam registrations
      const result = await withRateLimit(
        registrationLimiter,
        formData.email.toLowerCase(),
        async () => {
          // Sign up with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: formData.name,
              },
            },
          });

          if (authError) throw authError;

          if (authData.user) {
            // Update profile with timezone
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ timezone: formData.timezone })
              .eq('id', authData.user.id);

            if (profileError) throw profileError;
          }

          return authData;
        }
      );

      if (!result.success) {
        // Check if rate limit was exceeded
        if (result.retryAfter) {
          await logRateLimitExceeded(formData.email.toLowerCase(), 'registration');
        } else {
          // Log failed registration attempt
          await logRegistrationFailed(formData.email, result.error || 'Unknown error');
        }
        setError(result.error || 'Registration failed');
        return;
      }

      if (result.data?.user) {
        // Log successful registration
        await logRegistration(result.data.user.id, formData.email);
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Log failed registration attempt
      await logRegistrationFailed(formData.email, err.message || 'Unknown error');
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Start your journey to building better habits
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className="w-full px-3 py-2 border rounded-md"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />

              {/* Password Strength Indicator */}
              {passwordValidation && formData.password && (
                <div className="space-y-2">
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordValidation.strength === 'weak'
                            ? 'bg-red-500'
                            : passwordValidation.strength === 'fair'
                            ? 'bg-orange-500'
                            : passwordValidation.strength === 'good'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${getStrengthPercentage(passwordValidation.score)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordValidation.strength === 'weak'
                          ? 'text-red-600'
                          : passwordValidation.strength === 'fair'
                          ? 'text-orange-600'
                          : passwordValidation.strength === 'good'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {getStrengthLabel(passwordValidation.strength)}
                    </span>
                  </div>

                  {/* Feedback Messages */}
                  {passwordValidation.feedback.length > 0 && (
                    <div className="text-xs text-red-600">
                      {passwordValidation.feedback.map((msg, idx) => (
                        <div key={idx}>• {msg}</div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {passwordValidation.suggestions.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {passwordValidation.suggestions.map((msg, idx) => (
                        <div key={idx}>💡 {msg}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!formData.password && (
                <p className="text-xs text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
