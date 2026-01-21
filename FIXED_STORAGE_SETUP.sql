-- ============================================
-- FIXED Storage Setup - Copy & Paste This
-- ============================================

-- Step 1: Make sure bucket is public
UPDATE storage.buckets
SET public = true
WHERE name = 'listings';

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Step 3: Create policy for public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'listings');

-- Step 4: Create policy for public reads
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Step 5: Verify bucket exists and is public
SELECT name, public 
FROM storage.buckets 
WHERE name = 'listings';

