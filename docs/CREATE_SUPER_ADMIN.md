# Create Super Admin Account

## 🎯 What is a Super Admin?

A Super Admin has **global access** to:
- ✅ All merchants (view, edit, delete)
- ✅ All users
- ✅ All listings (from all merchants)
- ✅ All files
- ✅ All analytics
- ✅ Platform-wide management

Regular merchants can only see their own data.

## 🔧 How to Create a Super Admin

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console:**
   - https://console.firebase.google.com
   - Select project: `home-africa-90018`

2. **Go to Firestore Database:**
   - Click **Firestore Database** in left sidebar
   - Click **Start collection** (if first time) or navigate to existing

3. **Create `superAdmins` Collection:**
   - Collection ID: `superAdmins`
   - Document ID: Use your Firebase Auth User ID (get it from Authentication → Users)
   - Add fields:
     ```
     email: "your-email@example.com" (string)
     createdAt: [timestamp]
     name: "Your Name" (string)
     ```

4. **OR Add Super Admin Flag to Existing Merchant:**
   - Go to `merchants` collection
   - Find your merchant document (by User ID)
   - Add field: `superAdmin: true` (boolean)

### Method 2: Using Browser Console (Quick)

1. **Login to admin panel** with your merchant account
2. **Open browser console** (F12)
3. **Run this code:**

```javascript
// Replace with your Firebase Auth User ID
const userId = firebase.auth().currentUser.uid;
const email = firebase.auth().currentUser.email;

// Create super admin document
firebase.firestore().collection('superAdmins').doc(userId).set({
  email: email,
  name: 'Super Admin',
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}).then(() => {
  console.log('✅ Super admin created! Refresh the page.');
});
```

### Method 3: Add Super Admin Flag to Merchant

1. **Login to admin panel**
2. **Open browser console** (F12)
3. **Run this code:**

```javascript
const userId = firebase.auth().currentUser.uid;

// Add superAdmin flag to your merchant document
firebase.firestore().collection('merchants').doc(userId).update({
  superAdmin: true
}).then(() => {
  console.log('✅ Super admin flag added! Refresh the page.');
});
```

## ✅ Verify Super Admin Status

After creating super admin:

1. **Refresh admin panel** (F5)
2. **Check navbar** - should show:
   - "SUPER ADMIN PANEL" (instead of "MERCHANT ADMIN PANEL")
   - "🛡️ SUPER ADMIN" badge (yellow/gold color)

3. **Check dashboard** - should show:
   - All listings from all merchants
   - All users
   - All merchants
   - Global statistics

## 🎯 Super Admin Features

### What Super Admins Can Do:
- ✅ View ALL listings (not just their own)
- ✅ View ALL merchants
- ✅ View ALL users
- ✅ Delete any listing
- ✅ Delete any merchant
- ✅ Delete any user
- ✅ Edit any listing
- ✅ Access all analytics
- ✅ Manage platform-wide settings

### What Regular Merchants Can Do:
- ❌ Only see their own listings
- ❌ Only see their own data
- ❌ Cannot access other merchants' data

## 🔒 Security Note

**Important:** Super admin status is checked on every page load. Make sure to:
- Keep super admin credentials secure
- Only grant super admin to trusted administrators
- Regularly audit super admin access

---

**After creating super admin, refresh the admin panel and you'll see global access!** 🚀

