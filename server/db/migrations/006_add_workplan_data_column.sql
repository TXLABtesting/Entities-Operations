-- Add data JSONB column to work_plans for storing form data
ALTER TABLE work_plans ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_work_plans_data ON work_plans USING GIN (data);
