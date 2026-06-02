-- ============================================
-- SIMPLE Storage Setup - Copy & Paste This
-- ============================================

-- Make sure bucket is public
UPDATE storage.buckets
SET public = true
WHERE name = 'listings';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Allow public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'listings');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Check bucket status
SELECT name, public FROM storage.buckets WHERE name = 'listings';
