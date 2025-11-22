'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Eye, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createPagination, type PaginationMeta } from '@/lib/pagination';
import { logGoalApproved, logGoalRejected } from '@/lib/admin-audit-logger';

interface Goal {
  id: string;
  author_id: string;
  title: string;
  description: string;
  citation: string | null;
  total_days: number;
  approval_status: 'draft' | 'pending' | 'published' | 'archived';
  tags: string[];
  chat_enabled: boolean;
  created_at: string;
  updated_at: string;
  authors: {
    profiles: {
      name: string;
    };
  };
  _count?: {
    days: number;
    enrollments: number;
  };
}

export default function GoalModerationPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'published' | 'archived'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(0);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadGoals();
    }
  }, [filter, page, loading]);

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

  const loadGoals = async () => {
    try {
      // Create pagination helper
      const pagination = createPagination({ page, pageSize: 20 });

      let query = supabase
        .from('goals')
        .select(`
          id,
          author_id,
          title,
          description,
          citation,
          total_days,
          approval_status,
          tags,
          chat_enabled,
          created_at,
          updated_at,
          authors!inner (
            profiles!inner (
              name
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(...pagination.range);

      if (filter !== 'all') {
        query = query.eq('approval_status', filter);
      }

      const { data, error, count } = await query;

      // Update pagination metadata
      setPaginationMeta(pagination.getMeta(count || 0));

      if (error) throw error;

      // Get day counts and enrollment counts for each goal
      const goalsWithCounts = await Promise.all(
        (data || []).map(async (goal) => {
          const [{ count: daysCount }, { count: enrollmentsCount }] = await Promise.all([
            supabase
              .from('goal_days')
              .select('*', { count: 'exact', head: true })
              .eq('goal_id', goal.id),
            supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('goal_id', goal.id),
          ]);

          return {
            ...goal,
            _count: {
              days: daysCount || 0,
              enrollments: enrollmentsCount || 0,
            },
          };
        })
      );

      setGoals(goalsWithCounts);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const handleApprove = async (goalId: string, authorUserId: string) => {
    if (!confirm('Publish this goal? It will be available to all users.')) return;

    setProcessing(goalId);
    try {
      // Get goal title for audit log
      const goal = goals.find(g => g.id === goalId);
      const goalTitle = goal?.title || 'Unknown Goal';

      const { error } = await supabase
        .from('goals')
        .update({ approval_status: 'published' })
        .eq('id', goalId);

      if (error) throw error;

      // Log admin action
      await logGoalApproved(goalId, goalTitle);

      // Notify author
      await supabase.rpc('create_notification', {
        p_user_id: authorUserId,
        p_type: 'goal_approval_status',
        p_title: '✅ Goal Published!',
        p_message: 'Your goal has been approved and is now available to all users.',
        p_data: JSON.stringify({ goal_id: goalId, status: 'published' }),
        p_expires_hours: null,
      });

      alert('Goal published successfully!');
      await loadGoals();
    } catch (error) {
      console.error('Error approving goal:', error);
      alert('Failed to approve goal. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (goalId: string, authorUserId: string) => {
    const reason = prompt('Enter rejection reason (will be sent to author):');
    if (!reason) return;

    setProcessing(goalId);
    try {
      // Get goal title for audit log
      const goal = goals.find(g => g.id === goalId);
      const goalTitle = goal?.title || 'Unknown Goal';

      const { error } = await supabase
        .from('goals')
        .update({ approval_status: 'draft' })
        .eq('id', goalId);

      if (error) throw error;

      // Log admin action
      await logGoalRejected(goalId, goalTitle, reason);

      // Notify author
      await supabase.rpc('create_notification', {
        p_user_id: authorUserId,
        p_type: 'goal_approval_status',
        p_title: '❌ Goal Needs Revision',
        p_message: `Your goal was not approved. Reason: ${reason}`,
        p_data: JSON.stringify({ goal_id: goalId, status: 'rejected', reason }),
        p_expires_hours: null,
      });

      alert('Goal sent back to draft.');
      await loadGoals();
    } catch (error) {
      console.error('Error rejecting goal:', error);
      alert('Failed to reject goal. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleArchive = async (goalId: string) => {
    if (!confirm('Archive this goal? It will be hidden from users.')) return;

    setProcessing(goalId);
    try {
      const { error } = await supabase
        .from('goals')
        .update({ approval_status: 'archived' })
        .eq('id', goalId);

      if (error) throw error;

      alert('Goal archived.');
      await loadGoals();
    } catch (error) {
      console.error('Error archiving goal:', error);
      alert('Failed to archive goal. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleUnarchive = async (goalId: string) => {
    if (!confirm('Restore this goal to published status?')) return;

    setProcessing(goalId);
    try {
      const { error } = await supabase
        .from('goals')
        .update({ approval_status: 'published' })
        .eq('id', goalId);

      if (error) throw error;

      alert('Goal restored.');
      await loadGoals();
    } catch (error) {
      console.error('Error restoring goal:', error);
      alert('Failed to restore goal. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Draft</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Published</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-3xl font-bold">Goal Moderation</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage goal submissions
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('pending');
              setPage(0); // Reset to first page when filter changes
            }}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('published');
              setPage(0);
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Published
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('draft');
              setPage(0);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Draft
          </Button>
          <Button
            variant={filter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('archived');
              setPage(0);
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Archived
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('all');
              setPage(0);
            }}
          >
            All
          </Button>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No goals found with status: {filter}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <CardDescription>
                        By {goal.authors.profiles.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(goal.approval_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {goal.description}
                    </p>

                    {goal.citation && (
                      <p className="text-xs text-muted-foreground italic">
                        Citation: {goal.citation}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {goal.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {goal.total_days} days
                      </span>
                      <span>{goal._count?.days || 0} days created</span>
                      <span>{goal._count?.enrollments || 0} enrollments</span>
                      {goal.chat_enabled && (
                        <Badge variant="outline" className="text-xs">Chat enabled</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(goal.created_at), { addSuffix: true })}
                      </span>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={`/goals/${goal.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Link>
                        </Button>

                        {goal.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => {
                                // Get author's user_id from the goal
                                supabase
                                  .from('authors')
                                  .select('user_id')
                                  .eq('id', goal.author_id)
                                  .single()
                                  .then(({ data }) => {
                                    if (data) handleApprove(goal.id, data.user_id);
                                  });
                              }}
                              disabled={processing === goal.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => {
                                supabase
                                  .from('authors')
                                  .select('user_id')
                                  .eq('id', goal.author_id)
                                  .single()
                                  .then(({ data }) => {
                                    if (data) handleReject(goal.id, data.user_id);
                                  });
                              }}
                              disabled={processing === goal.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {goal.approval_status === 'published' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleArchive(goal.id)}
                            disabled={processing === goal.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        )}

                        {goal.approval_status === 'archived' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => handleUnarchive(goal.id)}
                            disabled={processing === goal.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {paginationMeta && paginationMeta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(paginationMeta.currentPage * paginationMeta.pageSize) + 1}-
              {Math.min((paginationMeta.currentPage + 1) * paginationMeta.pageSize, paginationMeta.totalItems)} of {paginationMeta.totalItems} goals
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={!paginationMeta.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: paginationMeta.totalPages }, (_, i) => i)
                  .filter(i => {
                    // Show first, last, current, and nearby pages
                    return i === 0 ||
                           i === paginationMeta.totalPages - 1 ||
                           Math.abs(i - paginationMeta.currentPage) <= 1;
                  })
                  .map((i, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage !== undefined && i - prevPage > 1;

                    return (
                      <React.Fragment key={i}>
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={i === paginationMeta.currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(i)}
                          className="w-10"
                        >
                          {i + 1}
                        </Button>
                      </React.Fragment>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!paginationMeta.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
