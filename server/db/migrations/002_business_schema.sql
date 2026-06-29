-- Business schema: tracks, work_plans, initiatives, process_prioritizations

-- Tracks
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Plans
CREATE TABLE IF NOT EXISTS work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES entities(id),
  track_id UUID REFERENCES tracks(id),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  year INT,
  submitted_by UUID REFERENCES app_users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES app_users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES app_users(id),
  updated_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initiatives
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_plan_id UUID REFERENCES work_plans(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id),
  track_id UUID REFERENCES tracks(id),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  owner TEXT,
  phase INT,
  status TEXT NOT NULL DEFAULT 'planned',
  priority TEXT,
  start_date DATE,
  end_date DATE,
  progress INT DEFAULT 0,
  outputs JSONB DEFAULT '[]',
  outcomes JSONB DEFAULT '[]',
  created_by UUID REFERENCES app_users(id),
  updated_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Process Prioritizations
CREATE TABLE IF NOT EXISTS process_prioritizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID REFERENCES entities(id),
  work_plan_id UUID REFERENCES work_plans(id),
  process_name TEXT NOT NULL,
  owner TEXT,
  volume_text TEXT,
  ai_type TEXT,
  value_area TEXT,
  volume_score INT,
  effort_score INT,
  impact_score INT,
  data_score INT,
  api_score INT,
  risk_score INT,
  total_score INT,
  priority_level TEXT,
  opportunities TEXT,
  challenges TEXT,
  difficulties TEXT,
  notes TEXT,
  linked_initiative_id UUID REFERENCES initiatives(id),
  created_by UUID REFERENCES app_users(id),
  updated_by UUID REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_plans_entity ON work_plans(entity_id);
CREATE INDEX IF NOT EXISTS idx_work_plans_status ON work_plans(status);
CREATE INDEX IF NOT EXISTS idx_work_plans_track ON work_plans(track_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_work_plan ON initiatives(work_plan_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_entity ON initiatives(entity_id);
CREATE INDEX IF NOT EXISTS idx_prioritizations_entity ON process_prioritizations(entity_id);
