# 🔐 Password Storage Information

## Current Setup

### Supabase Auth (Primary Authentication)
- **Location:** `auth.users` table (managed by Supabase)
- **Security:** Passwords are automatically hashed using bcrypt
- **Access:** Not directly accessible (Supabase handles this securely)
- **Status:** ✅ Active and working

### Users Table (Public Schema)
- **Column:** `password_hash VARCHAR(255)`
- **Purpose:** For reference/backup or custom authentication
- **Status:** Column exists in schema, but currently not populated

---

## ⚠️ Important Security Notes

1. **Never store plain passwords** - Always hash them using bcrypt or similar
2. **Supabase Auth is secure** - It handles password hashing automatically
3. **Password hashes are not exposed** - Supabase Auth doesn't allow access to password hashes

---

## Options for Storing Passwords in Users Table

### Option 1: Store Hashed Passwords During Signup (Recommended if needed)

If you want to store password hashes in the `users` table, you would need to:

1. Hash the password on the client side (using a library like `crypto-js` or `bcryptjs`)
2. Store the hash in `users.password_hash` during signup
3. Use this for custom authentication if needed

**⚠️ Warning:** Client-side hashing is less secure. Better to use a server-side function.

### Option 2: Use Supabase Edge Function (Most Secure)

Create a Supabase Edge Function that:
1. Receives the password during signup
2. Hashes it server-side
3. Stores it in `users.password_hash`

### Option 3: Keep Using Supabase Auth Only (Current - Recommended)

- Supabase Auth handles everything securely
- No need to store passwords in users table
- `password_hash` column can remain NULL

---

## Current Implementation

The signup process:
1. Creates user in Supabase Auth (password handled securely)
2. Syncs user data to `users` table (without password_hash)
3. Password is stored securely in `auth.users` by Supabase

---

## If You Want to Store Password Hashes

To store password hashes in the `users` table, you would need to:

1. **Add password hashing library** (e.g., `bcryptjs`):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js"></script>
   ```

2. **Update signup process** to hash password:
   ```javascript
   const passwordHash = bcrypt.hashSync(password, 10);
   // Store passwordHash in users.password_hash
   ```

3. **Update users table sync** in `js/auth.js`:
   ```javascript
   await supabase
     .from('users')
     .upsert({
       id: user.id,
       email: user.email,
       password_hash: passwordHash, // Add this
       // ... other fields
     });
   ```

---

## Recommendation

**Keep using Supabase Auth only** - it's secure and handles everything properly. The `password_hash` column in the users table can remain NULL or be used for other purposes.

If you need custom authentication later, consider using Supabase Edge Functions for secure password hashing.

---

## Database Migration

The `password_hash` column already exists in your schema. Run the migration to ensure it exists:

```sql
-- Already included in ADD_PROFILE_PICTURE_COLUMN.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

---

**Status:** ✅ Password column exists, Supabase Auth handles authentication securely

