# 🐛 Debug: Car Not Appearing in Supabase

## 🔍 **Troubleshooting Steps**

### **1. Check Browser Console**
Open browser console (F12) and look for:
- ✅ "🚀 Attempting to save car listing to Supabase"
- ✅ "✅ Listing saved to Supabase"
- ❌ Any error messages

### **2. Common Issues**

#### **Issue 1: RLS (Row Level Security) Policy**
Supabase might be blocking inserts due to RLS policies.

**Fix:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Check `listings` table policies
3. Ensure there's an INSERT policy that allows inserts

**Quick Fix SQL:**
```sql
-- Allow public inserts to listings table (for testing)
CREATE POLICY "Allow public inserts"
ON listings
FOR INSERT
TO public
WITH CHECK (true);
```

#### **Issue 2: Missing Required Fields**
Check if all required fields are present:
- `type` ✅
- `title` ✅
- `price` ✅

#### **Issue 3: Merchant ID Foreign Key**
If `merchant_id` is set but doesn't exist, insert might fail.

**Fix:** The code now handles null merchant_id, but check if your schema allows it:
```sql
-- Check if merchant_id can be null
ALTER TABLE listings 
ALTER COLUMN merchant_id DROP NOT NULL;
```

#### **Issue 4: Location Field Format**
Location should be JSONB format.

**Current Fix:** Code now handles both string and object formats.

---

## 🔧 **Quick Debug Steps**

1. **Open Browser Console** (F12)
2. **Post a car** and watch console
3. **Look for:**
   - "🚀 Attempting to save car listing to Supabase"
   - "📝 Inserting listing record"
   - "✅ Listing created in Supabase" OR error message

4. **If you see an error:**
   - Copy the error message
   - Check Supabase Dashboard → Logs
   - Check RLS policies

---

## ✅ **What Was Fixed**

1. ✅ Added better error logging
2. ✅ Made merchant_id optional (can be null)
3. ✅ Fixed location field handling
4. ✅ Added detailed console logs

---

## 🚀 **Next Steps**

1. **Try posting a car again**
2. **Check browser console** for detailed logs
3. **Share any error messages** you see
4. **Check Supabase Dashboard → Table Editor** for the listing

---

**The code has been updated with better error handling. Try posting again and check the console!**

