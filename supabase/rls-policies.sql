-- Row Level Security (RLS) Policies for DailyGoalTracker
-- Run this AFTER schema.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Profiles are created via trigger on auth.users insert
CREATE POLICY "Enable insert for authenticated users"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- AUTHORS POLICIES
-- ============================================================================

-- Anyone can view active authors
CREATE POLICY "Anyone can view active authors"
    ON authors FOR SELECT
    USING (status = 'active');

-- Users can create author profile for themselves
CREATE POLICY "Users can create own author profile"
    ON authors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own author profile
CREATE POLICY "Authors can update own profile"
    ON authors FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- GOALS POLICIES
-- ============================================================================

-- Anyone can view published goals
CREATE POLICY "Anyone can view published goals"
    ON goals FOR SELECT
    USING (approval_status = 'published');

-- Authors can view their own goals (any status)
CREATE POLICY "Authors can view own goals"
    ON goals FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM authors WHERE id = goals.author_id
        )
    );

-- Authors can create goals
CREATE POLICY "Authors can create goals"
    ON goals FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM authors WHERE id = author_id AND status = 'active'
        )
    );

-- Authors can update their own goals
CREATE POLICY "Authors can update own goals"
    ON goals FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM authors WHERE id = goals.author_id
        )
    );

-- ============================================================================
-- GOAL DAYS POLICIES
-- ============================================================================

-- Anyone can view days of published goals
CREATE POLICY "Anyone can view published goal days"
    ON goal_days FOR SELECT
    USING (
        goal_id IN (SELECT id FROM goals WHERE approval_status = 'published')
    );

-- Authors can view days of their own goals
CREATE POLICY "Authors can view own goal days"
    ON goal_days FOR SELECT
    USING (
        goal_id IN (
            SELECT g.id FROM goals g
            JOIN authors a ON g.author_id = a.id
            WHERE a.user_id = auth.uid()
        )
    );

-- Authors can create days for their own goals
CREATE POLICY "Authors can create goal days"
    ON goal_days FOR INSERT
    WITH CHECK (
        goal_id IN (
            SELECT g.id FROM goals g
            JOIN authors a ON g.author_id = a.id
            WHERE a.user_id = auth.uid()
        )
    );

-- Authors can update days of their own goals
CREATE POLICY "Authors can update goal days"
    ON goal_days FOR UPDATE
    USING (
        goal_id IN (
            SELECT g.id FROM goals g
            JOIN authors a ON g.author_id = a.id
            WHERE a.user_id = auth.uid()
        )
    );

-- ============================================================================
-- GROUPS POLICIES
-- ============================================================================

-- Users can view public groups
CREATE POLICY "Anyone can view public groups"
    ON groups FOR SELECT
    USING (privacy_setting = 'public');

-- Users can view groups they're members of
CREATE POLICY "Users can view their groups"
    ON groups FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM enrollments WHERE user_id = auth.uid()
        )
    );

-- Users can create groups
CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Group creators can update their groups
CREATE POLICY "Creators can update own groups"
    ON groups FOR UPDATE
    USING (auth.uid() = creator_id);

-- ============================================================================
-- ENROLLMENTS POLICIES
-- ============================================================================

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
    ON enrollments FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create enrollments for themselves
CREATE POLICY "Users can enroll themselves"
    ON enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments
CREATE POLICY "Users can update own enrollments"
    ON enrollments FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- DAY COMPLETIONS POLICIES
-- ============================================================================

-- Users can view their own completions
CREATE POLICY "Users can view own completions"
    ON day_completions FOR SELECT
    USING (
        enrollment_id IN (
            SELECT id FROM enrollments WHERE user_id = auth.uid()
        )
    );

-- Users can create completions for their enrollments
CREATE POLICY "Users can create own completions"
    ON day_completions FOR INSERT
    WITH CHECK (
        enrollment_id IN (
            SELECT id FROM enrollments WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- ACHIEVEMENTS POLICIES
-- ============================================================================

-- Everyone can view achievements
CREATE POLICY "Anyone can view achievements"
    ON achievements FOR SELECT
    USING (true);

-- ============================================================================
-- USER ACHIEVEMENTS POLICIES
-- ============================================================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert achievements (via triggers/functions)
CREATE POLICY "System can insert achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Row Level Security policies created successfully!';
    RAISE NOTICE 'All tables are now protected with RLS';
END $$;
