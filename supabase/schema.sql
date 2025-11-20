-- DailyGoalTracker Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'author', 'user');
CREATE TYPE approval_status AS ENUM ('draft', 'pending', 'published', 'archived');
CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE content_type AS ENUM ('text', 'exercise', 'checklist');
CREATE TYPE privacy_setting AS ENUM ('public', 'private');
CREATE TYPE author_status AS ENUM ('pending', 'active', 'suspended');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role DEFAULT 'user',
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authors table
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    status author_status DEFAULT 'pending',
    portfolio_url TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 100),
    description TEXT NOT NULL CHECK (char_length(description) >= 50 AND char_length(description) <= 500),
    citation TEXT,
    min_days INTEGER DEFAULT 5 CHECK (min_days >= 5),
    total_days INTEGER NOT NULL CHECK (total_days >= min_days),
    approval_status approval_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    chat_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal days table
CREATE TABLE goal_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index > 0),
    title TEXT NOT NULL,
    brief_preview TEXT,
    content_type content_type NOT NULL,
    content_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(goal_id, day_index)
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
    invite_code TEXT UNIQUE NOT NULL,
    privacy_setting privacy_setting DEFAULT 'private',
    member_visibility BOOLEAN DEFAULT TRUE,
    chat_enabled BOOLEAN DEFAULT TRUE,
    max_members INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    current_day_index INTEGER DEFAULT 1,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    streak_count INTEGER DEFAULT 0,
    status enrollment_status DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    projected_end_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, goal_id, group_id)
);

-- Day completions table
CREATE TABLE day_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    goal_day_id UUID NOT NULL REFERENCES goal_days(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_data JSONB,
    UNIQUE(enrollment_id, day_index)
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Create indexes for performance
CREATE INDEX idx_goals_approval_status ON goals(approval_status);
CREATE INDEX idx_goals_author_id ON goals(author_id);
CREATE INDEX idx_goal_days_goal_id ON goal_days(goal_id, day_index);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);
CREATE INDEX idx_enrollments_user_status ON enrollments(user_id, status);
CREATE INDEX idx_enrollments_goal_id ON enrollments(goal_id);
CREATE INDEX idx_day_completions_enrollment ON day_completions(enrollment_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Set default invite code for groups
ALTER TABLE groups ALTER COLUMN invite_code SET DEFAULT generate_invite_code();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: profiles, authors, goals, goal_days, groups, enrollments, day_completions, achievements, user_achievements';
END $$;
