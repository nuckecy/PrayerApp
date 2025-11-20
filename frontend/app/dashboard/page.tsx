'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth';

interface Goal {
  id: string;
  title: string;
  description: string;
  total_days: number;
  tags: string[];
}

interface Enrollment {
  id: string;
  current_day_index: number;
  streak_count: number;
  status: string;
  goal_id: string;
  group_id: string | null;
  goals: Goal;
  groups?: {
    id: string;
    name: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);

        // Fetch user profile
        const userProfile = await getUserProfile(currentUser.id);
        setProfile(userProfile);

        // Fetch enrollments with goals and groups
        const { data: enrollmentsData, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            current_day_index,
            streak_count,
            status,
            goal_id,
            group_id,
            goals!inner (
              id,
              title,
              description,
              total_days,
              tags
            ),
            groups (
              id,
              name
            )
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Type assertion since Supabase returns the correct structure
        setEnrollments((enrollmentsData as any) || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.name || user?.email}!</h1>
            {activeEnrollments.length > 0 && (
              <p className="text-lg text-muted-foreground">
                Keep up your streak! You&apos;re doing great.
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/author/dashboard">Author Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Active Goals */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Active Goals ({activeEnrollments.length})</h2>
            <Button asChild>
              <Link href="/goals">Browse Goals</Link>
            </Button>
          </div>

          {activeEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-xl text-muted-foreground mb-4">
                  You haven&apos;t started any goals yet.
                </p>
                <Button asChild>
                  <Link href="/goals">Explore Available Goals</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => {
                const progress = (enrollment.current_day_index / enrollment.goals.total_days) * 100;

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <CardTitle>{enrollment.goals.title}</CardTitle>
                      <CardDescription>
                        Day {enrollment.current_day_index} of {enrollment.goals.total_days}
                      </CardDescription>
                      {enrollment.groups && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                            👥 {enrollment.groups.name}
                          </span>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {enrollment.streak_count > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>🔥</span>
                          <span className="font-medium">{enrollment.streak_count} day streak</span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/goals/${enrollment.goals.id}/play/${enrollment.id}`}>
                          Continue
                        </Link>
                      </Button>
                      {enrollment.groups && (
                        <Button asChild variant="outline" className="flex-1">
                          <Link href={`/groups/${enrollment.group_id}`}>
                            Group
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedEnrollments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Completed Goals ({completedEnrollments.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="opacity-80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {enrollment.goals.title}
                      <span className="text-xl">✅</span>
                    </CardTitle>
                    <CardDescription>
                      Completed {enrollment.goals.total_days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.goals.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
