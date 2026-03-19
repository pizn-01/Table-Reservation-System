-- Interactive Floor Plan Editor — Database Migration
-- Run this in Supabase SQL Editor

-- New columns on tables for merge/split and visual sizing
ALTER TABLE tables ADD COLUMN IF NOT EXISTS merge_group_id UUID DEFAULT NULL;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS split_parent_id UUID DEFAULT NULL;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS width FLOAT DEFAULT 135;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS height FLOAT DEFAULT 100;

-- Store the selected floor plan view mode on the organization
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS floor_plan_view_mode TEXT DEFAULT 'standard';

-- Also add description for dynamic content (from Phase 9)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Experience authentic cuisine in an elegant atmosphere';
