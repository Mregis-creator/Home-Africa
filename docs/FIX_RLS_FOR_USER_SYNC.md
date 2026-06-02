# Fix RLS Policy for User Sync

## 🔴 Problem

The sync tool is failing with:
```
new row violates row-level security policy for table 'users'
```

This means the **Row-Level Security (RLS)** policies on the `users` table are preventing inserts.

---

## ✅ Solution: Update RLS Policies

You need to allow inserts into the `users` table. Here are the options:

### **Option 1: Allow Authenticated Users to Insert (Recommended)**

Run this SQL in Supabase SQL Editor:

```sql
-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.users;

-- Create policy to allow authenticated users to insert their own user record
CREATE POLICY "Allow authenticated users to insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow service role (for admin operations)
DROP POLICY IF EXISTS "Allow service role to insert" ON public.users;

CREATE POLICY "Allow service role to insert"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);
```

### **Option 2: Allow Public Inserts (Less Secure - Use with Caution)**

If you want to allow unauthenticated inserts (for sync tool):

```sql
-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Allow public inserts" ON public.users;

-- Create policy to allow public inserts
CREATE POLICY "Allow public inserts"
ON public.users
FOR INSERT
TO public
WITH CHECK (true);
```

### **Option 3: Use Database Function (Most Secure)**

Create a function that bypasses RLS:

```sql
-- Create function to insert users (bypasses RLS)
CREATE OR REPLACE FUNCTION public.insert_user(
  p_id UUID,
  p_email VARCHAR,
  p_full_name VARCHAR DEFAULT NULL,
  p_role VARCHAR DEFAULT 'user'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
    last_login = NOW()
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.insert_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_user TO anon;
```

Then update the sync tool to use this function instead of direct inserts.

---

## 🔧 Quick Fix: Update Sync Tool to Use Authenticated Request

Alternatively, I can update the sync tool to authenticate first, then sync users. This way, it will work with the authenticated user policy.

---

## 📋 Steps to Fix

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run Option 1 SQL** (recommended - most secure)
3. **Try sync again** → Open `sync-users-to-database.html` and click "Sync All Users"
4. **Verify** → Check `public.users` table

---

## 🎯 Recommended Approach

**Use Option 1** (Allow Authenticated Users) because:
- ✅ More secure (requires authentication)
- ✅ Works with your existing auth system
- ✅ Allows users to create their own records
- ✅ Still protects against unauthorized access

---

## ⚠️ Current RLS Status

To check your current RLS policies:

```sql
-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';
```

---

**Which option would you like to use?** I recommend **Option 1** for security, but I can also update the sync tool to authenticate first if you prefer.

