'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { loginLimiter, withRateLimit } from '@/lib/rate-limiter';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
        setError(result.error || 'Login failed');
        return;
      }

      if (result.data?.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-100 dark:bg-gray-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-200 dark:bg-gray-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="card border-border shadow-lg">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="alert alert-destructive">
                <div className="text-sm font-medium">{error}</div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="divider"></div>
            </div>

            {/* Sign Up Link */}
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
