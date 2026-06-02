# 🚀 Supabase Setup Guide - Step by Step

## 📋 Prerequisites
- A web browser (Chrome, Firefox, Edge, etc.)
- An email address (for account creation)
- 10-15 minutes

---

## Step 1: Create Supabase Account

1. **Go to Supabase Website**
   - Visit: https://supabase.com
   - Click **"Start your project"** or **"Sign Up"** (top right)

2. **Sign Up Options**
   - You can sign up with:
     - GitHub account (recommended - fastest)
     - Email address
     - Google account
   
3. **Complete Registration**
   - If using email: Enter your email and create a password
   - Verify your email (check inbox)
   - Accept terms of service

---

## Step 2: Create a New Project

1. **After Login**
   - You'll see the Supabase dashboard
   - Click **"New Project"** button (green button, top right)

2. **Project Details**
   Fill in the form:
   
   - **Name:** `home-africa` (or any name you prefer)
   - **Database Password:** 
     - Create a STRONG password (save this!)
     - Must be at least 8 characters
     - Include uppercase, lowercase, numbers, and symbols
     - Example: `HomeAfrica2025!Secure`
   - **Region:** 
     - Choose closest to Rwanda (e.g., `Europe West` or `Southeast Asia`)
     - This affects database speed
   
   - **Pricing Plan:** 
     - Select **"Free"** (perfect for starting out)
     - Free tier includes:
       - 500MB database
       - 2GB bandwidth
       - 50,000 monthly active users
       - Unlimited API requests

3. **Create Project**
   - Click **"Create new project"**
   - ⏳ Wait 2-3 minutes for project to initialize
   - You'll see a loading screen

---

## Step 3: Get Your Credentials

Once your project is ready:

1. **Go to Project Settings**
   - Click the **⚙️ Settings** icon (bottom left sidebar)
   - Or click **"Project Settings"** in the left menu

2. **Navigate to API**
   - In Settings, click **"API"** in the left sidebar
   - You'll see your API credentials

3. **Copy These Values:**
   
   **a) Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   - Look for "Project URL" section
   - Click the copy icon 📋 next to it
   - Example: `https://abcdefghijklmnop.supabase.co`

   **b) anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   - Look for "Project API keys" section
   - Find **"anon public"** key
   - Click the copy icon 📋
   - ⚠️ **Important:** Use the `anon public` key, NOT the `service_role` key

---

## Step 4: Configure Your Project

### Option A: Update Configuration File (Recommended)

1. **Open the Config File**
   - Navigate to: `js/supabase-config.js`
   - Open it in your code editor

2. **Replace the Placeholder Values**
   
   Find this section:
   ```javascript
   const SUPABASE_CONFIG = {
     url: 'YOUR_SUPABASE_URL', // e.g., 'https://xxxxx.supabase.co'
     anonKey: 'YOUR_SUPABASE_ANON_KEY' // Your anon/public key
   };
   ```

   Replace with your actual values:
   ```javascript
   const SUPABASE_CONFIG = {
     url: 'https://abcdefghijklmnop.supabase.co', // Your Project URL
     anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Your anon public key
   };
   ```

3. **Save the File**
   - Save `js/supabase-config.js`
   - Make sure there are no extra spaces or quotes

### Option B: Verify Configuration

After updating, your file should look like this:
```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-long-key-here'
};
```

---

## Step 5: Set Up Database Schema

1. **Open SQL Editor**
   - In Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button

2. **Copy Database Schema**
   - Open the file: `DATABASE_SCHEMA_WITH_AI.sql`
   - Select ALL the content (Ctrl+A / Cmd+A)
   - Copy it (Ctrl+C / Cmd+C)

3. **Paste and Run**
   - Go back to Supabase SQL Editor
   - Paste the SQL code (Ctrl+V / Cmd+V)
   - Click **"Run"** button (or press Ctrl+Enter)
   - ⏳ Wait 10-30 seconds for execution

4. **Verify Success**
   - You should see: ✅ "Success. No rows returned"
   - If you see errors, check the error message

5. **Verify Tables Created**
   - Click **"Table Editor"** in left sidebar
   - You should see tables:
     - ✅ users
     - ✅ merchants
     - ✅ listings
     - ✅ bookings
     - ✅ reviews
     - ✅ transactions
     - ✅ chat_conversations
     - ✅ chat_messages
     - ✅ ai_knowledge_base
     - ✅ ai_training_data
     - ✅ ai_analytics

---

## Step 6: Test Your Configuration

1. **Open Your Website**
   - Open `index.html` in your browser
   - Or serve it via a local server

2. **Check Browser Console**
   - Press `F12` to open Developer Tools
   - Go to **"Console"** tab
   - Look for: ✅ `Supabase client initialized`
   - If you see errors, check the error message

3. **Test Chatbot**
   - Click the chatbot button (bottom right)
   - Or click "AI Assistant" in navbar
   - Or click the genius sticker near footer
   - The chatbot should open

4. **Test Database Connection**
   - In browser console, type:
   ```javascript
   window.supabaseClient
   ```
   - Should return: `SupabaseClient {url: "...", key: "..."}`
   - If `null`, check your configuration

---

## 🐛 Troubleshooting

### Problem: "Supabase not configured" error
**Solution:**
- Check `js/supabase-config.js` has correct values
- Make sure URL starts with `https://`
- Make sure anon key is the full long string
- Check for extra spaces or quotes

### Problem: "Failed to fetch" error
**Solution:**
- Verify your Project URL is correct
- Check if project is active in Supabase dashboard
- Make sure you're using `anon public` key, not `service_role`

### Problem: SQL script fails
**Solution:**
- Check error message in SQL Editor
- Make sure you copied the ENTIRE SQL file
- Try running sections one at a time
- Check if tables already exist (delete them first)

### Problem: Chatbot not appearing
**Solution:**
- Check browser console for JavaScript errors
- Verify scripts are loaded (check Network tab)
- Make sure `js/supabase-config.js` is loaded before `js/ai-chatbot.js`
- Check file paths are correct

### Problem: "Row Level Security" errors
**Solution:**
- RLS is enabled by default
- For testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
  ```
  (Re-enable after testing!)

---

## ✅ Verification Checklist

- [ ] Supabase account created
- [ ] Project created and initialized
- [ ] Project URL copied
- [ ] anon public key copied
- [ ] `js/supabase-config.js` updated with credentials
- [ ] Database schema SQL executed successfully
- [ ] Tables visible in Table Editor
- [ ] Browser console shows "Supabase client initialized"
- [ ] Chatbot opens when clicked
- [ ] No errors in browser console

---

## 📸 Visual Guide

### Finding Your Credentials:

```
Supabase Dashboard
├── ⚙️ Settings (bottom left)
    ├── API
        ├── Project URL: [Copy this]
        └── Project API keys
            └── anon public: [Copy this]
```

### SQL Editor Location:

```
Supabase Dashboard
├── SQL Editor (left sidebar)
    └── New query
        └── Paste SQL → Run
```

---

## 🔒 Security Notes

1. **Never commit credentials to Git**
   - Add `js/supabase-config.js` to `.gitignore`
   - Or use environment variables

2. **anon public key is safe**
   - It's designed to be public
   - It has Row Level Security (RLS) protection
   - Don't share `service_role` key (keep it secret!)

3. **Database Password**
   - Save it securely (password manager)
   - You'll need it for direct database access

---

## 🎯 Next Steps After Configuration

1. **Add Sample Data**
   - Insert some test listings
   - Add FAQs to knowledge base
   - Test chatbot functionality

2. **Configure RLS Policies**
   - Set up proper security rules
   - Test with different user roles

3. **Set Up Authentication** (Optional)
   - Configure Supabase Auth
   - Add user login/signup

4. **Deploy**
   - Deploy your website
   - Update Supabase URL if needed
   - Test in production

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Supabase GitHub:** https://github.com/supabase/supabase

---

## 🎉 Success!

Once configured, you'll have:
- ✅ Database ready for listings
- ✅ AI chatbot ready to use
- ✅ Real-time capabilities
- ✅ Scalable infrastructure

**Your chatbot is now ready to help your customers!** 🚀

---

**Last Updated:** January 2025

