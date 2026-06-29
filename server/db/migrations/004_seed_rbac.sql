-- Seed system roles
INSERT INTO roles (code, name, description, is_system) VALUES
  ('platform_admin', 'Platform Admin', 'Full system administration. Can manage users, roles, permissions, entities, settings, and all work plans.', TRUE),
  ('program_admin', 'Program Admin', 'Can manage program-wide work plans, initiatives, reporting, reviews, exports, and entities.', TRUE),
  ('entity_admin', 'Entity Admin', 'Can manage users and work plans for their assigned entity.', TRUE),
  ('coordinator', 'Coordinator', 'Can create and edit assigned work plans and initiatives for their entity.', TRUE),
  ('reviewer', 'Reviewer', 'Can review, comment, approve, reject, or request changes depending on workflow state.', TRUE),
  ('viewer', 'Viewer', 'Read-only access to permitted dashboards, plans, and reports.', TRUE),
  ('auditor', 'Auditor', 'Read-only access plus audit logs and history.', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed permissions
INSERT INTO permissions (code, description) VALUES
  ('users:view', 'View users'),
  ('users:create', 'Create users'),
  ('users:update', 'Update users'),
  ('users:enable', 'Enable user access'),
  ('users:disable', 'Disable user access'),
  ('roles:view', 'View roles'),
  ('roles:assign', 'Assign roles to users'),
  ('entities:view', 'View entities'),
  ('entities:create', 'Create entities'),
  ('entities:update', 'Update entities'),
  ('workplans:view', 'View work plans'),
  ('workplans:create', 'Create work plans'),
  ('workplans:update', 'Update work plans'),
  ('workplans:delete', 'Delete work plans'),
  ('workplans:submit', 'Submit work plans'),
  ('workplans:approve', 'Approve work plans'),
  ('workplans:reject', 'Reject work plans'),
  ('workplans:export', 'Export work plans'),
  ('initiatives:view', 'View initiatives'),
  ('initiatives:create', 'Create initiatives'),
  ('initiatives:update', 'Update initiatives'),
  ('initiatives:delete', 'Delete initiatives'),
  ('prioritization:view', 'View prioritization'),
  ('prioritization:create', 'Create prioritization'),
  ('prioritization:update', 'Update prioritization'),
  ('prioritization:delete', 'Delete prioritization'),
  ('reports:view', 'View reports'),
  ('reports:export', 'Export reports'),
  ('audit:view', 'View audit logs'),
  ('settings:view', 'View settings'),
  ('settings:update', 'Update settings')
ON CONFLICT (code) DO NOTHING;

-- Seed role-permission matrix
-- platform_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.code = 'platform_admin'
ON CONFLICT DO NOTHING;

-- program_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'program_admin' AND p.code IN (
  'users:view','users:create','users:update','users:enable','users:disable',
  'roles:view','roles:assign',
  'entities:view','entities:create','entities:update',
  'workplans:view','workplans:create','workplans:update','workplans:delete','workplans:submit','workplans:approve','workplans:reject','workplans:export',
  'initiatives:view','initiatives:create','initiatives:update','initiatives:delete',
  'prioritization:view','prioritization:create','prioritization:update','prioritization:delete',
  'reports:view','reports:export',
  'audit:view'
)
ON CONFLICT DO NOTHING;

-- entity_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'entity_admin' AND p.code IN (
  'users:view','users:create','users:update','users:enable','users:disable',
  'entities:view',
  'workplans:view','workplans:create','workplans:update','workplans:delete','workplans:submit','workplans:export',
  'initiatives:view','initiatives:create','initiatives:update','initiatives:delete',
  'prioritization:view','prioritization:create','prioritization:update','prioritization:delete',
  'reports:view','reports:export'
)
ON CONFLICT DO NOTHING;

-- coordinator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'coordinator' AND p.code IN (
  'entities:view',
  'workplans:view','workplans:create','workplans:update','workplans:submit','workplans:export',
  'initiatives:view','initiatives:create','initiatives:update',
  'prioritization:view','prioritization:create','prioritization:update',
  'reports:view'
)
ON CONFLICT DO NOTHING;

-- reviewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'reviewer' AND p.code IN (
  'entities:view',
  'workplans:view','workplans:approve','workplans:reject','workplans:export',
  'initiatives:view',
  'prioritization:view',
  'reports:view'
)
ON CONFLICT DO NOTHING;

-- viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'viewer' AND p.code IN (
  'entities:view',
  'workplans:view',
  'initiatives:view',
  'prioritization:view',
  'reports:view'
)
ON CONFLICT DO NOTHING;

-- auditor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'auditor' AND p.code IN (
  'entities:view',
  'workplans:view','workplans:export',
  'initiatives:view',
  'prioritization:view',
  'reports:view','reports:export',
  'audit:view'
)
ON CONFLICT DO NOTHING;
