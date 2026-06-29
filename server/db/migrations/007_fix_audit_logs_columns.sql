-- Add user_id and details columns to audit_logs for auth middleware compatibility
-- The auth middleware uses (user_id, action, resource_type, details) while
-- the audit middleware uses (actor_user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
-- We need both patterns to work.

-- Add user_id as alias column (nullable, references same user)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id);

-- Add details column for simple text/JSON audit entries
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;

-- Create a trigger to sync user_id and actor_user_id
CREATE OR REPLACE FUNCTION sync_audit_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.actor_user_id IS NULL THEN
    NEW.actor_user_id := NEW.user_id;
  ELSIF NEW.actor_user_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.actor_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_audit_user_id ON audit_logs;
CREATE TRIGGER trg_sync_audit_user_id
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION sync_audit_user_id();
