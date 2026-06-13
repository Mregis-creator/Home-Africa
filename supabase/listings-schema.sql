-- ============================================================
-- HOME AFRICA — LISTINGS TABLE (canonical schema)
-- ============================================================
-- This file documents and reconciles the `listings` table, which was
-- previously created ad-hoc in the Supabase dashboard and NOT tracked in
-- source control. It is written to be idempotent and SAFE to re-run:
--   * CREATE TABLE / INDEX use IF NOT EXISTS
--   * ADD COLUMN uses IF NOT EXISTS
--   * policies are dropped-then-created
-- Running it will not drop data.
--
-- Canonical location shape (JSONB column `location`):
--   {
--     "country":  "Rwanda",
--     "city":     "Kigali",
--     "district": "Gasabo",          -- controlled (see js/locations.js)
--     "sector":   "Kacyiru",         -- controlled (see js/locations.js)
--     "address":  "KG 9 Ave",        -- optional free text
--     "label":    "KG 9 Ave, Kacyiru, Gasabo, Kigali"  -- display string
--   }
-- Always render via HALocations.format(listing.location) on the client.
-- ============================================================

CREATE TABLE IF NOT EXISTS listings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  merchant_id UUID,

  type        TEXT NOT NULL DEFAULT 'apartment'
                CHECK (type IN ('apartment', 'car', 'land', 'driving_school')),
  title       TEXT NOT NULL,
  description TEXT,

  price       NUMERIC DEFAULT 0,
  currency    TEXT DEFAULT 'RWF',          -- default set from APP_CONFIG client-side

  status      TEXT DEFAULT 'active'
                CHECK (status IN ('active', 'pending', 'sold', 'inactive', 'archived')),

  -- Structured location (see canonical shape above)
  location    JSONB DEFAULT '{}'::jsonb,

  images      JSONB DEFAULT '[]'::jsonb,
  metadata    JSONB DEFAULT '{}'::jsonb,

  views       INTEGER DEFAULT 0,
  favorites   INTEGER DEFAULT 0,

  -- Featured / boosted placement (revenue rail — see P1)
  featured       BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- For tables that already exist, make sure newer columns are present.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured       BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS currency       TEXT DEFAULT 'RWF';

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_listings_type        ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_status      ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_user        ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_created     ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_featured    ON listings(featured, featured_until);

-- JSONB expression indexes — power location filtering and per-city scaling
CREATE INDEX IF NOT EXISTS idx_listings_loc_city     ON listings((location->>'city'));
CREATE INDEX IF NOT EXISTS idx_listings_loc_district ON listings((location->>'district'));
CREATE INDEX IF NOT EXISTS idx_listings_loc_sector   ON listings((location->>'sector'));

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Anyone may read active listings (public marketplace browsing)
DROP POLICY IF EXISTS "Public can view active listings" ON listings;
CREATE POLICY "Public can view active listings" ON listings
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

-- NOTE: posting is currently open (public/anonymous posting is allowed by the
-- app). Tighten this to `auth.uid() IS NOT NULL` once posting requires login.
DROP POLICY IF EXISTS "Anyone can create listings" ON listings;
CREATE POLICY "Anyone can create listings" ON listings
  FOR INSERT WITH CHECK (true);

-- Owners can update / delete their own listings
DROP POLICY IF EXISTS "Owners can update own listings" ON listings;
CREATE POLICY "Owners can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can delete own listings" ON listings;
CREATE POLICY "Owners can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Triggers & helpers
-- ------------------------------------------------------------
-- Reuses update_updated_at_column() defined in supabase-tables.sql
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atomic view increment (js/supabase-listings.js calls this RPC)
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listings SET views = COALESCE(views, 0) + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
