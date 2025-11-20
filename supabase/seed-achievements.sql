-- Seed Default Achievements for DailyGoalTracker
-- Run this in Supabase SQL Editor to create achievement badges

-- Clear existing achievements (optional - comment out if you want to keep existing)
-- DELETE FROM user_achievements;
-- DELETE FROM achievements;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, criteria) VALUES
-- Streak Achievements
('First Step', 'Complete your first day', '🎯', jsonb_build_object('type', 'day_completion', 'count', 1)),
('Week Warrior', 'Maintain a 7-day streak', '🔥', jsonb_build_object('type', 'streak', 'count', 7)),
('Unstoppable', 'Maintain a 30-day streak', '⚡', jsonb_build_object('type', 'streak', 'count', 30)),
('Century', 'Maintain a 100-day streak', '💯', jsonb_build_object('type', 'streak', 'count', 100)),

-- Goal Completion Achievements
('Goal Crusher', 'Complete your first goal', '🏆', jsonb_build_object('type', 'goal_completion', 'count', 1)),
('Triple Threat', 'Complete 3 different goals', '🎖️', jsonb_build_object('type', 'goal_completion', 'count', 3)),
('Goal Master', 'Complete 10 different goals', '👑', jsonb_build_object('type', 'goal_completion', 'count', 10)),

-- Speed Achievements
('Quick Start', 'Complete first 3 days without skipping', '🚀', jsonb_build_object('type', 'quick_start', 'days', 3)),
('Marathon Runner', 'Complete a 30+ day goal', '🏃', jsonb_build_object('type', 'long_goal', 'days', 30)),
('Ultra Achiever', 'Complete a 100+ day goal', '🦸', jsonb_build_object('type', 'long_goal', 'days', 100)),

-- Consistency Achievements
('Morning Person', 'Complete 10 days before 9 AM', '🌅', jsonb_build_object('type', 'time_consistency', 'hour', 9, 'count', 10)),
('Night Owl', 'Complete 10 days after 9 PM', '🦉', jsonb_build_object('type', 'time_consistency', 'hour', 21, 'count', 10)),
('Perfect Week', 'Complete 7 consecutive days', '✨', jsonb_build_object('type', 'consecutive', 'days', 7)),

-- Community Achievements
('Team Player', 'Join your first group goal', '🤝', jsonb_build_object('type', 'group_join', 'count', 1)),
('Community Leader', 'Create a group with 10+ members', '📢', jsonb_build_object('type', 'group_leader', 'members', 10)),

-- Special Achievements
('Phoenix Rising', 'Restart a goal after breaking a streak', '🔄', jsonb_build_object('type', 'comeback', 'count', 1)),
('Dedicated Learner', 'Complete all days of a text-heavy goal', '📚', jsonb_build_object('type', 'learner', 'count', 1)),
('Early Bird', 'Join the platform in its first year', '🐣', jsonb_build_object('type', 'early_adopter', 'year', 2025));

-- Function to automatically award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID, p_event_type TEXT, p_event_data JSONB)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT, achievement_icon TEXT) AS $$
DECLARE
    v_achievement RECORD;
    v_user_stats JSONB;
    v_already_has BOOLEAN;
BEGIN
    -- Build user stats
    SELECT jsonb_build_object(
        'total_completions', COUNT(DISTINCT dc.id),
        'total_goals_completed', COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed'),
        'max_streak', COALESCE(MAX(e.streak_count), 0),
        'groups_joined', COUNT(DISTINCT e.group_id) FILTER (WHERE e.group_id IS NOT NULL)
    ) INTO v_user_stats
    FROM day_completions dc
    LEFT JOIN enrollments e ON dc.enrollment_id = e.id
    WHERE e.user_id = p_user_id;

    -- Check each achievement
    FOR v_achievement IN SELECT * FROM achievements LOOP
        -- Check if user already has this achievement
        SELECT EXISTS(
            SELECT 1 FROM user_achievements
            WHERE user_id = p_user_id AND achievement_id = v_achievement.id
        ) INTO v_already_has;

        IF NOT v_already_has THEN
            -- Check criteria based on type
            IF v_achievement.criteria->>'type' = 'day_completion' AND
               (v_user_stats->>'total_completions')::int >= (v_achievement.criteria->>'count')::int THEN
                INSERT INTO user_achievements (user_id, achievement_id)
                VALUES (p_user_id, v_achievement.id);
                RETURN QUERY SELECT v_achievement.id, v_achievement.name, v_achievement.icon;

            ELSIF v_achievement.criteria->>'type' = 'streak' AND
                  (v_user_stats->>'max_streak')::int >= (v_achievement.criteria->>'count')::int THEN
                INSERT INTO user_achievements (user_id, achievement_id)
                VALUES (p_user_id, v_achievement.id);
                RETURN QUERY SELECT v_achievement.id, v_achievement.name, v_achievement.icon;

            ELSIF v_achievement.criteria->>'type' = 'goal_completion' AND
                  (v_user_stats->>'total_goals_completed')::int >= (v_achievement.criteria->>'count')::int THEN
                INSERT INTO user_achievements (user_id, achievement_id)
                VALUES (p_user_id, v_achievement.id);
                RETURN QUERY SELECT v_achievement.id, v_achievement.name, v_achievement.icon;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check achievements after day completion
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user_id from enrollment
    SELECT user_id INTO v_user_id
    FROM enrollments
    WHERE id = NEW.enrollment_id;

    -- Check for new achievements
    PERFORM check_and_award_achievements(
        v_user_id,
        'day_completion',
        jsonb_build_object('day_index', NEW.day_index)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_day_completion_check_achievements ON day_completions;
CREATE TRIGGER after_day_completion_check_achievements
    AFTER INSERT ON day_completions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_achievements();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=======================================';
    RAISE NOTICE 'Achievements system initialized!';
    RAISE NOTICE 'Created 17 default achievements';
    RAISE NOTICE 'Automatic award system enabled';
    RAISE NOTICE '=======================================';
END $$;
