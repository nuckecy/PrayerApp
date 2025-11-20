'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/AppHeader';
import { Users, Target, CheckCircle, TrendingUp, Award, UserPlus } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisWeek: number;
  totalGoals: number;
  publishedGoals: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalAchievements: number;
  totalGroups: number;
  averageGoalCompletionRate: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalGoals: 0,
    publishedGoals: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    totalAchievements: 0,
    totalGroups: 0,
    averageGoalCompletionRate: 0,
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

      await loadAnalytics();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  const loadAnalytics = async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Execute all queries in parallel
      const [
        { count: totalUsers },
        { count: newUsers },
        { count: totalGoals },
        { count: publishedGoals },
        { count: totalEnrollments },
        { count: activeEnrollments },
        { count: completedEnrollments },
        { count: totalAchievements },
        { count: totalGroups },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('goals').select('*', { count: 'exact', head: true }),
        supabase.from('goals').select('*', { count: 'exact', head: true }).eq('approval_status', 'published'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('user_achievements').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }),
      ]);

      const completionRate = totalEnrollments > 0
        ? ((completedEnrollments || 0) / (totalEnrollments || 1)) * 100
        : 0;

      setAnalytics({
        totalUsers: totalUsers || 0,
        newUsersThisWeek: newUsers || 0,
        totalGoals: totalGoals || 0,
        publishedGoals: publishedGoals || 0,
        totalEnrollments: totalEnrollments || 0,
        activeEnrollments: activeEnrollments || 0,
        completedEnrollments: completedEnrollments || 0,
        totalAchievements: totalAchievements || 0,
        totalGroups: totalGroups || 0,
        averageGoalCompletionRate: Math.round(completionRate),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
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
            <p className="text-muted-foreground">Loading analytics...</p>
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
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Key metrics and platform insights
          </p>
        </div>

        <div className="space-y-6">
          {/* User Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">User Metrics</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    All registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New This Week</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.newUsersThisWeek}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered in last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalAchievements}</div>
                  <p className="text-xs text-muted-foreground">
                    Achievements earned
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Content Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Content Metrics</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalGoals}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.publishedGoals} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalGroups}</div>
                  <p className="text-xs text-muted-foreground">
                    Active study groups
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enrollment Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Enrollment Metrics</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
                  <p className="text-xs text-muted-foreground">
                    All time enrollments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeEnrollments}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently active enrollments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.completedEnrollments}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.averageGoalCompletionRate}% completion rate
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle>Platform Health Summary</CardTitle>
              <CardDescription>Overall platform performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">User Growth Rate</span>
                <span className="text-sm text-muted-foreground">
                  {analytics.totalUsers > 0
                    ? `${Math.round((analytics.newUsersThisWeek / analytics.totalUsers) * 100)}% weekly`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Goal Completion Rate</span>
                <span className="text-sm text-muted-foreground">
                  {analytics.averageGoalCompletionRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Active vs Total Enrollments</span>
                <span className="text-sm text-muted-foreground">
                  {analytics.totalEnrollments > 0
                    ? `${Math.round((analytics.activeEnrollments / analytics.totalEnrollments) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Average Achievements per User</span>
                <span className="text-sm text-muted-foreground">
                  {analytics.totalUsers > 0
                    ? (analytics.totalAchievements / analytics.totalUsers).toFixed(1)
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
