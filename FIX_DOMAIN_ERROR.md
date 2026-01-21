# Fix: Domain Not Allowlisted Error

## 🔴 Error Message
```
Firebase: Domain not allowlisted by project (auth/unauthorized-continue-uri).
```

## 🎯 What This Means
Firebase requires you to authorize domains that can receive email link redirects. Your current domain (localhost or your domain) is not in the authorized list.

## ✅ Solution: Add Domain to Firebase Console

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com
2. Select your project: `home-africa-90018`
3. Click **Authentication** in left sidebar
4. Click **Settings** tab (at the top)
5. Scroll down to **Authorized domains** section

### Step 2: Add Your Domain
You should see a list like:
- `localhost`
- `home-africa-90018.firebaseapp.com`
- `home-africa-90018.web.app`

**If `localhost` is NOT in the list:**
1. Click **Add domain** button
2. Enter: `localhost`
3. Click **Add**

**If you're testing on a different port (e.g., `localhost:5500`):**
- Add: `localhost:5500` (or whatever port Live Server uses)

**If you're deploying to a custom domain:**
- Add your production domain (e.g., `yourdomain.com`)

### Step 3: Save and Test Again
- Changes are saved automatically
- Try the passwordless signup/login again

## 🔧 Alternative: Update Code to Use Firebase Hosting URL

If you want to use Firebase's default redirect URL instead:

The code currently uses:
```javascript
url: window.location.origin + '/signup.html'
```

You can change it to use Firebase Hosting URL:
```javascript
url: 'https://home-africa-90018.firebaseapp.com/signup.html'
```

But **adding localhost to authorized domains is the better solution** for development.

## 📋 Quick Checklist

- [ ] Go to Firebase Console → Authentication → Settings
- [ ] Scroll to "Authorized domains"
- [ ] Add `localhost` if not present
- [ ] Add your Live Server port if needed (e.g., `localhost:5500`)
- [ ] Save changes
- [ ] Test passwordless signup again

## 🐛 Still Not Working?

### Check Your Current URL:
- Open browser DevTools (F12)
- Check Console for the exact URL being used
- Make sure that exact URL is in authorized domains

### Common Ports:
- Live Server (VS Code): Usually `localhost:5500` or `127.0.0.1:5500`
- Python http.server: Usually `localhost:8000`
- Other servers: Check your terminal for the port number

### Add Multiple Domains:
You can add multiple domains:
- `localhost`
- `localhost:5500`
- `127.0.0.1`
- `127.0.0.1:5500`
- Your production domain

---

**After adding localhost to authorized domains, try the passwordless signup again!** 🚀

