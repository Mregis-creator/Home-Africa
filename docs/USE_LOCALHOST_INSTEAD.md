# Fix: Use localhost Instead of 127.0.0.1

## 🔴 Problem
You clicked the email link and saw "Site Not Found" because Firebase hosting isn't set up yet.

## ✅ Solution: Use localhost

I've updated the code to automatically convert `127.0.0.1` to `localhost` in the redirect URL. Since `localhost` is already authorized in Firebase, this will work!

## 🎯 What You Need to Do

### Option 1: Use localhost URL (Recommended)
**Change your browser address from:**
```
http://127.0.0.1:5500/signup.html
```

**To:**
```
http://localhost:5500/signup.html
```

Then try passwordless signup again - the email link will now redirect to `localhost:5500` which is authorized!

### Option 2: Click the Email Link Again
If you already received an email, you can:
1. **Copy the link from the email**
2. **Replace `127.0.0.1` with `localhost`** in the URL
3. **Paste and go** in your browser

For example, if the link is:
```
http://127.0.0.1:5500/signup.html?email=...
```

Change it to:
```
http://localhost:5500/signup.html?email=...
```

## 🔄 How It Works Now

The code now automatically converts:
- `http://127.0.0.1:5500` → `http://localhost:5500`

So when you:
1. Access via `localhost:5500`
2. Request passwordless signup
3. Click email link
4. It redirects to `localhost:5500` (authorized!)
5. Account created successfully!

## ✅ Next Steps

1. **Change your browser URL to use `localhost` instead of `127.0.0.1`**
2. **Refresh the page**
3. **Try passwordless signup again**
4. **Click the email link** - it should work now!

---

**The code is updated!** Just use `localhost` instead of `127.0.0.1` and everything will work! 🎉

