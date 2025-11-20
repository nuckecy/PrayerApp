'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/client';

interface Enrollment {
  id: string;
  currentDayIndex: number;
  streakCount: number;
  status: string;
  goal: {
    id: string;
    title: string;
    description: string;
    totalDays: number;
    tags: string[];
    author: {
      user: {
        name: string;
      };
    };
  };
  _count: {
    completions: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchEnrollments = async () => {
      try {
        const response: any = await api.getMyGoals();
        setEnrollments(response.enrollments);
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            {activeEnrollments.length > 0 && (
              <p className="text-lg text-muted-foreground">
                Keep up your streak! You're doing great.
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
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
                  You haven't started any goals yet.
                </p>
                <Button asChild>
                  <Link href="/goals">Explore Available Goals</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => {
                const progress = (enrollment._count.completions / enrollment.goal.totalDays) * 100;

                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <CardTitle>{enrollment.goal.title}</CardTitle>
                      <CardDescription>
                        Day {enrollment.currentDayIndex} of {enrollment.goal.totalDays}
                      </CardDescription>
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

                      {enrollment.streakCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>🔥</span>
                          <span className="font-medium">{enrollment.streakCount} day streak</span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/goals/${enrollment.goal.id}/play/${enrollment.id}`}>
                          Continue
                        </Link>
                      </Button>
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
                      {enrollment.goal.title}
                      <span className="text-xl">✅</span>
                    </CardTitle>
                    <CardDescription>
                      Completed {enrollment.goal.totalDays} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      by {enrollment.goal.author.user.name}
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
