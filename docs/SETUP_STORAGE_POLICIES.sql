-- ============================================
-- Supabase Storage Setup SQL Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the bucket (if it doesn't exist)
-- Note: You might need to create it manually in Dashboard first
-- But this ensures it's configured correctly

-- Step 2: Set bucket to public (if not already)
UPDATE storage.buckets
SET public = true
WHERE name = 'listings';

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Step 4: Create policy for public uploads (INSERT)
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'listings' AND
  (storage.foldername(name))[1] IN ('cars', 'apartments', 'land', 'test')
);

-- Step 5: Create policy for public reads (SELECT)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Step 6: Create policy for authenticated uploads (optional - for logged-in users)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- Step 7: Verify bucket exists and is public
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'listings';

-- ============================================
-- Notes:
-- 1. CORS is handled automatically by Supabase
-- 2. The CORS errors you see are likely due to missing policies
-- 3. After running this, try uploading again
-- ============================================

