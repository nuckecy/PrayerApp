'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { loginLimiter, withRateLimit } from '@/lib/rate-limiter';
import { logLogin, logLoginFailed, logRateLimitExceeded } from '@/lib/security-logger';
import {
  checkLoginAllowed,
  handleFailedLogin,
  formatLockoutMessage,
  getAttemptsWarning,
} from '@/lib/account-lockout';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setLoading(true);

    try {
      // Check if account is locked before attempting login
      const lockoutCheck = await checkLoginAllowed(formData.email.toLowerCase());

      if (!lockoutCheck.canAttemptLogin && lockoutCheck.lockoutStatus) {
        const lockoutMsg = formatLockoutMessage(lockoutCheck.lockoutStatus);
        setError(lockoutMsg);
        setLoading(false);
        return;
      }

      // Apply rate limiting to prevent brute force attacks
      const result = await withRateLimit(
        loginLimiter,
        formData.email.toLowerCase(),
        async () => {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (authError) throw authError;
          return data;
        }
      );

      if (!result.success) {
        // Handle failed login - record attempt and check for lockout
        const failedLoginResult = await handleFailedLogin(formData.email.toLowerCase());

        // Check if rate limit was exceeded
        if (result.retryAfter) {
          await logRateLimitExceeded(formData.email.toLowerCase(), 'login');
        } else {
          // Log failed login attempt
          await logLoginFailed(formData.email, result.error || 'Unknown error');
        }

        // Check if account is now locked
        if (!failedLoginResult.canAttemptLogin && failedLoginResult.lockoutStatus) {
          const lockoutMsg = formatLockoutMessage(failedLoginResult.lockoutStatus);
          setError(lockoutMsg);
        } else {
          setError(result.error || 'Login failed');

          // Show warning about remaining attempts
          const warningMsg = getAttemptsWarning(failedLoginResult.failedAttempts || 0);
          if (warningMsg) {
            setWarning(warningMsg);
          }
        }
        return;
      }

      if (result.data?.user) {
        // Log successful login
        await logLogin(result.data.user.id, 'password');
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Handle failed login - record attempt and check for lockout
      const failedLoginResult = await handleFailedLogin(formData.email.toLowerCase());

      // Log failed login attempt
      await logLoginFailed(formData.email, err.message || 'Unknown error');

      // Check if account is now locked
      if (!failedLoginResult.canAttemptLogin && failedLoginResult.lockoutStatus) {
        const lockoutMsg = formatLockoutMessage(failedLoginResult.lockoutStatus);
        setError(lockoutMsg);
      } else {
        setError(err.message || 'An unexpected error occurred');

        // Show warning about remaining attempts
        const warningMsg = getAttemptsWarning(failedLoginResult.failedAttempts || 0);
        if (warningMsg) {
          setWarning(warningMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to continue your progress
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            {warning && (
              <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded">
                {warning}
              </div>
            )}

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
                className="w-full px-3 py-2 border rounded-md"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
