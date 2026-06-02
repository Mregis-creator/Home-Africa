# 🔧 Enable Firebase Storage - Step by Step Guide

## Problem
If image uploads are stuck at 0%, Firebase Storage might not be enabled or configured properly.

---

## ✅ Step 1: Enable Firebase Storage

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **home-africa-90018**

2. **Navigate to Storage**
   - In the left sidebar, click **"Storage"**
   - If you see "Get started" button, click it
   - If Storage is already enabled, skip to Step 2

3. **Start in Production Mode** (Recommended)
   - Choose **"Start in production mode"**
   - Click **"Next"**
   - Select your Cloud Storage location (choose closest to your users)
   - Click **"Done"**

---

## ✅ Step 2: Configure Storage Rules

1. **Go to Storage Rules**
   - In Firebase Console → Storage
   - Click on **"Rules"** tab

2. **Update Rules** (Copy and paste this):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images
    match /{allPaths=**} {
      allow read: if true; // Anyone can read
      allow write: if request.auth != null || 
                      request.resource.size < 10 * 1024 * 1024; // 10MB max, allow unauthenticated for now
    }
    
    // More secure: Only authenticated users can upload
    // match /{allPaths=**} {
    //   allow read: if true;
    //   allow write: if request.auth != null && 
    //                   request.resource.size < 10 * 1024 * 1024;
    // }
  }
}
```

3. **Click "Publish"**

---

## ✅ Step 3: Verify Storage Bucket Name

Your Firebase config should have:
```javascript
storageBucket: "home-africa-90018.appspot.com"
```

**Check this:**
1. Go to Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps"
3. Check the `storageBucket` value matches your config

---

## ✅ Step 4: Test Storage Connection

Open browser console (F12) and run:

```javascript
// Check if Firebase Storage is initialized
if (typeof firebase !== 'undefined' && firebase.storage) {
  console.log('✅ Firebase Storage is available');
  const storage = firebase.storage();
  console.log('Storage bucket:', storage.app.options.storageBucket);
} else {
  console.error('❌ Firebase Storage is NOT available');
}
```

---

## 🔍 Troubleshooting

### Issue: "Storage is not initialized"
**Solution:** Make sure `firebase-storage-compat.js` is loaded before using storage.

### Issue: "Permission denied"
**Solution:** Check Storage Rules (Step 2) - make sure write permissions are set.

### Issue: "Bucket not found"
**Solution:** Verify `storageBucket` in Firebase config matches your project.

### Issue: Upload hangs at 0%
**Possible causes:**
1. Storage not enabled → Follow Step 1
2. Storage rules blocking → Follow Step 2
3. Network issue → Check browser console for errors
4. File too large → Check file sizes (should be < 10MB each)

---

## 🚀 Quick Test

After enabling Storage, try uploading a small test image (under 1MB) to verify it works.

---

## 📝 Current Storage Config

Your current config in `post.html`:
```javascript
storageBucket: "home-africa-90018.appspot.com"
```

Make sure this matches your Firebase project!

---

**Need help?** Check browser console (F12) for specific error messages.

