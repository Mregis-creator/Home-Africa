# 🐛 Debug: Upload Stuck at 0%

## Quick Checks

### 1. **Open Browser Console (F12)**
Look for these messages:
- `🚀 Starting upload of X files...`
- `🔍 Checking if bucket "listings" exists...`
- `✅ Bucket "listings" exists, proceeding with upload...`
- `📤 Uploading 1/X: [filename]...`

**If you DON'T see these messages:**
- Supabase Storage might not be initialized
- Check if `js/supabase-config.js` is loaded
- Check if `js/supabase-storage.js` is loaded

### 2. **Check Network Tab**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try uploading
4. Look for requests to `supabase.co/storage/v1/object/`
5. Check if requests are:
   - **Pending** (stuck) → Network/CORS issue
   - **Failed** (red) → Check error message
   - **Success** (green) → Upload worked but progress not updating

### 3. **Common Issues**

#### Issue: No console messages at all
**Fix:** Check if scripts are loaded:
```html
<script src="js/supabase-config.js"></script>
<script src="js/supabase-storage.js"></script>
```

#### Issue: "Bucket not found"
**Fix:** Create bucket in Supabase Dashboard → Storage

#### Issue: "Permission denied" or "new row violates"
**Fix:** Create Storage policy:
1. Go to Supabase Dashboard → Storage → Policies
2. Create policy for INSERT operations
3. Allow `public` role

#### Issue: Upload starts but stuck at 0%
**Possible causes:**
1. **File too large** → Try smaller images (< 5MB each)
2. **Network slow** → Check internet connection
3. **CORS issue** → Check browser console for CORS errors
4. **Supabase Storage quota exceeded** → Check Supabase dashboard

### 4. **Test with Single Small Image**
Try uploading just ONE small image (< 1MB) to see if it works.

### 5. **Check Supabase Storage Status**
1. Go to Supabase Dashboard → Storage
2. Check if bucket `listings` exists
3. Check if there are any files uploaded
4. Check Storage usage/quota

---

## 🔍 What to Look For in Console

**Good signs:**
```
🚀 Starting upload of 3 files...
🔍 Checking if bucket "listings" exists...
✅ Bucket "listings" exists, proceeding with upload...
📤 Uploading 1/3: image1.jpg (2.5 MB) to listings/cars/[id]/...
📤 Upload progress: 0% (0/3)
📤 Upload progress: 33% (1/3)
✅ Uploaded 1/3: https://...
```

**Bad signs:**
```
❌ Upload error for image1.jpg: ...
⚠️ Bucket "listings" not found...
❌ Supabase client not initialized...
```

---

## 🚨 Still Stuck?

1. **Check browser console** (F12) for errors
2. **Check Network tab** for failed requests
3. **Try single small image** first
4. **Verify bucket exists** in Supabase Dashboard
5. **Check Storage policies** allow uploads

---

## Quick Test

Run this in browser console (F12):

```javascript
// Check Supabase Storage
if (window.supabaseStorage) {
  console.log('✅ Supabase Storage available');
  
  // Check bucket
  window.supabaseStorage.checkBucket('listings').then(exists => {
    console.log('Bucket exists:', exists);
  });
} else {
  console.error('❌ Supabase Storage not available');
}
```

