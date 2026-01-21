# Admin Panel Guide - HOME AFRICA

## Overview
The Admin Panel provides full CRUD (Create, Read, Update, Delete) operations for managing the HOME AFRICA platform.

## Current Setup

### File Storage
- **Location**: Firebase Storage
- **Bucket**: `home-africa-90018.appspot.com`
- **Structure**: 
  - `apartments/{listingId}_{timestamp}_{index}.{ext}`
  - `cars/{listingId}_{timestamp}_{index}.{ext}`
  - `land/{listingId}_{timestamp}_{index}.{ext}`

### Database
- **Platform**: Firebase Firestore
- **Collections**:
  - `apartmentListings` - Apartment listings
  - `carListings` - Car listings
  - `landListings` - Land plot listings
  - `merchants` - Merchant/user accounts

### CRUD Operations
Currently handled **client-side** through Firebase SDK. No backend server required.

## Admin Panel Features

### 1. Authentication
- **Default Credentials**:
  - Email: `admin@homeafrica.com`
  - Password: `admin123456`
- **⚠️ IMPORTANT**: Change these credentials in production!
- **Location**: `js/admin-panel.js` (lines 20-21)

### 2. Dashboard Stats
- Total Listings count
- Total Users count
- Total Merchants count
- Storage usage (approximate)

### 3. Listings Management
**Features**:
- View all listings (apartments, cars, land)
- Search/filter listings
- Edit listing details (title, price, status)
- Delete listings (removes from database AND storage)
- Toggle listing status (active/inactive)

**CRUD Operations**:
- **Read**: `loadListings()` - Fetches all listings from Firestore
- **Update**: `editListing()` - Updates listing in Firestore
- **Delete**: `deleteListing()` - Deletes listing and associated images

### 4. Users Management
**Features**:
- View all users/merchants
- Delete users (cascades to listings)
- View user verification status

**CRUD Operations**:
- **Read**: `loadUsers()` - Fetches users from merchants collection
- **Delete**: `deleteUser()` - Deletes user and all their listings

### 5. Merchants Management
**Features**:
- View all merchants
- Verify/unverify merchants
- Delete merchants
- View merchant ratings and listing counts

**CRUD Operations**:
- **Read**: `loadMerchants()` - Fetches merchants from Firestore
- **Update**: `verifyMerchant()` - Updates verification status
- **Delete**: `deleteMerchant()` - Deletes merchant and listings

### 6. File Storage Management
**Features**:
- View all uploaded files
- Filter by type (apartments, cars, land)
- Delete files from storage
- View file URLs

**CRUD Operations**:
- **Read**: `loadFiles()` - Extracts image URLs from listings
- **Delete**: `deleteFile()` - Deletes file from Storage and removes from listing

### 7. Analytics
**Features**:
- Listings by type chart (doughnut)
- User growth chart (bar)
- Visual data representation

## How to Use

### Access Admin Panel
1. Navigate to `admin.html` in your browser
2. Login with admin credentials
3. Use tabs to navigate between sections

### Edit a Listing
1. Go to "Listings" tab
2. Click edit icon (pencil) on any listing
3. Modify details in the modal
4. Click "Save Changes"

### Delete a Listing
1. Go to "Listings" tab
2. Click delete icon (trash) on any listing
3. Confirm deletion
4. Listing and images will be permanently deleted

### Verify a Merchant
1. Go to "Merchants" tab
2. Click verify icon (checkmark) on any merchant
3. Merchant status updates immediately

### Delete Files
1. Go to "Files" tab
2. Click delete icon on any file
3. File is removed from storage and listing

## Security Considerations

### Current Implementation
- Simple localStorage-based authentication
- No server-side validation
- Admin credentials hardcoded

### Production Recommendations
1. **Use Firebase Authentication**:
   ```javascript
   // Replace simple auth with Firebase Auth
   await auth.signInWithEmailAndPassword(email, password);
   // Check custom claims for admin role
   ```

2. **Add Role-Based Access Control**:
   - Create custom claims in Firebase Auth
   - Verify admin role on backend
   - Use Firebase Security Rules

3. **Implement Firebase Security Rules**:
   ```javascript
   // firestore.rules
   match /{document=**} {
     allow read: if request.auth != null;
     allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
   }
   ```

4. **Add Audit Logging**:
   - Log all admin actions
   - Track who made changes
   - Store in Firestore audit collection

## File Upload Flow

### Current Flow
1. User selects images in `post.html`
2. Images uploaded to Firebase Storage via `uploadImages()`
3. Download URLs stored in Firestore listing document
4. Images accessible via public URLs

### Storage Structure
```
storage/
├── apartments/
│   ├── {listingId}_1234567890_0.jpg
│   ├── {listingId}_1234567890_1.jpg
│   └── {listingId}_1234567890_2.jpg
├── cars/
│   └── ...
└── land/
    └── ...
```

## Backend Control

### Current: Client-Side Only
- All CRUD operations happen in browser
- Firebase handles authentication and storage
- No backend server needed

### Future: Supabase Integration
Consider migrating to Supabase for:
- Better backend control
- Row Level Security (RLS)
- Server-side functions
- Better analytics
- More robust admin features

## Troubleshooting

### Can't Login
- Check admin credentials in `js/admin-panel.js`
- Clear browser localStorage
- Check browser console for errors

### Files Not Deleting
- Check Firebase Storage permissions
- Verify file URLs are correct
- Check browser console for errors

### Listings Not Loading
- Check Firebase Firestore connection
- Verify collection names match
- Check browser console for errors

## Next Steps

1. **Implement Firebase Auth** for proper authentication
2. **Add Firebase Security Rules** for data protection
3. **Create audit logging** for admin actions
4. **Add bulk operations** (bulk delete, bulk verify)
5. **Implement search/filter** improvements
6. **Add export functionality** (CSV, JSON)
7. **Create admin activity log** dashboard

---

**Note**: This admin panel is fully functional but should be enhanced with proper authentication and security before production use.

