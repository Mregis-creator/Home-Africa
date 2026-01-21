# 🔧 Fix CORS & 404 Errors in Supabase Storage

## The Problem
You're seeing:
- **404 errors** → Bucket or file path not found
- **CORS errors** → Cross-origin request blocked

---

## ✅ Solution

### Step 1: Verify Bucket Exists

1. Go to **Supabase Dashboard → Storage**
2. Check if bucket `listings` exists
3. If not, create it:
   - Click **"New bucket"**
   - Name: `listings`
   - Public: ✅ **Yes**
   - Click **"Create bucket"**

### Step 2: Fix CORS (Most Important!)

Supabase Storage needs CORS configured. Go to:

1. **Supabase Dashboard → Settings → API**
2. Scroll to **"CORS Configuration"** or **"Storage CORS"**
3. Add your domain:
   - `http://localhost`
   - `http://localhost:5500` (if using Live Server)
   - `http://127.0.0.1:5500`
   - Your production domain (if deployed)

**OR** use SQL to set CORS:

Go to **SQL Editor** and run:

```sql
-- Allow CORS for localhost
UPDATE storage.buckets
SET public = true,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE name = 'listings';
```

### Step 3: Set Storage Policies

Go to **Storage → Policies** and create:

**Policy 1: Allow public uploads**
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'listings');
```

**Policy 2: Allow public reads**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');
```

### Step 4: Check Supabase Project Settings

1. Go to **Settings → API**
2. Check **"Project URL"** matches your Supabase URL
3. Verify **"anon public key"** is correct in `js/supabase-config.js`

---

## 🔍 Debug Steps

### Check 1: Verify Bucket
Run in browser console (F12):
```javascript
window.supabaseStorage.checkBucket('listings').then(exists => {
  console.log('Bucket exists:', exists);
});
```

### Check 2: Test Upload Manually
```javascript
const file = new File(['test'], 'test.txt', { type: 'text/plain' });
window.supabaseStorage.supabase.storage
  .from('listings')
  .upload('test/test.txt', file)
  .then(console.log)
  .catch(console.error);
```

### Check 3: Check Network Request
In Network tab, click on a failed request:
- Check **"Request URL"** - should be `https://[project].supabase.co/storage/v1/object/listings/...`
- Check **"Response"** tab - what error message?
- Check **"Headers"** - is CORS header present?

---

## 🚨 Common Issues

### Issue: "Bucket not found" (404)
**Fix:** Create bucket in Supabase Dashboard → Storage

### Issue: CORS error
**Fix:** Add your domain to Supabase CORS settings

### Issue: "new row violates row-level security policy"
**Fix:** Create Storage policies (Step 3 above)

### Issue: File path issues
**Fix:** The code now sanitizes paths automatically

---

## ✅ After Fixing

1. **Refresh** your browser (hard refresh: Ctrl+F5)
2. **Clear cache** if needed
3. Try uploading again
4. Check Network tab - should see **200 OK** instead of errors

---

**The main issue is likely CORS configuration!** Make sure to add your localhost domain to Supabase CORS settings.

