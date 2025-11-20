'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isStreakAtRisk } from '@/lib/midnight-rule';

interface Member {
  user_id: string;
  current_day_index: number;
  streak_count: number;
  status: string;
  last_completed_at: string | null;
  profiles: {
    name: string;
  };
}

interface CollectiveStreakProps {
  members: Member[];
  totalDays: number;
}

export function CollectiveStreak({ members, totalDays }: CollectiveStreakProps) {
  // Calculate collective stats
  const activeMembers = members.filter((m) => m.status === 'active');
  const completedMembers = members.filter((m) => m.status === 'completed');

  // Members on track (active and completed today or yesterday)
  const membersOnTrack = activeMembers.filter((m) => {
    if (!m.last_completed_at) return false;
    const risk = isStreakAtRisk(m.last_completed_at, 'UTC');
    return !risk.atRisk;
  }).length;

  // Total completion percentage across all members
  const totalPossibleDays = members.length * totalDays;
  const totalCompletedDays = members.reduce((sum, m) => sum + (m.current_day_index - 1), 0);
  const overallProgress = totalPossibleDays > 0 ? (totalCompletedDays / totalPossibleDays) * 100 : 0;

  // Average streak
  const avgStreak =
    activeMembers.length > 0
      ? Math.round(activeMembers.reduce((sum, m) => sum + m.streak_count, 0) / activeMembers.length)
      : 0;

  // Best streak in group
  const bestStreak = Math.max(...members.map((m) => m.streak_count), 0);

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Collective Progress
        </CardTitle>
        <CardDescription>How the group is doing together</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stat */}
        <div className="text-center">
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {membersOnTrack} / {activeMembers.length}
          </div>
          <p className="text-lg font-medium text-purple-900">
            member{activeMembers.length !== 1 ? 's' : ''} on track
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {completedMembers.length > 0 && `${completedMembers.length} completed the goal`}
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Group Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{avgStreak}</div>
            <div className="text-xs text-muted-foreground">Avg Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{bestStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{members.length}</div>
            <div className="text-xs text-muted-foreground">Total Members</div>
          </div>
        </div>

        {/* Encouragement Message */}
        {membersOnTrack === activeMembers.length && activeMembers.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
            <p className="text-sm font-medium text-green-900">
              🎉 Amazing! Everyone is on track!
            </p>
          </div>
        ) : membersOnTrack > activeMembers.length / 2 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
            <p className="text-sm font-medium text-blue-900">
              💪 Great momentum! Keep going!
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-center">
            <p className="text-sm font-medium text-amber-900">
              🔥 Let's get back on track together!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
