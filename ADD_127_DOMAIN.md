# Add 127.0.0.1:5500 to Firebase Authorized Domains

## 🎯 Your Current URL
`http://127.0.0.1:5500/signup.html`

## ✅ Step-by-Step Fix

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com
2. Select project: `home-africa-90018`

### Step 2: Navigate to Authorized Domains
1. Click **Authentication** in left sidebar
2. Click **Settings** tab (at the top, next to "Sign-in method")
3. Scroll down to **Authorized domains** section

### Step 3: Add Your Domain
1. Click **Add domain** button
2. Enter: `127.0.0.1:5500`
3. Click **Add**

### Step 4: Also Add localhost (Recommended)
While you're there, also add:
- `localhost` (if not already there)
- `localhost:5500` (for consistency)

This way it works whether you use `127.0.0.1` or `localhost`.

### Step 5: Save and Test
- Changes are saved automatically
- Go back to your browser
- Try passwordless signup again!

---

## 📋 What You Should See

After adding, your authorized domains should include:
- ✅ `localhost`
- ✅ `localhost:5500`
- ✅ `127.0.0.1:5500`
- ✅ `home-africa-90018.firebaseapp.com` (default)
- ✅ `home-africa-90018.web.app` (default)

---

## 🚀 After Adding Domain

1. Refresh your browser page (`http://127.0.0.1:5500/signup.html`)
2. Try passwordless signup again
3. The error should be gone!

---

**That's it!** Add `127.0.0.1:5500` to authorized domains and you're good to go! 🎉

