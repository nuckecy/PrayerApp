import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using placeholder values for build.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Types for our database
export type Profile = {
  id: string;
  name: string;
  role: 'super_admin' | 'author' | 'user';
  timezone: string;
  notification_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  citation?: string;
  min_days: number;
  total_days: number;
  approval_status: 'draft' | 'pending' | 'published' | 'archived';
  version: number;
  tags: string[];
  chat_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  goal_id: string;
  group_id?: string;
  current_day_index: number;
  last_completed_at?: string;
  streak_count: number;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  projected_end_date?: string;
  actual_end_date?: string;
  created_at: string;
};
