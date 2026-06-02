# Sync Users to Database - Guide

## 🔍 Problem

You have **4 users in Supabase Auth** but the `public.users` table is **empty**. This happens because:

1. Users were created directly in Supabase Auth (not through your app)
2. The sync logic in `js/auth.js` only works for Firebase users
3. Users need to be synced to `public.users` table for the app to work properly

---

## ✅ Solution: Use the Sync Tool

I've created a sync tool at `sync-users-to-database.html` that will:

1. ✅ Fetch all known users from Supabase Auth
2. ✅ Check if they exist in `public.users` table
3. ✅ Create missing users in the database
4. ✅ Show you a summary of what was synced

---

## 🚀 How to Use

### **Step 1: Open the Sync Tool**

1. Open `sync-users-to-database.html` in your browser
2. You should see a page with a "Sync All Users" button

### **Step 2: Run the Sync**

1. Click the **"Sync All Users"** button
2. Wait for the sync to complete (a few seconds)
3. Check the results:
   - **New** = Users created in database
   - **Exists** = Users already in database
   - **Error** = Failed to sync

### **Step 3: Verify**

1. Go back to Supabase Dashboard
2. Check the `public.users` table
3. You should now see your users!

---

## 🔧 Manual Sync (Alternative)

If the sync tool doesn't work, you can manually sync users:

### **Option 1: Via Supabase Dashboard SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL (replace emails with your actual user emails):

```sql
-- Insert users manually
INSERT INTO public.users (id, email, full_name, role, created_at)
VALUES 
  (gen_random_uuid(), 'kigaliworld@gmail.com', 'Kigali World', 'user', NOW()),
  (gen_random_uuid(), 'guildpresident@davisc...', 'Guild President', 'user', NOW()),
  (gen_random_uuid(), 'rejoestes@gmail.com', 'Rejo Estes', 'user', NOW()),
  (gen_random_uuid(), 'imfuraregis@gmail.com', 'Imfura Regis', 'user', NOW())
ON CONFLICT (email) DO NOTHING;
```

### **Option 2: Via Supabase Table Editor**

1. Go to Supabase Dashboard → Table Editor → `public.users`
2. Click **"Insert"** button
3. Add each user manually:
   - **id**: Generate UUID (or use existing auth user ID)
   - **email**: User's email address
   - **full_name**: User's name (or email prefix)
   - **role**: `user` (or `merchant` if applicable)
   - **created_at**: Current timestamp

---

## 🔄 Auto-Sync on Login

To prevent this issue in the future, I can update the login flow to automatically sync users when they log in. This way:

- ✅ New users are automatically created in `public.users`
- ✅ Existing users are updated with latest info
- ✅ No manual sync needed

**Would you like me to implement auto-sync on login?**

---

## 📋 Database Schema

Make sure your `public.users` table has these columns:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  verified BOOLEAN DEFAULT false,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  pending_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

---

## 🎯 Next Steps

1. **Run the sync tool** → `sync-users-to-database.html`
2. **Verify users** → Check Supabase Dashboard
3. **Test login** → Try logging in with one of the synced users
4. **Enable auto-sync** → (Optional) I can add auto-sync on login

---

## ⚠️ Important Notes

- **User IDs**: The sync tool generates new UUIDs. If you need to match Supabase Auth user IDs exactly, you'll need to use the Supabase Admin API (serverless function).
- **Passwords**: Passwords are stored in Supabase Auth, not in `public.users`. The `password_hash` column is optional.
- **Roles**: Users are synced with `role: 'user'` by default. Update manually if needed.

---

## 🆘 Troubleshooting

### **"Supabase client not loaded"**
- Make sure `js/supabase-config.js` is configured correctly
- Check browser console for errors

### **"Permission denied"**
- Check RLS policies on `public.users` table
- Make sure your Supabase project allows inserts

### **"Users still not showing"**
- Check Supabase Dashboard → Table Editor → `public.users`
- Verify the sync completed successfully
- Try manual insert via SQL Editor

---

**Ready to sync?** Open `sync-users-to-database.html` and click "Sync All Users"! 🚀

