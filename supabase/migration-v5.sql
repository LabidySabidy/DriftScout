-- DriftScout V5: Bug Reports
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  steps TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a bug
CREATE POLICY "Authenticated users can create bug reports"
  ON bug_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admin can view all bugs
CREATE POLICY "Admin can view all bug reports"
  ON bug_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admin can update bugs (close, add notes)
CREATE POLICY "Admin can update bug reports"
  ON bug_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
