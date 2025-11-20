'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
  criteria: any;
}

interface AchievementsBadgesProps {
  achievements: Achievement[];
  userAchievements: Achievement[];
}

export function AchievementsBadges({ achievements, userAchievements }: AchievementsBadgesProps) {
  const earnedIds = new Set(userAchievements.map((a) => a.id));
  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  // Group achievements by category
  const categories = {
    Streaks: achievements.filter((a) =>
      ['streak', 'consecutive', 'quick_start'].includes(a.criteria?.type)
    ),
    'Goal Completion': achievements.filter((a) =>
      ['goal_completion', 'long_goal'].includes(a.criteria?.type)
    ),
    Consistency: achievements.filter((a) =>
      ['time_consistency', 'learner'].includes(a.criteria?.type)
    ),
    Community: achievements.filter((a) =>
      ['group_join', 'group_leader', 'team'].includes(a.criteria?.type)
    ),
    Special: achievements.filter((a) =>
      ['comeback', 'early_adopter', 'day_completion'].includes(a.criteria?.type)
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Achievements</CardTitle>
          <CardDescription>
            {earnedCount} of {totalCount} achievements earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recently Earned */}
      {userAchievements.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">Recently Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {userAchievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm min-w-[100px]"
                >
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="text-xs font-medium text-center">{achievement.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements by Category */}
      {Object.entries(categories).map(([category, categoryAchievements]) => {
        if (categoryAchievements.length === 0) return null;

        const categoryEarned = categoryAchievements.filter((a) => earnedIds.has(a.id)).length;

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{category}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {categoryEarned}/{categoryAchievements.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryAchievements.map((achievement) => {
                  const isEarned = earnedIds.has(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${
                          isEarned
                            ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md'
                            : 'border-gray-200 bg-gray-50 opacity-60 grayscale'
                        }
                      `}
                    >
                      {isEarned && (
                        <div className="absolute top-2 right-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                          ✓
                        </div>
                      )}
                      <div className="text-center space-y-2">
                        <div className={`text-4xl ${!isEarned && 'filter brightness-50'}`}>
                          {achievement.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{achievement.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {achievement.description}
                          </div>
                        </div>
                        {isEarned && achievement.earned_at && (
                          <div className="text-xs text-amber-600 font-medium">
                            Earned {new Date(achievement.earned_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* No Achievements Yet */}
      {userAchievements.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Start Your Journey!</h3>
            <p className="text-muted-foreground">
              Complete your first day to earn your first achievement badge.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
