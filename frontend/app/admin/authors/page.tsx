'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/AppHeader';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Author {
  id: string;
  user_id: string;
  bio: string;
  status: 'pending' | 'active' | 'suspended';
  portfolio_url: string | null;
  created_at: string;
  approval_date: string | null;
  profiles: {
    name: string;
    email: string;
  };
  _count?: {
    goals: number;
  };
}

export default function AuthorManagementPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadAuthors();
    }
  }, [filter, loading]);

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

  const loadAuthors = async () => {
    try {
      let query = supabase
        .from('authors')
        .select(`
          id,
          user_id,
          bio,
          status,
          portfolio_url,
          created_at,
          approval_date,
          profiles!inner (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get goal counts for each author
      const authorsWithCounts = await Promise.all(
        (data || []).map(async (author) => {
          const { count } = await supabase
            .from('goals')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', author.id);

          return {
            ...author,
            _count: { goals: count || 0 },
          };
        })
      );

      setAuthors(authorsWithCounts);
    } catch (error) {
      console.error('Error loading authors:', error);
    }
  };

  const handleApprove = async (authorId: string, userId: string) => {
    if (!confirm('Approve this author application?')) return;

    setProcessing(authorId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update author status
      const { error: authorError } = await supabase
        .from('authors')
        .update({
          status: 'active',
          approval_date: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', authorId);

      if (authorError) throw authorError;

      // Update user role to 'author'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'author' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create notification
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'author_application_status',
        p_title: '✅ Author Application Approved!',
        p_message: 'Congratulations! Your author application has been approved. You can now create goals from your Author Dashboard.',
        p_data: JSON.stringify({ status: 'approved' }),
        p_expires_hours: null,
      });

      alert('Author approved successfully!');
      await loadAuthors();
    } catch (error) {
      console.error('Error approving author:', error);
      alert('Failed to approve author. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (authorId: string, userId: string) => {
    const reason = prompt('Enter rejection reason (will be sent to applicant):');
    if (!reason) return;

    setProcessing(authorId);
    try {
      // Delete author record
      const { error: deleteError } = await supabase
        .from('authors')
        .delete()
        .eq('id', authorId);

      if (deleteError) throw deleteError;

      // Create notification
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'author_application_status',
        p_title: '❌ Author Application Status',
        p_message: `Your author application was not approved. Reason: ${reason}`,
        p_data: JSON.stringify({ status: 'rejected', reason }),
        p_expires_hours: null,
      });

      alert('Author application rejected.');
      await loadAuthors();
    } catch (error) {
      console.error('Error rejecting author:', error);
      alert('Failed to reject author. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleSuspend = async (authorId: string, userId: string) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    setProcessing(authorId);
    try {
      const { error } = await supabase
        .from('authors')
        .update({ status: 'suspended' })
        .eq('id', authorId);

      if (error) throw error;

      // Create notification
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'author_application_status',
        p_title: '⚠️ Author Account Suspended',
        p_message: `Your author account has been suspended. Reason: ${reason}`,
        p_data: JSON.stringify({ status: 'suspended', reason }),
        p_expires_hours: null,
      });

      alert('Author suspended.');
      await loadAuthors();
    } catch (error) {
      console.error('Error suspending author:', error);
      alert('Failed to suspend author. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReactivate = async (authorId: string, userId: string) => {
    if (!confirm('Reactivate this author?')) return;

    setProcessing(authorId);
    try {
      const { error } = await supabase
        .from('authors')
        .update({ status: 'active' })
        .eq('id', authorId);

      if (error) throw error;

      // Create notification
      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: 'author_application_status',
        p_title: '✅ Author Account Reactivated',
        p_message: 'Your author account has been reactivated. You can now create goals again.',
        p_data: JSON.stringify({ status: 'reactivated' }),
        p_expires_hours: null,
      });

      alert('Author reactivated.');
      await loadAuthors();
    } catch (error) {
      console.error('Error reactivating author:', error);
      alert('Failed to reactivate author. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Active</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Suspended</Badge>;
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
          <h1 className="text-3xl font-bold">Author Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage author applications and accounts
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Active
          </Button>
          <Button
            variant={filter === 'suspended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('suspended')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Suspended
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
        </div>

        {/* Authors List */}
        {authors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No authors found with status: {filter}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {authors.map((author) => (
              <Card key={author.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{author.profiles.name}</CardTitle>
                      <CardDescription>{author.profiles.email}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(author.status)}
                      <span className="text-xs text-muted-foreground">
                        {author._count?.goals || 0} goals
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Bio</h4>
                      <p className="text-sm text-muted-foreground">{author.bio}</p>
                    </div>

                    {author.portfolio_url && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Portfolio</h4>
                        <a
                          href={author.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {author.portfolio_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Applied {formatDistanceToNow(new Date(author.created_at), { addSuffix: true })}
                      </span>

                      <div className="flex gap-2">
                        {author.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleApprove(author.id, author.user_id)}
                              disabled={processing === author.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleReject(author.id, author.user_id)}
                              disabled={processing === author.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {author.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleSuspend(author.id, author.user_id)}
                            disabled={processing === author.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}

                        {author.status === 'suspended' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => handleReactivate(author.id, author.user_id)}
                            disabled={processing === author.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reactivate
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
      </div>
    </>
  );
}
