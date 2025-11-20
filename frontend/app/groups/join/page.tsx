'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface Group {
  id: string;
  goal_id: string;
  name: string;
  invite_code: string;
  privacy_setting: string;
  max_members: number | null;
  member_visibility: boolean;
  chat_enabled: boolean;
  goals: {
    id: string;
    title: string;
    description: string;
    total_days: number;
  };
  _count?: {
    enrollments: number;
  };
}

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState(codeFromUrl || '');
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState('');
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    // Auto-lookup if code provided in URL
    if (codeFromUrl) {
      handleLookup();
    }
  }, [codeFromUrl]);

  const handleLookup = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    setLoading(true);
    setError('');
    setGroup(null);
    setAlreadyMember(false);

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push(`/auth/login?redirect=/groups/join?code=${inviteCode}`);
        return;
      }

      // Look up group by invite code
      const { data: groupData, error: groupError, count } = await supabase
        .from('groups')
        .select(`
          id,
          goal_id,
          name,
          invite_code,
          privacy_setting,
          max_members,
          member_visibility,
          chat_enabled,
          goals!inner (
            id,
            title,
            description,
            total_days
          ),
          enrollments!left (count)
        `, { count: 'exact' })
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (groupError || !groupData) {
        setError('Invalid invite code. Please check and try again.');
        return;
      }

      // Check if already a member
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('group_id', groupData.id)
        .maybeSingle();

      if (existingEnrollment) {
        setAlreadyMember(true);
      }

      setGroup(groupData as any);
    } catch (err: any) {
      console.error('Failed to lookup group:', err);
      setError('Failed to find group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!group) return;

    setJoining(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check max members limit
      if (group.max_members) {
        const { count } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.id);

        if (count && count >= group.max_members) {
          setError('This group is full and cannot accept new members.');
          return;
        }
      }

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          goal_id: group.goal_id,
          group_id: group.id,
          current_day_index: 1,
          streak_count: 0,
          status: 'active',
        })
        .select()
        .single();

      if (enrollError) {
        if (enrollError.code === '23505') {
          // Unique constraint violation - already enrolled
          setError('You are already a member of this group');
          setAlreadyMember(true);
          return;
        }
        throw enrollError;
      }

      // Success - redirect to group page
      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      console.error('Failed to join group:', err);
      setError(err.message || 'Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-4">
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
            <h1 className="text-4xl font-bold mb-2">Join a Group</h1>
            <p className="text-lg text-muted-foreground">
              Enter an invite code to join a goal group
            </p>
          </div>

          {/* Invite Code Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enter Invite Code</CardTitle>
              <CardDescription>
                The code is 6 characters (letters and numbers)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-lg uppercase text-center"
                  placeholder="ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inviteCode.length === 6) {
                      handleLookup();
                    }
                  }}
                />
                <Button
                  onClick={handleLookup}
                  disabled={loading || inviteCode.length !== 6}
                  size="lg"
                >
                  {loading ? 'Looking up...' : 'Find Group'}
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Info (if found) */}
          {group && (
            <Card className={alreadyMember ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {alreadyMember ? '✓ Already a Member' : '✓ Group Found'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.privacy_setting === 'private' ? '🔒 Private Group' : '🌐 Public Group'}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Goal</h4>
                  <p className="font-medium text-primary">{group.goals.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{group.goals.description}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    📅 {group.goals.total_days} days
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Group Features</h4>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {group.chat_enabled && (
                      <span className="px-2 py-1 bg-white rounded border">💬 Chat enabled</span>
                    )}
                    {group.member_visibility && (
                      <span className="px-2 py-1 bg-white rounded border">👁️ Members visible</span>
                    )}
                    {group.max_members && (
                      <span className="px-2 py-1 bg-white rounded border">
                        👥 Max {group.max_members} members
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  {alreadyMember ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/groups/${group.id}`}>Go to Group Page</Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoin}
                      disabled={joining}
                      className="w-full"
                      size="lg"
                    >
                      {joining ? 'Joining...' : 'Join This Group'}
                    </Button>
                  )}
                </div>

                {!alreadyMember && (
                  <p className="text-xs text-center text-muted-foreground">
                    By joining, you&apos;ll be enrolled in the goal and can track progress with the group
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="mt-6 bg-gray-50">
            <CardContent className="py-6">
              <h3 className="font-semibold mb-3 text-sm">Need help?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Ask the group creator for the invite code</li>
                <li>• Invite codes are 6 characters (letters and numbers)</li>
                <li>• Codes are case-insensitive (ABC123 = abc123)</li>
                <li>• You can join multiple groups for the same goal</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
