-- =====================================================
-- Additional Database Tables for MVP Features
-- Payment, Email Notifications, Verification, Subscriptions
-- =====================================================

-- Email Notifications Table
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50), -- welcome, booking_confirmation, message_notification, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    error TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_type ON email_notifications(type);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);

-- Merchant Subscriptions Table
CREATE TABLE IF NOT EXISTS merchant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL, -- basic, standard, premium
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_merchant ON merchant_subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_status ON merchant_subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON merchant_subscriptions(stripe_subscription_id);

-- Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- merchant, listing
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    documents TEXT[], -- Array of document URLs
    business_name VARCHAR(255),
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_merchant ON verification_requests(merchant_id);
CREATE INDEX idx_verification_requests_listing ON verification_requests(listing_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

-- Add verified fields to listings table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='listings' AND column_name='verified') THEN
        ALTER TABLE listings ADD COLUMN verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE listings ADD COLUMN verified_at TIMESTAMP;
        ALTER TABLE listings ADD COLUMN verified_by UUID REFERENCES users(id);
    END IF;
END $$;

-- Add contact fields to bookings table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='contact_name') THEN
        ALTER TABLE bookings ADD COLUMN contact_name VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN contact_phone VARCHAR(20);
        ALTER TABLE bookings ADD COLUMN contact_email VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN scheduled_time VARCHAR(20);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_notifications (admins can view all)
CREATE POLICY "Admins can view all email notifications"
    ON email_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- RLS Policies for merchant_subscriptions (merchants can view their own)
CREATE POLICY "Merchants can view their own subscriptions"
    ON merchant_subscriptions FOR SELECT
    USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert their own subscriptions"
    ON merchant_subscriptions FOR INSERT
    WITH CHECK (merchant_id = auth.uid());

-- RLS Policies for verification_requests
CREATE POLICY "Merchants can view their own verification requests"
    ON verification_requests FOR SELECT
    USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can create verification requests"
    ON verification_requests FOR INSERT
    WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Admins can update verification requests"
    ON verification_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- Sample Data (Optional)
-- =====================================================

-- Insert sample subscription plans (if needed)
-- These would typically be managed through Stripe, but can be stored here for reference
-- CREATE TABLE subscription_plans (
--     id VARCHAR(50) PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     price_monthly DECIMAL(10,2) NOT NULL,
--     features JSONB,
--     stripe_price_id VARCHAR(255)
-- );

-- =====================================================
-- Notes:
-- 1. Replace Stripe keys in js/payments.js with your actual keys
-- 2. Set up Supabase Edge Function for email sending (or use external service)
-- 3. Configure Stripe webhooks to update subscription status
-- 4. Set up admin panel to review verification requests
-- =====================================================

