# Testing Firebase Authentication - Step by Step Guide

## 🎯 Testing Checklist

### Step 1: Enable Firebase Authentication (REQUIRED)
**Before testing, you MUST enable Email/Password authentication:**

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `home-africa-90018`
3. Click **Authentication** in left sidebar
4. Click **Get Started** (if first time)
5. Go to **Sign-in method** tab
6. Click on **Email/Password**
7. Enable **Email/Password** (toggle ON)
8. Click **Save**

### Step 2: Test Registration (signup.html)

1. **Open signup.html** in your browser (via Live Server)
2. **Fill out the form:**
   - Full Name: `Test Merchant`
   - Email: `test@example.com` (use a real email you can access)
   - Password: `test123456` (at least 6 characters)
   - Phone: `+250788123456` (optional)
   - Select at least one category (e.g., Apartments)

3. **Click "Sign Up Now"**
4. **Expected Results:**
   - ✅ Form submits successfully
   - ✅ Alert: "Account created successfully!"
   - ✅ Redirects to index.html or post.html
   - ✅ Check Firebase Console → Authentication → Users (should see new user)
   - ✅ Check Firestore → merchants collection (should see merchant document)

### Step 3: Test Admin Login (admin.html)

1. **Open admin.html** in your browser
2. **Login with registered merchant credentials:**
   - Email: `test@example.com` (the email you just registered)
   - Password: `test123456`

3. **Expected Results:**
   - ✅ Login succeeds
   - ✅ Admin panel appears
   - ✅ Merchant name shown in navbar
   - ✅ Dashboard loads with stats
   - ✅ Can access all tabs (Listings, Users, Merchants, Files, Analytics)

### Step 4: Test Access Denial (Non-Merchant)

1. **Try logging in with non-merchant email:**
   - Email: `random@example.com`
   - Password: `anypassword`

2. **Expected Results:**
   - ❌ Login fails OR
   - ✅ If email exists in Firebase Auth but not in merchants collection:
     - User authenticated but access denied
     - Message: "Access denied. Only registered merchants can access the admin panel."
     - User automatically logged out

### Step 5: Test Logout

1. **While logged in to admin panel:**
   - Click **Logout** button in navbar

2. **Expected Results:**
   - ✅ Logged out successfully
   - ✅ Login screen appears
   - ✅ Cannot access admin panel without re-login

## 🔍 Verification Steps

### Check Firebase Console

1. **Authentication → Users:**
   - Should see registered user with email
   - User ID should be visible
   - Email should be verified (if email verification enabled)

2. **Firestore → merchants collection:**
   - Should see merchant document
   - Document ID should match Firebase Auth user ID
   - Should contain: merchantName, merchantEmail, categories, etc.

### Check Browser Console

1. **Open browser DevTools (F12)**
2. **Check for errors:**
   - No Firebase errors
   - No authentication errors
   - No network errors

3. **Check localStorage:**
   - `merchantRegistered: "true"`
   - `merchantName: "Test Merchant"`
   - `merchantEmail: "test@example.com"`
   - `merchantId: "firebase-user-id"`

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/operation-not-allowed)"
**Solution:** Email/Password authentication not enabled in Firebase Console
- Go to Firebase Console → Authentication → Sign-in method
- Enable Email/Password

### Error: "Access denied" after successful login
**Solution:** Merchant document not created in Firestore
- Check Firestore → merchants collection
- If missing, registration may have failed
- Try registering again

### Error: "Email already in use"
**Solution:** User already exists
- Use different email
- Or sign in instead of signing up

### Login works but admin panel doesn't load
**Solution:** Check browser console for errors
- Verify Firebase config is correct
- Check network tab for failed requests
- Ensure all scripts are loaded

### Can't see merchant in Firestore
**Solution:** Check Firestore rules
- May need to adjust security rules
- Or check if document was created with different structure

## ✅ Success Criteria

**Registration is successful if:**
- ✅ User created in Firebase Authentication
- ✅ Merchant document created in Firestore
- ✅ Redirects to next page
- ✅ No errors in console

**Login is successful if:**
- ✅ User authenticated with Firebase Auth
- ✅ Merchant verified in Firestore
- ✅ Admin panel loads
- ✅ Merchant name shown in navbar
- ✅ Can access all features

## 🚀 Quick Test Script

Run this in browser console after registration to verify:

```javascript
// Check Firebase Auth
firebase.auth().currentUser ? console.log('✅ Authenticated:', firebase.auth().currentUser.email) : console.log('❌ Not authenticated');

// Check Firestore merchant
const db = firebase.firestore();
const userId = firebase.auth().currentUser?.uid;
if (userId) {
  db.collection('merchants').doc(userId).get().then(doc => {
    if (doc.exists) {
      console.log('✅ Merchant found:', doc.data());
    } else {
      console.log('❌ Merchant not found');
    }
  });
}
```

---

**Ready to test!** Start with Step 1 (enable Firebase Authentication) and work through each step. Let me know if you encounter any issues! 🚀

