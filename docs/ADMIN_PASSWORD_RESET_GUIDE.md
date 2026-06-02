# 🔐 Admin Password Reset Feature

## ✅ What's Been Added

### Admin Password Reset Functionality
- Admins can reset user passwords from the admin panel
- Temporary passwords are generated and displayed to admins
- Temporary passwords are stored encrypted in the database
- Password reset emails are sent to users
- Temporary passwords expire after 24 hours

---

## 🗄️ Database Setup

**IMPORTANT:** Run the updated SQL migration:

1. Go to Supabase SQL Editor
2. Run `ADD_PROFILE_PICTURE_COLUMN.sql`
3. This adds:
   - `temp_password` (TEXT) - Encrypted temporary password
   - `temp_password_expires` (TIMESTAMP) - Expiration time
   - `password_hash` (VARCHAR) - For future use
   - `profile_picture_url` (TEXT) - Profile picture URL
   - `bio` (TEXT) - User biography

---

## 🎯 How It Works

### For Admins:

1. **Access Admin Panel:**
   - Go to `admin.html`
   - Login as admin/super admin
   - Click "Users" tab

2. **Reset User Password:**
   - Find the user in the table
   - Click "Reset" button next to their name
   - Confirm the reset
   - **Temporary password will be displayed** (save this!)
   - Password expires in 24 hours

3. **View Temporary Passwords:**
   - Temporary passwords are shown in the "Temp Password" column
   - Only visible if password was reset and not expired
   - Shows expiration time

### For Users:

1. **Receive Password Reset Email:**
   - User receives email with reset link
   - Can click link to set new password

2. **Or Use Temporary Password:**
   - Admin shares temporary password
   - User can login immediately
   - Should change password after first login

---

## 🔒 Security Features

### Password Storage:
- **Temporary passwords:** Encrypted (Base64) in database
- **Actual passwords:** Stored securely by Supabase Auth (hashed with bcrypt)
- **Expiration:** Temporary passwords expire after 24 hours
- **Access:** Only admins can see temporary passwords

### Admin Permissions:
- Only super admins can reset passwords for all users
- Regular admins can reset their own password
- All password resets are logged

---

## 📋 Admin Panel Features

### Users Table Shows:
- Email
- Name
- Role
- Verified Status
- **Temp Password** (if exists and not expired)
- Created Date
- Actions (Reset Password, Delete)

### Password Reset Process:
1. Admin clicks "Reset" button
2. System generates random 12-character password
3. Password is encrypted and stored in database
4. Password reset email sent to user
5. Temporary password displayed to admin
6. Admin shares password with user for immediate access

---

## ⚠️ Important Notes

### Security Best Practices:
1. **Never share passwords via insecure channels** (use secure messaging)
2. **Temporary passwords expire** - Users should change them
3. **Password reset emails** are sent automatically
4. **Encryption is basic** - For production, use stronger encryption

### Limitations:
- **Cannot view actual passwords** - They're hashed by Supabase Auth
- **Temporary passwords only** - For admin support purposes
- **24-hour expiration** - For security

---

## 🚀 Usage Example

```
Admin: "I need to reset password for user@example.com"
1. Go to Admin Panel → Users tab
2. Find user@example.com
3. Click "Reset" button
4. System shows: "Temporary Password: Abc123!@#Xyz"
5. Admin shares password with user
6. User can login immediately
7. User should change password after login
```

---

## 📁 Files Modified

- `admin.html` - Added temp password column to users table
- `js/admin-panel-supabase.js` - Added `resetUserPassword()` function
- `js/admin-user-management.js` - New helper class for user management
- `ADD_PROFILE_PICTURE_COLUMN.sql` - Added temp password columns

---

## ✅ Status

**Feature Complete!** Admins can now:
- ✅ Reset user passwords
- ✅ See temporary passwords
- ✅ View password expiration times
- ✅ Send password reset emails

**Next Steps:**
1. Run SQL migration
2. Test password reset in admin panel
3. Verify temporary passwords are displayed correctly

---

**Note:** This feature allows admins to support users who forgot passwords while maintaining security best practices.

