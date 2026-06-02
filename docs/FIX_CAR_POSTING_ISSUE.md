# 🔧 Fix: Car Not Appearing in Supabase

## 🐛 **Problem**
You posted a car but it's not showing in Supabase `listings` table.

## 🔍 **Most Likely Cause: RLS Policies**

Supabase uses Row Level Security (RLS) which blocks inserts by default unless you create policies.

---

## ✅ **QUICK FIX - Run This SQL**

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Enable RLS (if not already)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public inserts" ON listings;
DROP POLICY IF EXISTS "Allow public reads" ON listings;
DROP POLICY IF EXISTS "Allow public updates" ON listings;

-- Allow public inserts
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

-- Allow public updates (for view tracking)
CREATE POLICY "Allow public updates"
ON listings
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
```

---

## 🔍 **Also Check: Foreign Key Constraint**

If `merchant_id` is required but you don't have a merchant, run:

```sql
-- Make merchant_id nullable (if needed)
ALTER TABLE listings 
ALTER COLUMN merchant_id DROP NOT NULL;
```

---

## 🧪 **Test Again**

1. **Run the SQL above** in Supabase
2. **Open browser console** (F12)
3. **Post a car** again
4. **Check console** for:
   - "🚀 Attempting to save car listing to Supabase"
   - "📝 Inserting listing record"
   - "✅ Listing created in Supabase" OR error message

5. **Check Supabase Dashboard** → Table Editor → `listings` table

---

## 📋 **What I Fixed in Code**

1. ✅ Added detailed error logging
2. ✅ Made merchant_id optional (only added if found)
3. ✅ Fixed location field handling
4. ✅ Added merchant info to metadata
5. ✅ Better error messages in console

---

## 🚀 **After Running SQL**

1. Try posting a car again
2. Check browser console for detailed logs
3. Check Supabase Dashboard → `listings` table
4. Share any errors you see if it still doesn't work

---

**Run the SQL fix above and try posting again!** 🚀

