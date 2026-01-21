# Enable Email Link (Passwordless) Authentication

## 🎯 What is Email Link Authentication?

Email link authentication (also called "magic links" or "passwordless sign-in") allows users to sign in by clicking a secure link sent to their email instead of entering a password.

**Benefits:**
- ✅ No password to remember
- ✅ More secure (link expires quickly)
- ✅ Better user experience
- ✅ Reduces password-related support issues

## 📋 Setup Steps

### Step 1: Enable Email Link in Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `home-africa-90018`
3. Click **Authentication** → **Sign-in method**
4. Click on **Email/Password** (or enable it if not already enabled)
5. Enable **Email link (passwordless sign-in)** toggle
6. Click **Save**

### Step 2: Configure Authorized Domains

1. In Firebase Console → Authentication → Settings
2. Scroll to **Authorized domains**
3. Add your domain (e.g., `localhost`, your production domain)
4. Default domains: `localhost`, `your-project.firebaseapp.com`, `your-project.web.app`

### Step 3: Test It!

1. **Test Registration:**
   - Go to `signup.html`
   - Select "Email Link (Passwordless)" option
   - Enter email and submit
   - Check email inbox
   - Click the link in email
   - Account created!

2. **Test Login:**
   - Go to `admin.html`
   - Select "Email Link" option
   - Enter email and submit
   - Check email inbox
   - Click the link in email
   - Logged in!

## 🔧 How It Works

### Registration Flow (Passwordless)
```
User enters email → Firebase sends email link → User clicks link → 
Account created → Merchant document created → Redirected to admin panel
```

### Login Flow (Passwordless)
```
User enters email → Firebase sends email link → User clicks link → 
Authenticated → Merchant verified → Admin panel access granted
```

## 📧 Email Link Format

The email link looks like:
```
https://home-africa-90018.firebaseapp.com/__/auth/action?mode=signIn&oobCode=ABC123...
```

When clicked, it redirects to your app with authentication token.

## ⚙️ Configuration

### Action Code Settings

The code uses these settings:
```javascript
const actionCodeSettings = {
  url: window.location.origin + '/admin.html', // Where to redirect after click
  handleCodeInApp: true // Open link in app if possible
};
```

### Customize Redirect URLs

**For Signup:**
- Edit `signup.html` → `actionCodeSettings.url`
- Change to your desired redirect page

**For Login:**
- Edit `admin.html` → `actionCodeSettings.url`
- Change to your desired redirect page

## 🔒 Security Features

- ✅ Links expire after 1 hour (default)
- ✅ One-time use links
- ✅ Domain verification required
- ✅ Secure token-based authentication

## 🐛 Troubleshooting

### "Email link authentication not enabled"
**Solution:** Enable it in Firebase Console → Authentication → Sign-in method → Email link

### "Invalid action code"
**Solution:** Link may have expired or been used. Request a new link.

### Email not received
**Solution:**
- Check spam folder
- Verify email address is correct
- Check Firebase Console → Authentication → Users for email status
- Ensure email provider isn't blocking Firebase emails

### Link doesn't work
**Solution:**
- Check authorized domains in Firebase Console
- Ensure link hasn't expired
- Check browser console for errors

## ✅ Testing Checklist

- [ ] Email link authentication enabled in Firebase Console
- [ ] Authorized domains configured
- [ ] Test registration with email link
- [ ] Test login with email link
- [ ] Verify merchant document created
- [ ] Verify admin panel access works
- [ ] Test link expiration (wait 1 hour)
- [ ] Test link reuse (should fail after first use)

## 🎉 Features Added

### Signup Page (signup.html)
- ✅ Toggle between Password and Email Link
- ✅ Passwordless registration option
- ✅ Email link sent to user
- ✅ Automatic account creation on link click

### Admin Panel (admin.html)
- ✅ Toggle between Password and Email Link
- ✅ Passwordless login option
- ✅ Email link sent to user
- ✅ Automatic login on link click

---

**Ready to use!** Enable Email Link authentication in Firebase Console and test it! 🚀

