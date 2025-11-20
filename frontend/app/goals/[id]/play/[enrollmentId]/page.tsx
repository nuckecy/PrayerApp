'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { canCompleteToday, isStreakAtRisk, formatNextAvailable } from '@/lib/midnight-rule';

interface Enrollment {
  id: string;
  user_id: string;
  goal_id: string;
  current_day_index: number;
  streak_count: number;
  status: string;
  last_completed_at: string | null;
  goals: {
    id: string;
    title: string;
    description: string;
    total_days: number;
  };
}

interface DayContent {
  id: string;
  day_index: number;
  title: string;
  brief_preview: string;
  content_type: 'text' | 'exercise' | 'checklist';
  content_payload: any;
}

interface UserProfile {
  timezone: string;
}

export default function GoalPlayerPage({
  params,
}: {
  params: { id: string; enrollmentId: string };
}) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentDay, setCurrentDay] = useState<DayContent | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [error, setError] = useState('');
  const [completedData, setCompletedData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch user profile for timezone
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);

        // Fetch enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            id,
            user_id,
            goal_id,
            current_day_index,
            streak_count,
            status,
            last_completed_at,
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
          setError('Unauthorized access');
          return;
        }

        setEnrollment(enrollmentData as any);

        // Check if paused
        if (enrollmentData.status === 'paused') {
          // User can still view, just can't complete
          setError('');
        }

        // Fetch current day content
        const { data: dayData, error: dayError } = await supabase
          .from('goal_days')
          .select('*')
          .eq('goal_id', params.id)
          .eq('day_index', enrollmentData.current_day_index)
          .single();

        if (dayError) throw dayError;
        setCurrentDay(dayData);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load goal content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.enrollmentId, router]);

  const handlePauseResume = async () => {
    if (!enrollment) return;

    setPausing(true);
    setError('');

    try {
      const newStatus = enrollment.status === 'paused' ? 'active' : 'paused';

      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ status: newStatus })
        .eq('id', enrollment.id);

      if (updateError) throw updateError;

      setEnrollment({ ...enrollment, status: newStatus });
    } catch (err: any) {
      console.error('Failed to pause/resume:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setPausing(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!enrollment || !currentDay || !userProfile) return;

    setCompleting(true);
    setError('');

    try {
      // Check if paused
      if (enrollment.status === 'paused') {
        setError('Goal is paused. Resume to continue.');
        return;
      }

      // Check midnight rule with timezone
      const midnightCheck = canCompleteToday(
        enrollment.last_completed_at,
        userProfile.timezone || 'UTC'
      );

      if (!midnightCheck.canComplete) {
        setError(
          midnightCheck.reason +
            (midnightCheck.nextAvailableAt
              ? ` (${formatNextAvailable(midnightCheck.nextAvailableAt, userProfile.timezone || 'UTC')})`
              : '')
        );
        return;
      }

      // Check if already completed this specific day
      const { data: existingCompletion } = await supabase
        .from('day_completions')
        .select('id')
        .eq('enrollment_id', enrollment.id)
        .eq('day_index', currentDay.day_index)
        .maybeSingle();

      if (existingCompletion) {
        setError('You have already completed this day');
        return;
      }

      // Create day completion record
      const { error: completionError } = await supabase
        .from('day_completions')
        .insert({
          enrollment_id: enrollment.id,
          goal_day_id: currentDay.id,
          day_index: currentDay.day_index,
          completed_data: completedData,
        });

      if (completionError) throw completionError;

      // Check if goal is completed
      const isGoalCompleted = currentDay.day_index >= enrollment.goals.total_days;

      // Update enrollment
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          current_day_index: currentDay.day_index + 1,
          last_completed_at: new Date().toISOString(),
          streak_count: enrollment.streak_count + 1,
          status: isGoalCompleted ? 'completed' : 'active',
          actual_end_date: isGoalCompleted ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', enrollment.id);

      if (updateError) throw updateError;

      if (isGoalCompleted) {
        // Goal completed - redirect to progress page with certificate
        router.push(`/goals/${params.id}/progress/${params.enrollmentId}?completed=true`);
      } else {
        // Day completed - reload to show next day
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Failed to complete day:', err);
      setError(err.message || 'Failed to complete day');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment || !currentDay) return null;

  const progress = (currentDay.day_index / enrollment.goals.total_days) * 100;
  const midnightCheck = canCompleteToday(
    enrollment.last_completed_at,
    userProfile?.timezone || 'UTC'
  );
  const streakRisk = isStreakAtRisk(
    enrollment.last_completed_at,
    userProfile?.timezone || 'UTC'
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/goals/${params.id}/progress/${params.enrollmentId}`}>
                  📊 View Progress
                </Link>
              </Button>
              <Button
                variant={enrollment.status === 'paused' ? 'default' : 'outline'}
                onClick={handlePauseResume}
                disabled={pausing}
              >
                {pausing
                  ? 'Updating...'
                  : enrollment.status === 'paused'
                  ? '▶️ Resume'
                  : '⏸️ Pause'}
              </Button>
            </div>
          </div>

          {/* Paused Notice */}
          {enrollment.status === 'paused' && (
            <Card className="mb-6 bg-blue-50 border-blue-300">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏸️</span>
                  <div>
                    <p className="font-semibold text-blue-900">Goal Paused</p>
                    <p className="text-sm text-blue-700">
                      Your progress is saved. Resume whenever you&apos;re ready to continue!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Streak Risk Warning */}
          {streakRisk.atRisk && enrollment.status !== 'paused' && (
            <Card className="mb-6 bg-yellow-50 border-yellow-300">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-yellow-900">{streakRisk.message}</p>
                    {streakRisk.hoursRemaining && (
                      <p className="text-sm text-yellow-700">
                        You have {streakRisk.hoursRemaining} hour{streakRisk.hoursRemaining !== 1 ? 's' : ''} left to maintain your streak!
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{enrollment.goals.title}</CardTitle>
              <CardDescription>
                Day {currentDay.day_index} of {enrollment.goals.total_days}
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

              <div className="flex gap-4">
                {enrollment.streak_count > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🔥</span>
                    <span className="font-medium">{enrollment.streak_count} day streak</span>
                  </div>
                )}
                {midnightCheck.isWarningPeriod && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <span>⏰</span>
                    <span className="font-medium">20+ hours since last completion</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Day Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Day {currentDay.day_index}: {currentDay.title}</CardTitle>
              <CardDescription>{currentDay.brief_preview}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentDay.content_type === 'text' && (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {currentDay.content_payload.text}
                  </div>
                </div>
              )}

              {currentDay.content_type === 'exercise' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="font-semibold mb-2">Exercise Instructions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {currentDay.content_payload.instructions}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Response (optional)</label>
                    <textarea
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Reflect on this exercise..."
                      value={completedData.response || ''}
                      onChange={(e) =>
                        setCompletedData({ ...completedData, response: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {currentDay.content_type === 'checklist' && (
                <div className="space-y-2">
                  <h3 className="font-semibold mb-4">Complete the following tasks:</h3>
                  {currentDay.content_payload.items?.map((item: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-md">
                      <input
                        type="checkbox"
                        id={`item-${index}`}
                        checked={completedData[`item-${index}`] || false}
                        onChange={(e) =>
                          setCompletedData({
                            ...completedData,
                            [`item-${index}`]: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <label htmlFor={`item-${index}`} className="flex-1 cursor-pointer">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {!midnightCheck.canComplete && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">{midnightCheck.reason}</p>
                  {midnightCheck.nextAvailableAt && (
                    <p className="text-xs text-yellow-700 mt-1">
                      Next available: {formatNextAvailable(midnightCheck.nextAvailableAt, userProfile?.timezone || 'UTC')}
                    </p>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCompleteDay}
                disabled={completing || !midnightCheck.canComplete || enrollment.status === 'paused'}
              >
                {completing
                  ? 'Completing...'
                  : enrollment.status === 'paused'
                  ? 'Resume Goal to Continue'
                  : `Complete Day ${currentDay.day_index}`}
              </Button>

              {midnightCheck.canComplete && enrollment.status !== 'paused' && (
                <p className="text-center text-sm text-muted-foreground">
                  Complete today to maintain your streak! 🔥
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
