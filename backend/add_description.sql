-- Run this in your Supabase SQL Editor to add the description column
-- This allows the landing page to dynamically pull the restaurant description.

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Experience authentic cuisine in an elegant atmosphere';
