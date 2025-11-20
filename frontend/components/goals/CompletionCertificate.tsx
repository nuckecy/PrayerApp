'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CompletionCertificateProps {
  userName: string;
  goalTitle: string;
  totalDays: number;
  startDate: string;
  endDate: string;
  streakCount: number;
  onDownload?: () => void;
  onShare?: () => void;
}

export function CompletionCertificate({
  userName,
  goalTitle,
  totalDays,
  startDate,
  endDate,
  streakCount,
  onDownload,
  onShare,
}: CompletionCertificateProps) {
  const formattedStartDate = format(new Date(startDate), 'MMMM d, yyyy');
  const formattedEndDate = format(new Date(endDate), 'MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* Certificate */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-blue-50 border-4 border-amber-200">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

        <div className="relative p-12 text-center space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="text-6xl">🏆</div>
            <h2 className="text-4xl font-bold text-amber-900">Certificate of Completion</h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full" />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-lg text-gray-700">This certifies that</p>
            <p className="text-3xl font-bold text-gray-900">{userName}</p>
            <p className="text-lg text-gray-700">has successfully completed</p>
            <p className="text-2xl font-semibold text-primary">{goalTitle}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto py-6">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-amber-600">{totalDays}</div>
              <div className="text-sm text-gray-600">Days Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-green-600">{streakCount}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2 text-sm text-gray-600">
            <p>Started: {formattedStartDate}</p>
            <p>Completed: {formattedEndDate}</p>
          </div>

          {/* Signature line */}
          <div className="pt-8">
            <div className="w-48 border-t-2 border-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">DailyGoalTracker Platform</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        {onDownload && (
          <Button onClick={onDownload} variant="outline" size="lg">
            📥 Download Certificate
          </Button>
        )}
        {onShare && (
          <Button onClick={onShare} size="lg">
            📤 Share Achievement
          </Button>
        )}
      </div>

      {/* Celebration Message */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="p-6 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h3 className="text-2xl font-bold text-purple-900">Congratulations!</h3>
          <p className="text-gray-700">
            You&apos;ve shown incredible dedication and consistency by completing {totalDays} consecutive days.
            Your commitment to personal growth is inspiring!
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              Consistent
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Dedicated
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Goal Achiever
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
