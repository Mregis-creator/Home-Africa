# 🔧 Quick Fix: "Bucket not found" Error

## The Problem
You're seeing: `Upload failed: Failed to upload [filename]: Bucket not found`

This means the Supabase Storage bucket `listings` doesn't exist yet.

---

## ✅ Solution (2 minutes)

### Step 1: Create the Bucket

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: **home-africa**

2. **Navigate to Storage**
   - Click **"Storage"** in the left sidebar
   - You should see a list of buckets (or empty if none exist)

3. **Create New Bucket**
   - Click the **"New bucket"** button (top right)
   - **Bucket name:** `listings` (exactly this name, lowercase)
   - **Public bucket:** ✅ **Check this box** (important!)
   - Click **"Create bucket"**

### Step 2: Set Storage Policies (Important!)

After creating the bucket, you need to allow uploads:

1. **Go to Storage → Policies**
2. Click **"New Policy"**
3. Choose **"For full customization"**
4. **Policy name:** `Allow public uploads`
5. **Allowed operation:** `INSERT`
6. **Target roles:** `public`
7. **USING expression:** Leave empty or use: `bucket_id = 'listings'`
8. **WITH CHECK expression:** `bucket_id = 'listings'`
9. Click **"Review"** then **"Save policy"**

**OR use SQL Editor:**

Go to **SQL Editor** and run:

```sql
-- Allow public uploads to listings bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'listings');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');
```

### Step 3: Test

1. **Refresh** `post.html` in your browser
2. Try uploading images again
3. Should work now! ✅

---

## 🔍 Verify Bucket Exists

After creating, you should see:
- Bucket name: `listings`
- Public: ✅ Yes
- Size: 0 B (empty)

---

## 🚨 Still Getting Error?

1. **Check bucket name** - Must be exactly `listings` (lowercase)
2. **Check it's public** - Public bucket should be checked
3. **Check policies** - Make sure upload policy exists
4. **Refresh page** - Hard refresh (Ctrl+F5)

---

## 📸 Visual Guide

1. **Storage page** → See "New bucket" button
2. **Create bucket** → Name: `listings`, Public: ✅
3. **Policies tab** → Create upload policy
4. **Done!** → Try uploading again

---

**That's it! Once the bucket is created, uploads will work!** 🎉

