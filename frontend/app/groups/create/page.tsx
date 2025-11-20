'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface Goal {
  id: string;
  title: string;
  description: string;
  total_days: number;
}

export default function CreateGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goalId = searchParams.get('goalId');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    privacySetting: 'private' as 'public' | 'private',
    maxMembers: '',
    chatEnabled: true,
    memberVisibility: true,
  });

  useEffect(() => {
    const fetchGoal = async () => {
      if (!goalId) {
        setError('No goal selected');
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Fetch goal details
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('id, title, description, total_days')
          .eq('id', goalId)
          .eq('approval_status', 'published')
          .single();

        if (goalError) throw goalError;
        setGoal(goalData);
      } catch (err) {
        console.error('Failed to fetch goal:', err);
        setError('Failed to load goal details');
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, [goalId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (!goalId) {
        setError('No goal selected');
        return;
      }

      // Validate
      if (formData.name.length < 3 || formData.name.length > 50) {
        setError('Group name must be between 3 and 50 characters');
        return;
      }

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          goal_id: goalId,
          creator_id: user.id,
          name: formData.name,
          privacy_setting: formData.privacySetting,
          max_members: formData.maxMembers ? parseInt(formData.maxMembers) : null,
          chat_enabled: formData.chatEnabled,
          member_visibility: formData.memberVisibility,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Auto-enroll creator in the group
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          goal_id: goalId,
          group_id: groupData.id,
          current_day_index: 1,
          streak_count: 0,
          status: 'active',
        });

      if (enrollError) {
        // If enrollment fails, delete the group
        await supabase.from('groups').delete().eq('id', groupData.id);
        throw enrollError;
      }

      // Success - redirect to group page
      router.push(`/groups/${groupData.id}`);
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.message || 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-4">
              <Link href={`/goals/${goalId}`}>← Back to Goal</Link>
            </Button>
            <h1 className="text-4xl font-bold mb-2">Create a Group</h1>
            <p className="text-lg text-muted-foreground">
              Start a community for: <span className="font-semibold">{goal?.title}</span>
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👥</span>
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Why create a group?</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Share your journey with friends or community</li>
                    <li>• Stay motivated through collective accountability</li>
                    <li>• Track group progress with collective streaks</li>
                    <li>• Optional chat to encourage each other</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Group Settings</CardTitle>
              <CardDescription>Configure your group preferences</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Group Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Morning Mindfulness Squad"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">{formData.name.length}/50 characters</p>
                </div>

                {/* Privacy Setting */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Privacy <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={formData.privacySetting === 'private'}
                        onChange={() => setFormData({ ...formData, privacySetting: 'private' })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">Private (Recommended)</div>
                        <div className="text-xs text-muted-foreground">
                          Only people with the invite code can join
                        </div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={formData.privacySetting === 'public'}
                        onChange={() => setFormData({ ...formData, privacySetting: 'public' })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">Public</div>
                        <div className="text-xs text-muted-foreground">
                          Anyone can discover and join this group
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Max Members */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Maximum Members (optional)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a limit on how many members can join
                  </p>
                </div>

                {/* Chat Enabled */}
                <div className="flex items-start gap-3 p-3 border rounded-md">
                  <input
                    type="checkbox"
                    id="chatEnabled"
                    checked={formData.chatEnabled}
                    onChange={(e) => setFormData({ ...formData, chatEnabled: e.target.checked })}
                    className="mt-1"
                  />
                  <label htmlFor="chatEnabled" className="cursor-pointer flex-1">
                    <div className="font-medium">Enable Group Chat</div>
                    <div className="text-xs text-muted-foreground">
                      Allow members to send messages and encourage each other
                    </div>
                  </label>
                </div>

                {/* Member Visibility */}
                <div className="flex items-start gap-3 p-3 border rounded-md">
                  <input
                    type="checkbox"
                    id="memberVisibility"
                    checked={formData.memberVisibility}
                    onChange={(e) => setFormData({ ...formData, memberVisibility: e.target.checked })}
                    className="mt-1"
                  />
                  <label htmlFor="memberVisibility" className="cursor-pointer flex-1">
                    <div className="font-medium">Show Member List</div>
                    <div className="text-xs text-muted-foreground">
                      Display member names and progress to other group members
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href={`/goals/${goalId}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
