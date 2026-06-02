# 🚀 Migration Plan: Firebase → Supabase

## Why Migrate?

✅ **Single Database** - Everything in PostgreSQL  
✅ **Supabase Storage** - Built-in file storage (like Firebase Storage)  
✅ **Better Consistency** - ACID transactions  
✅ **Simpler Architecture** - One platform instead of two  
✅ **Cost Effective** - Potentially lower costs  
✅ **Already Set Up** - We already have Supabase configured!

---

## Migration Strategy

### Phase 1: Storage Migration (Immediate)
- ✅ Replace Firebase Storage with Supabase Storage
- ✅ Update `post.html` to use Supabase Storage
- ✅ Test image uploads

### Phase 2: Database Migration (Next)
- Migrate Firestore collections to PostgreSQL tables
- Update all read/write operations
- Keep Firebase Auth for now (can migrate later)

### Phase 3: Complete Migration (Future)
- Migrate Firebase Auth to Supabase Auth
- Remove Firebase dependencies
- Full PostgreSQL/Supabase stack

---

## Step 1: Enable Supabase Storage

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: **home-africa**

2. **Enable Storage**
   - Click **"Storage"** in left sidebar
   - Click **"Create a new bucket"**
   - Name: `listings`
   - Public: ✅ Yes (so images are accessible)
   - Click **"Create bucket"**

3. **Set Storage Policies** (Optional - for security)
   - Go to Storage → Policies
   - Create policy for uploads:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'listings');
   
   -- Allow public reads
   CREATE POLICY "Allow public reads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'listings');
   ```

---

## Step 2: Update Code

We'll update `post.html` to use Supabase Storage instead of Firebase Storage.

---

## Benefits

### Current (Firebase + Supabase):
- Firebase Storage (images)
- Firebase Firestore (listings)
- Supabase PostgreSQL (AI, Phase II features)
- Firebase Auth (authentication)

### After Migration (Supabase Only):
- Supabase Storage (images)
- Supabase PostgreSQL (everything)
- Supabase Auth (authentication) - optional, can keep Firebase Auth

---

## Migration Checklist

- [ ] Enable Supabase Storage bucket
- [ ] Update `post.html` to use Supabase Storage
- [ ] Test image uploads
- [ ] Migrate existing Firebase listings to Supabase
- [ ] Update all pages to read from Supabase
- [ ] Remove Firebase Storage dependency

---

**Let's start with Storage migration first!** 🚀

