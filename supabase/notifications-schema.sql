-- Phase 5: Notifications System
-- Run this in Supabase SQL Editor

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
    'daily_reminder',
    'streak_warning',
    'goal_completed',
    'achievement_earned',
    'group_member_joined',
    'group_member_completed',
    'author_application_status',
    'goal_approval_status'
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for efficient queries
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_expires_hours INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiration if specified
    IF p_expires_hours IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
    END IF;

    -- Insert notification
    INSERT INTO notifications (user_id, type, title, message, data, expires_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, v_expires_at)
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger daily reminder notifications
-- This would be called by a scheduled job (Supabase Edge Function or cron)
CREATE OR REPLACE FUNCTION trigger_daily_reminders()
RETURNS TABLE(user_id UUID, user_name TEXT, user_timezone TEXT, reminder_time TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.timezone,
        COALESCE(p.notification_preferences->>'daily_reminder_time', '09:00') as reminder_time
    FROM profiles p
    WHERE
        -- User has enabled daily reminders (default true)
        COALESCE((p.notification_preferences->>'daily_reminders_enabled')::boolean, true) = true
        -- User has active enrollments
        AND EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.user_id = p.id
            AND e.status = 'active'
        );
END;
$$ LANGUAGE plpgsql;

-- Function to trigger streak warning notifications
CREATE OR REPLACE FUNCTION trigger_streak_warnings()
RETURNS TABLE(notification_id UUID, user_id UUID) AS $$
DECLARE
    v_enrollment RECORD;
    v_hours_since_completion NUMERIC;
    v_notification_id UUID;
    v_user_prefs JSONB;
    v_warnings_enabled BOOLEAN;
BEGIN
    -- Loop through active enrollments
    FOR v_enrollment IN
        SELECT
            e.id, e.user_id, e.goal_id, e.last_completed_at, e.streak_count,
            g.title as goal_title,
            p.notification_preferences
        FROM enrollments e
        JOIN goals g ON e.goal_id = g.id
        JOIN profiles p ON e.user_id = p.id
        WHERE e.status = 'active'
        AND e.last_completed_at IS NOT NULL
    LOOP
        -- Check if streak warnings are enabled (default true)
        v_warnings_enabled := COALESCE(
            (v_enrollment.notification_preferences->>'streak_warnings_enabled')::boolean,
            true
        );

        IF v_warnings_enabled THEN
            -- Calculate hours since last completion
            v_hours_since_completion := EXTRACT(EPOCH FROM (NOW() - v_enrollment.last_completed_at)) / 3600;

            -- Send warning if between 20-24 hours
            IF v_hours_since_completion >= 20 AND v_hours_since_completion < 24 THEN
                -- Check if notification already sent recently (avoid duplicates)
                IF NOT EXISTS (
                    SELECT 1 FROM notifications n
                    WHERE n.user_id = v_enrollment.user_id
                    AND n.type = 'streak_warning'
                    AND n.data->>'enrollment_id' = v_enrollment.id::text
                    AND n.created_at > NOW() - INTERVAL '6 hours'
                ) THEN
                    -- Create notification
                    v_notification_id := create_notification(
                        v_enrollment.user_id,
                        'streak_warning',
                        '⚠️ Streak at Risk!',
                        format('Your %s-day streak for "%s" is at risk! Complete today''s goal within %s hours.',
                            v_enrollment.streak_count,
                            v_enrollment.goal_title,
                            CEIL(24 - v_hours_since_completion)
                        ),
                        jsonb_build_object(
                            'enrollment_id', v_enrollment.id,
                            'goal_id', v_enrollment.goal_id,
                            'streak_count', v_enrollment.streak_count,
                            'hours_remaining', CEIL(24 - v_hours_since_completion)
                        ),
                        24
                    );

                    user_id := v_enrollment.user_id;
                    notification_id := v_notification_id;
                    RETURN NEXT;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on goal completion
CREATE OR REPLACE FUNCTION notify_goal_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_goal_title TEXT;
    v_total_days INTEGER;
    v_user_prefs JSONB;
    v_notifications_enabled BOOLEAN;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get goal details
        SELECT title, total_days INTO v_goal_title, v_total_days
        FROM goals WHERE id = NEW.goal_id;

        -- Check if goal completion notifications are enabled
        SELECT notification_preferences INTO v_user_prefs
        FROM profiles WHERE id = NEW.user_id;

        v_notifications_enabled := COALESCE(
            (v_user_prefs->>'goal_completion_enabled')::boolean,
            true
        );

        IF v_notifications_enabled THEN
            -- Create completion notification
            PERFORM create_notification(
                NEW.user_id,
                'goal_completed',
                '🎉 Goal Completed!',
                format('Congratulations! You completed "%s" - all %s days done!', v_goal_title, v_total_days),
                jsonb_build_object(
                    'enrollment_id', NEW.id,
                    'goal_id', NEW.goal_id,
                    'total_days', v_total_days,
                    'streak_count', NEW.streak_count
                ),
                NULL
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for goal completion
CREATE TRIGGER on_goal_completed
AFTER UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION notify_goal_completion();

-- Function to notify on achievement earned
CREATE OR REPLACE FUNCTION notify_achievement_earned()
RETURNS TRIGGER AS $$
DECLARE
    v_achievement RECORD;
    v_user_prefs JSONB;
    v_notifications_enabled BOOLEAN;
BEGIN
    -- Get achievement details
    SELECT name, description, icon INTO v_achievement
    FROM achievements WHERE id = NEW.achievement_id;

    -- Check if achievement notifications are enabled
    SELECT notification_preferences INTO v_user_prefs
    FROM profiles WHERE id = NEW.user_id;

    v_notifications_enabled := COALESCE(
        (v_user_prefs->>'achievement_notifications_enabled')::boolean,
        true
    );

    IF v_notifications_enabled THEN
        -- Create achievement notification
        PERFORM create_notification(
            NEW.user_id,
            'achievement_earned',
            format('%s Achievement Unlocked!', v_achievement.icon),
            format('You earned "%s": %s', v_achievement.name, v_achievement.description),
            jsonb_build_object(
                'achievement_id', NEW.achievement_id,
                'achievement_name', v_achievement.name,
                'icon', v_achievement.icon
            ),
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for achievement earned
CREATE TRIGGER on_achievement_earned
AFTER INSERT ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION notify_achievement_earned();

-- Function to notify group members when someone joins
CREATE OR REPLACE FUNCTION notify_group_member_joined()
RETURNS TRIGGER AS $$
DECLARE
    v_group RECORD;
    v_new_member_name TEXT;
    v_member_id UUID;
    v_member_prefs JSONB;
    v_notifications_enabled BOOLEAN;
BEGIN
    -- Only trigger for new enrollments with group_id
    IF NEW.group_id IS NOT NULL AND (OLD IS NULL OR OLD.group_id IS NULL) THEN
        -- Get group and goal details
        SELECT g.name as group_name, g.creator_id, goal.title as goal_title
        INTO v_group
        FROM groups g
        JOIN goals goal ON g.goal_id = goal.goal_id
        WHERE g.id = NEW.group_id;

        -- Get new member name
        SELECT name INTO v_new_member_name
        FROM profiles WHERE id = NEW.user_id;

        -- Notify all other group members
        FOR v_member_id IN
            SELECT DISTINCT e.user_id
            FROM enrollments e
            WHERE e.group_id = NEW.group_id
            AND e.user_id != NEW.user_id
        LOOP
            -- Check if group notifications are enabled for this member
            SELECT notification_preferences INTO v_member_prefs
            FROM profiles WHERE id = v_member_id;

            v_notifications_enabled := COALESCE(
                (v_member_prefs->>'group_activity_enabled')::boolean,
                true
            );

            IF v_notifications_enabled THEN
                PERFORM create_notification(
                    v_member_id,
                    'group_member_joined',
                    '👥 New Group Member',
                    format('%s joined "%s"', v_new_member_name, v_group.group_name),
                    jsonb_build_object(
                        'group_id', NEW.group_id,
                        'new_member_id', NEW.user_id,
                        'new_member_name', v_new_member_name
                    ),
                    168  -- Expire in 7 days
                );
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for group member joined
CREATE TRIGGER on_group_member_joined
AFTER INSERT OR UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION notify_group_member_joined();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Notifications system created successfully!';
    RAISE NOTICE 'Tables: notifications';
    RAISE NOTICE 'Functions: create_notification, trigger_daily_reminders, trigger_streak_warnings, cleanup_expired_notifications';
    RAISE NOTICE 'Triggers: on_goal_completed, on_achievement_earned, on_group_member_joined';
END $$;
