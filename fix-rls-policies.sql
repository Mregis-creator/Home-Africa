    -- ============================================
    -- Fix RLS Policies for User Sync
    -- ============================================
    -- Run this SQL in Supabase SQL Editor to allow user syncing

    -- Step 1: Check if RLS is enabled (it should be)
    -- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Step 2: Drop existing insert policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.users;
    DROP POLICY IF EXISTS "Allow public inserts" ON public.users;
    DROP POLICY IF EXISTS "Allow service role to insert" ON public.users;

    -- Step 3: Create policy to allow authenticated users to insert
    -- This allows logged-in users to create their own user record
    CREATE POLICY "Allow authenticated users to insert"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    -- Step 4: Create policy to allow public inserts (for sync tool)
    -- WARNING: This is less secure but needed for the sync tool
    -- You can remove this after syncing if you want
    CREATE POLICY "Allow public inserts"
    ON public.users
    FOR INSERT
    TO public
    WITH CHECK (true);

    -- Step 5: Also allow updates for authenticated users
    DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.users;

    CREATE POLICY "Allow authenticated users to update"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- Step 6: Allow users to read their own data
    DROP POLICY IF EXISTS "Allow users to read own data" ON public.users;

    CREATE POLICY "Allow users to read own data"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

    -- Step 7: Allow public to read (for profile pages, etc.)
    DROP POLICY IF EXISTS "Allow public read" ON public.users;

    CREATE POLICY "Allow public read"
    ON public.users
    FOR SELECT
    TO public
    USING (true);

    -- ============================================
    -- Alternative: Create a secure function that bypasses RLS
    -- ============================================

    -- Create function to insert/update users (bypasses RLS)
    CREATE OR REPLACE FUNCTION public.sync_user(
    p_id UUID,
    p_email VARCHAR,
    p_full_name VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT 'user'
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_user_id UUID;
    BEGIN
    INSERT INTO public.users (id, email, full_name, role, created_at)
    VALUES (
        p_id,
        p_email,
        COALESCE(p_full_name, split_part(p_email, '@', 1)),
        p_role,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        role = COALESCE(EXCLUDED.role, users.role),
        last_login = NOW()
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
    END;
    $$;

    -- Grant execute permission to authenticated and anon
    GRANT EXECUTE ON FUNCTION public.sync_user(UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.sync_user(UUID, VARCHAR, VARCHAR, VARCHAR) TO anon;

    -- ============================================
    -- Sync existing users from auth.users
    -- ============================================
    -- This will sync all users from Supabase Auth to public.users

    INSERT INTO public.users (id, email, full_name, role, created_at)
    SELECT 
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        split_part(email, '@', 1)
    ) as full_name,
    COALESCE(raw_user_meta_data->>'role', 'user') as role,
    created_at
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    last_login = NOW();

    -- ============================================
    -- Verify the sync worked
    -- ============================================
    SELECT COUNT(*) as total_users FROM public.users;

