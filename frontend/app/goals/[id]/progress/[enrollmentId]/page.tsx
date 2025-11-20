'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { ProgressCalendar } from '@/components/goals/ProgressCalendar';
import { CompletionCertificate } from '@/components/goals/CompletionCertificate';
import { format, differenceInDays } from 'date-fns';
import { calculateSkippedDays, isStreakAtRisk } from '@/lib/midnight-rule';

interface Enrollment {
  id: string;
  user_id: string;
  current_day_index: number;
  streak_count: number;
  status: string;
  start_date: string;
  last_completed_at: string | null;
  projected_end_date: string;
  actual_end_date: string | null;
  goals: {
    id: string;
    title: string;
    description: string;
    total_days: number;
  };
}

interface DayCompletion {
  day_index: number;
  completed_at: string;
}

interface UserProfile {
  name: string;
  timezone: string;
}

export default function ProgressPage({
  params,
}: {
  params: { id: string; enrollmentId: string };
}) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [completions, setCompletions] = useState<DayCompletion[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, timezone')
          .eq('id', user.id)
          .single();

        setUserProfile(profileData);

        // Fetch enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            id,
            user_id,
            current_day_index,
            streak_count,
            status,
            start_date,
            last_completed_at,
            projected_end_date,
            actual_end_date,
            goals!inner (
              id,
              title,
              description,
              total_days
            )
          `)
          .eq('id', params.enrollmentId)
          .single();

        if (enrollmentError) throw enrollmentError;

        if (enrollmentData.user_id !== user.id) {
          router.push('/dashboard');
          return;
        }

        setEnrollment(enrollmentData as any);

        // Fetch completions
        const { data: completionsData, error: completionsError } = await supabase
          .from('day_completions')
          .select('day_index, completed_at')
          .eq('enrollment_id', params.enrollmentId)
          .order('day_index', { ascending: true });

        if (completionsError) throw completionsError;
        setCompletions(completionsData || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.enrollmentId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading progress...</p>
      </div>
    );
  }

  if (!enrollment) return null;

  const completionRate = (completions.length / enrollment.goals.total_days) * 100;
  const skippedDays = calculateSkippedDays(
    enrollment.last_completed_at,
    userProfile?.timezone || 'UTC'
  );
  const streakRisk = isStreakAtRisk(
    enrollment.last_completed_at,
    userProfile?.timezone || 'UTC'
  );

  const daysElapsed = enrollment.start_date
    ? differenceInDays(new Date(), new Date(enrollment.start_date))
    : 0;
  const avgCompletionRate = daysElapsed > 0 ? (completions.length / daysElapsed) * 100 : 0;

  // Calculate best streak (consecutive completions)
  let bestStreak = 0;
  let currentStreak = 0;
  const sortedCompletions = [...completions].sort((a, b) => a.day_index - b.day_index);
  for (let i = 0; i < sortedCompletions.length; i++) {
    if (i === 0 || sortedCompletions[i].day_index === sortedCompletions[i - 1].day_index + 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <Button variant="outline" asChild>
                <Link href="/dashboard">← Back to Dashboard</Link>
              </Button>
            </div>
            <Button asChild>
              <Link href={`/goals/${params.id}/play/${params.enrollmentId}`}>
                Continue Goal →
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{enrollment.goals.title}</h1>
            <p className="text-lg text-muted-foreground">Progress & Statistics</p>
          </div>

          {/* Streak Risk Warning */}
          {streakRisk.atRisk && (
            <Card className="mb-6 bg-yellow-50 border-yellow-300">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-900">{streakRisk.message}</p>
                    {streakRisk.hoursRemaining && (
                      <p className="text-sm text-yellow-700">
                        Complete today to keep your {enrollment.streak_count}-day streak alive!
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show certificate if completed */}
          {enrollment.status === 'completed' && enrollment.actual_end_date && userProfile && (
            <div className="mb-8">
              <CompletionCertificate
                userName={userProfile.name}
                goalTitle={enrollment.goals.title}
                totalDays={enrollment.goals.total_days}
                startDate={enrollment.start_date}
                endDate={enrollment.actual_end_date}
                streakCount={enrollment.streak_count}
              />
            </div>
          )}

          {/* Key Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Completion Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(completionRate)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completions.length} of {enrollment.goals.total_days} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Current Streak</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 flex items-center gap-2">
                  🔥 {enrollment.streak_count}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Best: {bestStreak} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Days Remaining</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {enrollment.goals.total_days - completions.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current day: {enrollment.current_day_index}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(avgCompletionRate)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {skippedDays > 0 ? `${skippedDays} day(s) skipped` : 'Perfect consistency!'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Calendar */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <ProgressCalendar
                startDate={enrollment.start_date}
                totalDays={enrollment.goals.total_days}
                currentDayIndex={enrollment.current_day_index}
                completions={completions}
                status={enrollment.status as any}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(enrollment.start_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {enrollment.status === 'completed' ? 'Completed' : 'Projected End'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.actual_end_date
                        ? format(new Date(enrollment.actual_end_date), 'MMMM d, yyyy')
                        : enrollment.projected_end_date
                        ? format(new Date(enrollment.projected_end_date), 'MMMM d, yyyy')
                        : 'TBD'}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Day 1</span>
                  <span>Day {enrollment.goals.total_days}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {completions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completions
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((completion) => (
                      <div
                        key={completion.day_index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <p className="font-medium">Day {completion.day_index}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(completion.completed_at), 'MMM d, yyyy \'at\' h:mm a')}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
