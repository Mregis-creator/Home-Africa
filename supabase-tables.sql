-- Supabase Tables for HOME AFRICA
-- Run these in Supabase SQL Editor

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('apartment', 'car', 'land')),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  search_params JSONB NOT NULL,
  alert_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

-- Enable Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('apartment', 'car', 'land')),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SELLER SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'enterprise')),
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'rejected', 'expired')),
  active BOOLEAN DEFAULT false,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON seller_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own subscription" ON seller_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_seller_subscriptions_updated_at
  BEFORE UPDATE ON seller_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MESSAGING TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL,
  participant_1_type TEXT DEFAULT 'user',
  participant_2_id UUID NOT NULL,
  participant_2_type TEXT DEFAULT 'user',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  unread_count_p1 INT DEFAULT 0,
  unread_count_p2 INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their threads" ON message_threads
  FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Authenticated users can create threads" ON message_threads
  FOR INSERT WITH CHECK (auth.uid() = participant_1_id);

CREATE POLICY "Participants can update their threads" ON message_threads
  FOR UPDATE USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT DEFAULT 'user',
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread participants can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads t
      WHERE t.id = messages.thread_id
      AND (t.participant_1_id = auth.uid() OR t.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================================
-- USER PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  profile_picture_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role constraint (supports all platform roles)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'merchant', 'agent', 'support', 'dev', 'admin'));

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can upsert own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin policies for messaging (placed here because they depend on user_profiles)
CREATE POLICY "Admins can view all threads" ON message_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create threads with anyone" ON message_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can send messages to any thread" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- VERIFIED SELLERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS verified_sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verified_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified sellers" ON verified_sellers
  FOR SELECT USING (true);

CREATE POLICY "Only admin can manage verified sellers" ON verified_sellers
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@home.africa'
  ));


-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);


-- ============================================================
-- TRANSACTIONS TABLE (Payments for featured listings, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id TEXT,
  type TEXT NOT NULL DEFAULT 'feature_listing',
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'RWF',
  status TEXT DEFAULT 'pending',
  provider TEXT DEFAULT 'flutterwave',
  provider_ref TEXT,
  provider_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own pending transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ============================================================
-- MERCHANT SETTINGS TABLE (Payout & Payment Configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Bank payout details
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  momo_number TEXT,
  
  -- Flutterwave API keys (store securely - in production encrypt these)
  fw_public_key TEXT,
  fw_secret_key TEXT,
  fw_encryption_key TEXT,
  fw_webhook_secret TEXT,
  
  -- Settings
  currency TEXT DEFAULT 'RWF',
  auto_withdraw_threshold INTEGER DEFAULT 50000,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON merchant_settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- WITHDRAWALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT DEFAULT 'bank',
  status TEXT DEFAULT 'pending',
  
  -- Bank details (snapshot at time of request)
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  momo_number TEXT,
  
  -- Processing
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ANALYTICS TABLES
-- ============================================================

-- Listing Views - Track every view of a listing
CREATE TABLE IF NOT EXISTS listing_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  source TEXT DEFAULT 'direct',
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_owner_id ON listing_views(owner_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_created_at ON listing_views(created_at DESC);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their listing stats" ON listing_views
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Public can create views" ON listing_views
  FOR INSERT WITH CHECK (true);

-- Area Statistics - Aggregated stats by area/district
CREATE TABLE IF NOT EXISTS area_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_name TEXT NOT NULL,
  district TEXT,
  province TEXT,
  total_listings INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  avg_price INTEGER,
  min_price INTEGER,
  max_price INTEGER,
  popular_type TEXT,
  listings_change_30d INTEGER DEFAULT 0,
  views_change_30d INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_area_stats_area ON area_stats(area_name);
CREATE INDEX IF NOT EXISTS idx_area_stats_district ON area_stats(district);

ALTER TABLE area_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view area stats" ON area_stats
  FOR SELECT USING (true);

-- Merchant Analytics Summary - Daily/Weekly aggregated stats
CREATE TABLE IF NOT EXISTS merchant_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_date DATE NOT NULL,
  
  -- Listing stats
  total_listings INTEGER DEFAULT 0,
  new_listings INTEGER DEFAULT 0,
  featured_listings INTEGER DEFAULT 0,
  
  -- Engagement stats
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  favorites_received INTEGER DEFAULT 0,
  inquiries_received INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  
  -- Conversion stats
  phone_clicks INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  booking_requests INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_analytics_merchant ON merchant_analytics(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_analytics_period ON merchant_analytics(period_date DESC);

ALTER TABLE merchant_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own analytics" ON merchant_analytics
  FOR SELECT USING (auth.uid() = merchant_id);

-- Function to record listing view
CREATE OR REPLACE FUNCTION record_listing_view(
  p_listing_id TEXT,
  p_listing_type TEXT,
  p_owner_id UUID,
  p_viewer_id UUID,
  p_source TEXT DEFAULT 'direct',
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO listing_views (
    listing_id, listing_type, owner_id, viewer_id, 
    source, referrer, user_agent
  ) VALUES (
    p_listing_id, p_listing_type, p_owner_id, p_viewer_id,
    p_source, p_referrer, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- USER ACTIVITY LOG - For user dashboard analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'view', 'favorite', 'search', 'message', 'booking'
  listing_id TEXT,
  listing_type TEXT,
  listing_title TEXT,
  search_query TEXT,
  search_filters JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert activities" ON user_activities
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- PLATFORM ANALYTICS - For admin dashboard
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_date DATE NOT NULL,
  
  -- User metrics
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  
  -- Listing metrics
  new_listings INTEGER DEFAULT 0,
  total_listings INTEGER DEFAULT 0,
  featured_listings INTEGER DEFAULT 0,
  expired_listings INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  avg_session_duration INTEGER, -- in seconds
  
  -- Conversion metrics
  new_favorites INTEGER DEFAULT 0,
  new_inquiries INTEGER DEFAULT 0,
  new_messages INTEGER DEFAULT 0,
  new_bookings INTEGER DEFAULT 0,
  
  -- Revenue metrics
  subscription_revenue INTEGER DEFAULT 0,
  featured_listing_revenue INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  
  -- Source breakdown
  traffic_sources JSONB,
  device_breakdown JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_period ON platform_analytics(period_date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_type ON platform_analytics(period);

ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can view platform analytics" ON platform_analytics
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- ============================================================
-- VIP MERCHANT ACCESS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS vip_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_type TEXT NOT NULL, -- 'market_intel', 'competitor_data', 'price_benchmarks'
  filters_applied JSONB,
  results_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_vip_access_log_merchant ON vip_access_log(merchant_id);
CREATE INDEX IF NOT EXISTS idx_vip_access_log_type ON vip_access_log(access_type);

ALTER TABLE vip_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own access log" ON vip_access_log
  FOR SELECT USING (auth.uid() = merchant_id);

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

-- Public platform stats view
CREATE OR REPLACE VIEW public_platform_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'merchant') as total_merchants,
  (SELECT COUNT(*) FROM listing_views WHERE created_at > NOW() - INTERVAL '30 days') as monthly_views,
  (SELECT COUNT(*) FROM favorites WHERE created_at > NOW() - INTERVAL '30 days') as monthly_favorites;

-- Merchant performance summary view
CREATE OR REPLACE VIEW merchant_performance AS
SELECT
  u.id as merchant_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  COUNT(DISTINCT lv.id) as total_views,
  MAX(lv.created_at) as last_view_date
FROM auth.users u
LEFT JOIN listing_views lv ON lv.owner_id = u.id AND lv.created_at > NOW() - INTERVAL '30 days'
WHERE u.raw_user_meta_data->>'role' = 'merchant'
GROUP BY u.id, u.email, u.raw_user_meta_data->>'full_name';

-- Market intelligence view (placeholder - requires listings table)
CREATE OR REPLACE VIEW market_intelligence AS
SELECT
  NULL::TEXT as district,
  NULL::TEXT as listing_type,
  0::BIGINT as listing_count
WHERE false;

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE activity_type = 'view') as views_count,
  COUNT(*) FILTER (WHERE activity_type = 'favorite') as favorites_count,
  COUNT(*) FILTER (WHERE activity_type = 'search') as searches_count,
  COUNT(*) FILTER (WHERE activity_type = 'message') as messages_count,
  MAX(created_at) as last_activity
FROM user_activities
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id;


-- ============================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================

-- Function to get merchant stats
CREATE OR REPLACE FUNCTION get_merchant_stats(p_merchant_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  total_favorites BIGINT,
  total_inquiries BIGINT,
  top_listing_id TEXT,
  top_listing_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT lv.id)::BIGINT as total_views,
    COUNT(DISTINCT f.id)::BIGINT as total_favorites,
    COUNT(DISTINCT m.id)::BIGINT as total_inquiries,
    (SELECT listing_id FROM listing_views WHERE owner_id = p_merchant_id GROUP BY listing_id ORDER BY COUNT(*) DESC LIMIT 1) as top_listing_id,
    (SELECT COUNT(*) FROM listing_views WHERE owner_id = p_merchant_id GROUP BY listing_id ORDER BY COUNT(*) DESC LIMIT 1)::BIGINT as top_listing_views
  FROM listing_views lv
  LEFT JOIN favorites f ON f.user_id != p_merchant_id AND f.created_at > NOW() - (p_days || ' days')::INTERVAL
  LEFT JOIN message_threads m ON (m.participant_1_id = p_merchant_id OR m.participant_2_id = p_merchant_id) AND m.last_message_at > NOW() - (p_days || ' days')::INTERVAL
  WHERE lv.owner_id = p_merchant_id
    AND lv.created_at > NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform summary for admin
CREATE OR REPLACE FUNCTION get_platform_summary()
RETURNS TABLE (
  total_users BIGINT,
  total_merchants BIGINT,
  total_listings BIGINT,
  daily_views BIGINT,
  daily_revenue BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data->>'role' = 'merchant') as total_merchants,
    0::BIGINT as total_listings, -- listings table managed separately
    (SELECT COUNT(*) FROM listing_views WHERE created_at > NOW() - INTERVAL '1 day') as daily_views,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE created_at > NOW() - INTERVAL '1 day' AND status = 'completed') as daily_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user activity
CREATE OR REPLACE FUNCTION record_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_listing_id TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL,
  p_listing_title TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activities (
    user_id, activity_type, listing_id, listing_type, 
    listing_title, search_query, metadata
  ) VALUES (
    p_user_id, p_activity_type, p_listing_id, p_listing_type,
    p_listing_title, p_search_query, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER update_platform_analytics_updated_at
  BEFORE UPDATE ON platform_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activities_updated_at
  BEFORE UPDATE ON user_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_analytics_updated_at
  BEFORE UPDATE ON merchant_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- LEAD CRM TABLES
-- ============================================================

-- Merchant Leads - Potential buyers tracked by merchants
CREATE TABLE IF NOT EXISTS merchant_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Lead scoring
  lead_score INTEGER DEFAULT 0,
  temperature TEXT DEFAULT 'cold' CHECK (temperature IN ('hot', 'warm', 'cold', 'ice')),
  
  -- Lead source and metadata
  source TEXT DEFAULT 'organic',
  source_detail TEXT,
  tags JSONB DEFAULT '[]',
  
  -- Pipeline tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'active', 'converted', 'lost', 'dormant')),
  pipeline_stage TEXT DEFAULT 'inquiry' CHECK (pipeline_stage IN ('inquiry', 'contacted', 'viewing_scheduled', 'negotiating', 'closed_won', 'closed_lost')),
  
  -- Engagement metrics (cached for quick access)
  profile_views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  return_visits INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  time_on_page INTEGER DEFAULT 0, -- in seconds
  
  -- Contact tracking
  first_contact_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  
  -- Lead contact info (from billing definition)
  listing_id TEXT,
  listing_type TEXT CHECK (listing_type IN ('apartment', 'car', 'land')),
  lead_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_email TEXT,
  lead_phone TEXT,

  -- Lead quality
  is_qualified BOOLEAN DEFAULT true,
  qualification_reason TEXT,

  -- Billing
  is_free_lead BOOLEAN DEFAULT false,
  lead_cost DECIMAL(5,2) DEFAULT 0,
  is_billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMPTZ,
  invoice_id TEXT,

  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  conversion_value INTEGER, -- in RWF
  converted_to_sale BOOLEAN DEFAULT false,
  sale_value DECIMAL(12,2),
  commission_earned DECIMAL(10,2),
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_leads_merchant ON merchant_leads(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_user ON merchant_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_score ON merchant_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_temperature ON merchant_leads(temperature);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_stage ON merchant_leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_activity ON merchant_leads(last_activity_at DESC);

ALTER TABLE merchant_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own leads" ON merchant_leads
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants manage own leads" ON merchant_leads
  FOR ALL USING (auth.uid() = merchant_id);

-- Lead Engagement Log - Detailed activity tracking
CREATE TABLE IF NOT EXISTS lead_engagement_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES merchant_leads(id) ON DELETE CASCADE NOT NULL,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  activity_type TEXT NOT NULL, -- 'view', 'favorite', 'message', 'phone_click', 'whatsapp_click', 'email_click', 'return_visit', 'search', 'inquiry'
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_engagement_log_lead ON lead_engagement_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_engagement_log_type ON lead_engagement_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_engagement_log_created ON lead_engagement_log(created_at DESC);

ALTER TABLE lead_engagement_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view own engagement logs" ON lead_engagement_log
  FOR SELECT USING (auth.uid() = merchant_id);

-- Lead Follow-ups - Reminder system
CREATE TABLE IF NOT EXISTS lead_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES merchant_leads(id) ON DELETE CASCADE NOT NULL,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  reminder_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed', 'cancelled')),
  
  completed_at TIMESTAMPTZ,
  completed_note TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_merchant ON lead_follow_ups(merchant_id);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_date ON lead_follow_ups(reminder_date);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_status ON lead_follow_ups(status);

ALTER TABLE lead_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own follow-ups" ON lead_follow_ups
  FOR ALL USING (auth.uid() = merchant_id);

-- ============================================================
-- CRM VIEWS
-- ============================================================

-- Hot leads summary for dashboard
CREATE OR REPLACE VIEW hot_leads_summary AS
SELECT
  merchant_id,
  COUNT(*) FILTER (WHERE temperature = 'hot') as hot_count,
  COUNT(*) FILTER (WHERE temperature = 'warm') as warm_count,
  COUNT(*) FILTER (WHERE temperature = 'cold') as cold_count,
  COUNT(*) FILTER (WHERE temperature = 'ice') as ice_count,
  COUNT(*) FILTER (WHERE pipeline_stage = 'closed_won' AND converted_at > NOW() - INTERVAL '30 days') as monthly_conversions,
  AVG(lead_score) as avg_lead_score,
  MAX(last_activity_at) as last_activity
FROM merchant_leads
GROUP BY merchant_id;

-- Lead conversion funnel by merchant
CREATE OR REPLACE VIEW merchant_conversion_funnel AS
SELECT
  merchant_id,
  COUNT(*) FILTER (WHERE pipeline_stage = 'inquiry') as inquiry_count,
  COUNT(*) FILTER (WHERE pipeline_stage = 'contacted') as contacted_count,
  COUNT(*) FILTER (WHERE pipeline_stage = 'viewing_scheduled') as viewing_count,
  COUNT(*) FILTER (WHERE pipeline_stage = 'negotiating') as negotiating_count,
  COUNT(*) FILTER (WHERE pipeline_stage = 'closed_won') as closed_won_count,
  COUNT(*) FILTER (WHERE pipeline_stage = 'closed_lost') as closed_lost_count,
  COALESCE(
    COUNT(*) FILTER (WHERE pipeline_stage = 'closed_won')::float / 
    NULLIF(COUNT(*) FILTER (WHERE pipeline_stage = 'inquiry'), 0) * 100,
    0
  ) as conversion_rate
FROM merchant_leads
GROUP BY merchant_id;

-- Upcoming follow-ups
CREATE OR REPLACE VIEW upcoming_follow_ups AS
SELECT
  f.*,
  l.user_id,
  l.lead_score,
  l.temperature,
  l.pipeline_stage
FROM lead_follow_ups f
JOIN merchant_leads l ON l.id = f.lead_id
WHERE f.status = 'pending'
  AND f.reminder_date <= NOW() + INTERVAL '24 hours'
ORDER BY f.reminder_date ASC;

-- Lead source attribution
CREATE OR REPLACE VIEW lead_source_performance AS
SELECT
  merchant_id,
  source,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE temperature IN ('hot', 'warm')) as qualified_leads,
  COUNT(*) FILTER (WHERE pipeline_stage = 'closed_won') as conversions,
  AVG(lead_score) as avg_score,
  COALESCE(
    COUNT(*) FILTER (WHERE pipeline_stage = 'closed_won')::float / 
    NULLIF(COUNT(*), 0) * 100,
    0
  ) as conversion_rate
FROM merchant_leads
GROUP BY merchant_id, source
ORDER BY merchant_id, conversion_rate DESC;

-- ============================================================
-- CRM FUNCTIONS
-- ============================================================

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_profile_views INTEGER DEFAULT 0,
  p_favorites INTEGER DEFAULT 0,
  p_messages INTEGER DEFAULT 0,
  p_return_visits INTEGER DEFAULT 0,
  p_phone_clicks INTEGER DEFAULT 0,
  p_whatsapp_clicks INTEGER DEFAULT 0,
  p_email_clicks INTEGER DEFAULT 0,
  p_time_on_page INTEGER DEFAULT 0, -- seconds
  p_last_activity_days INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base engagement score
  score := score + (p_profile_views * 2);
  score := score + (p_favorites * 5);
  score := score + (p_messages * 10);
  score := score + (p_return_visits * 3);
  score := score + (p_phone_clicks * 12);
  score := score + (p_whatsapp_clicks * 12);
  score := score + (p_email_clicks * 8);
  score := score + (p_time_on_page / 60); -- per minute
  
  -- Recency multiplier
  IF p_last_activity_days <= 1 THEN
    score := score * 1.3;
  ELSIF p_last_activity_days <= 3 THEN
    score := score * 1.1;
  ELSIF p_last_activity_days <= 7 THEN
    score := score * 1.0;
  ELSIF p_last_activity_days <= 14 THEN
    score := score * 0.8;
  ELSIF p_last_activity_days <= 30 THEN
    score := score * 0.6;
  ELSE
    score := score * 0.3;
  END IF;
  
  RETURN ROUND(score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update lead score and temperature
CREATE OR REPLACE FUNCTION update_lead_score(p_lead_id UUID)
RETURNS VOID AS $$
DECLARE
  v_lead RECORD;
  v_new_score INTEGER;
  v_days_since INTEGER;
  v_temperature TEXT;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM merchant_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate days since last activity
  v_days_since := EXTRACT(DAY FROM NOW() - v_lead.last_activity_at);
  
  -- Calculate new score
  v_new_score := calculate_lead_score(
    v_lead.profile_views,
    v_lead.favorites,
    v_lead.messages,
    v_lead.return_visits,
    v_lead.phone_clicks,
    v_lead.whatsapp_clicks,
    v_lead.email_clicks,
    v_lead.time_on_page,
    v_days_since
  );
  
  -- Determine temperature
  IF v_new_score >= 50 AND v_days_since <= 3 THEN
    v_temperature := 'hot';
  ELSIF v_new_score >= 30 AND v_days_since <= 7 THEN
    v_temperature := 'warm';
  ELSIF v_new_score >= 15 AND v_days_since <= 14 THEN
    v_temperature := 'cold';
  ELSE
    v_temperature := 'ice';
  END IF;
  
  -- Update lead
  UPDATE merchant_leads SET
    lead_score = v_new_score,
    temperature = v_temperature,
    updated_at = NOW()
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get leads needing follow-up
CREATE OR REPLACE FUNCTION get_leads_needing_follow_up(p_merchant_id UUID, p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  lead_id UUID,
  user_id UUID,
  lead_score INTEGER,
  temperature TEXT,
  hours_since_contact INTEGER,
  pipeline_stage TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id as lead_id,
    l.user_id,
    l.lead_score,
    l.temperature,
    EXTRACT(HOUR FROM NOW() - l.last_contact_at)::INTEGER as hours_since_contact,
    l.pipeline_stage
  FROM merchant_leads l
  WHERE l.merchant_id = p_merchant_id
    AND l.temperature = 'hot'
    AND l.pipeline_stage IN ('inquiry', 'contacted')
    AND (l.last_contact_at IS NULL OR l.last_contact_at < NOW() - (p_hours || ' hours')::INTERVAL)
  ORDER BY l.lead_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CRM TRIGGERS
-- ============================================================

CREATE TRIGGER update_merchant_leads_updated_at
  BEFORE UPDATE ON merchant_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_follow_ups_updated_at
  BEFORE UPDATE ON lead_follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update lead score when engagement changes
CREATE OR REPLACE FUNCTION auto_update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_lead_score(NEW.lead_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_engagement_log_insert
  AFTER INSERT ON lead_engagement_log
  FOR EACH ROW EXECUTE FUNCTION auto_update_lead_score();

-- ============================================================
-- MARKET INTELLIGENCE TABLES
-- ============================================================

-- Market Price History - Track price movements over time
CREATE TABLE IF NOT EXISTS market_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district TEXT NOT NULL,
  property_type TEXT NOT NULL,
  
  -- Price metrics
  avg_price INTEGER,
  median_price INTEGER,
  min_price INTEGER,
  max_price INTEGER,
  price_per_sqm INTEGER,
  
  -- Volume metrics
  total_listings INTEGER DEFAULT 0,
  new_listings INTEGER DEFAULT 0,
  sold_listings INTEGER DEFAULT 0,
  
  -- Time metrics
  avg_days_on_market INTEGER,
  
  -- Period
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_date DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_price_district ON market_price_history(district);
CREATE INDEX IF NOT EXISTS idx_market_price_type ON market_price_history(property_type);
CREATE INDEX IF NOT EXISTS idx_market_price_period ON market_price_history(period_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_price_composite ON market_price_history(district, property_type, period_date DESC);

ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view market price history" ON market_price_history
  FOR SELECT USING (true);

-- Market Alerts - Generated intelligence for VIP merchants
CREATE TABLE IF NOT EXISTS market_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Alert classification
  alert_type TEXT NOT NULL, -- 'supply_demand_gap', 'price_trend', 'seasonal', 'competition'
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'moderate', 'low', 'info', 'positive')),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Targeting
  target_district TEXT,
  target_property_type TEXT,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global alerts
  
  -- Data payload
  data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  -- Action tracking
  actionable BOOLEAN DEFAULT false,
  action_text TEXT,
  action_url TEXT,
  action_taken BOOLEAN DEFAULT false,
  action_taken_at TIMESTAMPTZ,
  
  -- Expiry
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_alerts_user ON market_alerts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_market_alerts_type ON market_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_market_alerts_severity ON market_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_market_alerts_read ON market_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_market_alerts_created ON market_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_alerts_expires ON market_alerts(expires_at);

ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alerts or global alerts" ON market_alerts
  FOR SELECT USING (
    target_user_id IS NULL OR 
    auth.uid() = target_user_id OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'vip_merchant'))
  );

CREATE POLICY "Users manage own alerts" ON market_alerts
  FOR UPDATE USING (target_user_id IS NULL OR auth.uid() = target_user_id);

-- Market Search Trends - Track what users are searching for
CREATE TABLE IF NOT EXISTS market_search_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Search parameters
  district TEXT,
  property_type TEXT,
  min_price INTEGER,
  max_price INTEGER,
  bedrooms INTEGER,
  
  -- Search volume
  search_count INTEGER DEFAULT 1,
  unique_searchers INTEGER DEFAULT 1,
  
  -- Engagement
  avg_results_clicked NUMERIC(5,2),
  conversion_rate NUMERIC(5,2), -- % who favorited or contacted
  
  -- Period
  period TEXT NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
  period_timestamp TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_trends_district ON market_search_trends(district);
CREATE INDEX IF NOT EXISTS idx_search_trends_type ON market_search_trends(property_type);
CREATE INDEX IF NOT EXISTS idx_search_trends_period ON market_search_trends(period_timestamp DESC);

ALTER TABLE market_search_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VIP and admin can view search trends" ON market_search_trends
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'vip_merchant'))
  );

-- Supply Demand Gaps - Pre-calculated opportunity windows
CREATE TABLE IF NOT EXISTS supply_demand_gaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  district TEXT NOT NULL,
  property_type TEXT NOT NULL,
  
  -- Gap metrics
  demand_count INTEGER NOT NULL, -- searches in last 30 days
  supply_count INTEGER NOT NULL, -- active listings
  ratio NUMERIC(5,2) NOT NULL, -- demand/supply
  
  -- Opportunity score
  opportunity_score INTEGER CHECK (opportunity_score BETWEEN 0 AND 100),
  severity TEXT CHECK (severity IN ('critical', 'high', 'moderate', 'low')),
  
  -- Recommendation
  recommendation TEXT,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  UNIQUE(district, property_type, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_gaps_district ON supply_demand_gaps(district);
CREATE INDEX IF NOT EXISTS idx_gaps_type ON supply_demand_gaps(property_type);
CREATE INDEX IF NOT EXISTS idx_gaps_score ON supply_demand_gaps(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_gaps_valid ON supply_demand_gaps(valid_until);

ALTER TABLE supply_demand_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VIP and admin can view supply/demand gaps" ON supply_demand_gaps
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'vip_merchant'))
  );

-- ============================================================
-- MARKET INTELLIGENCE VIEWS
-- ============================================================

-- Current market snapshot (placeholder - requires listings table)
CREATE OR REPLACE VIEW market_snapshot AS
SELECT NULL::TEXT as district, NULL::TEXT as property_type, 0::BIGINT as active_listings WHERE false;

-- Price trend analysis (placeholder - requires listings table)
CREATE OR REPLACE VIEW price_trends AS
SELECT NULL::TEXT as district, NULL::TEXT as property_type, NULL::DATE as month WHERE false;

-- Hot districts (placeholder - requires listings table)
CREATE OR REPLACE VIEW hot_districts AS
SELECT NULL::TEXT as district, 0::BIGINT as total_listings WHERE false;

-- ============================================================
-- MARKET INTELLIGENCE FUNCTIONS
-- ============================================================

-- Function to calculate supply/demand ratio
CREATE OR REPLACE FUNCTION calculate_supply_demand_ratio(
  p_district TEXT,
  p_property_type TEXT
) RETURNS TABLE (
  demand INTEGER,
  supply INTEGER,
  ratio NUMERIC,
  opportunity_score INTEGER
) AS $$
DECLARE
  v_demand INTEGER;
  v_supply INTEGER;
  v_ratio NUMERIC;
  v_score INTEGER;
BEGIN
  -- Count searches in last 30 days matching criteria
  SELECT COUNT(*) INTO v_demand
  FROM user_activities
  WHERE activity_type = 'search'
    AND created_at > NOW() - INTERVAL '30 days'
    AND (
      (search_filters->>'district' = p_district OR search_filters->>'location' = p_district)
      AND (search_filters->>'type' = p_property_type OR search_filters->>'property_type' = p_property_type)
    );
  
  -- Count active listings (listings table managed separately)
  v_supply := 0;
  
  -- Calculate ratio
  v_ratio := CASE 
    WHEN v_supply > 0 THEN ROUND((v_demand::NUMERIC / v_supply), 2)
    WHEN v_demand > 0 THEN v_demand::NUMERIC
    ELSE 0
  END;
  
  -- Calculate opportunity score (0-100)
  v_score := LEAST(ROUND(v_ratio * 10), 100);
  
  RETURN QUERY SELECT v_demand, v_supply, v_ratio, v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate market alert
CREATE OR REPLACE FUNCTION generate_market_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}',
  p_actionable BOOLEAN DEFAULT false,
  p_action_text TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO market_alerts (
    alert_type,
    severity,
    title,
    message,
    target_user_id,
    data,
    actionable,
    action_text,
    action_url,
    expires_at
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_target_user_id,
    p_data,
    p_actionable,
    p_action_text,
    p_action_url,
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get opportunity score for listing
CREATE OR REPLACE FUNCTION get_listing_opportunity_score(
  p_district TEXT,
  p_property_type TEXT,
  p_price INTEGER
) RETURNS TABLE (
  score INTEGER,
  rating TEXT,
  demand INTEGER,
  supply INTEGER,
  avg_market_price INTEGER,
  recommendation TEXT
) AS $$
DECLARE
  v_demand INTEGER;
  v_supply INTEGER;
  v_ratio NUMERIC;
  v_avg_price INTEGER;
  v_score INTEGER;
  v_rating TEXT;
  v_recommendation TEXT;
BEGIN
  -- Get supply/demand
  SELECT * INTO v_demand, v_supply, v_ratio
  FROM calculate_supply_demand_ratio(p_district, p_property_type);
  
  -- Average market price (listings table managed separately)
  v_avg_price := 0;
  
  -- Calculate score
  v_score := 50; -- Base
  
  -- Supply/demand factor (up to 30 points)
  IF v_ratio >= 10 THEN
    v_score := v_score + 30;
  ELSIF v_ratio >= 5 THEN
    v_score := v_score + 20;
  ELSIF v_ratio >= 3 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Price competitiveness (up to 20 points)
  IF v_avg_price > 0 THEN
    IF p_price <= v_avg_price * 0.9 THEN
      v_score := v_score + 20; -- 10% below market
    ELSIF p_price <= v_avg_price THEN
      v_score := v_score + 10; -- At market
    ELSIF p_price > v_avg_price * 1.2 THEN
      v_score := v_score - 15; -- 20%+ above market
    END IF;
  END IF;
  
  -- Ensure bounds
  v_score := GREATEST(0, LEAST(100, v_score));
  
  -- Determine rating
  v_rating := CASE
    WHEN v_score >= 80 THEN 'Excellent'
    WHEN v_score >= 60 THEN 'Good'
    WHEN v_score >= 40 THEN 'Fair'
    ELSE 'Poor'
  END;
  
  -- Generate recommendation
  v_recommendation := CASE
    WHEN v_score >= 70 THEN 'STRONG OPPORTUNITY: List immediately for best results.'
    WHEN v_score >= 50 THEN 'DECENT OPPORTUNITY: Consider listing with competitive pricing.'
    ELSE 'CHALLENGING: May need aggressive pricing or wait for better market conditions.'
  END;
  
  RETURN QUERY SELECT v_score, v_rating, v_demand, v_supply, v_avg_price, v_recommendation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh supply/demand gaps (run periodically)
CREATE OR REPLACE FUNCTION refresh_supply_demand_gaps()
RETURNS VOID AS $$
DECLARE
  v_district TEXT;
  v_type TEXT;
  v_demand INTEGER;
  v_supply INTEGER;
  v_ratio NUMERIC;
  v_score INTEGER;
  v_severity TEXT;
  v_recommendation TEXT;
BEGIN
  -- Clear old gaps
  DELETE FROM supply_demand_gaps WHERE valid_until < NOW();
  
  -- Iterate through known districts/types (listings table managed separately)
  FOR v_district, v_type IN 
    SELECT DISTINCT target_district, target_property_type FROM market_alerts 
    WHERE target_district IS NOT NULL AND target_property_type IS NOT NULL
  LOOP
    -- Calculate metrics
    SELECT * INTO v_demand, v_supply, v_ratio, v_score
    FROM calculate_supply_demand_ratio(v_district, v_type);
    
    -- Only store if significant gap
    IF v_ratio >= 3 THEN
      v_severity := CASE
        WHEN v_ratio >= 10 THEN 'critical'
        WHEN v_ratio >= 5 THEN 'high'
        ELSE 'moderate'
      END;
      
      v_recommendation := CASE v_severity
        WHEN 'critical' THEN '🚨 CRITICAL: Extreme undersupply. List immediately!'
        WHEN 'high' THEN '⚡ HIGH DEMAND: Fast sale expected. List now!'
        ELSE '📈 MODERATE: Good opportunity. Consider listing.'
      END;
      
      INSERT INTO supply_demand_gaps (
        district, property_type, demand_count, supply_count, ratio,
        opportunity_score, severity, recommendation
      ) VALUES (
        v_district, v_type, v_demand, v_supply, v_ratio,
        v_score, v_severity, v_recommendation
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNNEL ANALYTICS & ABANDONMENT RECOVERY TABLES
-- ============================================================

-- Funnel Events - Track user progression through conversion stages
CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Funnel stage
  stage TEXT NOT NULL CHECK (stage IN (
    'search', 'view_listing', 'view_details', 'favorite', 
    'contact_click', 'message_sent', 'phone_click', 'whatsapp_click',
    'email_click', 'share_click', 'booking_started', 'booking_complete'
  )),
  
  -- Event metadata
  metadata JSONB DEFAULT '{}',
  
  -- Context
  device_info JSONB DEFAULT '{}',
  referrer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user ON funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_stage ON funnel_events(stage);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON funnel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_metadata ON funnel_events USING GIN(metadata);

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own funnel events" ON funnel_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants view events for their listings" ON funnel_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Abandoned Sessions - Track users who dropped off
CREATE TABLE IF NOT EXISTS abandoned_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User who abandoned
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Listing they were interested in
  listing_id TEXT NOT NULL,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Listing snapshot (in case listing is deleted/modified)
  listing_title TEXT,
  listing_price INTEGER,
  listing_type TEXT,
  listing_district TEXT,
  
  -- Abandonment details
  abandonment_stage TEXT NOT NULL, -- 'view_listing', 'favorite', 'contact_click'
  abandonment_reason TEXT, -- optional survey response
  
  -- Recovery tracking
  recovery_sent BOOLEAN DEFAULT false,
  recovery_sent_at TIMESTAMPTZ,
  recovery_type TEXT, -- 'email', 'sms', 'notification', 'self_returned'
  
  -- Conversion tracking
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  recovered_via TEXT, -- which recovery email worked
  
  -- Expiry
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_user ON abandoned_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_merchant ON abandoned_sessions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_listing ON abandoned_sessions(listing_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_recovered ON abandoned_sessions(recovered);
CREATE INDEX IF NOT EXISTS idx_abandoned_expires ON abandoned_sessions(expires_at);

ALTER TABLE abandoned_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own abandoned sessions" ON abandoned_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants view abandonment for their listings" ON abandoned_sessions
  FOR SELECT USING (auth.uid() = merchant_id);

-- Scheduled Recoveries - Queue for recovery campaigns
CREATE TABLE IF NOT EXISTS scheduled_recoveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Target user
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recovery details
  recovery_type TEXT NOT NULL, -- 'immediate', 'follow_up', 'final'
  email_template TEXT NOT NULL, -- 'still_interested', 'price_drop_alert', 'similar_listings'
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'clicked', 'converted', 'cancelled', 'failed')),
  cancelled_at TIMESTAMPTZ,
  
  -- Engagement tracking
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  
  -- Metadata for email personalization
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_user ON scheduled_recoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_merchant ON scheduled_recoveries(merchant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_recoveries(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_at ON scheduled_recoveries(scheduled_at);

ALTER TABLE scheduled_recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scheduled recoveries" ON scheduled_recoveries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants view scheduled recoveries for their listings" ON scheduled_recoveries
  FOR SELECT USING (auth.uid() = merchant_id);

-- User Funnel Positions - Current state of each user in funnel
CREATE TABLE IF NOT EXISTS user_funnel_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  current_stage TEXT,
  last_listing_id TEXT,
  
  -- Session tracking
  total_sessions INTEGER DEFAULT 0,
  total_listings_viewed INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  
  -- Engagement scoring
  engagement_score INTEGER DEFAULT 0, -- 0-100 based on activity
  
  -- Lifecycle
  first_visit_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_pos_user ON user_funnel_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_pos_stage ON user_funnel_positions(current_stage);
CREATE INDEX IF NOT EXISTS idx_funnel_pos_score ON user_funnel_positions(engagement_score DESC);

ALTER TABLE user_funnel_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own funnel position" ON user_funnel_positions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FUNNEL ANALYTICS VIEWS
-- ============================================================

-- Merchant funnel summary
CREATE OR REPLACE VIEW merchant_funnel_summary AS
SELECT
  (fe.metadata->>'merchant_id')::UUID as merchant_id,
  COUNT(DISTINCT CASE WHEN fe.stage = 'view_listing' THEN fe.user_id END) as unique_viewers,
  COUNT(DISTINCT CASE WHEN fe.stage = 'favorite' THEN fe.user_id END) as unique_favoriters,
  COUNT(DISTINCT CASE WHEN fe.stage = 'contact_click' THEN fe.user_id END) as unique_contactors,
  COUNT(DISTINCT CASE WHEN fe.stage = 'message_sent' THEN fe.user_id END) as unique_messagers,
  COUNT(DISTINCT CASE WHEN fe.stage = 'view_listing' THEN fe.id END) as total_views,
  COUNT(DISTINCT CASE WHEN fe.stage = 'favorite' THEN fe.id END) as total_favorites,
  COUNT(DISTINCT CASE WHEN fe.stage = 'message_sent' THEN fe.id END) as total_messages,
  -- Conversion rates
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN fe.stage = 'view_listing' THEN fe.user_id END) > 0
    THEN ROUND(
      (COUNT(DISTINCT CASE WHEN fe.stage = 'message_sent' THEN fe.user_id END)::NUMERIC / 
       COUNT(DISTINCT CASE WHEN fe.stage = 'view_listing' THEN fe.user_id END)) * 100, 2
    )
    ELSE 0
  END as conversion_rate
FROM funnel_events fe
GROUP BY (fe.metadata->>'merchant_id')::UUID;

-- Abandonment summary by merchant
CREATE OR REPLACE VIEW merchant_abandonment_summary AS
SELECT
  merchant_id,
  COUNT(*) as total_abandoned,
  COUNT(*) FILTER (WHERE recovered = true) as recovered_count,
  COUNT(*) FILTER (WHERE recovered = false AND expires_at > NOW()) as active_abandoned,
  ROUND(
    (COUNT(*) FILTER (WHERE recovered = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) as recovery_rate,
  AVG(listing_price) FILTER (WHERE recovered = false) as avg_potential_value
FROM abandoned_sessions
GROUP BY merchant_id;

-- Daily funnel metrics
CREATE OR REPLACE VIEW daily_funnel_metrics AS
SELECT
  DATE(created_at) as date,
  stage,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM funnel_events
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), stage
ORDER BY date DESC, stage;

-- Recovery campaign performance
CREATE OR REPLACE VIEW recovery_campaign_performance AS
SELECT
  recovery_type,
  email_template,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE clicked = true) as clicks,
  COUNT(*) FILTER (WHERE converted = true) as conversions,
  ROUND(
    (COUNT(*) FILTER (WHERE clicked = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) as click_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE converted = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) as conversion_rate,
  AVG(EXTRACT(EPOCH FROM (sent_at - scheduled_at))/3600)::INTEGER as avg_send_delay_hours
FROM scheduled_recoveries
WHERE status IN ('sent', 'clicked', 'converted')
GROUP BY recovery_type, email_template;

-- ============================================================
-- FUNNEL ANALYTICS FUNCTIONS
-- ============================================================

-- Function to calculate merchant's conversion funnel
CREATE OR REPLACE FUNCTION get_merchant_funnel(
  p_merchant_id UUID,
  p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (
  stage TEXT,
  total_events BIGINT,
  unique_users BIGINT,
  conversion_from_previous NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_counts AS (
    SELECT
      fe.stage,
      COUNT(*) as events,
      COUNT(DISTINCT fe.user_id) as users
    FROM funnel_events fe
    WHERE (fe.metadata->>'merchant_id')::UUID = p_merchant_id
      AND fe.created_at > NOW() - (p_period_days || ' days')::INTERVAL
    GROUP BY fe.stage
  ),
  ordered_stages AS (
    SELECT unnest(ARRAY['view_listing', 'favorite', 'contact_click', 'message_sent']) as stage_order, 
           generate_series(1, 4) as stage_index
  )
  SELECT
    os.stage_order as stage,
    COALESCE(sc.events, 0) as total_events,
    COALESCE(sc.users, 0) as unique_users,
    CASE 
      WHEN os.stage_index = 1 THEN 100.0
      WHEN LAG(COALESCE(sc.users, 0)) OVER (ORDER BY os.stage_index) > 0
      THEN ROUND(
        (COALESCE(sc.users, 0)::NUMERIC / LAG(COALESCE(sc.users, 0)) OVER (ORDER BY os.stage_index)) * 100,
        2
      )
      ELSE 0
    END as conversion_from_previous
  FROM ordered_stages os
  LEFT JOIN stage_counts sc ON sc.stage = os.stage_order
  ORDER BY os.stage_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top abandoned opportunities for merchant
CREATE OR REPLACE FUNCTION get_abandoned_opportunities(
  p_merchant_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  listing_id TEXT,
  listing_title TEXT,
  listing_price INTEGER,
  abandonment_count BIGINT,
  total_potential_value BIGINT,
  hours_since_last_abandonment INTEGER,
  recovery_urgency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.listing_id,
    a.listing_title,
    a.listing_price,
    COUNT(*) as abandonment_count,
    SUM(a.listing_price) as total_potential_value,
    EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at)))/3600::INTEGER as hours_since_last_abandonment,
    CASE
      WHEN EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at)))/3600 < 24 THEN 'urgent'
      WHEN EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at)))/3600 < 72 THEN 'high'
      ELSE 'medium'
    END as recovery_urgency
  FROM abandoned_sessions a
  WHERE a.merchant_id = p_merchant_id
    AND a.recovered = false
    AND a.expires_at > NOW()
  GROUP BY a.listing_id, a.listing_title, a.listing_price
  ORDER BY COUNT(*) DESC, a.listing_price DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark recovery as sent
CREATE OR REPLACE FUNCTION mark_recovery_sent(
  p_recovery_id UUID,
  p_email_tracking_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE scheduled_recoveries
  SET status = 'sent',
      sent_at = NOW(),
      metadata = metadata || jsonb_build_object('email_tracking_id', p_email_tracking_id)
  WHERE id = p_recovery_id;
  
  -- Also update abandoned session
  UPDATE abandoned_sessions
  SET recovery_sent = true,
      recovery_sent_at = NOW()
  WHERE user_id = (SELECT user_id FROM scheduled_recoveries WHERE id = p_recovery_id)
    AND listing_id = (SELECT listing_id FROM scheduled_recoveries WHERE id = p_recovery_id)
    AND recovered = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SOCIAL PROOF & REAL-TIME ACTIVITY TABLES
-- ============================================================

-- Listing Activities - Every view, favorite, contact action
CREATE TABLE IF NOT EXISTS listing_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  listing_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'view', 'favorite', 'unfavorite', 'contact', 'message', 'share', 'phone_click', 'whatsapp_click', 'email_click'
  )),
  
  metadata JSONB DEFAULT '{}',
  
  ip_hash TEXT, -- Hashed IP for duplicate detection (privacy safe)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_listing ON listing_activities(listing_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON listing_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON listing_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON listing_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_session ON listing_activities(session_id);

ALTER TABLE listing_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert activities" ON listing_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Merchants can view activities for their listings" ON listing_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Listing Activity Aggregates - Pre-calculated counts for performance
CREATE TABLE IF NOT EXISTS listing_activity_aggregates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  listing_id TEXT NOT NULL UNIQUE,
  
  -- Time-windowed view counts
  views_1h INTEGER DEFAULT 0,
  views_24h INTEGER DEFAULT 0,
  views_7d INTEGER DEFAULT 0,
  views_30d INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  
  -- Favorites
  favorites_1h INTEGER DEFAULT 0,
  favorites_24h INTEGER DEFAULT 0,
  favorites_7d INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  
  -- Inquiries
  inquiries_1h INTEGER DEFAULT 0,
  inquiries_24h INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  
  -- Trending score (0-100)
  trending_score INTEGER DEFAULT 0,
  
  -- Velocity tracking
  last_activity_at TIMESTAMPTZ,
  activity_velocity TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aggregates_listing ON listing_activity_aggregates(listing_id);
CREATE INDEX IF NOT EXISTS idx_aggregates_trending ON listing_activity_aggregates(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_aggregates_velocity ON listing_activity_aggregates(activity_velocity);

ALTER TABLE listing_activity_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view aggregates" ON listing_activity_aggregates
  FOR SELECT USING (true);

-- User Activity Feed - Personalized feed of updates
CREATE TABLE IF NOT EXISTS user_feed_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feed item details
  feed_type TEXT NOT NULL CHECK (feed_type IN (
    'new_listing', 'price_drop', 'back_on_market', 'trending', 'similar_to_viewed', 
    'favorite_sold', 'favorite_price_drop', 'merchant_new_listing'
  )),
  
  listing_id TEXT,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- price_drop_amount, similarity_score, etc.
  
  -- Priority & timing
  priority INTEGER DEFAULT 0, -- Higher = more important
  expires_at TIMESTAMPTZ,
  
  -- Engagement
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_user ON user_feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_type ON user_feed_items(feed_type);
CREATE INDEX IF NOT EXISTS idx_feed_created ON user_feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_priority ON user_feed_items(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_dismissed ON user_feed_items(dismissed);

ALTER TABLE user_feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feed" ON user_feed_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their feed items" ON user_feed_items
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- SOCIAL PROOF VIEWS
-- ============================================================

-- Trending listings view
CREATE OR REPLACE VIEW trending_listings_view AS
SELECT
  laa.listing_id,
  laa.trending_score,
  laa.views_24h,
  laa.favorites_24h,
  laa.activity_velocity,
  CASE 
    WHEN laa.trending_score >= 80 THEN 'hot'
    WHEN laa.trending_score >= 60 THEN 'trending'
    WHEN laa.trending_score >= 40 THEN 'rising'
    ELSE 'normal'
  END as trend_status
FROM listing_activity_aggregates laa
ORDER BY laa.trending_score DESC;

-- Hot properties (real-time popular)
CREATE OR REPLACE VIEW hot_properties_now AS
SELECT
  laa.listing_id,
  laa.views_1h,
  laa.favorites_1h,
  laa.trending_score
FROM listing_activity_aggregates laa
WHERE laa.views_1h > 0
ORDER BY laa.views_1h DESC, laa.trending_score DESC;

-- Merchant social proof stats
CREATE OR REPLACE VIEW merchant_social_proof_stats AS
SELECT
  laa.listing_id,
  SUM(laa.total_views) as total_views,
  SUM(laa.total_favorites) as total_favorites,
  AVG(laa.trending_score) as avg_trending_score,
  COUNT(DISTINCT CASE WHEN laa.trending_score >= 70 THEN laa.listing_id END) as hot_listings,
  SUM(laa.views_24h) as views_today,
  SUM(laa.favorites_24h) as favorites_today
FROM listing_activity_aggregates laa
GROUP BY laa.listing_id;

-- ============================================================
-- SOCIAL PROOF FUNCTIONS
-- ============================================================

-- Function to update activity aggregates
CREATE OR REPLACE FUNCTION update_listing_activity_aggregate(
  p_listing_id TEXT,
  p_activity_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert or update aggregate record
  INSERT INTO listing_activity_aggregates (
    listing_id, views_1h, views_24h, views_7d, views_30d, total_views,
    favorites_1h, favorites_24h, favorites_7d, total_favorites,
    inquiries_1h, inquiries_24h, total_inquiries,
    last_activity_at, updated_at
  )
  VALUES (
    p_listing_id,
    CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type IN ('contact', 'message') THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type IN ('contact', 'message') THEN 1 ELSE 0 END,
    CASE WHEN p_activity_type IN ('contact', 'message') THEN 1 ELSE 0 END,
    NOW(),
    NOW()
  )
  ON CONFLICT (listing_id) DO UPDATE SET
    views_1h = listing_activity_aggregates.views_1h + CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    views_24h = listing_activity_aggregates.views_24h + CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    views_7d = listing_activity_aggregates.views_7d + CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    views_30d = listing_activity_aggregates.views_30d + CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    total_views = listing_activity_aggregates.total_views + CASE WHEN p_activity_type = 'view' THEN 1 ELSE 0 END,
    favorites_1h = listing_activity_aggregates.favorites_1h + CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    favorites_24h = listing_activity_aggregates.favorites_24h + CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    favorites_7d = listing_activity_aggregates.favorites_7d + CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    total_favorites = listing_activity_aggregates.total_favorites + CASE WHEN p_activity_type = 'favorite' THEN 1 ELSE 0 END,
    inquiries_1h = listing_activity_aggregates.inquiries_1h + CASE WHEN p_activity_type IN ('contact', 'message') THEN 1 ELSE 0 END,
    inquiries_24h = listing_activity_aggregates.inquiries_24h + CASE WHEN p_activity_type IN ('contact', 'message') THEN 1 ELSE 0 END,
    total_inquiries = listing_activity_aggregates.total_inquiries + CASE WHEN p_activity_type IN ('contact', 'message') THEN 1 ELSE 0 END,
    last_activity_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_listing_id TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER;
  v_agg listing_activity_aggregates%ROWTYPE;
BEGIN
  SELECT * INTO v_agg FROM listing_activity_aggregates WHERE listing_id = p_listing_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate score based on recent activity
  v_score := LEAST(COALESCE(v_agg.views_24h, 0) * 2, 40)
           + LEAST(COALESCE(v_agg.favorites_24h, 0) * 10, 30)
           + LEAST(COALESCE(v_agg.inquiries_24h, 0) * 15, 20);
  
  -- Velocity bonus
  IF COALESCE(v_agg.views_1h, 0) > 0 THEN
    v_score := v_score + 10;
  END IF;
  
  -- Cap at 100
  v_score := LEAST(v_score, 100);
  
  -- Update the aggregate
  UPDATE listing_activity_aggregates
  SET trending_score = v_score,
      activity_velocity = CASE 
        WHEN COALESCE(v_agg.views_1h, 0) > 5 THEN 'high'
        WHEN COALESCE(v_agg.views_24h, 0) > 20 THEN 'medium'
        ELSE 'low'
      END,
      updated_at = NOW()
  WHERE listing_id = p_listing_id;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh all aggregates (run periodically via cron)
CREATE OR REPLACE FUNCTION refresh_activity_aggregates()
RETURNS VOID AS $$
BEGIN
  -- Reset 1h and 24h counters (they're meant to be sliding windows)
  UPDATE listing_activity_aggregates
  SET views_1h = 0,
      favorites_1h = 0,
      inquiries_1h = 0,
      updated_at = NOW()
  WHERE updated_at < NOW() - INTERVAL '1 hour';
  
  -- Recalculate trending scores for active listings
  PERFORM calculate_trending_score(listing_id)
  FROM listing_activity_aggregates
  WHERE updated_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate personalized feed for user
CREATE OR REPLACE FUNCTION generate_user_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID,
  feed_type TEXT,
  listing_id TEXT,
  title TEXT,
  description TEXT,
  priority INTEGER
) AS $$
BEGIN
  -- Delete old feed items
  DELETE FROM user_feed_items 
  WHERE user_id = p_user_id 
    AND created_at < NOW() - INTERVAL '7 days';
  
  -- Note: new listing alerts require listings table (managed separately)
  
  -- Note: price drop alerts require listings table (managed separately)
  
  -- Note: trending alerts require listings table (managed separately)
  
  -- Return the feed
  RETURN QUERY
  SELECT 
    ufi.id,
    ufi.feed_type,
    ufi.listing_id,
    ufi.title,
    ufi.description,
    ufi.priority
  FROM user_feed_items ufi
  WHERE ufi.user_id = p_user_id
    AND ufi.dismissed = false
    AND (ufi.expires_at IS NULL OR ufi.expires_at > NOW())
  ORDER BY ufi.priority DESC, ufi.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROPERTY STATUS UPDATES - LinkedIn-style Professional Feed
-- ============================================================
CREATE TABLE IF NOT EXISTS property_status_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_type TEXT DEFAULT 'user', -- 'user' or 'merchant'
  content TEXT NOT NULL,
  
  -- Property Proof Requirements (All required for posting)
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'land', 'commercial', 'other')),
  location TEXT NOT NULL, -- Must include location
  price_estimate DECIMAL(12,2), -- Optional price
  property_size_sqm DECIMAL(10,2), -- Property size
  
  -- Media (At least 1 required - enforced by validation)
  media_urls TEXT[] DEFAULT '{}', -- Array of image/video URLs
  
  -- Linked to actual listing (optional - can be standalone status)
  linked_listing_id TEXT,
  linked_listing_type TEXT CHECK (linked_listing_type IN ('apartment', 'car', 'land')),
  
  -- Engagement metrics
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  
  -- Status options
  status_type TEXT DEFAULT 'available' CHECK (status_type IN ('available', 'sold', 'price_drop', 'open_house', 'coming_soon', 'market_insight')),
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  is_approved BOOLEAN DEFAULT true, -- Auto-approved, flagged if reported
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_status_user_id ON property_status_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_property_status_created_at ON property_status_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_status_type ON property_status_updates(status_type);
CREATE INDEX IF NOT EXISTS idx_property_status_approved ON property_status_updates(is_approved, is_flagged) WHERE is_approved = true AND is_flagged = false;

-- Enable RLS
ALTER TABLE property_status_updates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view approved property updates" ON property_status_updates
  FOR SELECT USING (is_approved = true AND is_flagged = false);

CREATE POLICY "Users can create own property updates" ON property_status_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property updates" ON property_status_updates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own property updates" ON property_status_updates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all property updates" ON property_status_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_property_status_updated_at
  BEFORE UPDATE ON property_status_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PROPERTY STATUS LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS property_status_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID REFERENCES property_status_updates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(status_id, user_id) -- Prevent duplicate likes
);

CREATE INDEX IF NOT EXISTS idx_property_likes_status_id ON property_status_likes(status_id);
CREATE INDEX IF NOT EXISTS idx_property_likes_user_id ON property_status_likes(user_id);

ALTER TABLE property_status_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON property_status_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can add own likes" ON property_status_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes" ON property_status_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PROPERTY STATUS COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS property_status_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID REFERENCES property_status_updates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES property_status_comments(id) ON DELETE CASCADE, -- For threaded replies
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_comments_status_id ON property_status_comments(status_id);
CREATE INDEX IF NOT EXISTS idx_property_comments_user_id ON property_status_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_property_comments_parent ON property_status_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

ALTER TABLE property_status_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON property_status_comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create own comments" ON property_status_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON property_status_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON property_status_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_property_comments_updated_at
  BEFORE UPDATE ON property_status_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Increment/decrement likes count
-- ============================================================
CREATE OR REPLACE FUNCTION update_property_status_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE property_status_updates 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.status_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE property_status_updates 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.status_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_status_likes_count_trigger
  AFTER INSERT OR DELETE ON property_status_likes
  FOR EACH ROW EXECUTE FUNCTION update_property_status_likes_count();

-- ============================================================
-- FUNCTION: Update comments count
-- ============================================================
CREATE OR REPLACE FUNCTION update_property_status_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE property_status_updates 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.status_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false) THEN
    UPDATE property_status_updates 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = COALESCE(NEW.status_id, OLD.status_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_status_comments_count_trigger
  AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON property_status_comments
  FOR EACH ROW EXECUTE FUNCTION update_property_status_comments_count();

-- ============================================================
-- REVENUE STREAM 1: MERCHANT SUBSCRIPTION TIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Tier levels
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'professional', 'enterprise')),
  
  -- Pricing
  monthly_price DECIMAL(10,2) DEFAULT 0,
  yearly_price DECIMAL(10,2) DEFAULT 0,
  
  -- Lead allowances
  free_leads_per_month INT DEFAULT 30,
  lead_cost_excess DECIMAL(5,2) DEFAULT 0.50, -- $0.50 per lead after free allowance
  
  -- Feature limits
  max_listings INT DEFAULT 5,        -- Free: 5, Pro: 20, Enterprise: unlimited
  max_featured_listings INT DEFAULT 1, -- Free: 1, Pro: 5, Enterprise: 10
  max_sponsored_posts INT DEFAULT 0,   -- Free: 0, Pro: 2/month, Enterprise: unlimited
  
  -- Features enabled
  analytics_enabled BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  virtual_tours_included BOOLEAN DEFAULT false,
  dedicated_account_manager BOOLEAN DEFAULT false,
  
  -- Subscription status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Payment info (Stripe/PayPal IDs)
  payment_provider TEXT,
  subscription_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id)
);

-- Enable RLS
ALTER TABLE merchant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Merchants can view own subscription" ON merchant_subscriptions
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Admins can manage all subscriptions" ON merchant_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger
CREATE TRIGGER update_merchant_subscriptions_updated_at
  BEFORE UPDATE ON merchant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default subscription on merchant creation
CREATE OR REPLACE FUNCTION create_merchant_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO merchant_subscriptions (
    merchant_id,
    tier,
    monthly_price,
    free_leads_per_month,
    max_listings,
    max_featured_listings,
    analytics_enabled
  ) VALUES (
    NEW.user_id,
    'free',
    0,
    30,  -- 30 FREE leads per month!
    5,
    1,
    false
  )
  ON CONFLICT (merchant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_merchant_subscription
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  WHEN (NEW.role = 'merchant')
  EXECUTE FUNCTION create_merchant_subscription();

-- ============================================================
-- REVENUE STREAM 2: LEAD TRACKING & BILLING
-- (merchant_leads table already created above - ensure billing columns exist)
-- ============================================================
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS listing_id TEXT;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS listing_type TEXT;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS lead_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS lead_email TEXT;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS lead_phone TEXT;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT true;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS qualification_reason TEXT;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS is_free_lead BOOLEAN DEFAULT false;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS lead_cost DECIMAL(5,2) DEFAULT 0;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT false;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS billed_at TIMESTAMPTZ;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS invoice_id TEXT;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS converted_to_sale BOOLEAN DEFAULT false;
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS sale_value DECIMAL(12,2);
ALTER TABLE merchant_leads ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_merchant_leads_merchant_id ON merchant_leads(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_created_at ON merchant_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_merchant_leads_billing ON merchant_leads(merchant_id, is_billed, is_free_lead);

CREATE POLICY "Users can view leads they created" ON merchant_leads
  FOR SELECT USING (auth.uid() = lead_user_id);

CREATE POLICY "System can insert leads" ON merchant_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all leads" ON merchant_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to count free leads used this month
CREATE OR REPLACE FUNCTION get_free_leads_used(p_merchant_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM merchant_leads
  WHERE merchant_id = p_merchant_id
    AND is_free_lead = true
    AND contacted_at >= DATE_TRUNC('month', NOW())
    AND contacted_at < DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine if lead is free or paid
CREATE OR REPLACE FUNCTION calculate_lead_cost(
  p_merchant_id UUID,
  p_source TEXT DEFAULT 'listing_contact'
)
RETURNS TABLE(is_free BOOLEAN, cost DECIMAL(5,2)) AS $$
DECLARE
  v_free_used INT;
  v_free_limit INT;
  v_tier TEXT;
  v_cost DECIMAL(5,2);
BEGIN
  -- Get merchant subscription
  SELECT ms.free_leads_per_month, ms.tier, ms.lead_cost_excess
  INTO v_free_limit, v_tier, v_cost
  FROM merchant_subscriptions ms
  WHERE ms.merchant_id = p_merchant_id;
  
  IF v_free_limit IS NULL THEN
    v_free_limit := 30; -- Default
    v_cost := 0.50;
  END IF;
  
  -- Count free leads used this month
  SELECT get_free_leads_used(p_merchant_id) INTO v_free_used;
  
  -- Determine if this lead is free
  IF v_free_used < v_free_limit THEN
    RETURN QUERY SELECT true, 0::DECIMAL(5,2);
  ELSE
    -- Source-based pricing
    IF p_source IN ('sponsored_post', 'featured_listing') THEN
      v_cost := GREATEST(v_cost, 2.00); -- Premium leads cost more
    END IF;
    RETURN QUERY SELECT false, v_cost;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a lead (called when user contacts merchant)
CREATE OR REPLACE FUNCTION record_merchant_lead(
  p_merchant_id UUID,
  p_listing_id TEXT,
  p_listing_type TEXT,
  p_source TEXT,
  p_lead_user_id UUID DEFAULT NULL,
  p_lead_email TEXT DEFAULT NULL,
  p_lead_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_is_free BOOLEAN;
  v_cost DECIMAL(5,2);
  v_lead_id UUID;
  v_result JSONB;
BEGIN
  -- Calculate if free and cost
  SELECT * INTO v_is_free, v_cost FROM calculate_lead_cost(p_merchant_id, p_source);
  
  -- Insert lead
  INSERT INTO merchant_leads (
    merchant_id,
    listing_id,
    listing_type,
    source,
    lead_user_id,
    lead_email,
    lead_phone,
    is_free_lead,
    lead_cost
  ) VALUES (
    p_merchant_id,
    p_listing_id,
    p_listing_type,
    p_source,
    p_lead_user_id,
    p_lead_email,
    p_lead_phone,
    v_is_free,
    v_cost
  )
  RETURNING id INTO v_lead_id;
  
  v_result := jsonb_build_object(
    'lead_id', v_lead_id,
    'is_free', v_is_free,
    'cost', v_cost,
    'message', CASE 
      WHEN v_is_free THEN 'Free lead! (' || (get_free_leads_used(p_merchant_id) + 1) || '/30 used this month)'
      ELSE 'Paid lead: $' || v_cost || ' (Free limit reached)'
    END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REVENUE STREAM 3: SPONSORED POSTS / PROPERTY FEED ADS
-- ============================================================
CREATE TABLE IF NOT EXISTS sponsored_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Post content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  
  -- Property details
  property_type TEXT,
  location TEXT,
  price DECIMAL(12,2),
  
  -- Targeting
  target_locations TEXT[] DEFAULT '{}',
  target_property_types TEXT[] DEFAULT '{}',
  
  -- Campaign
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  daily_budget DECIMAL(10,2),
  total_budget DECIMAL(10,2),
  
  -- Performance
  impressions_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_posts_status ON sponsored_posts(status);
CREATE INDEX IF NOT EXISTS idx_sponsored_posts_dates ON sponsored_posts(start_date, end_date);

ALTER TABLE sponsored_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own sponsored posts" ON sponsored_posts
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Anyone can view active sponsored posts" ON sponsored_posts
  FOR SELECT USING (status = 'active' AND NOW() BETWEEN start_date AND end_date);

CREATE POLICY "Merchants can create sponsored posts" ON sponsored_posts
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Admins can approve/reject sponsored posts" ON sponsored_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_sponsored_posts_updated_at
  BEFORE UPDATE ON sponsored_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REVENUE STREAM 4: INVOICES & BILLING
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT CHECK (invoice_type IN ('subscription', 'leads', 'sponsored_posts', 'featured_listings')),
  
  -- Amounts
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Line items (JSON array)
  line_items JSONB DEFAULT '[]',
  
  -- Period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  paid_at TIMESTAMPTZ,
  paid_via TEXT,
  payment_id TEXT,
  
  -- Due date
  due_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_invoices_merchant ON merchant_invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_invoices_status ON merchant_invoices(status);

ALTER TABLE merchant_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own invoices" ON merchant_invoices
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Admins can manage all invoices" ON merchant_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to generate monthly invoice
CREATE OR REPLACE FUNCTION generate_monthly_invoice(p_merchant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_subtotal DECIMAL(10,2) := 0;
  v_line_items JSONB := '[]';
  v_subscription_amount DECIMAL(10,2);
  v_leads_amount DECIMAL(10,2);
  v_sponsored_amount DECIMAL(10,2);
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  v_period_start := DATE_TRUNC('month', NOW() - INTERVAL '1 month');
  v_period_end := DATE_TRUNC('month', NOW());
  
  -- Get subscription amount
  SELECT COALESCE(monthly_price, 0) INTO v_subscription_amount
  FROM merchant_subscriptions
  WHERE merchant_id = p_merchant_id
    AND tier != 'free';
  
  -- Get leads amount (paid leads only)
  SELECT COALESCE(SUM(lead_cost), 0) INTO v_leads_amount
  FROM merchant_leads
  WHERE merchant_id = p_merchant_id
    AND is_free_lead = false
    AND contacted_at >= v_period_start
    AND contacted_at < v_period_end
    AND is_billed = false;
  
  -- Get sponsored posts amount
  SELECT COALESCE(SUM(spent_amount), 0) INTO v_sponsored_amount
  FROM sponsored_posts
  WHERE merchant_id = p_merchant_id
    AND created_at >= v_period_start
    AND created_at < v_period_end;
  
  v_subtotal := v_subscription_amount + v_leads_amount + v_sponsored_amount;
  
  -- Build line items
  IF v_subscription_amount > 0 THEN
    v_line_items := v_line_items || jsonb_build_object(
      'description', 'Professional Subscription',
      'amount', v_subscription_amount
    );
  END IF;
  
  IF v_leads_amount > 0 THEN
    v_line_items := v_line_items || jsonb_build_object(
      'description', 'Qualified Leads',
      'amount', v_leads_amount,
      'count', (SELECT COUNT(*) FROM merchant_leads WHERE merchant_id = p_merchant_id AND is_free_lead = false AND contacted_at >= v_period_start AND contacted_at < v_period_end)
    );
  END IF;
  
  -- Only create invoice if there's a charge
  IF v_subtotal > 0 THEN
    -- Generate invoice number
    v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || SUBSTRING(p_merchant_id::TEXT, 1, 8);
    
    INSERT INTO merchant_invoices (
      merchant_id,
      invoice_number,
      invoice_type,
      subtotal,
      total_amount,
      line_items,
      period_start,
      period_end,
      due_date
    ) VALUES (
      p_merchant_id,
      v_invoice_number,
      'subscription',
      v_subtotal,
      v_subtotal, -- Add tax calculation here if needed
      v_line_items,
      v_period_start,
      v_period_end,
      NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO v_invoice_id;
    
    -- Mark leads as billed
    UPDATE merchant_leads
    SET is_billed = true, billed_at = NOW(), invoice_id = v_invoice_number
    WHERE merchant_id = p_merchant_id
      AND is_free_lead = false
      AND contacted_at >= v_period_start
      AND contacted_at < v_period_end
      AND is_billed = false;
  END IF;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- REVENUE STREAM 5: PARTNERSHIPS & COMMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Partner details
  partner_name TEXT NOT NULL,
  partner_type TEXT CHECK (partner_type IN ('mortgage', 'moving', 'insurance', 'interior_design', 'legal', 'valuation')),
  partner_logo_url TEXT,
  partner_website TEXT,
  
  -- Commission structure
  commission_type TEXT DEFAULT 'per_lead' CHECK (commission_type IN ('per_lead', 'per_conversion', 'percentage')),
  commission_amount DECIMAL(10,2),
  commission_percentage DECIMAL(5,2), -- For percentage type
  
  -- Tracking
  api_endpoint TEXT,
  tracking_code TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track partner referrals
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partner_integrations(id) ON DELETE CASCADE,
  
  -- Referral details
  user_id UUID REFERENCES auth.users(id),
  listing_id TEXT,
  listing_type TEXT,
  
  -- Conversion tracking
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(12,2),
  commission_earned DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE partner_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partners" ON partner_integrations
  FOR SELECT USING (is_active = true);

CREATE POLICY "System can record referrals" ON partner_referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage partners" ON partner_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default partners
INSERT INTO partner_integrations (partner_name, partner_type, commission_type, commission_amount, commission_percentage, priority) VALUES
  ('BK Mortgage', 'mortgage', 'per_conversion', 100.00, NULL, 1),
  ('Rwanda Moving Co', 'moving', 'per_lead', 20.00, NULL, 2),
  ('SafeHome Insurance', 'insurance', 'percentage', NULL, 10.00, 3),
  ('Elite Interior Design', 'interior_design', 'per_lead', 30.00, NULL, 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MERCHANT DASHBOARD VIEW: Revenue Analytics
-- ============================================================
CREATE OR REPLACE VIEW merchant_revenue_analytics AS
SELECT 
  ms.merchant_id,
  ms.tier,
  ms.free_leads_per_month,
  COUNT(ml.id) FILTER (WHERE ml.is_free_lead = true AND ml.contacted_at >= DATE_TRUNC('month', NOW())) as free_leads_used,
  COUNT(ml.id) FILTER (WHERE ml.is_free_lead = false AND ml.contacted_at >= DATE_TRUNC('month', NOW())) as paid_leads_this_month,
  COALESCE(SUM(ml.lead_cost) FILTER (WHERE ml.contacted_at >= DATE_TRUNC('month', NOW())), 0) as total_lead_cost_this_month,
  COUNT(sp.id) FILTER (WHERE sp.status = 'active') as active_sponsored_posts,
  COALESCE(SUM(sp.spent_amount), 0) as total_sponsored_spend,
  (SELECT total_amount FROM merchant_invoices WHERE merchant_id = ms.merchant_id AND status = 'pending' ORDER BY created_at DESC LIMIT 1) as pending_invoice_amount
FROM merchant_subscriptions ms
LEFT JOIN merchant_leads ml ON ml.merchant_id = ms.merchant_id
LEFT JOIN sponsored_posts sp ON sp.merchant_id = ms.merchant_id
GROUP BY ms.merchant_id, ms.tier, ms.free_leads_per_month;

-- ============================================================
-- RWANDA PAYMENTS: Mobile Money & Bank Integration
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Payer info
  user_id UUID REFERENCES auth.users(id),
  user_type TEXT DEFAULT 'merchant' CHECK (user_type IN ('merchant', 'user', 'admin')),
  
  -- Payment details
  payment_type TEXT NOT NULL CHECK (payment_type IN (
    'subscription', 'lead_fee', 'sponsored_post', 
    'featured_listing', 'invoice_payment', 'credit_purchase'
  )),
  
  -- Reference codes for tracking
  internal_reference TEXT UNIQUE NOT NULL, -- e.g., HOME-202401-M-abc123
  merchant_reference TEXT, -- Merchant's own reference
  
  -- Payment method
  payment_method TEXT NOT NULL CHECK (payment_method IN ('momo_mtn', 'momo_airtel', 'bank_bok', 'cash', 'other')),
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'RWF',
  exchange_rate DECIMAL(10,4) DEFAULT 1, -- For USD conversion if needed
  amount_usd DECIMAL(10,2),
  
  -- Payment status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Awaiting payment
    'awaiting_confirmation', -- Payment sent, awaiting verification
    'completed',         -- Payment verified
    'failed',           -- Payment failed
    'cancelled',        -- Cancelled by user
    'refunded'          -- Refunded
  )),
  
  -- Payment instructions (shown to user)
  payment_instructions JSONB DEFAULT '{}',
  -- Example: {"momo_number": "+250783962518", "message": "Pay to MTN MoMo..."}
  
  -- Verification details
  verification_method TEXT CHECK (verification_method IN ('manual', 'api_webhook', 'auto_simulation')),
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified (if manual)
  verified_at TIMESTAMPTZ,
  verification_source TEXT, -- e.g. momo_sms, bank_transfer, receipt_upload, manual
  verification_notes TEXT,
  
  -- MoMo/Bank specific tracking
  momo_transaction_id TEXT,
  bank_reference TEXT,
  sender_phone TEXT, -- Last 4 digits for verification
  sender_name TEXT,
  
  -- Receipt/Proof
  receipt_url TEXT, -- Uploaded screenshot/proof
  
  -- Related records
  invoice_id UUID REFERENCES merchant_invoices(id),
  subscription_id UUID REFERENCES merchant_subscriptions(id),
  lead_id UUID REFERENCES merchant_leads(id),
  sponsored_post_id UUID REFERENCES sponsored_posts(id),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'), -- Payment window
  completed_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(internal_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pending ON payment_transactions(status) WHERE status IN ('pending', 'awaiting_confirmation');

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own payments" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PAYMENT PLATFORM CONFIGURATION (Your MoMo/Bank Details)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_platform_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Platform details (YOUR receiving accounts)
  platform_name TEXT NOT NULL,
  
  -- MTN MoMo
  momo_mtn_number TEXT DEFAULT '+250783962518',
  momo_mtn_name TEXT DEFAULT 'HOME AFRICA Ltd',
  momo_mtn_enabled BOOLEAN DEFAULT true,
  
  -- Airtel MoMo (optional)
  momo_airtel_number TEXT,
  momo_airtel_name TEXT,
  momo_airtel_enabled BOOLEAN DEFAULT false,
  
  -- Bank of Kigali
  bank_name TEXT DEFAULT 'Bank of Kigali',
  bank_account_number TEXT DEFAULT '100032273461',
  bank_account_name TEXT DEFAULT 'HOME AFRICA Ltd',
  bank_swift_code TEXT DEFAULT 'BKIGRWRW',
  bank_enabled BOOLEAN DEFAULT true,
  
  -- Fees configuration (who pays)
  momo_fee_bearer TEXT DEFAULT 'merchant' CHECK (momo_fee_bearer IN ('platform', 'merchant')),
  bank_fee_bearer TEXT DEFAULT 'merchant' CHECK (bank_fee_bearer IN ('platform', 'merchant')),
  momo_fee_percentage DECIMAL(5,2) DEFAULT 1.0, -- 1% MTN fee
  bank_fee_percentage DECIMAL(5,2) DEFAULT 0.5, -- 0.5% bank fee
  
  -- Auto-confirmation settings
  auto_confirm_enabled BOOLEAN DEFAULT false, -- For development/testing
  auto_confirm_threshold DECIMAL(10,2) DEFAULT 100000, -- Max RWF to auto-confirm
  
  -- Webhook/API settings (for future automation)
  webhook_url TEXT,
  webhook_secret TEXT,
  api_enabled BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default config (only one row needed)
INSERT INTO payment_platform_config (
  platform_name,
  momo_mtn_number,
  momo_mtn_enabled,
  bank_account_number,
  bank_enabled,
  momo_fee_bearer,
  bank_fee_bearer
) VALUES (
  'HOME AFRICA Rwanda',
  '+250783962518',
  true,
  '100032273461',
  true,
  'merchant',
  'merchant'
)
ON CONFLICT DO NOTHING;

ALTER TABLE payment_platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment config" ON payment_platform_config
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update config" ON payment_platform_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FUNCTION: Generate unique payment reference
-- ============================================================
CREATE OR REPLACE FUNCTION generate_payment_reference(
  p_user_id UUID,
  p_payment_type TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_timestamp TEXT;
  v_random TEXT;
  v_reference TEXT;
BEGIN
  -- Prefix based on payment type
  v_prefix := CASE p_payment_type
    WHEN 'subscription' THEN 'SUB'
    WHEN 'lead_fee' THEN 'LEAD'
    WHEN 'sponsored_post' THEN 'AD'
    WHEN 'featured_listing' THEN 'FEAT'
    WHEN 'invoice_payment' THEN 'INV'
    ELSE 'PAY'
  END;
  
  -- Timestamp component (YYMMDD)
  v_timestamp := TO_CHAR(NOW(), 'YYMMDD');
  
  -- Random component (6 chars)
  v_random := SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
  
  -- Combine: HOME-SUB-240526-abc123
  v_reference := 'HOME-' || v_prefix || '-' || v_timestamp || '-' || v_random;
  
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Create new payment transaction
-- ============================================================
CREATE OR REPLACE FUNCTION create_payment_transaction(
  p_user_id UUID,
  p_payment_type TEXT,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT DEFAULT NULL,
  p_invoice_id UUID DEFAULT NULL,
  p_subscription_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_reference TEXT;
  v_config payment_platform_config%ROWTYPE;
  v_instructions JSONB;
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- Generate unique reference
  v_reference := generate_payment_reference(p_user_id, p_payment_type);
  
  -- Get platform config
  SELECT * INTO v_config FROM payment_platform_config LIMIT 1;
  
  -- Build payment instructions based on method
  IF p_payment_method = 'momo_mtn' THEN
    v_instructions := jsonb_build_object(
      'method', 'MTN Mobile Money',
      'recipient_number', v_config.momo_mtn_number,
      'recipient_name', v_config.momo_mtn_name,
      'amount', p_amount,
      'currency', 'RWF',
      'reference', v_reference,
      'ussd_code', '*182*1*1*' || REPLACE(REPLACE(v_config.momo_mtn_number, '+', ''), ' ', '') || '*' || p_amount || '*' || v_reference || '#',
      'instructions', ARRAY[
        'Dial *182#',
        'Select 1 (Send Money)',
        'Enter phone: ' || v_config.momo_mtn_number,
        'Enter amount: ' || p_amount,
        'Enter PIN',
        'Reference: ' || v_reference,
        'Confirm payment'
      ],
      'alternative', 'Use MTN MoMo App → Send Money → Enter ' || v_config.momo_mtn_number || ' → Amount ' || p_amount || ' → Reference: ' || v_reference
    );
  ELSIF p_payment_method = 'bank_bok' THEN
    v_instructions := jsonb_build_object(
      'method', 'Bank of Kigali Transfer',
      'bank_name', v_config.bank_name,
      'account_number', v_config.bank_account_number,
      'account_name', v_config.bank_account_name,
      'swift_code', v_config.bank_swift_code,
      'amount', p_amount,
      'currency', 'RWF',
      'reference', v_reference,
      'instructions', ARRAY[
        'Log into your Bank of Kigali app or visit branch',
        'Transfer to Account: ' || v_config.bank_account_number,
        'Name: ' || v_config.bank_account_name,
        'Amount: ' || p_amount || ' RWF',
        'Reference: ' || v_reference,
        'Upload proof after payment'
      ]
    );
  END IF;
  
  -- Insert transaction
  INSERT INTO payment_transactions (
    user_id,
    payment_type,
    internal_reference,
    payment_method,
    amount,
    currency,
    payment_instructions,
    invoice_id,
    subscription_id,
    description,
    status
  ) VALUES (
    p_user_id,
    p_payment_type,
    v_reference,
    p_payment_method,
    p_amount,
    'RWF',
    v_instructions,
    p_invoice_id,
    p_subscription_id,
    p_description,
    'pending'
  )
  RETURNING id INTO v_transaction_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'reference', v_reference,
    'amount', p_amount,
    'instructions', v_instructions,
    'message', 'Payment created. Use reference ' || v_reference || ' when making payment.'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Verify payment (admin or auto)
-- ============================================================
CREATE OR REPLACE FUNCTION verify_payment(
  p_transaction_id UUID,
  p_verified_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_verification_source TEXT DEFAULT NULL,
  p_auto_verify BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_transaction payment_transactions%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get transaction
  SELECT * INTO v_transaction FROM payment_transactions WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  IF v_transaction.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already verified');
  END IF;
  
  -- Update transaction
  UPDATE payment_transactions
  SET 
    status = 'completed',
    verified_by = p_verified_by,
    verified_at = NOW(),
    completed_at = NOW(),
    verification_method = CASE WHEN p_auto_verify THEN 'auto_simulation' ELSE 'manual' END,
    verification_source = p_verification_source,
    verification_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_transaction_id;
  
  -- If invoice payment, mark invoice as paid
  IF v_transaction.invoice_id IS NOT NULL THEN
    UPDATE merchant_invoices
    SET 
      status = 'paid',
      paid_at = NOW(),
      paid_via = v_transaction.payment_method,
      payment_id = v_transaction.internal_reference
    WHERE id = v_transaction.invoice_id;
  END IF;
  
  -- If subscription payment, activate subscription
  IF v_transaction.subscription_id IS NOT NULL THEN
    UPDATE merchant_subscriptions
    SET 
      status = 'active',
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '30 days'
    WHERE id = v_transaction.subscription_id;
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', p_transaction_id,
    'reference', v_transaction.internal_reference,
    'amount', v_transaction.amount,
    'message', 'Payment verified successfully'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Auto-confirm small payments (for dev/testing)
-- ============================================================
CREATE OR REPLACE FUNCTION auto_confirm_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_config payment_platform_config%ROWTYPE;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM payment_platform_config LIMIT 1;
  
  -- Auto-confirm if enabled and under threshold
  IF v_config.auto_confirm_enabled 
     AND NEW.amount <= v_config.auto_confirm_threshold 
     AND NEW.status = 'awaiting_confirmation' THEN
    
    -- Simulate verification after 5 seconds
    PERFORM pg_sleep(5);
    
    UPDATE payment_transactions
    SET 
      status = 'completed',
      verified_at = NOW(),
      completed_at = NOW(),
      verification_method = 'auto_simulation',
      verification_notes = 'Auto-confirmed (amount under ' || v_config.auto_confirm_threshold || ' RWF)',
      updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Update related records
    IF NEW.invoice_id IS NOT NULL THEN
      UPDATE merchant_invoices
      SET status = 'paid', paid_at = NOW(), paid_via = NEW.payment_method
      WHERE id = NEW.invoice_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (disabled by default, enable for testing)
-- CREATE TRIGGER auto_confirm_payment_trigger
--   AFTER INSERT ON payment_transactions
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_confirm_payment();

-- ============================================================
-- VIEW: Pending payments for admin dashboard
-- ============================================================
CREATE OR REPLACE VIEW pending_payments_view AS
SELECT 
  pt.id,
  pt.internal_reference,
  pt.user_id,
  up.full_name as user_name,
  au.email as user_email,
  pt.payment_type,
  pt.payment_method,
  pt.amount,
  pt.currency,
  pt.status,
  pt.created_at,
  pt.payment_instructions,
  pt.receipt_url,
  pt.sender_phone,
  pt.sender_name,
  pt.description,
  EXTRACT(EPOCH FROM (pt.expires_at - NOW()))/3600 as hours_remaining
FROM payment_transactions pt
LEFT JOIN user_profiles up ON up.user_id = pt.user_id
LEFT JOIN auth.users au ON au.id = pt.user_id
WHERE pt.status IN ('pending', 'awaiting_confirmation')
ORDER BY pt.created_at ASC;