'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface Author {
  user_id: string;
  profiles: {
    name: string;
  };
}

interface Goal {
  id: string;
  title: string;
  description: string;
  total_days: number;
  tags: string[];
  authors?: Author;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        // Fetch published goals with author information
        const { data, error } = await supabase
          .from('goals')
          .select(`
            id,
            title,
            description,
            total_days,
            tags,
            authors!inner (
              user_id,
              profiles!inner (
                name
              )
            )
          `)
          .eq('approval_status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Type assertion since Supabase returns the correct structure
        setGoals((data as any) || []);
      } catch (error) {
        console.error('Failed to fetch goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Goals</h1>
          <p className="text-lg text-muted-foreground">
            Choose a goal and start building better habits, one day at a time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{goal.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {goal.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="flex flex-wrap gap-2 mb-4">
                  {goal.tags && goal.tags.length > 0 ? (
                    goal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                      No tags
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{goal.total_days} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✍️</span>
                    <span>by {goal.authors?.profiles.name || 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/goals/${goal.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No goals available yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
