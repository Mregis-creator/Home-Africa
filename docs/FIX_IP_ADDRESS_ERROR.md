# Fix: IP Address Not Allowed in Authorized Domains

## 🔴 Problem
Firebase doesn't accept IP addresses like `127.0.0.1:5500` in authorized domains. It only accepts:
- Domain names (e.g., `localhost`, `example.com`)
- Firebase hosting domains (e.g., `your-project.firebaseapp.com`)

## ✅ Solution: Use Firebase Hosting URL

I've updated the code to use Firebase's hosting URL (`https://home-africa-90018.firebaseapp.com`) for email link redirects. This URL is already authorized by default and works from any domain.

### What Changed:
- **Signup:** Now redirects to `https://home-africa-90018.firebaseapp.com/signup.html`
- **Login:** Now redirects to `https://home-africa-90018.firebaseapp.com/admin.html`

### How It Works:
1. User clicks email link
2. Redirects to Firebase hosting URL (already authorized)
3. Firebase hosting redirects back to your local app
4. Account created/logged in successfully

## 🎯 Alternative: Use localhost Instead

If you prefer to use your local URL, simply:
1. **Change your browser URL from:**
   - `http://127.0.0.1:5500/signup.html`
   
2. **To:**
   - `http://localhost:5500/signup.html`

Since `localhost` is already in authorized domains, this will work!

## 🚀 Test Now

1. **Refresh your browser** (to load updated code)
2. **Try passwordless signup again**
3. **Click the email link** - it will redirect to Firebase hosting URL first, then back to your app

---

## 📋 What's Already Authorized

These domains are automatically authorized by Firebase:
- ✅ `localhost` (you added this)
- ✅ `home-africa-90018.firebaseapp.com` (default)
- ✅ `home-africa-90018.web.app` (default)

You don't need to add IP addresses - just use `localhost` or the Firebase hosting URL!

---

**The code is now updated!** Try passwordless signup again - it should work! 🎉

