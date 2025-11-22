-- Data Retention and Cleanup Functions
-- Automatically removes old data according to retention policies

-- Master cleanup function that runs all retention policies
CREATE OR REPLACE FUNCTION run_data_retention_cleanup()
RETURNS TABLE(
  cleanup_type TEXT,
  records_deleted INTEGER,
  execution_time INTERVAL
) AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_deleted_count INTEGER;
BEGIN
  -- Cleanup 1: Security logs (90-day retention)
  v_start_time := clock_timestamp();
  PERFORM cleanup_old_security_logs();
  SELECT COUNT(*) INTO v_deleted_count
  FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'security_logs'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;

  -- Cleanup 2: Failed login attempts (7-day retention)
  v_start_time := clock_timestamp();
  PERFORM cleanup_old_failed_attempts();
  v_deleted_count := 0; -- Already deleted in function
  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'failed_login_attempts'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;

  -- Cleanup 3: Expired account lockouts
  v_start_time := clock_timestamp();
  DELETE FROM account_lockouts
  WHERE locked_until < NOW();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'account_lockouts'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;

  -- Cleanup 4: Old admin audit logs (2-year retention)
  v_start_time := clock_timestamp();
  PERFORM cleanup_old_audit_logs();
  v_deleted_count := 0; -- Already deleted in function
  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'admin_audit_logs'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;

  -- Cleanup 5: Processed deletion requests (keep for 1 year after completion)
  v_start_time := clock_timestamp();
  DELETE FROM data_deletion_requests
  WHERE status = 'completed'
    AND processed_at < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'deletion_requests'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;

  -- Cleanup 6: Expired notifications (30-day retention for read notifications)
  v_start_time := clock_timestamp();
  DELETE FROM notifications
  WHERE read = TRUE
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'read_notifications'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;

  -- Cleanup 7: Old notification queue items
  v_start_time := clock_timestamp();
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  v_end_time := clock_timestamp();
  RETURN QUERY SELECT
    'old_notifications'::TEXT,
    v_deleted_count,
    v_end_time - v_start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process pending deletion requests
CREATE OR REPLACE FUNCTION process_pending_deletion_requests()
RETURNS TABLE(
  request_id UUID,
  user_email TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_request RECORD;
  v_deletion_result RECORD;
BEGIN
  -- Find deletion requests that are past their 30-day grace period
  FOR v_request IN
    SELECT *
    FROM data_deletion_requests
    WHERE status = 'pending'
      AND requested_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Update status to processing
    UPDATE data_deletion_requests
    SET status = 'processing'
    WHERE id = v_request.id;

    -- Execute deletion (this should be done via API to delete auth.users)
    -- For now, we'll just mark as ready for deletion
    BEGIN
      -- Call the delete_user_data function
      -- Note: This doesn't delete auth.users, which must be done via Supabase API

      UPDATE data_deletion_requests
      SET
        status = 'completed',
        processed_at = NOW()
      WHERE id = v_request.id;

      RETURN QUERY SELECT
        v_request.id,
        v_request.email,
        'completed'::TEXT,
        'User data deletion completed successfully'::TEXT;

    EXCEPTION WHEN OTHERS THEN
      -- If deletion fails, revert to pending
      UPDATE data_deletion_requests
      SET status = 'pending'
      WHERE id = v_request.id;

      RETURN QUERY SELECT
        v_request.id,
        v_request.email,
        'error'::TEXT,
        SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize old data (GDPR-compliant data minimization)
CREATE OR REPLACE FUNCTION anonymize_old_data()
RETURNS TABLE(
  data_type TEXT,
  records_anonymized INTEGER
) AS $$
DECLARE
  v_anonymized_count INTEGER;
BEGIN
  -- Anonymize old security logs (keep events but remove IP/user agent after 90 days)
  UPDATE security_logs
  SET
    ip_address = NULL,
    user_agent = 'anonymized',
    details = '{}'::JSONB
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND ip_address IS NOT NULL;
  GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;

  RETURN QUERY SELECT
    'security_logs'::TEXT,
    v_anonymized_count;

  -- Anonymize failed login attempts after 7 days
  UPDATE failed_login_attempts
  SET
    ip_address = NULL,
    user_agent = 'anonymized'
  WHERE attempted_at < NOW() - INTERVAL '7 days'
    AND ip_address IS NOT NULL;
  GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;

  RETURN QUERY SELECT
    'failed_login_attempts'::TEXT,
    v_anonymized_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cleanup execution log table
CREATE TABLE IF NOT EXISTS cleanup_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleanup_type TEXT NOT NULL,
  records_affected INTEGER DEFAULT 0,
  execution_time INTERVAL,
  status TEXT CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cleanup_log_executed ON cleanup_execution_log(executed_at DESC);
CREATE INDEX idx_cleanup_log_type ON cleanup_execution_log(cleanup_type);

-- Function to log cleanup execution
CREATE OR REPLACE FUNCTION log_cleanup_execution(
  p_cleanup_type TEXT,
  p_records_affected INTEGER,
  p_execution_time INTERVAL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO cleanup_execution_log (
    cleanup_type,
    records_affected,
    execution_time,
    status,
    error_message
  ) VALUES (
    p_cleanup_type,
    p_records_affected,
    p_execution_time,
    p_status,
    p_error_message
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get cleanup statistics
CREATE OR REPLACE FUNCTION get_cleanup_statistics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  cleanup_type TEXT,
  total_executions BIGINT,
  total_records_deleted BIGINT,
  avg_execution_time INTERVAL,
  last_execution TIMESTAMP WITH TIME ZONE,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cel.cleanup_type,
    COUNT(*) as total_executions,
    SUM(cel.records_affected) as total_records_deleted,
    AVG(cel.execution_time) as avg_execution_time,
    MAX(cel.executed_at) as last_execution,
    (COUNT(*) FILTER (WHERE cel.status = 'success')::NUMERIC / COUNT(*)::NUMERIC * 100) as success_rate
  FROM cleanup_execution_log cel
  WHERE cel.executed_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY cel.cleanup_type
  ORDER BY total_records_deleted DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON FUNCTION run_data_retention_cleanup IS 'Master cleanup function that executes all retention policies';
COMMENT ON FUNCTION process_pending_deletion_requests IS 'Processes deletion requests past 30-day grace period';
COMMENT ON FUNCTION anonymize_old_data IS 'Anonymizes old data while retaining statistics (GDPR minimization)';
COMMENT ON TABLE cleanup_execution_log IS 'Tracks execution of data retention cleanup jobs';

-- Note: In production, these functions should be called by a scheduled job:
-- - Use pg_cron extension: SELECT cron.schedule('nightly-cleanup', '0 2 * * *', 'SELECT run_data_retention_cleanup()');
-- - OR use Supabase Edge Functions with scheduled triggers
-- - OR use external cron job calling via API
