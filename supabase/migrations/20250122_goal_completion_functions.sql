-- Secure Goal Completion Functions
-- Moves business logic to database level with built-in validation and anti-cheating

-- Function to complete a goal day
CREATE OR REPLACE FUNCTION complete_goal_day(
  p_enrollment_id UUID,
  p_day_index INTEGER,
  p_completion_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  completion_id UUID,
  is_goal_completed BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_goal_id UUID;
  v_total_days INTEGER;
  v_already_completed BOOLEAN;
  v_completion_id UUID;
  v_completed_count INTEGER;
  v_is_goal_completed BOOLEAN := FALSE;
  v_recent_completions INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated'::TEXT, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Get enrollment details
  SELECT e.goal_id, g.total_days INTO v_goal_id, v_total_days
  FROM enrollments e
  JOIN goals g ON g.id = e.goal_id
  WHERE e.id = p_enrollment_id
    AND e.user_id = v_user_id;

  IF v_goal_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Enrollment not found or access denied'::TEXT, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Validate day index
  IF p_day_index < 1 OR p_day_index > v_total_days THEN
    RETURN QUERY SELECT FALSE, 'Invalid day index'::TEXT, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Check if already completed
  SELECT EXISTS(
    SELECT 1 FROM day_completions
    WHERE enrollment_id = p_enrollment_id
      AND day_index = p_day_index
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RETURN QUERY SELECT FALSE, 'Day already completed'::TEXT, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Anti-cheating: Check for excessive completions in last hour
  SELECT COUNT(*) INTO v_recent_completions
  FROM day_completions
  WHERE enrollment_id = p_enrollment_id
    AND completed_at > NOW() - INTERVAL '1 hour';

  IF v_recent_completions >= 10 THEN
    RETURN QUERY SELECT FALSE, 'Too many completions in short time period. Please slow down.'::TEXT, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Create completion record
  INSERT INTO day_completions (
    enrollment_id,
    goal_id,
    day_index,
    completion_notes
  ) VALUES (
    p_enrollment_id,
    v_goal_id,
    p_day_index,
    p_completion_notes
  )
  RETURNING id INTO v_completion_id;

  -- Check if goal is now complete
  SELECT COUNT(*) INTO v_completed_count
  FROM day_completions
  WHERE enrollment_id = p_enrollment_id;

  IF v_completed_count >= v_total_days THEN
    -- Update enrollment as completed
    UPDATE enrollments
    SET
      status = 'completed',
      completed_at = NOW()
    WHERE id = p_enrollment_id;

    v_is_goal_completed := TRUE;

    -- Create completion notification (if notification function exists)
    PERFORM create_notification(
      v_user_id,
      'goal_completed',
      '🎉 Goal Completed!',
      'Congratulations on completing your goal!',
      json_build_object('enrollment_id', p_enrollment_id, 'goal_id', v_goal_id)::TEXT,
      NULL
    );
  END IF;

  -- Update enrollment progress
  UPDATE enrollments
  SET current_day = p_day_index
  WHERE id = p_enrollment_id
    AND current_day < p_day_index;

  RETURN QUERY SELECT TRUE, 'Day completed successfully'::TEXT, v_completion_id, v_is_goal_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enrollment progress with anti-cheat analysis
CREATE OR REPLACE FUNCTION get_enrollment_progress(
  p_enrollment_id UUID
)
RETURNS TABLE(
  total_days INTEGER,
  completed_days INTEGER,
  current_day INTEGER,
  completion_percentage NUMERIC,
  is_suspicious BOOLEAN,
  suspicious_reasons TEXT[]
) AS $$
DECLARE
  v_user_id UUID;
  v_total_days INTEGER;
  v_completed_days INTEGER;
  v_current_day INTEGER;
  v_completion_percentage NUMERIC;
  v_is_suspicious BOOLEAN := FALSE;
  v_suspicious_reasons TEXT[] := ARRAY[]::TEXT[];
  v_fast_completions INTEGER;
  v_bulk_completions INTEGER;
BEGIN
  v_user_id := auth.uid();

  -- Get enrollment data
  SELECT e.current_day, g.total_days INTO v_current_day, v_total_days
  FROM enrollments e
  JOIN goals g ON g.id = e.goal_id
  WHERE e.id = p_enrollment_id
    AND e.user_id = v_user_id;

  IF v_total_days IS NULL THEN
    RETURN;
  END IF;

  -- Count completed days
  SELECT COUNT(*) INTO v_completed_days
  FROM day_completions
  WHERE enrollment_id = p_enrollment_id;

  -- Calculate completion percentage
  v_completion_percentage := (v_completed_days::NUMERIC / v_total_days::NUMERIC) * 100;

  -- Anti-cheat check 1: Impossibly fast completions (< 30 seconds apart)
  SELECT COUNT(*) INTO v_fast_completions
  FROM (
    SELECT
      completed_at,
      LAG(completed_at) OVER (ORDER BY completed_at) as prev_completed_at
    FROM day_completions
    WHERE enrollment_id = p_enrollment_id
  ) sq
  WHERE prev_completed_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (completed_at - prev_completed_at)) < 30;

  IF v_fast_completions > 0 THEN
    v_is_suspicious := TRUE;
    v_suspicious_reasons := array_append(v_suspicious_reasons,
      'Impossibly fast completions detected (' || v_fast_completions || ' instances)');
  END IF;

  -- Anti-cheat check 2: Bulk completions (5+ days in 5 minutes)
  SELECT COUNT(DISTINCT completion_window) INTO v_bulk_completions
  FROM (
    SELECT
      DATE_TRUNC('minute', completed_at)::TIMESTAMP / 5 as completion_window,
      COUNT(*) as count_in_window
    FROM day_completions
    WHERE enrollment_id = p_enrollment_id
    GROUP BY completion_window
    HAVING COUNT(*) >= 5
  ) sq;

  IF v_bulk_completions > 0 THEN
    v_is_suspicious := TRUE;
    v_suspicious_reasons := array_append(v_suspicious_reasons,
      'Bulk completion pattern detected');
  END IF;

  RETURN QUERY SELECT
    v_total_days,
    v_completed_days,
    v_current_day,
    v_completion_percentage,
    v_is_suspicious,
    v_suspicious_reasons;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to undo a completion (within 5 minutes)
CREATE OR REPLACE FUNCTION undo_day_completion(
  p_completion_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_enrollment_id UUID;
  v_completed_at TIMESTAMP WITH TIME ZONE;
  v_time_elapsed_minutes NUMERIC;
BEGIN
  v_user_id := auth.uid();

  -- Get completion details
  SELECT dc.enrollment_id, dc.completed_at INTO v_enrollment_id, v_completed_at
  FROM day_completions dc
  JOIN enrollments e ON e.id = dc.enrollment_id
  WHERE dc.id = p_completion_id
    AND e.user_id = v_user_id;

  IF v_enrollment_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Completion not found or access denied'::TEXT;
    RETURN;
  END IF;

  -- Check if completion was recent (within 5 minutes)
  v_time_elapsed_minutes := EXTRACT(EPOCH FROM (NOW() - v_completed_at)) / 60;

  IF v_time_elapsed_minutes > 5 THEN
    RETURN QUERY SELECT FALSE, 'Cannot undo completion after 5 minutes'::TEXT;
    RETURN;
  END IF;

  -- Delete the completion
  DELETE FROM day_completions
  WHERE id = p_completion_id;

  -- Update enrollment status if was marked as completed
  UPDATE enrollments
  SET status = 'in_progress', completed_at = NULL
  WHERE id = v_enrollment_id
    AND status = 'completed';

  RETURN QUERY SELECT TRUE, 'Completion undone successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON FUNCTION complete_goal_day IS 'Securely completes a goal day with anti-cheating protection';
COMMENT ON FUNCTION get_enrollment_progress IS 'Gets enrollment progress with anti-cheat analysis';
COMMENT ON FUNCTION undo_day_completion IS 'Allows undoing a completion within 5 minutes';
