-- Security Event Logging Table
-- Tracks authentication and security-related events for monitoring and incident response

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX idx_security_logs_type ON security_logs(event_type, created_at DESC);
CREATE INDEX idx_security_logs_severity ON security_logs(severity, created_at DESC);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

-- RLS Policies: Only super_admins can view security logs
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all security logs
CREATE POLICY "Super admins can view security logs"
  ON security_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can view their own security events (for security dashboard)
CREATE POLICY "Users can view their own security logs"
  ON security_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert security logs (via API)
CREATE POLICY "Service role can insert security logs"
  ON security_logs
  FOR INSERT
  WITH CHECK (true);

-- Create function to clean up old security logs (retention: 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE security_logs IS 'Tracks security events for monitoring and incident response';
COMMENT ON COLUMN security_logs.event_type IS 'Event types: login, logout, login_failed, password_change, password_reset, mfa_enabled, mfa_disabled, suspicious_activity';
COMMENT ON COLUMN security_logs.severity IS 'Severity levels: info, warning, error, critical';
COMMENT ON COLUMN security_logs.details IS 'Additional context (JSON): error messages, request details, etc.';
