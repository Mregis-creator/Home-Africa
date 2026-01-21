-- =====================================================
-- HOME AFRICA Database Schema (with AI Chatbot Support)
-- =====================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search (AI chatbot)

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user', -- user, merchant, admin, ai_bot
    full_name VARCHAR(255),
    avatar_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'::jsonb -- {language, notifications, theme}
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Merchants Table
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_merchants_verified ON merchants(verified);
CREATE INDEX idx_merchants_rating ON merchants(rating DESC);
CREATE INDEX idx_merchants_city ON merchants(city);

-- Listings Table (Unified)
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    type VARCHAR(20) NOT NULL, -- apartment, car, land, driving_school
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'RWF',
    status VARCHAR(20) DEFAULT 'active', -- active, sold, rented, inactive
    location JSONB, -- {city, district, coordinates: {lat, lng}, address}
    images TEXT[], -- Array of image URLs
    metadata JSONB, -- Type-specific data (transmission, fuel, rooms, etc.)
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    -- Full-text search vector for AI chatbot
    search_vector tsvector
);

CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_merchant ON listings(merchant_id);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_location ON listings USING GIN(location);
CREATE INDEX idx_listings_search ON listings USING GIN(search_vector); -- For AI chatbot search

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- =====================================================
-- AI CHATBOT TABLES
-- =====================================================

-- Chat Conversations Table
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- NULL for anonymous users
    session_id VARCHAR(255), -- For anonymous users
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, abandoned
    language VARCHAR(10) DEFAULT 'en', -- en, rw, fr
    context JSONB DEFAULT '{}'::jsonb, -- Store conversation context, user intent, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    -- Track what the user was interested in
    interested_listings UUID[], -- Array of listing IDs user asked about
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5)
);

CREATE INDEX idx_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_conversations_session ON chat_conversations(session_id);
CREATE INDEX idx_conversations_status ON chat_conversations(status);
CREATE INDEX idx_conversations_created ON chat_conversations(created_at DESC);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, listing_card, quick_reply
    metadata JSONB DEFAULT '{}'::jsonb, -- Store structured data, listing IDs referenced, etc.
    -- AI-specific fields
    intent VARCHAR(50), -- search_listing, ask_question, book_viewing, etc.
    confidence DECIMAL(3,2), -- AI confidence score (0.00-1.00)
    entities JSONB, -- Extracted entities (location, price_range, property_type, etc.)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_messages_role ON chat_messages(role);
CREATE INDEX idx_messages_created ON chat_messages(created_at);
CREATE INDEX idx_messages_intent ON chat_messages(intent);

-- AI Knowledge Base (FAQs, Common Questions)
CREATE TABLE ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50), -- general, listings, booking, payment, account
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[], -- For matching user queries
    priority INTEGER DEFAULT 0, -- Higher priority = shown first
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0, -- Track how often this answer is used
    helpful_count INTEGER DEFAULT 0, -- User feedback
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Full-text search vector
    search_vector tsvector
);

CREATE INDEX idx_kb_category ON ai_knowledge_base(category);
CREATE INDEX idx_kb_active ON ai_knowledge_base(is_active);
CREATE INDEX idx_kb_language ON ai_knowledge_base(language);
CREATE INDEX idx_kb_search ON ai_knowledge_base USING GIN(search_vector);
CREATE INDEX idx_kb_keywords ON ai_knowledge_base USING GIN(keywords);

-- AI Training Data (for improving chatbot)
CREATE TABLE ai_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_query TEXT NOT NULL,
    intent VARCHAR(50),
    entities JSONB,
    correct_response TEXT, -- What the bot should have said
    actual_response TEXT, -- What the bot actually said
    conversation_id UUID REFERENCES chat_conversations(id),
    is_correct BOOLEAN, -- Was the bot's response correct?
    feedback TEXT, -- User feedback
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_training_intent ON ai_training_data(intent);
CREATE INDEX idx_training_correct ON ai_training_data(is_correct);

-- AI Chatbot Analytics
CREATE TABLE ai_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    resolved_conversations INTEGER DEFAULT 0,
    average_response_time DECIMAL(10,2), -- in seconds
    most_common_intent VARCHAR(50),
    user_satisfaction_avg DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_date ON ai_analytics(date);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_updated_at BEFORE UPDATE ON ai_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update search_vector for listings
CREATE OR REPLACE FUNCTION update_listings_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.metadata::text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search_vector for knowledge base
CREATE OR REPLACE FUNCTION update_kb_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.answer, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update search_vector automatically
CREATE TRIGGER update_listings_search_vector_trigger
    BEFORE INSERT OR UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_listings_search_vector();

CREATE TRIGGER update_kb_search_vector_trigger
    BEFORE INSERT OR UPDATE ON ai_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_kb_search_vector();

-- Function to increment knowledge base usage
CREATE OR REPLACE FUNCTION increment_kb_usage(kb_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ai_knowledge_base 
    SET usage_count = usage_count + 1 
    WHERE id = kb_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track listing views from chatbot
CREATE OR REPLACE FUNCTION track_chatbot_listing_view(listing_uuid UUID, conversation_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Increment listing views
    UPDATE listings SET views = views + 1 WHERE id = listing_uuid;
    
    -- Add to conversation's interested listings if not already there
    UPDATE chat_conversations 
    SET interested_listings = array_append(
        COALESCE(interested_listings, ARRAY[]::UUID[]), 
        listing_uuid
    )
    WHERE id = conversation_uuid 
    AND NOT (listing_uuid = ANY(COALESCE(interested_listings, ARRAY[]::UUID[])));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA (Knowledge Base)
-- =====================================================

-- Insert common FAQs
INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority, language) VALUES
('general', 'What is HOME AFRICA?', 'HOME AFRICA is Rwanda''s premier real estate and lifestyle platform. We help you find apartments, cars, land plots, and connect you with driving schools. Everything you need for your home and lifestyle in one place!', ARRAY['what', 'home', 'africa', 'about', 'platform'], 10, 'en'),

('listings', 'How do I search for apartments?', 'You can search for apartments by visiting the Apartments page. Use filters to narrow down by price, location, number of rooms, and more. You can also use the search bar to find specific properties.', ARRAY['search', 'apartments', 'find', 'property', 'rent'], 9, 'en'),

('listings', 'How do I search for cars?', 'Visit the Cars page to browse available vehicles. You can filter by make, model, year, price, transmission type, and fuel type. Use the search bar for specific car models.', ARRAY['cars', 'vehicles', 'search', 'buy', 'car'], 9, 'en'),

('booking', 'How do I book a viewing?', 'Click on any listing to view details, then click "Book Viewing" or "Schedule Test Drive". Fill in your preferred date and time, and the merchant will confirm with you.', ARRAY['book', 'viewing', 'schedule', 'appointment', 'visit'], 8, 'en'),

('payment', 'What payment methods do you accept?', 'We support various payment methods including MTN Mobile Money, Airtel Money, bank transfers, and credit/debit cards. Payment options vary by merchant.', ARRAY['payment', 'pay', 'money', 'momo', 'card'], 7, 'en'),

('account', 'Do I need to create an account?', 'You can browse listings without an account, but creating an account allows you to save favorites, track bookings, post listings (as a merchant), and receive notifications.', ARRAY['account', 'signup', 'register', 'login'], 6, 'en'),

('general', 'Where are you located?', 'HOME AFRICA serves Rwanda, with listings primarily in Kigali and other major cities. You can filter listings by location on each category page.', ARRAY['location', 'where', 'kigali', 'rwanda'], 5, 'en');

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Public policies (read-only for listings)
CREATE POLICY "Public listings are viewable by everyone"
ON listings FOR SELECT
USING (status = 'active');

-- Users can read their own data
CREATE POLICY "Users can read their own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Merchants can manage their listings
CREATE POLICY "Merchants can insert their own listings"
ON listings FOR INSERT
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their own listings"
ON listings FOR UPDATE
USING (auth.uid() = merchant_id);

-- Anyone can create conversations (for chatbot)
CREATE POLICY "Anyone can create conversations"
ON chat_conversations FOR INSERT
WITH CHECK (true);

-- Users can read their own conversations
CREATE POLICY "Users can read their own conversations"
ON chat_conversations FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id OR session_id IS NOT NULL);

-- Anyone can insert messages (for chatbot)
CREATE POLICY "Anyone can insert messages"
ON chat_messages FOR INSERT
WITH CHECK (true);

-- Users can read messages from their conversations
CREATE POLICY "Users can read their conversation messages"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_conversations 
        WHERE id = chat_messages.conversation_id 
        AND (user_id IS NULL OR user_id = auth.uid())
    )
);

-- Public can read knowledge base
CREATE POLICY "Knowledge base is public"
ON ai_knowledge_base FOR SELECT
USING (is_active = true);

-- =====================================================
-- VIEWS (for easier querying)
-- =====================================================

-- View for active listings with merchant info
CREATE VIEW active_listings_view AS
SELECT 
    l.*,
    m.business_name as merchant_name,
    m.verified as merchant_verified,
    m.rating as merchant_rating
FROM listings l
LEFT JOIN merchants m ON l.merchant_id = m.id
WHERE l.status = 'active';

-- View for conversation summaries (for AI analytics)
CREATE VIEW conversation_summaries AS
SELECT 
    c.id,
    c.user_id,
    c.session_id,
    c.status,
    c.created_at,
    c.resolved_at,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at
FROM chat_conversations c
LEFT JOIN chat_messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.session_id, c.status, c.created_at, c.resolved_at;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE chat_conversations IS 'Stores chatbot conversation sessions with users';
COMMENT ON TABLE chat_messages IS 'Individual messages within conversations (user and AI)';
COMMENT ON TABLE ai_knowledge_base IS 'FAQ and knowledge base for AI chatbot responses';
COMMENT ON TABLE ai_training_data IS 'Training data for improving AI chatbot accuracy';
COMMENT ON COLUMN listings.search_vector IS 'Full-text search vector for AI chatbot to search listings';
COMMENT ON COLUMN chat_messages.entities IS 'Extracted entities from user message (location, price, etc.)';
COMMENT ON COLUMN chat_conversations.interested_listings IS 'Array of listing IDs the user showed interest in during conversation';

