-- Seed default tracks
INSERT INTO tracks (code, name_en, name_ar, description_en, description_ar, sort_order) VALUES
  ('services', 'Services', 'الخدمات', 'Government services track', 'مسار الخدمات الحكومية', 1),
  ('operations', 'Operations', 'العمليات', 'Operations and processes track', 'مسار العمليات والإجراءات', 2),
  ('workforce', 'Workforce', 'القوى العاملة', 'Workforce and HR track', 'مسار القوى العاملة والموارد البشرية', 3),
  ('policymaking', 'Policymaking', 'صنع السياسات', 'Policymaking track', 'مسار صنع السياسات', 4)
ON CONFLICT (code) DO NOTHING;
