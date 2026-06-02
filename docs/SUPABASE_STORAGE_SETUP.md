# 🚀 Supabase Storage Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: **home-africa**

2. **Create Bucket**
   - Click **"Storage"** in left sidebar
   - Click **"New bucket"** button
   - **Name:** `listings`
   - **Public bucket:** ✅ **Yes** (so images are accessible via URL)
   - Click **"Create bucket"**

### Step 2: Set Storage Policies (Optional but Recommended)

Go to **Storage → Policies** and create:

**Policy 1: Allow public reads**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');
```

**Policy 2: Allow authenticated uploads**
```sql
CREATE POLICY "Authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');
```

**Policy 3: Allow uploads (temporary - for testing)**
```sql
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'listings');
```

Click **"Save"** for each policy.

---

## ✅ Test It

1. Open `post.html` in your browser
2. Try uploading a car with images
3. Check browser console (F12) for upload progress
4. Images should upload to Supabase Storage!

---

## 📁 File Structure

Images will be stored as:
```
listings/
  ├── cars/
  │   └── [listingId]/
  │       ├── [timestamp]_0.jpg
  │       ├── [timestamp]_1.jpg
  │       └── [timestamp]_2.jpg
  ├── apartments/
  │   └── [listingId]/
  └── land/
      └── [listingId]/
```

---

## 🔍 Verify Upload

After uploading, check:
1. Supabase Dashboard → Storage → `listings` bucket
2. You should see your uploaded images
3. Click on an image to see its public URL

---

## 🎯 Benefits Over Firebase Storage

✅ **No separate setup** - Already using Supabase  
✅ **Better integration** - Same platform as database  
✅ **Easier management** - One dashboard for everything  
✅ **PostgreSQL metadata** - Can query file info  
✅ **Free tier** - 1GB storage + 2GB bandwidth  

---

**That's it! You're ready to upload images to Supabase Storage!** 🎉

