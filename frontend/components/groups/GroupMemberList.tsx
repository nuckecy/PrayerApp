'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { isStreakAtRisk } from '@/lib/midnight-rule';

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

interface GroupMemberListProps {
  members: Member[];
  totalDays: number;
  isCreator: boolean;
  currentUserId: string | null;
}

export function GroupMemberList({ members, totalDays, isCreator, currentUserId }: GroupMemberListProps) {
  const getMemberStatus = (member: Member): {
    label: string;
    color: string;
    icon: string;
  } => {
    if (member.status === 'completed') {
      return { label: 'Completed', color: 'text-green-600', icon: '✅' };
    }

    if (member.status === 'paused') {
      return { label: 'Paused', color: 'text-gray-500', icon: '⏸️' };
    }

    if (!member.last_completed_at) {
      return { label: 'Not started', color: 'text-gray-600', icon: '⏳' };
    }

    const risk = isStreakAtRisk(member.last_completed_at, 'UTC');
    if (risk.atRisk) {
      if (risk.hoursRemaining === 0) {
        return { label: 'Streak broken', color: 'text-red-600', icon: '💔' };
      }
      return { label: 'At risk', color: 'text-yellow-600', icon: '⚠️' };
    }

    return { label: 'On track', color: 'text-green-600', icon: '🟢' };
  };

  // Sort: creator first, then by streak count
  const sortedMembers = [...members].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return b.streak_count - a.streak_count;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedMembers.map((member) => {
            const status = getMemberStatus(member);
            const progress = ((member.current_day_index - 1) / totalDays) * 100;
            const isYou = member.user_id === currentUserId;

            return (
              <div
                key={member.id}
                className={`p-4 border rounded-lg ${
                  isYou ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.profiles.name}
                        {isYou && <span className="text-xs text-primary">(You)</span>}
                      </p>
                      {member.user_id === members.find(m => m.user_id)?.user_id && isCreator && member.user_id !== currentUserId && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                          Creator
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {member.streak_count > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <span>🔥</span>
                        <span className="font-medium">{member.streak_count}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Day {member.current_day_index - 1} of {totalDays}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        member.status === 'completed'
                          ? 'bg-green-500'
                          : member.status === 'paused'
                          ? 'bg-gray-400'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Last Active */}
                {member.last_completed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last active: {format(new Date(member.last_completed_at), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No members yet. Share the invite code to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
