# 🗄️ HOME AFRICA Database Architecture Strategy

## Current State Analysis

**Current Stack:**
- **Primary Database:** Firebase Firestore (NoSQL)
- **Storage:** Firebase Storage (for images)
- **Authentication:** Firebase Auth (implicit)
- **Collections:** `carListings`, `apartmentListings`, `landListings`, `drivingSchoolListings`

**Current Limitations:**
1. NoSQL structure limits complex queries and relationships
2. Limited transaction support for financial operations
3. Cost scaling concerns at high volume
4. Limited integration with external payment/analytics systems
5. No structured user management system
6. **No AI chatbot support** - Need intelligent customer service automation

---

## 🎯 Recommended Architecture: **Hybrid Approach**

### **Phase 1: Enhanced Firebase (MVP → Growth)**
**Timeline: 0-6 months | Users: 0-10,000**

**Why Firebase for Phase 1:**
- ✅ Already implemented
- ✅ Fast development (no backend needed)
- ✅ Real-time updates
- ✅ Built-in authentication
- ✅ Cost-effective for small scale
- ✅ Easy deployment

**Enhanced Structure:**
```
Firebase Collections:
├── users/
│   ├── {userId}/
│   │   ├── profile: {name, email, phone, role}
│   │   ├── preferences: {favorites, searchAlerts}
│   │   └── activity: {recentViews, notifications}
│
├── merchants/
│   ├── {merchantId}/
│   │   ├── businessInfo: {name, contact, verified, rating}
│   │   ├── listings: {apartments[], cars[], land[]}
│   │   └── analytics: {views, bookings, revenue}
│
├── listings/
│   ├── apartments/
│   ├── cars/
│   ├── land/
│   └── drivingSchools/
│
├── bookings/
│   └── {bookingId}/
│       ├── listingId, userId, date, status
│
├── reviews/
│   └── {reviewId}/
│       ├── listingId, userId, rating, comment
│
└── analytics/
    ├── views/
    ├── searches/
    └── conversions/
```

**Firebase Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Merchants can manage their own listings
    match /merchants/{merchantId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.uid == merchantId;
    }
    
    // Listings: public read, merchant write
    match /listings/{listingType}/{listingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                                resource.data.merchantId == request.auth.uid;
    }
  }
}
```

---

### **Phase 2: Hybrid Architecture (Growth → Scale)**
**Timeline: 6-12 months | Users: 10,000-100,000**

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Frontend (HTML/JS)              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐    ┌───────▼────────┐
│  Firebase  │    │   PostgreSQL   │
│  Firestore │    │   (Supabase/   │
│            │    │   AWS RDS)     │
└────────────┘    └────────────────┘
    │                     │
    │ Real-time           │ Structured Data
    │ Listings            │ Users, Payments
    │ Search              │ Analytics
    │ Notifications       │ Transactions
```

**Data Distribution:**

**Firebase Firestore (Keep):**
- Real-time listings (apartments, cars, land)
- Search indexes
- User preferences & favorites
- Real-time notifications
- Chat/messaging (future)

**PostgreSQL Database (Add):**
- User accounts & authentication
- Merchant profiles & verification
- Financial transactions
- Booking system
- Reviews & ratings (structured)
- Analytics & reporting
- Payment processing logs

**Why Hybrid?**
- ✅ Best of both worlds
- ✅ Firebase for real-time, PostgreSQL for consistency
- ✅ Gradual migration path
- ✅ Cost optimization

---

### **Phase 3: Full Enterprise Architecture**
**Timeline: 12+ months | Users: 100,000+**

**Complete Stack:**
```
┌─────────────────────────────────────────────┐
│           Load Balancer (Cloudflare)       │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐    ┌───────▼────────┐
│  CDN +     │    │   Backend API  │
│  Firebase  │    │   (Node.js/    │
│  (Cache)   │    │   Python)      │
└────────────┘    └───────┬────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
   │PostgreSQL│     │  Redis    │    │  MongoDB  │
   │(Primary) │     │  (Cache)  │    │(Analytics)│
   └──────────┘     └───────────┘    └───────────┘
```

---

## 📊 Detailed Database Schema (PostgreSQL)

### **Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user', -- user, merchant, admin
    full_name VARCHAR(255),
    avatar_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

### **Merchants Table**
```sql
CREATE TABLE merchants (
    id UUID PRIMARY KEY REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50), -- individual, company
    tax_id VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Rwanda',
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_listings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_merchants_verified ON merchants(verified);
CREATE INDEX idx_merchants_rating ON merchants(rating DESC);
```

### **Listings Table (Unified)**
```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id),
    type VARCHAR(20) NOT NULL, -- apartment, car, land, driving_school
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'RWF',
    status VARCHAR(20) DEFAULT 'active', -- active, sold, rented, inactive
    location JSONB, -- {city, district, coordinates}
    images TEXT[], -- Array of image URLs
    metadata JSONB, -- Type-specific data
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_merchant ON listings(merchant_id);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_location ON listings USING GIN(location);
```

### **Bookings Table**
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    booking_type VARCHAR(20), -- viewing, test_drive, consultation
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
```

### **Reviews Table**
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_merchant ON reviews(merchant_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### **Transactions Table**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    listing_id UUID REFERENCES listings(id),
    type VARCHAR(20), -- listing_fee, premium_feature, subscription
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    payment_method VARCHAR(50), -- mtn_momo, airtel_money, card, bank
    payment_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

---

## 🔄 Migration Strategy

### **Step 1: Parallel Run (Month 1-2)**
- Set up PostgreSQL database
- Create schema and tables
- Build API endpoints (Node.js/Express or Python/FastAPI)
- Keep Firebase running in parallel

### **Step 2: Dual Write (Month 2-3)**
- Write new data to both Firebase and PostgreSQL
- Read from Firebase (existing users)
- Gradually migrate read operations

### **Step 3: Migration (Month 3-4)**
- Migrate existing Firebase data to PostgreSQL
- Update frontend to use new API
- Keep Firebase for real-time features only

### **Step 4: Optimization (Month 4+)**
- Remove duplicate Firebase writes
- Optimize queries
- Add caching layer (Redis)

---

## 💰 Cost Comparison

### **Firebase Firestore (Current)**
- **Free Tier:** 50K reads/day, 20K writes/day
- **Paid:** $0.06 per 100K reads, $0.18 per 100K writes
- **Estimated Monthly (10K users):** $50-150

### **PostgreSQL (Supabase)**
- **Free Tier:** 500MB database, 2GB bandwidth
- **Pro:** $25/month (8GB database, 50GB bandwidth)
- **Estimated Monthly (10K users):** $25-50

### **Hybrid Approach**
- **Firebase:** Real-time listings only ($30/month)
- **PostgreSQL:** User data, transactions ($25/month)
- **Total:** ~$55/month (vs $150 Firebase-only)

---

## 🚀 Recommended Next Steps

### **Immediate (This Week)**
1. ✅ Document current Firebase structure
2. ✅ Set up Supabase account (free PostgreSQL)
3. ✅ Create database schema
4. ✅ Build basic API endpoints

### **Short-term (This Month)**
1. Implement user authentication in PostgreSQL
2. Create merchant registration system
3. Set up booking system
4. Add review/rating system

### **Medium-term (Next 3 Months)**
1. Migrate user data to PostgreSQL
2. Implement payment processing
3. Add analytics dashboard
4. Set up email/SMS notifications

---

## 🛠️ Technology Stack Recommendation

### **Backend Options:**

**Option A: Node.js + Express (Recommended)**
- ✅ JavaScript (same as frontend)
- ✅ Large ecosystem
- ✅ Easy Firebase integration
- ✅ Good for real-time features

**Option B: Python + FastAPI**
- ✅ Fast development
- ✅ Great for data processing
- ✅ Strong analytics libraries
- ✅ Good documentation

**Option C: Supabase (Backend-as-a-Service)**
- ✅ Built-in PostgreSQL
- ✅ Auto-generated APIs
- ✅ Real-time subscriptions
- ✅ Built-in authentication
- ✅ **Best for rapid scaling**

---

## 📋 Action Plan

### **Week 1: Setup**
- [ ] Create Supabase project
- [ ] Design database schema
- [ ] Set up development environment
- [ ] Create initial migrations

### **Week 2: Core Features**
- [ ] User authentication API
- [ ] Merchant registration API
- [ ] Listing CRUD API
- [ ] Basic search functionality

### **Week 3: Advanced Features**
- [ ] Booking system API
- [ ] Review/rating API
- [ ] Payment integration
- [ ] Notification system

### **Week 4: Integration**
- [ ] Connect frontend to new API
- [ ] Migrate existing data
- [ ] Testing & bug fixes
- [ ] Deploy to production

---

## 🎯 Success Metrics

- **Performance:** <200ms API response time
- **Uptime:** 99.9% availability
- **Scalability:** Support 100K+ users
- **Cost:** <$100/month for 10K users
- **Data Integrity:** Zero data loss
- **Integration:** Support 5+ payment methods

---

## 📞 Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Tutorial:** https://www.postgresql.org/docs/
- **Firebase Migration Guide:** https://firebase.google.com/docs/firestore/manage-data/migrate-data

---

**Last Updated:** January 2025
**Next Review:** March 2025

