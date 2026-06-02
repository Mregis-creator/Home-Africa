-- Add profile_picture_url and ensure password_hash column exists
-- Run this in Supabase SQL Editor

-- Ensure password_hash column exists (for storing password hashes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN password_hash VARCHAR(255);
        
        COMMENT ON COLUMN users.password_hash IS 'Hashed password (use bcrypt or similar - NEVER store plain passwords)';
    END IF;
END $$;

-- Add profile_picture_url column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profile_picture_url'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN profile_picture_url TEXT;
        
        COMMENT ON COLUMN users.profile_picture_url IS 'URL of user profile picture stored in Supabase Storage';
    END IF;
END $$;

-- Also ensure bio column exists (if not already added)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN bio TEXT;
        
        COMMENT ON COLUMN users.bio IS 'User biography/description';
    END IF;
END $$;

-- Add temporary password columns for admin support (optional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'temp_password'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN temp_password TEXT;
        
        COMMENT ON COLUMN users.temp_password IS 'Temporary encrypted password for admin support (expires after 24 hours)';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'temp_password_expires'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN temp_password_expires TIMESTAMP;
        
        COMMENT ON COLUMN users.temp_password_expires IS 'Expiration time for temporary password';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('profile_picture_url', 'bio', 'password_hash', 'temp_password', 'temp_password_expires');

