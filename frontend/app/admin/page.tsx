'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { Users, FileText, CheckCircle, AlertTriangle, TrendingUp, Settings } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  pendingAuthors: number;
  pendingGoals: number;
  activeGoals: number;
  totalEnrollments: number;
  completedGoals: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingAuthors: 0,
    pendingGoals: 0,
    activeGoals: 0,
    totalEnrollments: 0,
    completedGoals: 0,
  });

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

      await loadStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  const loadStats = async () => {
    try {
      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Pending authors
      const { count: pendingAuthorsCount } = await supabase
        .from('authors')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Pending goals
      const { count: pendingGoalsCount } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      // Active/published goals
      const { count: activeGoalsCount } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'published');

      // Total enrollments
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Completed goals
      const { count: completedCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      setStats({
        totalUsers: usersCount || 0,
        pendingAuthors: pendingAuthorsCount || 0,
        pendingGoals: pendingGoalsCount || 0,
        activeGoals: activeGoalsCount || 0,
        totalEnrollments: enrollmentsCount || 0,
        completedGoals: completedCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="container max-w-7xl py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage content, users, and platform operations
          </p>
        </div>

        {/* Alert Cards */}
        {(stats.pendingAuthors > 0 || stats.pendingGoals > 0) && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {stats.pendingAuthors > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Pending Author Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {stats.pendingAuthors} author{stats.pendingAuthors !== 1 ? 's' : ''} waiting for approval
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/authors">Review Applications</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {stats.pendingGoals > 0 && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                    Pending Goal Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {stats.pendingGoals} goal{stats.pendingGoals !== 1 ? 's' : ''} awaiting approval
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/goals">Review Goals</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered platform users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Published and available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedGoals} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/admin/authors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Author Management
                </CardTitle>
                <CardDescription>
                  Review and approve author applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.pendingAuthors > 0 && (
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-orange-100 text-orange-800 border-orange-300">
                    {stats.pendingAuthors} pending
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/admin/goals">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Goal Moderation
                </CardTitle>
                <CardDescription>
                  Review, approve, or reject submitted goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.pendingGoals > 0 && (
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-blue-100 text-blue-800 border-blue-300">
                    {stats.pendingGoals} pending
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/admin/analytics">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>
                  View platform metrics and insights
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/admin/users">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and roles
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
            <Link href="/admin/settings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure platform-wide settings
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
