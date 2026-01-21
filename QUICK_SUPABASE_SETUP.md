# ⚡ Quick Supabase Setup (5 Minutes)

## 🎯 Fast Track Setup

### 1. Create Account & Project (2 min)
1. Go to: https://supabase.com
2. Click **"Start your project"**
3. Sign up (GitHub/Google/Email)
4. Click **"New Project"**
5. Fill in:
   - Name: `home-africa`
   - Password: `[Create strong password]`
   - Region: `Europe West` (or closest)
   - Plan: **Free**
6. Click **"Create new project"**
7. Wait 2-3 minutes ⏳

### 2. Get Credentials (1 min)
1. Click **⚙️ Settings** (bottom left)
2. Click **"API"** in sidebar
3. Copy **Project URL** 📋
4. Copy **anon public** key 📋

### 3. Configure (1 min)
1. Open: `js/supabase-config.js`
2. Replace:
   ```javascript
   url: 'YOUR_SUPABASE_URL',
   anonKey: 'YOUR_SUPABASE_ANON_KEY'
   ```
3. With your actual values
4. Save file ✅

### 4. Create Database (1 min)
1. Click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open: `DATABASE_SCHEMA_WITH_AI.sql`
4. Copy ALL content
5. Paste in SQL Editor
6. Click **"Run"** ✅

### 5. Test (30 sec)
1. Open `index.html` in browser
2. Press `F12` → Console tab
3. Look for: ✅ `Supabase client initialized`
4. Click chatbot button → Should open! 🎉

---

## ✅ Done!

Your chatbot is now configured and ready!

**Need detailed help?** See `SUPABASE_SETUP_GUIDE.md`

