'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { CollectiveStreak } from '@/components/groups/CollectiveStreak';
import { GroupMemberList } from '@/components/groups/GroupMemberList';
import { InviteOptions } from '@/components/groups/InviteOptions';

interface Group {
  id: string;
  goal_id: string;
  creator_id: string;
  name: string;
  invite_code: string;
  privacy_setting: 'public' | 'private';
  member_visibility: boolean;
  chat_enabled: boolean;
  max_members: number | null;
  created_at: string;
  goals: {
    id: string;
    title: string;
    description: string;
    total_days: number;
  };
}

interface Member {
  id: string;
  user_id: string;
  current_day_index: number;
  streak_count: number;
  status: string;
  last_completed_at: string | null;
  created_at: string;
  profiles: {
    name: string;
  };
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setCurrentUserId(user.id);

        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select(`
            id,
            goal_id,
            creator_id,
            name,
            invite_code,
            privacy_setting,
            member_visibility,
            chat_enabled,
            max_members,
            created_at,
            goals!inner (
              id,
              title,
              description,
              total_days
            )
          `)
          .eq('id', params.id)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData as any);

        // Fetch group members
        const { data: membersData, error: membersError } = await supabase
          .from('enrollments')
          .select(`
            id,
            user_id,
            current_day_index,
            streak_count,
            status,
            last_completed_at,
            created_at,
            profiles!inner (
              name
            )
          `)
          .eq('group_id', params.id)
          .order('created_at', { ascending: true });

        if (membersError) throw membersError;
        setMembers((membersData as any) || []);
      } catch (err: any) {
        console.error('Failed to fetch group:', err);
        setError('Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading group...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground mb-4">{error || 'Group not found'}</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCreator = currentUserId === group.creator_id;
  const userMember = members.find((m) => m.user_id === currentUserId);
  const isMember = !!userMember;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Group Info */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl">{group.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {group.privacy_setting === 'private' ? '🔒 Private Group' : '🌐 Public Group'}
                      </CardDescription>
                    </div>
                    {isMember && (
                      <Button asChild>
                        <Link href={`/goals/${group.goal_id}/play/${userMember.id}`}>
                          Continue Goal →
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Goal</h3>
                    <Link
                      href={`/goals/${group.goal_id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {group.goals.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{group.goals.description}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      📅 {group.goals.total_days} days
                    </p>
                  </div>

                  <div className="flex gap-4 flex-wrap text-sm">
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>
                        {members.length} member{members.length !== 1 ? 's' : ''}
                        {group.max_members && ` (max ${group.max_members})`}
                      </span>
                    </div>
                    {group.chat_enabled && (
                      <div className="flex items-center gap-2">
                        <span>💬</span>
                        <span>Chat enabled</span>
                      </div>
                    )}
                    {group.member_visibility && (
                      <div className="flex items-center gap-2">
                        <span>👁️</span>
                        <span>Members visible</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Collective Streak */}
              <CollectiveStreak members={members} totalDays={group.goals.total_days} />

              {/* Member List */}
              {group.member_visibility && (
                <GroupMemberList
                  members={members}
                  totalDays={group.goals.total_days}
                  isCreator={isCreator}
                  currentUserId={currentUserId}
                />
              )}

              {/* Group Chat */}
              {group.chat_enabled && isMember && (
                <Card>
                  <CardHeader>
                    <CardTitle>Group Chat</CardTitle>
                    <CardDescription>Encourage and support each other</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-md p-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        💬 Chat feature coming soon!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Real-time messaging will be available in a future update.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Invite Options */}
              {isMember && (
                <InviteOptions
                  groupId={group.id}
                  inviteCode={group.invite_code}
                  groupName={group.name}
                />
              )}

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">
                      {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Members</span>
                    <span className="text-sm font-medium">{members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="text-sm font-medium">
                      {members.filter((m) => m.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm font-medium">
                      {members.filter((m) => m.status === 'completed').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Actions */}
              {isCreator && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Controls</CardTitle>
                    <CardDescription>You are the group creator</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full" size="sm">
                      Edit Group Settings
                    </Button>
                    <Button variant="outline" className="w-full" size="sm" disabled>
                      Manage Members
                    </Button>
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      More admin features coming soon
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Join Button (if not member) */}
              {!isMember && (
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="py-6 text-center">
                    <p className="mb-4">Join this group to start the goal together!</p>
                    <Button asChild variant="secondary" className="w-full">
                      <Link href={`/groups/join?code=${group.invite_code}`}>
                        Join Group
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
