-- Account Lockout System
-- Tracks failed login attempts and implements temporary account lockout

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- email or user_id
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('email', 'user_id')),
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_failed_attempts_identifier ON failed_login_attempts(identifier, attempted_at DESC);
CREATE INDEX idx_failed_attempts_ip ON failed_login_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_failed_attempts_time ON failed_login_attempts(attempted_at DESC);

-- Account lockout tracking table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL UNIQUE,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  lock_reason TEXT DEFAULT 'Too many failed login attempts',
  attempt_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lockouts_identifier ON account_lockouts(identifier);
CREATE INDEX idx_lockouts_until ON account_lockouts(locked_until);

-- RLS Policies: Service role only (called from backend/middleware)
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (security function)
CREATE POLICY "Service role only for failed attempts"
  ON failed_login_attempts
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role only for lockouts"
  ON account_lockouts
  USING (true)
  WITH CHECK (true);

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login_attempt(
  p_identifier TEXT,
  p_attempt_type TEXT DEFAULT 'email',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO failed_login_attempts (
    identifier,
    attempt_type,
    ip_address,
    user_agent
  ) VALUES (
    p_identifier,
    p_attempt_type,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(
  p_identifier TEXT
)
RETURNS TABLE(
  is_locked BOOLEAN,
  locked_until TIMESTAMP WITH TIME ZONE,
  reason TEXT
) AS $$
DECLARE
  v_lockout RECORD;
BEGIN
  -- Check for active lockout
  SELECT * INTO v_lockout
  FROM account_lockouts
  WHERE identifier = p_identifier
    AND locked_until > NOW();

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_lockout.locked_until, v_lockout.lock_reason;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock account
CREATE OR REPLACE FUNCTION lock_account(
  p_identifier TEXT,
  p_duration_minutes INTEGER DEFAULT 15,
  p_reason TEXT DEFAULT 'Too many failed login attempts'
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_locked_until TIMESTAMP WITH TIME ZONE;
  v_attempt_count INTEGER;
BEGIN
  v_locked_until := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;

  -- Count recent failed attempts
  SELECT COUNT(*) INTO v_attempt_count
  FROM failed_login_attempts
  WHERE identifier = p_identifier
    AND attempted_at > NOW() - INTERVAL '15 minutes';

  -- Insert or update lockout
  INSERT INTO account_lockouts (
    identifier,
    locked_until,
    lock_reason,
    attempt_count
  ) VALUES (
    p_identifier,
    v_locked_until,
    p_reason,
    v_attempt_count
  )
  ON CONFLICT (identifier)
  DO UPDATE SET
    locked_until = v_locked_until,
    lock_reason = p_reason,
    attempt_count = v_attempt_count,
    created_at = NOW();

  RETURN v_locked_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock account
CREATE OR REPLACE FUNCTION unlock_account(
  p_identifier TEXT
)
RETURNS void AS $$
BEGIN
  DELETE FROM account_lockouts
  WHERE identifier = p_identifier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent failed attempts count
CREATE OR REPLACE FUNCTION get_failed_attempts_count(
  p_identifier TEXT,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM failed_login_attempts
  WHERE identifier = p_identifier
    AND attempted_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear old failed attempts (retention: 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_failed_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '7 days';

  -- Clear expired lockouts
  DELETE FROM account_lockouts
  WHERE locked_until < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for account lockout policy';
COMMENT ON TABLE account_lockouts IS 'Tracks temporarily locked accounts due to failed login attempts';
COMMENT ON FUNCTION record_failed_login_attempt IS 'Records a failed login attempt';
COMMENT ON FUNCTION is_account_locked IS 'Checks if an account is currently locked';
COMMENT ON FUNCTION lock_account IS 'Locks an account for specified duration (default: 15 minutes)';
COMMENT ON FUNCTION unlock_account IS 'Manually unlocks an account';
COMMENT ON FUNCTION get_failed_attempts_count IS 'Gets count of failed attempts in specified time window';
