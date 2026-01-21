-- Fix RLS Policies for Listings Table
-- Run this in Supabase SQL Editor if listings are not being inserted

-- Enable RLS (if not already enabled)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public inserts" ON listings;
DROP POLICY IF EXISTS "Allow public reads" ON listings;
DROP POLICY IF EXISTS "Allow public updates" ON listings;

-- Allow public inserts (for testing - you can restrict later)
CREATE POLICY "Allow public inserts"
ON listings
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public reads
CREATE POLICY "Allow public reads"
ON listings
FOR SELECT
TO public
USING (true);

-- Allow public updates (for view tracking, etc.)
CREATE POLICY "Allow public updates"
ON listings
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'listings';