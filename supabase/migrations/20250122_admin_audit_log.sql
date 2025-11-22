-- Admin Audit Log Table
-- Tracks all administrative actions for compliance and accountability

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying and reporting
CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- RLS Policies: Only super_admins can view audit logs
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view audit logs"
  ON admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Service role can insert audit logs (via API)
CREATE POLICY "Service role can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  WITH CHECK (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create function to clean up old audit logs (retention: 2 years for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_audit_log
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    changes
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_changes
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Tracks all administrative actions for compliance and accountability';
COMMENT ON COLUMN admin_audit_log.action IS 'Action types: goal_approved, goal_rejected, user_role_changed, user_suspended, content_deleted, settings_updated';
COMMENT ON COLUMN admin_audit_log.target_type IS 'Resource types: goal, user, enrollment, notification, setting';
COMMENT ON COLUMN admin_audit_log.changes IS 'Before/after values: {"before": {...}, "after": {...}}';
