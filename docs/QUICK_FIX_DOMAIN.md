# Quick Fix: Domain Not Allowlisted

## ⚡ Quick Solution (2 minutes)

### Step 1: Add localhost to Authorized Domains

1. **Go to Firebase Console:**
   - https://console.firebase.google.com
   - Select project: `home-africa-90018`

2. **Navigate to:**
   - Authentication → Settings → Authorized domains

3. **Add Domain:**
   - Click **Add domain**
   - Enter: `localhost`
   - Click **Add**

4. **If using Live Server (port 5500):**
   - Also add: `localhost:5500`

5. **Done!** Try passwordless signup again.

---

## 🔍 Check Your Current URL

Open browser console (F12) and check:
- What URL is shown in the error?
- What port is Live Server using?

Add that exact domain to authorized domains.

---

## ✅ That's It!

After adding `localhost` to authorized domains, the error should be gone. Try the passwordless signup again! 🚀

