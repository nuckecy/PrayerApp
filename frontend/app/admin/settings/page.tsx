'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/AppHeader';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'super_admin') {
        alert('Access denied. Admin privileges required.');
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="container max-w-7xl py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="container max-w-7xl py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure platform-wide settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Configuration
            </CardTitle>
            <CardDescription>
              Advanced settings for platform administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Platform settings configuration coming soon.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This section will include:
            </p>
            <ul className="text-sm text-muted-foreground mt-4 space-y-1 max-w-md mx-auto text-left">
              <li>• Global platform settings</li>
              <li>• Email configuration</li>
              <li>• Notification defaults</li>
              <li>• Content moderation rules</li>
              <li>• Feature flags</li>
              <li>• Maintenance mode</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
