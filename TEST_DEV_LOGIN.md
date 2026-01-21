# Test Dev Mode Login

## ✅ Current Status

Dev mode is **ENABLED** and should bypass Firebase Auth completely.

## 🧪 How to Test

1. **Clear browser cache/storage:**
   - Open browser console (F12)
   - Run: `localStorage.clear()`
   - Refresh page (F5)

2. **Go to admin.html**

3. **Enter dev credentials:**
   - Email: `admin@homeafrica.com`
   - Password: `admin123456`

4. **Click Login**

5. **Check browser console (F12):**
   - Should see: `🔧 Dev mode: Bypassing Firebase Auth with super admin credentials`
   - Should see: `✅ Dev mode login successful!`
   - Should NOT see any Firebase Auth errors

## 🔍 If You Still Get Errors

### Check Console:
1. Open browser console (F12)
2. Look for the dev mode messages
3. If you see Firebase Auth errors, the dev mode check might not be running

### Verify Dev Mode is Active:
Run this in console:
```javascript
console.log('DEV_MODE:', typeof DEV_MODE !== 'undefined' ? DEV_MODE : 'NOT DEFINED');
console.log('DEV_EMAIL:', typeof DEV_SUPER_ADMIN_EMAIL !== 'undefined' ? DEV_SUPER_ADMIN_EMAIL : 'NOT DEFINED');
```

### Manual Test:
If login button still doesn't work, try this in console:
```javascript
// Simulate dev login
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
```

---

**The dev mode should completely bypass Firebase Auth!** If you still see errors, check the console for details. 🚀

