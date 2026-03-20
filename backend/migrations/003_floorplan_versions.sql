-- 003_floorplan_versions.sql
-- Store snapshots of floorplans per restaurant for history/restore

CREATE TABLE IF NOT EXISTS floorplan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text DEFAULT 'snapshot',
  data jsonb NOT NULL,
  created_by uuid NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for faster retrieval per restaurant
CREATE INDEX IF NOT EXISTS idx_floorplan_versions_restaurant ON floorplan_versions (restaurant_id);
