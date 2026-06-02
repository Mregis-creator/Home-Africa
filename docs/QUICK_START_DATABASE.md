# 🚀 Quick Start: Database Migration Guide

## 🎯 Recommended Path: **Supabase (PostgreSQL + Real-time)**

**Why Supabase?**
- ✅ Free tier (perfect for MVP)
- ✅ PostgreSQL (industry standard)
- ✅ Auto-generated REST APIs
- ✅ Real-time subscriptions (like Firebase)
- ✅ Built-in authentication
- ✅ Easy migration from Firebase
- ✅ Cost-effective scaling

---

## 📦 Step 1: Set Up Supabase (15 minutes)

1. **Create Account:**
   - Go to https://supabase.com
   - Sign up (free tier available)
   - Create new project: `home-africa`

2. **Get Credentials:**
   - Project Settings → API
   - Copy: `Project URL` and `anon public` key

3. **Install Supabase Client:**
```html
<!-- Add to your HTML files -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 🗄️ Step 2: Create Database Schema (30 minutes)

**Run this SQL in Supabase SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    avatar_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Merchants Table
CREATE TABLE merchants (
    id UUID PRIMARY KEY REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Listings Table (Unified)
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    type VARCHAR(20) NOT NULL, -- 'apartment', 'car', 'land', 'driving_school'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'RWF',
    status VARCHAR(20) DEFAULT 'active',
    location JSONB,
    images TEXT[],
    metadata JSONB, -- Store type-specific fields here
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    booking_type VARCHAR(20),
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_merchant ON listings(merchant_id);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
```

---

## 🔧 Step 3: Initialize Supabase in Your Code

**Create `js/supabase-config.js`:**

```javascript
// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
```

**Add to your HTML files (before other scripts):**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

---

## 📝 Step 4: Update Your Code (Example: Post Listing)

**Old Firebase Code:**
```javascript
// Firebase
db.collection('carListings').add({
  title: carTitle,
  price: carPrice,
  // ...
});
```

**New Supabase Code:**
```javascript
// Supabase
const { data, error } = await supabaseClient
  .from('listings')
  .insert({
    type: 'car',
    title: carTitle,
    price: carPrice,
    merchant_id: merchantId,
    metadata: {
      transmission: transmission,
      fuel: fuel,
      mileage: mileage
    }
  });

if (error) {
  console.error('Error posting listing:', error);
} else {
  console.log('Listing posted:', data);
}
```

---

## 🔄 Step 5: Migration Script (Migrate Existing Data)

**Create `js/migrate-firebase-to-supabase.js`:**

```javascript
// Run this once to migrate existing Firebase data
async function migrateFirebaseToSupabase() {
  // Fetch from Firebase
  const carSnapshot = await db.collection('carListings').get();
  const aptSnapshot = await db.collection('apartmentListings').get();
  const landSnapshot = await db.collection('landListings').get();

  // Migrate Cars
  const cars = [];
  carSnapshot.forEach(doc => {
    cars.push({
      type: 'car',
      title: doc.data().title,
      price: parseFloat(doc.data().price),
      merchant_id: doc.data().merchantId || null,
      images: doc.data().images || [],
      metadata: {
        transmission: doc.data().transmission,
        fuel: doc.data().fuel,
        mileage: doc.data().mileage,
        year: doc.data().year
      },
      created_at: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
    });
  });

  // Insert into Supabase
  const { data, error } = await supabaseClient
    .from('listings')
    .insert(cars);

  if (error) {
    console.error('Migration error:', error);
  } else {
    console.log('Migrated', cars.length, 'cars');
  }

  // Repeat for apartments and land...
}
```

---

## 🎨 Step 6: Update Frontend (Example: cars.html)

**Replace Firebase fetch with Supabase:**

```javascript
// Old Firebase code
db.collection('carListings').orderBy('createdAt', 'desc').get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const car = doc.data();
      car.id = doc.id;
      allCars.push(car);
    });
  });

// New Supabase code
const { data: cars, error } = await supabaseClient
  .from('listings')
  .select('*')
  .eq('type', 'car')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error fetching cars:', error);
} else {
  cars.forEach(car => {
    allCars.push(car);
  });
  renderCars();
}
```

---

## 🔐 Step 7: Set Up Row Level Security (RLS)

**In Supabase SQL Editor, add policies:**

```sql
-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read active listings
CREATE POLICY "Public listings are viewable by everyone"
ON listings FOR SELECT
USING (status = 'active');

-- Merchants can insert their own listings
CREATE POLICY "Merchants can insert their own listings"
ON listings FOR INSERT
WITH CHECK (auth.uid() = merchant_id);

-- Users can create bookings
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own bookings
CREATE POLICY "Users can view their bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = merchant_id);
```

---

## 📊 Step 8: Real-time Subscriptions (Optional)

**Listen for new listings in real-time:**

```javascript
// Subscribe to new car listings
supabaseClient
  .from('listings')
  .on('INSERT', { filter: 'type=eq.car' }, payload => {
    console.log('New car listing:', payload.new);
    // Add to your car list
    allCars.unshift(payload.new);
    renderCars();
  })
  .subscribe();
```

---

## ✅ Checklist

- [ ] Create Supabase account
- [ ] Run database schema SQL
- [ ] Add Supabase client to HTML files
- [ ] Update post.html to use Supabase
- [ ] Update cars.html to fetch from Supabase
- [ ] Update apartment.html
- [ ] Update land.html
- [ ] Migrate existing Firebase data
- [ ] Set up RLS policies
- [ ] Test all CRUD operations
- [ ] Deploy and monitor

---

## 🆘 Troubleshooting

**Issue: "Cannot read property 'supabase' of undefined"**
- Make sure Supabase script loads before your code
- Check script order in HTML

**Issue: "Row Level Security policy violation"**
- Check RLS policies in Supabase dashboard
- Verify user authentication

**Issue: "Connection timeout"**
- Check Supabase project status
- Verify API keys are correct

---

## 📚 Next Steps

1. **Authentication:** Set up Supabase Auth (replaces Firebase Auth)
2. **Storage:** Migrate images to Supabase Storage
3. **Payments:** Integrate payment processing
4. **Analytics:** Set up analytics dashboard
5. **Notifications:** Implement email/SMS via Supabase Edge Functions

---

**Need Help?** Check Supabase docs: https://supabase.com/docs

