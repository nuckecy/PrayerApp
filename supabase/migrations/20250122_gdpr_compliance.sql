-- GDPR Compliance: Data Export and Deletion Functions
-- Implements "Right to Access" and "Right to be Forgotten"

-- Function to export all user data (GDPR Article 15 - Right of Access)
CREATE OR REPLACE FUNCTION export_user_data()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_export_data JSONB;
  v_profile JSONB;
  v_enrollments JSONB;
  v_completions JSONB;
  v_notifications JSONB;
  v_goals JSONB;
  v_security_logs JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Export profile data
  SELECT jsonb_build_object(
    'id', id,
    'email', (SELECT email FROM auth.users WHERE id = v_user_id),
    'name', name,
    'role', role,
    'timezone', timezone,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_profile
  FROM profiles
  WHERE id = v_user_id;

  -- Export enrollments
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'goal_title', g.title,
      'status', e.status,
      'current_day', e.current_day,
      'enrolled_at', e.enrolled_at,
      'completed_at', e.completed_at
    )
  ), '[]'::jsonb) INTO v_enrollments
  FROM enrollments e
  JOIN goals g ON g.id = e.goal_id
  WHERE e.user_id = v_user_id;

  -- Export day completions
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'goal_title', g.title,
      'day_index', dc.day_index,
      'completed_at', dc.completed_at,
      'completion_notes', dc.completion_notes
    )
  ), '[]'::jsonb) INTO v_completions
  FROM day_completions dc
  JOIN goals g ON g.id = dc.goal_id
  JOIN enrollments e ON e.id = dc.enrollment_id
  WHERE e.user_id = v_user_id;

  -- Export notifications
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'type', type,
      'title', title,
      'message', message,
      'read', read,
      'created_at', created_at
    )
  ), '[]'::jsonb) INTO v_notifications
  FROM notifications
  WHERE user_id = v_user_id;

  -- Export authored goals (if user is an author)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'title', g.title,
      'description', g.description,
      'total_days', g.total_days,
      'approval_status', g.approval_status,
      'created_at', g.created_at
    )
  ), '[]'::jsonb) INTO v_goals
  FROM goals g
  JOIN authors a ON a.id = g.author_id
  WHERE a.user_id = v_user_id;

  -- Export recent security logs (last 90 days)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'event_type', event_type,
      'severity', severity,
      'created_at', created_at
    )
  ), '[]'::jsonb) INTO v_security_logs
  FROM security_logs
  WHERE user_id = v_user_id
    AND created_at > NOW() - INTERVAL '90 days';

  -- Build complete export
  v_export_data := jsonb_build_object(
    'export_date', NOW(),
    'user_id', v_user_id,
    'profile', v_profile,
    'enrollments', v_enrollments,
    'completions', v_completions,
    'notifications', v_notifications,
    'authored_goals', v_goals,
    'security_logs', v_security_logs,
    'export_format_version', '1.0'
  );

  RETURN v_export_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all user data (GDPR Article 17 - Right to Erasure)
CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  deleted_counts JSONB
) AS $$
DECLARE
  v_user_id UUID;
  v_author_id UUID;
  v_deleted_counts JSONB;
  v_enrollments_count INTEGER;
  v_completions_count INTEGER;
  v_notifications_count INTEGER;
  v_goals_count INTEGER;
  v_security_logs_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, '{}'::JSONB;
    RETURN;
  END IF;

  -- Get author_id if user is an author
  SELECT id INTO v_author_id
  FROM authors
  WHERE user_id = v_user_id;

  -- Delete day completions
  WITH deleted AS (
    DELETE FROM day_completions
    WHERE enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = v_user_id
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_completions_count FROM deleted;

  -- Delete enrollments
  WITH deleted AS (
    DELETE FROM enrollments
    WHERE user_id = v_user_id
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_enrollments_count FROM deleted;

  -- Delete notifications
  WITH deleted AS (
    DELETE FROM notifications
    WHERE user_id = v_user_id
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_notifications_count FROM deleted;

  -- Archive authored goals instead of deleting (preserve content for enrolled users)
  WITH updated AS (
    UPDATE goals
    SET
      approval_status = 'archived',
      updated_at = NOW()
    WHERE author_id = v_author_id
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_goals_count FROM updated;

  -- Delete author record
  DELETE FROM authors WHERE user_id = v_user_id;

  -- Delete security logs (keep audit trail in separate table)
  WITH deleted AS (
    DELETE FROM security_logs
    WHERE user_id = v_user_id
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_security_logs_count FROM deleted;

  -- Delete failed login attempts
  DELETE FROM failed_login_attempts
  WHERE identifier = (SELECT email FROM auth.users WHERE id = v_user_id);

  -- Delete account lockouts
  DELETE FROM account_lockouts
  WHERE identifier = (SELECT email FROM auth.users WHERE id = v_user_id);

  -- Anonymize profile (keep record but remove PII)
  UPDATE profiles
  SET
    name = 'Deleted User',
    timezone = 'UTC',
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Build deleted counts report
  v_deleted_counts := jsonb_build_object(
    'enrollments', v_enrollments_count,
    'completions', v_completions_count,
    'notifications', v_notifications_count,
    'goals_archived', v_goals_count,
    'security_logs', v_security_logs_count
  );

  -- Note: Actual auth.users deletion should be done via Supabase Admin API
  -- This function only handles application data

  RETURN QUERY SELECT
    TRUE,
    'User data deleted successfully. Account will be fully removed within 30 days.'::TEXT,
    v_deleted_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request data deletion (creates deletion request)
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  deleted_data JSONB
);

CREATE INDEX idx_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON data_deletion_requests(status, requested_at);

-- RLS for deletion requests
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests"
  ON data_deletion_requests
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create deletion requests"
  ON data_deletion_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function to create deletion request
CREATE OR REPLACE FUNCTION request_data_deletion(
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_request_id UUID;
  v_existing_request UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Check for existing pending request
  SELECT id INTO v_existing_request
  FROM data_deletion_requests
  WHERE user_id = v_user_id
    AND status IN ('pending', 'processing');

  IF v_existing_request IS NOT NULL THEN
    RAISE EXCEPTION 'A deletion request is already pending';
  END IF;

  -- Create deletion request
  INSERT INTO data_deletion_requests (
    user_id,
    email,
    reason,
    status
  ) VALUES (
    v_user_id,
    v_email,
    p_reason,
    'pending'
  )
  RETURNING id INTO v_request_id;

  -- Create notification
  PERFORM create_notification(
    v_user_id,
    'data_deletion_requested',
    'Account Deletion Requested',
    'Your account deletion request has been received. Your data will be permanently deleted within 30 days.',
    json_build_object('request_id', v_request_id)::TEXT,
    NULL
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON FUNCTION export_user_data IS 'Exports all user data in JSON format (GDPR Article 15)';
COMMENT ON FUNCTION delete_user_data IS 'Deletes all user data except audit records (GDPR Article 17)';
COMMENT ON FUNCTION request_data_deletion IS 'Creates a data deletion request with 30-day processing period';
COMMENT ON TABLE data_deletion_requests IS 'Tracks GDPR data deletion requests';
