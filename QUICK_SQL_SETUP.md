# 🚀 Quick SQL Setup for Supabase Storage

## Step-by-Step Guide

### Step 1: Open SQL Editor
1. Go to **Supabase Dashboard**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Run the SQL Script
1. Copy the contents of `SETUP_STORAGE_POLICIES.sql`
2. Paste into SQL Editor
3. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify Bucket Exists
**Important:** Before running SQL, make sure the bucket exists:

1. Go to **Storage** in left sidebar
2. Check if bucket `listings` exists
3. If NOT, create it:
   - Click **"New bucket"**
   - Name: `listings`
   - Public: ✅ **Yes**
   - Click **"Create bucket"**

### Step 4: Check Results
After running SQL, you should see:
- ✅ Policies created successfully
- ✅ Bucket info showing `public = true`

### Step 5: Test Upload
1. Refresh `post.html` in your browser
2. Try uploading images again
3. Should work now! ✅

---

## 🔍 If You Still Get CORS Errors

Supabase Storage CORS is **automatic** - no SQL needed. If you still see CORS errors:

1. **Check browser console** - What's the exact error?
2. **Check Network tab** - Is it a preflight (OPTIONS) request failing?
3. **Verify Supabase URL** - Make sure `js/supabase-config.js` has correct URL
4. **Check policies** - Run the SQL above to ensure policies exist

---

## 📝 What the SQL Does

1. **Sets bucket to public** - Allows public access
2. **Creates upload policy** - Allows anyone to upload to `listings` bucket
3. **Creates read policy** - Allows anyone to read from `listings` bucket
4. **Restricts folders** - Only allows uploads to `cars`, `apartments`, `land`, `test` folders

---

## 🚨 Common Issues

### Issue: "bucket not found"
**Fix:** Create bucket manually in Dashboard → Storage first

### Issue: "permission denied" after SQL
**Fix:** Make sure bucket is set to `public = true`

### Issue: Still getting CORS errors
**Fix:** 
- Check Supabase project URL is correct
- Try hard refresh (Ctrl+F5)
- Check browser console for exact error

---

**After running SQL, try uploading again!** 🎉

