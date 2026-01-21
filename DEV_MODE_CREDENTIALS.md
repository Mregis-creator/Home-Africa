# Development Mode - Default Credentials

## 🚀 Quick Access for Development

### Default Super Admin Credentials:
- **Email:** `admin@homeafrica.com`
- **Password:** `admin123456`

### How to Use:
1. Go to `admin.html`
2. Enter the credentials above
3. Click "Login"
4. **Instant super admin access!** No Firebase Auth needed in dev mode

## ⚙️ Features

- ✅ **Instant Login** - No need to wait for Firebase Auth
- ✅ **Super Admin Access** - Full platform access
- ✅ **Auto-Login** - Stays logged in until you logout
- ✅ **All Features** - Access to all merchants, users, listings

## 🔒 Security Note

**⚠️ IMPORTANT:** This is for **DEVELOPMENT ONLY**!

Before deploying to production:
1. Set `DEV_MODE = false` in `js/admin-panel.js`
2. Remove or change the default password
3. Remove the dev mode info banner

## 📝 Code Location

The dev mode settings are in `js/admin-panel.js`:

```javascript
const DEV_MODE = true; // Set to false in production
const DEV_SUPER_ADMIN_EMAIL = 'admin@homeafrica.com';
const DEV_SUPER_ADMIN_PASSWORD = 'admin123456';
```

## 🎯 What Happens

When you login with dev credentials:
1. Bypasses Firebase Authentication
2. Creates a mock super admin user
3. Grants full platform access
4. Saves login state in localStorage
5. Auto-logs in on next visit (until logout)

## 🔄 Disable Dev Mode

To disable dev mode:
1. Open `js/admin-panel.js`
2. Change `const DEV_MODE = true;` to `const DEV_MODE = false;`
3. Save and refresh

---

**Use these credentials for quick testing during development!** 🚀

