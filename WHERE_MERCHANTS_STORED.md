# 📍 Where Merchant Accounts Are Stored

## Current System (Firebase)

### **Location: Firebase Firestore**
- **Collection:** `merchants`
- **Document ID:** User's Firebase Auth UID (`user.uid`)

### **Code Location:**
- File: `signup.html` (lines 647-663)
- Function: Email link sign-in callback and password signup

### **Data Stored:**
```javascript
{
  merchantName: "Business Name",
  merchantEmail: "email@example.com",
  merchantContact: "+250 788 123 456",
  email: "email@example.com",
  categories: ["apartment", "car", "land"],
  verified: false,
  rating: 0,
  totalReviews: 0,
  totalListings: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  userId: "firebase-uid"
}
```

### **How to View:**
1. Go to **Firebase Console** → **Firestore Database**
2. Click on **`merchants`** collection
3. See all merchant documents

---

## Future System (Supabase - Ready for Migration)

### **Location: Supabase PostgreSQL**
- **Table:** `merchants` (in `DATABASE_SCHEMA_WITH_AI.sql`)
- **Table:** `business_profiles` (in `PHASE_II_DATABASE_SCHEMA.sql`)

### **Merchants Table:**
```sql
CREATE TABLE merchants (
    id UUID PRIMARY KEY REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    tax_id VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Rwanda',
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_listings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Business Profiles Table (Phase II):**
```sql
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    website_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    location VARCHAR(255),
    -- ... more fields
);
```

---

## Current Flow

### **When User Signs Up as Merchant:**

1. **Firebase Auth** → Creates user account
2. **Firestore** → Creates document in `merchants` collection
   - Document ID = Firebase Auth UID
   - Stores merchant info (name, email, categories, etc.)
3. **localStorage** → Stores quick access flags:
   - `merchantRegistered: "true"`
   - `merchantName: "Business Name"`
   - `merchantEmail: "email@example.com"`
   - `merchantId: "firebase-uid"`
   - `merchantCategories: ["apartment", "car"]`

### **When Admin Panel Checks:**
- File: `js/admin-panel.js`
- Function: `verifyMerchantRegistration(email)`
- Checks: `db.collection('merchants').where('merchantEmail', '==', email)`

---

## Migration Path

### **Current:** Firebase Firestore `merchants` collection
### **Future:** Supabase PostgreSQL `merchants` table

**Migration Steps (when ready):**
1. Export Firebase `merchants` collection
2. Transform data to match Supabase schema
3. Insert into Supabase `merchants` table
4. Update `signup.html` to write to Supabase instead of Firebase
5. Update `admin-panel.js` to read from Supabase

---

## Quick Access

### **View Merchants in Firebase:**
- Firebase Console → Firestore → `merchants` collection

### **View Merchants in Supabase (after migration):**
- Supabase Dashboard → Table Editor → `merchants` table

---

## Summary

**Currently:** Firebase Firestore `merchants` collection  
**Future:** Supabase PostgreSQL `merchants` table  
**Quick Check:** `localStorage.getItem('merchantRegistered')`

