'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { validateGoalDayContent, formatContentErrors } from '@/lib/content-validation';

interface DayContent {
  dayIndex: number;
  title: string;
  briefPreview: string;
  contentType: 'text' | 'exercise' | 'checklist';
  contentPayload: any;
}

const AVAILABLE_TAGS = [
  'Mindfulness',
  'Productivity',
  'Health',
  'Fitness',
  'Learning',
  'Career',
  'Relationships',
  'Spirituality',
  'Creativity',
  'Finance',
];

export default function NewGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  // Goal metadata
  const [goalData, setGoalData] = useState({
    title: '',
    description: '',
    citation: '',
    totalDays: 7,
    tags: [] as string[],
    chatEnabled: false,
  });

  // Days content
  const [days, setDays] = useState<DayContent[]>([]);
  const [currentDay, setCurrentDay] = useState<DayContent>({
    dayIndex: 1,
    title: '',
    briefPreview: '',
    contentType: 'text',
    contentPayload: { text: '' },
  });

  const handleGoalDataChange = (field: string, value: any) => {
    setGoalData({ ...goalData, [field]: value });
  };

  const toggleTag = (tag: string) => {
    if (goalData.tags.includes(tag)) {
      setGoalData({ ...goalData, tags: goalData.tags.filter((t) => t !== tag) });
    } else if (goalData.tags.length < 5) {
      setGoalData({ ...goalData, tags: [...goalData.tags, tag] });
    }
  };

  const addDay = () => {
    if (!currentDay.title || !currentDay.briefPreview) {
      setError('Please fill in the day title and preview');
      return;
    }

    // Validate content payload
    const validation = validateGoalDayContent(
      currentDay.contentType,
      currentDay.contentPayload
    );

    if (!validation.isValid) {
      setError(
        'Content validation failed:\n' +
        (validation.errors?.join('\n') || 'Invalid content')
      );
      return;
    }

    setDays([...days, { ...currentDay }]);
    setCurrentDay({
      dayIndex: days.length + 2,
      title: '',
      briefPreview: '',
      contentType: 'text',
      contentPayload: { text: '' },
    });
    setError('');
  };

  const removeDay = (index: number) => {
    const newDays = days.filter((_, i) => i !== index);
    // Reindex days
    const reindexed = newDays.map((day, i) => ({ ...day, dayIndex: i + 1 }));
    setDays(reindexed);
    setCurrentDay({ ...currentDay, dayIndex: reindexed.length + 1 });
  };

  const handleSubmit = async (saveAs: 'draft' | 'pending') => {
    setLoading(true);
    setError('');

    try {
      // Validation
      if (goalData.title.length < 5 || goalData.title.length > 100) {
        setError('Title must be between 5 and 100 characters');
        return;
      }

      if (goalData.description.length < 50 || goalData.description.length > 500) {
        setError('Description must be between 50 and 500 characters');
        return;
      }

      if (goalData.tags.length === 0) {
        setError('Please select at least one tag');
        return;
      }

      if (days.length < 5) {
        setError('A goal must have at least 5 days');
        return;
      }

      if (days.length !== goalData.totalDays) {
        setError(`You specified ${goalData.totalDays} days but only created ${days.length} days`);
        return;
      }

      // Validate all day content payloads before submission
      for (const day of days) {
        const validation = validateGoalDayContent(day.contentType, day.contentPayload);
        if (!validation.isValid) {
          setError(
            `Day ${day.dayIndex} has invalid content:\n` +
            (validation.errors?.join('\n') || 'Invalid content')
          );
          return;
        }
      }

      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get author record
      const { data: authorData, error: authorError } = await supabase
        .from('authors')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (authorError || !authorData || authorData.status !== 'active') {
        setError('You must be an approved author to create goals');
        return;
      }

      // Create goal
      const { data: goalRecord, error: goalError } = await supabase
        .from('goals')
        .insert({
          author_id: authorData.id,
          title: goalData.title,
          description: goalData.description,
          citation: goalData.citation || null,
          total_days: goalData.totalDays,
          tags: goalData.tags,
          chat_enabled: goalData.chatEnabled,
          approval_status: saveAs,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Create goal days
      const daysToInsert = days.map((day) => ({
        goal_id: goalRecord.id,
        day_index: day.dayIndex,
        title: day.title,
        brief_preview: day.briefPreview,
        content_type: day.contentType,
        content_payload: day.contentPayload,
      }));

      const { error: daysError } = await supabase.from('goal_days').insert(daysToInsert);

      if (daysError) throw daysError;

      // Success
      router.push(`/author/dashboard?goalCreated=${saveAs}`);
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      setError(err.message || 'Failed to create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Create New Goal</h1>
              <p className="text-lg text-muted-foreground">
                Step {currentStep} of 2: {currentStep === 1 ? 'Goal Details' : 'Daily Content'}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/author/dashboard')}>
              Cancel
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Goal Metadata */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Goal Information</CardTitle>
                <CardDescription>
                  Provide the basic details about your goal program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Goal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 30-Day Mindfulness Journey"
                    value={goalData.title}
                    onChange={(e) => handleGoalDataChange('title', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{goalData.title.length}/100 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    minLength={50}
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe what participants will learn and achieve..."
                    value={goalData.description}
                    onChange={(e) => handleGoalDataChange('description', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{goalData.description.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (Days) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={365}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={goalData.totalDays}
                    onChange={(e) => handleGoalDataChange('totalDays', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 5 days, maximum 365 days</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tags <span className="text-red-500">*</span> (Select 1-5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          goalData.tags.includes(tag)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Selected: {goalData.tags.length}/5</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Citation/Attribution (optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Source or inspiration for this goal"
                    value={goalData.citation}
                    onChange={(e) => handleGoalDataChange('citation', e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chatEnabled"
                    checked={goalData.chatEnabled}
                    onChange={(e) => handleGoalDataChange('chatEnabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="chatEnabled" className="text-sm font-medium cursor-pointer">
                    Enable group chat for this goal
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => {
                      if (goalData.title.length >= 5 && goalData.description.length >= 50 && goalData.tags.length > 0) {
                        setCurrentStep(2);
                        setError('');
                      } else {
                        setError('Please complete all required fields before continuing');
                      }
                    }}
                  >
                    Next: Add Daily Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Daily Content */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Days List */}
              {days.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Created Days ({days.length}/{goalData.totalDays})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {days.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex-1">
                            <p className="font-medium">Day {day.dayIndex}: {day.title}</p>
                            <p className="text-sm text-muted-foreground">{day.briefPreview}</p>
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded mt-1 inline-block">
                              {day.contentType}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeDay(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add New Day */}
              {days.length < goalData.totalDays && (
                <Card>
                  <CardHeader>
                    <CardTitle>Day {currentDay.dayIndex} Content</CardTitle>
                    <CardDescription>Create content for day {currentDay.dayIndex}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Day Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Introduction to Mindful Breathing"
                        value={currentDay.title}
                        onChange={(e) => setCurrentDay({ ...currentDay, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Brief Preview <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="A short preview of what this day covers..."
                        value={currentDay.briefPreview}
                        onChange={(e) => setCurrentDay({ ...currentDay, briefPreview: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        value={currentDay.contentType}
                        onChange={(e) =>
                          setCurrentDay({
                            ...currentDay,
                            contentType: e.target.value as 'text' | 'exercise' | 'checklist',
                            contentPayload: e.target.value === 'text' ? { text: '' } : { items: [] },
                          })
                        }
                      >
                        <option value="text">Text Lesson</option>
                        <option value="exercise">Interactive Exercise</option>
                        <option value="checklist">Checklist</option>
                      </select>
                    </div>

                    {currentDay.contentType === 'text' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content <span className="text-red-500">*</span></label>
                        <textarea
                          required
                          rows={10}
                          maxLength={2000}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                          placeholder="Write your lesson content here... (max 2000 characters)"
                          value={currentDay.contentPayload.text || ''}
                          onChange={(e) =>
                            setCurrentDay({
                              ...currentDay,
                              contentPayload: { text: e.target.value },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {(currentDay.contentPayload.text || '').length}/2000 characters
                        </p>
                      </div>
                    )}

                    {currentDay.contentType === 'exercise' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Exercise Instructions</label>
                        <textarea
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Describe the exercise and what participants should do..."
                          value={currentDay.contentPayload.instructions || ''}
                          onChange={(e) =>
                            setCurrentDay({
                              ...currentDay,
                              contentPayload: { ...currentDay.contentPayload, instructions: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}

                    {currentDay.contentType === 'checklist' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Checklist Instructions</label>
                        <textarea
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="List the checklist items, one per line..."
                          value={currentDay.contentPayload.items?.join('\n') || ''}
                          onChange={(e) =>
                            setCurrentDay({
                              ...currentDay,
                              contentPayload: { items: e.target.value.split('\n').filter((i) => i.trim()) },
                            })
                          }
                        />
                      </div>
                    )}

                    <Button onClick={addDay} className="w-full">
                      Add Day {currentDay.dayIndex}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back to Goal Details
                </Button>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit('draft')}
                    disabled={loading || days.length < 5 || days.length !== goalData.totalDays}
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSubmit('pending')}
                    disabled={loading || days.length < 5 || days.length !== goalData.totalDays}
                  >
                    {loading ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                </div>
              </div>

              {days.length < goalData.totalDays && (
                <p className="text-center text-sm text-muted-foreground">
                  Create {goalData.totalDays - days.length} more day(s) to complete this goal
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
