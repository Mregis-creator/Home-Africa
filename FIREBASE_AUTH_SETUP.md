# Firebase Authentication Setup - HOME AFRICA

## ✅ What's Been Implemented

### 1. Firebase Authentication Integration
- **Admin Panel**: Now uses Firebase Authentication instead of simple localStorage
- **Signup Process**: Creates Firebase Auth users and stores merchant data in Firestore
- **Merchant Verification**: Only registered merchants can access the admin panel

### 2. Security Features
- ✅ Firebase Auth email/password authentication
- ✅ Merchant verification before admin panel access
- ✅ Automatic logout if user is not a registered merchant
- ✅ Secure session management

## How It Works

### Registration Flow (signup.html)
1. User fills out signup form
2. Firebase Auth creates user account with email/password
3. Merchant document created in Firestore `merchants` collection
4. Merchant data linked to Firebase Auth user via `userId` field
5. User can now login to admin panel

### Login Flow (admin.html)
1. User enters email/password
2. Firebase Auth authenticates user
3. System checks if user exists in `merchants` collection
4. If merchant exists → Access granted
5. If not a merchant → Access denied, user logged out

## Merchant Data Structure

Merchants are stored in Firestore `merchants` collection with:
```javascript
{
  merchantName: "John Doe",
  merchantEmail: "john@example.com",
  merchantContact: "+250788123456",
  email: "john@example.com", // For compatibility
  categories: ["apartment", "car", "land"],
  verified: false,
  rating: 0,
  totalReviews: 0,
  totalListings: 0,
  userId: "firebase-auth-uid", // Links to Firebase Auth user
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Access Control

### Who Can Access Admin Panel?
- ✅ Registered merchants (users who signed up via signup.html)
- ❌ Regular users (not registered as merchants)
- ❌ Unauthenticated users

### Verification Process
1. User authenticates with Firebase Auth
2. System checks `merchants` collection for user's email or userId
3. If found → Merchant verified → Access granted
4. If not found → Access denied → User logged out

## Firebase Console Setup

### Enable Email/Password Authentication
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `home-africa-90018`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

### Firestore Security Rules (Recommended)
Add these rules to protect merchant data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Merchants collection
    match /merchants/{merchantId} {
      // Users can read their own merchant data
      allow read: if request.auth != null && request.auth.uid == merchantId;
      // Only authenticated users can create merchant records
      allow create: if request.auth != null && request.auth.uid == merchantId;
      // Users can update their own merchant data
      allow update: if request.auth != null && request.auth.uid == merchantId;
      // Only admins can delete (add admin check)
      allow delete: if request.auth != null;
    }
    
    // Listings - merchants can manage their own listings
    match /{collection}/{listingId} {
      allow read: if true; // Public read
      allow write: if request.auth != null && 
                      resource.data.merchantId == request.auth.uid;
    }
  }
}
```

## Testing

### Test Registration
1. Go to `signup.html`
2. Fill out the form:
   - Name: Test Merchant
   - Email: test@example.com
   - Password: test123456
   - Select at least one category
3. Submit form
4. Check Firebase Console → Authentication → Users (should see new user)
5. Check Firestore → merchants collection (should see merchant document)

### Test Admin Login
1. Go to `admin.html`
2. Login with registered merchant credentials:
   - Email: test@example.com
   - Password: test123456
3. Should see admin panel
4. Try logging in with non-merchant email → Should be denied

## Migration Notes

### Existing Merchants
If you have existing merchants in localStorage:
1. They need to register again via signup.html to create Firebase Auth accounts
2. Or manually create Firebase Auth users and link them to merchant documents

### Backward Compatibility
- localStorage still used for some features (merchantName, merchantEmail)
- New system uses Firebase Auth as primary authentication
- Old localStorage data will be replaced on next signup/login

## Troubleshooting

### "Access denied" after login
- Check if merchant document exists in Firestore
- Verify email matches between Auth and Firestore
- Check browser console for errors

### "Email already in use"
- User already has Firebase Auth account
- They should sign in instead of signing up
- Or use different email

### Can't create account
- Check Firebase Console → Authentication is enabled
- Verify email/password format
- Check browser console for errors

## Next Steps

1. **Enable Firebase Authentication** in Firebase Console
2. **Set up Firestore Security Rules** (see above)
3. **Test registration and login**
4. **Migrate existing merchants** (if any)
5. **Add password reset functionality**
6. **Add email verification** (optional)

---

**Important**: Make sure to enable Email/Password authentication in Firebase Console before testing!

