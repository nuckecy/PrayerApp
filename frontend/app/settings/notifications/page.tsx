'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationPreferences {
  daily_reminders_enabled: boolean;
  daily_reminder_time: string;
  streak_warnings_enabled: boolean;
  goal_completion_enabled: boolean;
  achievement_notifications_enabled: boolean;
  group_activity_enabled: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  daily_reminders_enabled: true,
  daily_reminder_time: '09:00',
  streak_warnings_enabled: true,
  goal_completion_enabled: true,
  achievement_notifications_enabled: true,
  group_activity_enabled: true,
  email_notifications_enabled: false,
  push_notifications_enabled: false,
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    checkAuth();
    checkPushSupport();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    await loadPreferences(user.id);
  };

  const checkPushSupport = () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
    }
  };

  const loadPreferences = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const savedPrefs = profile?.notification_preferences || {};
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...savedPrefs,
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user.id);

      if (error) throw error;

      alert('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in your browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreference('push_notifications_enabled', true);
        alert('Push notifications enabled!');
      } else {
        updatePreference('push_notifications_enabled', false);
        alert('Push notification permission denied.');
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
    }
  };

  // Generate time options (every 30 minutes)
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayStr = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      timeOptions.push({ value: timeStr, label: displayStr });
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage how and when you receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>In-App Notifications</CardTitle>
            <CardDescription>
              Manage notifications you see within the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Reminders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-reminders">Daily Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to complete your daily goal
                  </p>
                </div>
                <Switch
                  id="daily-reminders"
                  checked={preferences.daily_reminders_enabled}
                  onCheckedChange={(checked) => updatePreference('daily_reminders_enabled', checked)}
                />
              </div>

              {preferences.daily_reminders_enabled && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="reminder-time">Reminder Time</Label>
                  <Select
                    value={preferences.daily_reminder_time}
                    onValueChange={(value) => updatePreference('daily_reminder_time', value)}
                  >
                    <SelectTrigger id="reminder-time" className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Streak Warnings */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streak-warnings">Streak Warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Get warned when your streak is at risk (20+ hours since last completion)
                </p>
              </div>
              <Switch
                id="streak-warnings"
                checked={preferences.streak_warnings_enabled}
                onCheckedChange={(checked) => updatePreference('streak_warnings_enabled', checked)}
              />
            </div>

            {/* Goal Completion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="goal-completion">Goal Completion</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate when you complete a goal
                </p>
              </div>
              <Switch
                id="goal-completion"
                checked={preferences.goal_completion_enabled}
                onCheckedChange={(checked) => updatePreference('goal_completion_enabled', checked)}
              />
            </div>

            {/* Achievement Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="achievements">Achievement Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you earn badges and achievements
                </p>
              </div>
              <Switch
                id="achievements"
                checked={preferences.achievement_notifications_enabled}
                onCheckedChange={(checked) => updatePreference('achievement_notifications_enabled', checked)}
              />
            </div>

            {/* Group Activity */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="group-activity">Group Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about group member activity
                </p>
              </div>
              <Switch
                id="group-activity"
                checked={preferences.group_activity_enabled}
                onCheckedChange={(checked) => updatePreference('group_activity_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>
              Receive notifications even when the app is closed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Enable Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  {pushSupported
                    ? 'Get timely notifications on your device'
                    : 'Not supported in your browser'}
                </p>
              </div>
              {pushSupported ? (
                <Switch
                  id="push-notifications"
                  checked={preferences.push_notifications_enabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      requestPushPermission();
                    } else {
                      updatePreference('push_notifications_enabled', false);
                    }
                  }}
                />
              ) : (
                <Switch id="push-notifications" disabled checked={false} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Receive notifications via email (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-muted-foreground">
                  Enable Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Email notifications are coming in a future update
                </p>
              </div>
              <Switch
                id="email-notifications"
                disabled
                checked={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
