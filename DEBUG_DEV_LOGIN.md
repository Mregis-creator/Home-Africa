# Debug Dev Mode Login

## 🔴 Current Error
```
Firebase: The supplied auth credential is incorrect, malformed or has expired. (auth/invalid-credential).
```

## 🔍 What to Check

### Step 1: Open Browser Console (F12)
When you click login, check the console for these messages:

**If dev mode is working, you should see:**
```
🔍 Dev mode check: {devMode: true, emailMatch: true, passwordMatch: true, ...}
🔧 Dev mode: Bypassing Firebase Auth with super admin credentials
✅ Dev mode login successful! Admin panel loaded.
```

**If dev mode is NOT working, you might see:**
```
🔍 Dev mode check: {emailMatch: false, passwordMatch: false, ...}
⚠️ Not dev credentials - will proceed with Firebase Auth
🔐 Using Firebase Auth for: admin@homeafrica.com
```

### Step 2: Verify Credentials
Make sure you're entering:
- **Email:** `admin@homeafrica.com` (exact, no spaces)
- **Password:** `admin123456` (exact, no spaces)

### Step 3: Check Dev Mode Status
Run this in console:
```javascript
console.log('DEV_MODE:', typeof DEV_MODE !== 'undefined' ? DEV_MODE : 'NOT DEFINED');
console.log('DEV_EMAIL:', typeof DEV_SUPER_ADMIN_EMAIL !== 'undefined' ? DEV_SUPER_ADMIN_EMAIL : 'NOT DEFINED');
console.log('DEV_PASSWORD:', typeof DEV_SUPER_ADMIN_PASSWORD !== 'undefined' ? '***' : 'NOT DEFINED');
```

## ✅ Quick Fix

If you see Firebase Auth errors, try this manual login in console:

```javascript
// Force dev login
currentUser = {
  uid: 'dev-super-admin-uid',
  email: 'admin@homeafrica.com',
  displayName: 'Super Admin (Dev)'
};
isSuperAdmin = true;
currentMerchant = {
  id: 'dev-super-admin-uid',
  merchantName: 'Super Admin (Dev)',
  merchantEmail: 'admin@homeafrica.com',
  superAdmin: true
};
showAdminPanel();
loadDashboard();
localStorage.setItem('devAutoLogin', 'true');
```

---

**Check the console messages to see what's happening!** The dev mode check now has detailed logging. 🚀

