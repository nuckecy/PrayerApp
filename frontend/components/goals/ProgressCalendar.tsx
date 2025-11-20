'use client';

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addDays } from 'date-fns';

interface DayCompletion {
  day_index: number;
  completed_at: string;
}

interface ProgressCalendarProps {
  startDate: string;
  totalDays: number;
  currentDayIndex: number;
  completions: DayCompletion[];
  status: 'active' | 'paused' | 'completed';
}

export function ProgressCalendar({
  startDate,
  totalDays,
  currentDayIndex,
  completions,
  status,
}: ProgressCalendarProps) {
  const start = new Date(startDate);
  const projectedEnd = addDays(start, totalDays - 1);

  // Create a map of completed days by date
  const completionsByDate = new Map<string, number>();
  completions.forEach((completion) => {
    const dateKey = format(new Date(completion.completed_at), 'yyyy-MM-dd');
    completionsByDate.set(dateKey, completion.day_index);
  });

  // Generate all days from start to projected end
  const allDays = eachDayOfInterval({ start, end: projectedEnd });

  // Calculate expected day index for each date (if completing daily)
  const getExpectedDayIndex = (date: Date): number => {
    const daysSinceStart = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(daysSinceStart + 1, totalDays);
  };

  const getDayStatus = (date: Date, dayIndex: number): {
    status: 'completed' | 'current' | 'upcoming' | 'skipped' | 'future';
    label: string;
    color: string;
  } => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const completedDayIndex = completionsByDate.get(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Completed day
    if (completedDayIndex) {
      return {
        status: 'completed',
        label: `Day ${completedDayIndex}`,
        color: 'bg-green-500 text-white hover:bg-green-600',
      };
    }

    // Future date
    if (dateOnly > today) {
      return {
        status: 'future',
        label: '',
        color: 'bg-gray-100 text-gray-400',
      };
    }

    // Today - current day
    if (isSameDay(dateOnly, today)) {
      if (currentDayIndex <= totalDays) {
        return {
          status: 'current',
          label: `Day ${currentDayIndex}`,
          color: 'bg-primary text-white font-bold ring-2 ring-primary ring-offset-2',
        };
      }
      return {
        status: 'upcoming',
        label: '',
        color: 'bg-gray-200 text-gray-600',
      };
    }

    // Past date - skipped
    if (dateOnly < today && dayIndex <= currentDayIndex) {
      return {
        status: 'skipped',
        label: '',
        color: 'bg-red-100 text-red-500',
      };
    }

    // Upcoming
    return {
      status: 'upcoming',
      label: '',
      color: 'bg-gray-200 text-gray-600',
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Progress Calendar</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-100" />
            <span>Skipped</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200" />
            <span>Future</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for alignment */}
        {Array.from({ length: start.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Calendar days */}
        {allDays.map((date, index) => {
          const dayIndex = index + 1;
          const dayStatus = getDayStatus(date, dayIndex);

          return (
            <div
              key={date.toISOString()}
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center
                transition-all cursor-default text-xs
                ${dayStatus.color}
              `}
              title={dayStatus.label || format(date, 'MMM d')}
            >
              <div className="text-xs font-medium">
                {format(date, 'd')}
              </div>
              {dayStatus.label && (
                <div className="text-[10px] leading-tight">
                  {dayStatus.label.replace('Day ', 'D')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completions.length}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{currentDayIndex}</div>
          <div className="text-xs text-muted-foreground">Current Day</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{totalDays - completions.length}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>
    </div>
  );
}
