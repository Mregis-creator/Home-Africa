-- =====================================================
-- PHASE II: Business Networking & Marketplace Platform
-- Database Schema Extensions
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- USER PROFILES (Extended)
-- =====================================================

-- User Profiles Table (extends existing users table)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('personal', 'business')),
    display_name VARCHAR(255),
    bio TEXT,
    profile_image_url TEXT,
    cover_image_url TEXT,
    location VARCHAR(255),
    website_url TEXT,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(100),
    specialties TEXT[], -- Array of specialties
    certifications TEXT[], -- Array of certifications
    social_links JSONB, -- {linkedin, twitter, facebook, etc.}
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    reputation_score INTEGER DEFAULT 0,
    partners_count INTEGER DEFAULT 0, -- Label: "Partners" (formerly followers)
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Business Profiles Table (for merchants/companies)
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100), -- 'real_estate', 'developer', 'agent', etc.
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    website_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    location VARCHAR(255),
    founded_year INTEGER,
    employee_count VARCHAR(50),
    specialties TEXT[],
    certifications TEXT[],
    licenses TEXT[],
    social_links JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    listings_count INTEGER DEFAULT 0,
    partners_count INTEGER DEFAULT 0, -- Label: "Partners" (formerly followers)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id)
);

-- =====================================================
-- POSTS & CONTENT
-- =====================================================

-- Posts Table (for user and merchant posts)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL, -- Can be user_id or merchant_id
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('user', 'merchant')),
    post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('product', 'article', 'question', 'insight', 'update', 'announcement')),
    title VARCHAR(500),
    content TEXT NOT NULL,
    content_html TEXT, -- Rich HTML content
    images TEXT[], -- Array of image URLs
    videos TEXT[], -- Array of video URLs
    tags TEXT[], -- Array of tags
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link posts to listings (if post_type is 'product')
CREATE TABLE IF NOT EXISTS post_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, listing_id)
);

-- =====================================================
-- COMMENTS SYSTEM
-- =====================================================

-- Comments Table (rich comment system)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
    author_id UUID NOT NULL, -- Can be user_id or merchant_id
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('user', 'merchant')),
    content TEXT NOT NULL,
    content_html TEXT, -- Rich HTML content
    images TEXT[], -- Array of image URLs
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_best_answer BOOLEAN DEFAULT FALSE, -- For Q&A posts
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- =====================================================
-- CONNECTIONS & NETWORKING
-- =====================================================

-- Connections Table (Partners/follow system)
-- Note: UI Label = "Partners" (not "followers")
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL, -- User who follows (becomes Partner)
    following_id UUID NOT NULL, -- User/business being followed (gains Partner)
    following_type VARCHAR(20) NOT NULL CHECK (following_type IN ('user', 'merchant')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id, following_type)
);

-- =====================================================
-- DIRECT MESSAGING
-- =====================================================

-- Message Threads Table (conversations)
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_1_id UUID NOT NULL, -- User or merchant ID
    participant_1_type VARCHAR(20) NOT NULL CHECK (participant_1_type IN ('user', 'merchant')),
    participant_2_id UUID NOT NULL, -- User or merchant ID
    participant_2_type VARCHAR(20) NOT NULL CHECK (participant_2_type IN ('user', 'merchant')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    unread_count_p1 INTEGER DEFAULT 0,
    unread_count_p2 INTEGER DEFAULT 0,
    is_archived_p1 BOOLEAN DEFAULT FALSE,
    is_archived_p2 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_1_id, participant_1_type, participant_2_id, participant_2_type)
);

-- Messages Table (DM messages)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, -- User or merchant ID
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'merchant')),
    content TEXT NOT NULL,
    content_html TEXT, -- Rich HTML content
    attachments JSONB, -- {images: [], files: []}
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ACTIVITY FEED
-- =====================================================

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'post_created', 'comment_added', 'connection_made', etc.
    actor_id UUID NOT NULL, -- Who performed the action
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'merchant')),
    target_id UUID, -- What was acted upon (post_id, listing_id, etc.)
    target_type VARCHAR(50), -- 'post', 'listing', 'comment', etc.
    content TEXT, -- Activity description
    metadata JSONB, -- Additional data
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'new_message', 'new_comment', 'new_connection', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    icon_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MARKETPLACE ENHANCEMENTS
-- =====================================================

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS shopping_cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_type ON user_profiles(profile_type);

-- Business Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_merchant_id ON business_profiles(merchant_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_type ON business_profiles(business_type);

-- Posts Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, author_type);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Comments Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id, author_type);

-- Connections Indexes
CREATE INDEX IF NOT EXISTS idx_connections_follower ON connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_following ON connections(following_id, following_type);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Activity Feed Indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_read ON activity_feed(is_read);

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Shopping Cart & Wishlist Indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.author_type = 'user' THEN
            UPDATE user_profiles SET posts_count = posts_count + 1 WHERE user_id = NEW.author_id;
        ELSIF NEW.author_type = 'merchant' THEN
            UPDATE business_profiles SET listings_count = listings_count + 1 WHERE merchant_id = NEW.author_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.author_type = 'user' THEN
            UPDATE user_profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = OLD.author_id;
        ELSIF OLD.author_type = 'merchant' THEN
            UPDATE business_profiles SET listings_count = GREATEST(listings_count - 1, 0) WHERE merchant_id = OLD.author_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_counts_trigger
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        IF OLD.parent_comment_id IS NOT NULL THEN
            UPDATE comments SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.parent_comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_counts_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Function to update connection counts
CREATE OR REPLACE FUNCTION update_connection_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
        -- Update follower's following count
        UPDATE user_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
        
        -- Update following's partners count (UI Label: "Partners")
        IF NEW.following_type = 'user' THEN
            UPDATE user_profiles SET partners_count = partners_count + 1 WHERE user_id = NEW.following_id;
        ELSIF NEW.following_type = 'merchant' THEN
            UPDATE business_profiles SET partners_count = partners_count + 1 WHERE merchant_id = NEW.following_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
        UPDATE user_profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
        IF OLD.following_type = 'user' THEN
            UPDATE user_profiles SET partners_count = GREATEST(partners_count - 1, 0) WHERE user_id = OLD.following_id;
        ELSIF OLD.following_type = 'merchant' THEN
            UPDATE business_profiles SET partners_count = GREATEST(partners_count - 1, 0) WHERE merchant_id = OLD.following_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_connection_counts_trigger
    AFTER INSERT OR DELETE OR UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_connection_counts();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
-- Users can read public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Public posts are viewable by everyone
CREATE POLICY "Public posts are viewable by everyone" ON posts
    FOR SELECT USING (visibility = 'public' OR status = 'published');

-- Users can create their own posts
CREATE POLICY "Users can create own posts" ON posts
    FOR INSERT WITH CHECK (author_id = auth.uid());

-- Public comments are viewable by everyone
CREATE POLICY "Public comments are viewable by everyone" ON comments
    FOR SELECT USING (status = 'active');

-- Users can create comments
CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (true);

-- Users can only see their own cart
CREATE POLICY "Users can manage own cart" ON shopping_cart
    FOR ALL USING (user_id = auth.uid());

-- Users can only see their own wishlist
CREATE POLICY "Users can manage own wishlist" ON wishlist
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Schema creation complete!
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update application code to use new tables
-- 3. Create UI components for new features

