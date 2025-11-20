-- Phase 5: Row Level Security Policies for Notifications
-- Run this in Supabase SQL Editor after notifications-schema.sql

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
-- No policy needed for INSERT as it will be done via service role or functions

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Notifications RLS policies created successfully!';
END $$;
