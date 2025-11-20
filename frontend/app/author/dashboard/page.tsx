'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface Author {
  id: string;
  user_id: string;
  bio: string;
  status: 'pending' | 'active' | 'suspended';
  portfolio_url: string | null;
  created_at: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  total_days: number;
  approval_status: 'draft' | 'pending' | 'published' | 'archived';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function AuthorDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<Author | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('newApplication') === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch author profile
        const { data: authorData, error: authorError } = await supabase
          .from('authors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (authorError) {
          if (authorError.code === 'PGRST116') {
            // No author profile found - redirect to application
            router.push('/author/apply');
            return;
          }
          throw authorError;
        }

        setAuthor(authorData);

        // Fetch author's goals
        if (authorData.status === 'active') {
          const { data: goalsData, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('author_id', authorData.id)
            .order('updated_at', { ascending: false });

          if (goalsError) throw goalsError;
          setGoals(goalsData || []);
        }
      } catch (error) {
        console.error('Failed to fetch author data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!author) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              Application submitted successfully! We&apos;ll review it within 48 hours.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Author Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(author.status)}`}>
                {author.status.charAt(0).toUpperCase() + author.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
            {author.status === 'active' && (
              <Button asChild>
                <Link href="/author/goals/new">Create New Goal</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Pending Status Message */}
        {author.status === 'pending' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle>Application Under Review</CardTitle>
              <CardDescription>
                Your author application is currently being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We typically review applications within 48 hours. You&apos;ll receive an email notification
                once your application has been approved. In the meantime, you can prepare your first goal!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Suspended Status Message */}
        {author.status === 'suspended' && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle>Account Suspended</CardTitle>
              <CardDescription>
                Your author account has been temporarily suspended.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please contact support for more information about your account status.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Goals Section */}
        {author.status === 'active' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Goals ({goals.length})</h2>
            </div>

            {goals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-xl text-muted-foreground mb-4">
                    You haven&apos;t created any goals yet.
                  </p>
                  <Button asChild>
                    <Link href="/author/goals/new">Create Your First Goal</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(goal.approval_status)}`}>
                          {goal.approval_status}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {goal.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{goal.total_days} days</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {goal.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/author/goals/${goal.id}/edit`}>Edit</Link>
                      </Button>
                      {goal.approval_status === 'published' && (
                        <Button asChild className="flex-1">
                          <Link href={`/goals/${goal.id}`}>View</Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Author Profile */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Author Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-1">Bio</h3>
              <p className="text-sm text-muted-foreground">{author.bio}</p>
            </div>
            {author.portfolio_url && (
              <div>
                <h3 className="font-medium text-sm mb-1">Portfolio</h3>
                <a
                  href={author.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {author.portfolio_url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
