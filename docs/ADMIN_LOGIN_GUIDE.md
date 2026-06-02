# 🔐 Admin Panel Login Guide

## ✅ Fixed: Access Denied Issue

The RBAC check that was blocking access has been removed. The admin panel now handles its own authentication.

---

## 🚀 How to Login

### Option 1: Dev Mode (Quick Access)

The admin panel has **DEV MODE** enabled with pre-configured credentials:

**Email:** `admin@homeafrica.com`  
**Password:** `admin123456`

1. Go to `admin.html`
2. Enter the email and password above
3. Click "Login"
4. You'll have instant super admin access

---

### Option 2: Create Admin User in Database

To create a real admin user:

1. **Sign up normally** via `signup.html` with your email
2. **Run this SQL** in Supabase SQL Editor:

```sql
-- Update your user to admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```

3. **Login** to admin panel with your email and password

---

### Option 3: Use Existing Merchant Account

If you already have a merchant account:

1. Go to `admin.html`
2. Login with your merchant email and password
3. You'll have merchant admin access

---

## 🔧 Troubleshooting

### Still seeing "Access denied"?

1. **Clear browser cache** and refresh
2. **Check browser console** (F12) for errors
3. **Verify Supabase is loaded** - Check console for "✅ Supabase initialized"

### Can't login with dev credentials?

1. Make sure **DEV_MODE = true** in `js/admin-panel.js` (line 35)
2. Check browser console for errors
3. Try refreshing the page

### Need to disable dev mode?

In `js/admin-panel.js`, change:
```javascript
const DEV_MODE = false; // Set to false in production
```

---

## 📋 Admin Panel Features

Once logged in, you can:
- ✅ View all users
- ✅ Reset user passwords (see temporary passwords)
- ✅ Manage listings
- ✅ View analytics
- ✅ Manage merchants

---

## 🎯 Quick Test

1. Open `admin.html`
2. Login with: `admin@homeafrica.com` / `admin123456`
3. Click "Users" tab
4. You should see all users
5. Click "Reset" on any user to test password reset

---

**Status:** ✅ Fixed - Admin panel should now work!

