'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

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

export default function GoalPlayerPage({
  params,
}: {
  params: { id: string; enrollmentId: string };
}) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentDay, setCurrentDay] = useState<DayContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
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

  const canCompleteToday = () => {
    if (!enrollment?.last_completed_at) return true;

    const lastCompleted = new Date(enrollment.last_completed_at);
    const now = new Date();

    // Check if it's a different day (simple version - could be enhanced with timezone)
    const lastDate = lastCompleted.toDateString();
    const today = now.toDateString();

    return lastDate !== today;
  };

  const handleCompleteDay = async () => {
    if (!enrollment || !currentDay) return;

    setCompleting(true);
    setError('');

    try {
      // Check midnight rule
      if (!canCompleteToday()) {
        setError('You already completed a day today. Come back tomorrow!');
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
        // Goal completed - redirect to dashboard with success message
        router.push('/dashboard?goalCompleted=true');
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
  const canComplete = canCompleteToday();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>

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

              {enrollment.streak_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span>🔥</span>
                  <span className="font-medium">{enrollment.streak_count} day streak</span>
                </div>
              )}
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

              {!canComplete && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    You already completed a day today. Come back tomorrow to continue your streak!
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleCompleteDay}
                disabled={completing || !canComplete}
              >
                {completing ? 'Completing...' : `Complete Day ${currentDay.day_index}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
