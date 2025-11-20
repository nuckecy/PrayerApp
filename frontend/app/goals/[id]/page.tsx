'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface Goal {
  id: string;
  title: string;
  description: string;
  citation: string | null;
  total_days: number;
  tags: string[];
  chat_enabled: boolean;
  created_at: string;
  authors: {
    user_id: string;
    bio: string;
    profiles: {
      name: string;
    };
  };
}

interface DayPreview {
  id: string;
  day_index: number;
  title: string;
  brief_preview: string;
  content_type: string;
}

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState<DayPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGoalData = async () => {
      try {
        // Fetch goal details
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select(`
            id,
            title,
            description,
            citation,
            total_days,
            tags,
            chat_enabled,
            created_at,
            authors!inner (
              user_id,
              bio,
              profiles!inner (
                name
              )
            )
          `)
          .eq('id', params.id)
          .eq('approval_status', 'published')
          .single();

        if (goalError) {
          if (goalError.code === 'PGRST116') {
            setError('Goal not found or not published');
          } else {
            throw goalError;
          }
          return;
        }

        setGoal(goalData as any);

        // Fetch day previews
        const { data: daysData, error: daysError } = await supabase
          .from('goal_days')
          .select('id, day_index, title, brief_preview, content_type')
          .eq('goal_id', params.id)
          .order('day_index', { ascending: true });

        if (daysError) throw daysError;
        setDays(daysData || []);

        // Check if user is authenticated and enrolled
        const user = await getCurrentUser();
        if (user) {
          setIsAuthenticated(true);

          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('goal_id', params.id)
            .maybeSingle();

          if (enrollmentData && enrollmentData.status === 'active') {
            setIsEnrolled(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch goal:', err);
        setError('Failed to load goal details');
      } finally {
        setLoading(false);
      }
    };

    fetchGoalData();
  }, [params.id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/goals/${params.id}`);
      return;
    }

    setEnrolling(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_id', params.id)
        .maybeSingle();

      if (existingEnrollment) {
        setError('You are already enrolled in this goal');
        setIsEnrolled(true);
        return;
      }

      // Calculate projected end date
      const projectedEndDate = new Date();
      projectedEndDate.setDate(projectedEndDate.getDate() + (goal?.total_days || 0));

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          goal_id: params.id,
          current_day_index: 1,
          streak_count: 0,
          status: 'active',
          projected_end_date: projectedEndDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // Success - redirect to the goal player
      router.push(`/goals/${params.id}/play/${enrollment.id}`);
    } catch (err: any) {
      console.error('Failed to enroll:', err);
      setError(err.message || 'Failed to enroll in goal');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading goal...</p>
      </div>
    );
  }

  if (error && !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/goals">Browse Goals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!goal) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/goals">← Back to Goals</Link>
            </Button>
          </div>

          {/* Goal Header */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-3xl">{goal.title}</CardTitle>
              <CardDescription className="text-base">{goal.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {goal.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metadata */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{goal.total_days} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✍️</span>
                  <div>
                    <p className="text-sm text-muted-foreground">Author</p>
                    <p className="font-medium">{goal.authors.profiles.name}</p>
                  </div>
                </div>
                {goal.chat_enabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="text-sm text-muted-foreground">Community</p>
                      <p className="font-medium">Chat enabled</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Citation */}
              {goal.citation && (
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Citation:</strong> {goal.citation}
                  </p>
                </div>
              )}

              {/* Author Bio */}
              <div>
                <h3 className="font-semibold mb-2">About the Author</h3>
                <p className="text-sm text-muted-foreground">{goal.authors.bio}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Enrollment Options */}
              <div className="space-y-3">
                {isEnrolled ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/dashboard">View in Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Enrolling...' : isAuthenticated ? 'Start Solo' : 'Sign In to Start'}
                    </Button>

                    {isAuthenticated && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          size="lg"
                          asChild
                        >
                          <Link href={`/groups/create?goalId=${params.id}`}>
                            👥 Create Group
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          size="lg"
                          asChild
                        >
                          <Link href="/groups/join">
                            🔗 Join Group
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Day Previews */}
          <Card>
            <CardHeader>
              <CardTitle>What You&apos;ll Learn</CardTitle>
              <CardDescription>
                A preview of the {goal.total_days}-day journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => (
                  <div key={day.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Day {day.day_index}: {day.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{day.brief_preview}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded ml-4">
                        {day.content_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
