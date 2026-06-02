-- HOME AFRICA Email Automation System - Database Triggers
-- This script sets up PostgreSQL triggers to call Supabase Edge Functions
-- Run this in your Supabase SQL Editor after deploying the Edge Functions

-- ============================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron for scheduled processing (optional, for batching)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 2. EMAIL QUEUE TABLE (For reliable delivery)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template VARCHAR(50) NOT NULL,
  recipient_email TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, created_at);

-- RLS for security
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only system can access email queue" ON email_queue FOR ALL USING (false);

-- ============================================================
-- 3. HELPER FUNCTION: Queue Email
-- ============================================================

CREATE OR REPLACE FUNCTION queue_email(
  p_template VARCHAR,
  p_recipient_email TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO email_queue (template, recipient_email, payload)
  VALUES (p_template, p_recipient_email, p_payload)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. HELPER FUNCTION: Get User Email from user_id
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_email(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. TRIGGER: Welcome Email on User Signup
-- ============================================================

-- Function to queue welcome email when profile is created
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_full_name TEXT;
BEGIN
  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Only send if we have an email and this is a new user (not role update)
  IF v_email IS NOT NULL AND TG_OP = 'INSERT' THEN
    v_full_name := COALESCE(NEW.full_name, split_part(v_email, '@', 1));
    
    PERFORM queue_email(
      'welcome-email',
      v_email,
      jsonb_build_object(
        'userEmail', v_email,
        'userName', v_full_name,
        'role', NEW.role
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS welcome_email_trigger ON user_profiles;

-- Create trigger
CREATE TRIGGER welcome_email_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();

-- ============================================================
-- 6. TRIGGER: Role Upgrade Notification
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_role_upgrade_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Only trigger if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    
    IF v_email IS NOT NULL THEN
      PERFORM queue_email(
        'role-upgrade',
        v_email,
        jsonb_build_object(
          'userEmail', v_email,
          'userName', NEW.full_name,
          'oldRole', OLD.role,
          'newRole', NEW.role,
          'approvedAt', NOW()
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS role_upgrade_trigger ON user_profiles;

CREATE TRIGGER role_upgrade_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION trigger_role_upgrade_email();

-- ============================================================
-- 7. TRIGGER: New Lead Notification to Merchant
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_lead_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_merchant_email TEXT;
  v_merchant_name TEXT;
  v_product_title TEXT;
  v_product_type TEXT;
BEGIN
  -- Get merchant info
  SELECT 
    au.email, 
    up.full_name,
    COALESCE(a.title, c.title, l.title, 'Unknown Property')
  INTO v_merchant_email, v_merchant_name, v_product_title
  FROM auth.users au
  JOIN user_profiles up ON up.user_id = au.id
  LEFT JOIN apartments a ON a.merchant_id = NEW.merchant_id AND NEW.listing_type = 'apartment'
  LEFT JOIN cars c ON c.merchant_id = NEW.merchant_id AND NEW.listing_type = 'car'
  LEFT JOIN land_plots l ON l.merchant_id = NEW.merchant_id AND NEW.listing_type = 'land'
  WHERE au.id = NEW.merchant_id
  LIMIT 1;
  
  IF v_merchant_email IS NOT NULL THEN
    PERFORM queue_email(
      'new-lead-notification',
      v_merchant_email,
      jsonb_build_object(
        'merchantEmail', v_merchant_email,
        'merchantName', v_merchant_name,
        'leadName', COALESCE(NEW.lead_name, 'Anonymous'),
        'leadEmail', COALESCE(NEW.lead_email, ''),
        'leadPhone', COALESCE(NEW.lead_phone, ''),
        'leadMessage', COALESCE(NEW.initial_message, ''),
        'productTitle', v_product_title,
        'productType', COALESCE(NEW.listing_type, 'property'),
        'productUrl', 'https://home-africa.com/merchant-dashboard.html'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS lead_notification_trigger ON merchant_leads;

CREATE TRIGGER lead_notification_trigger
  AFTER INSERT ON merchant_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_lead_notification();

-- ============================================================
-- 8. TRIGGER: Payment Confirmation Email
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_payment_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Only trigger when status changes to confirmed/completed
  IF NEW.status IN ('confirmed', 'completed') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'completed')) THEN
    
    SELECT au.email, up.full_name 
    INTO v_email, v_user_name
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.user_id = au.id
    WHERE au.id = NEW.user_id;
    
    IF v_email IS NOT NULL THEN
      PERFORM queue_email(
        'payment-confirmation',
        v_email,
        jsonb_build_object(
          'userEmail', v_email,
          'userName', v_user_name,
          'amount', NEW.amount,
          'currency', COALESCE(NEW.currency, 'RWF'),
          'paymentMethod', COALESCE(NEW.payment_method, 'momo_mtn'),
          'reference', NEW.internal_reference,
          'status', NEW.status,
          'description', COALESCE(NEW.description, 'Payment to HOME AFRICA')
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS payment_confirmation_trigger ON payment_transactions;

CREATE TRIGGER payment_confirmation_trigger
  AFTER INSERT OR UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_payment_confirmation();

-- ============================================================
-- 9. TRIGGER: New Message Notification
-- ============================================================

-- Note: This requires a messages table. Adjust table/column names as needed
CREATE OR REPLACE FUNCTION trigger_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_email TEXT;
  v_recipient_name TEXT;
  v_sender_name TEXT;
  v_thread_product TEXT;
BEGIN
  -- Get recipient info
  SELECT au.email, up.full_name 
  INTO v_recipient_email, v_recipient_name
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.user_id = au.id
  WHERE au.id = NEW.recipient_id;
  
  -- Get sender name
  SELECT COALESCE(up.full_name, split_part(au.email, '@', 1))
  INTO v_sender_name
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.user_id = au.id
  WHERE au.id = NEW.sender_id;
  
  -- Get thread product info if available
  SELECT COALESCE(a.title, c.title, l.title, 'Listing')
  INTO v_thread_product
  FROM message_threads mt
  LEFT JOIN apartments a ON a.id = mt.product_id AND mt.product_type = 'apartment'
  LEFT JOIN cars c ON c.id = mt.product_id AND mt.product_type = 'car'
  LEFT JOIN land_plots l ON l.id = mt.product_id AND mt.product_type = 'land'
  WHERE mt.id = NEW.thread_id;
  
  IF v_recipient_email IS NOT NULL THEN
    PERFORM queue_email(
      'new-message-notification',
      v_recipient_email,
      jsonb_build_object(
        'recipientEmail', v_recipient_email,
        'recipientName', v_recipient_name,
        'senderName', v_sender_name,
        'messagePreview', substring(NEW.content from 1 for 150),
        'threadId', NEW.thread_id,
        'productTitle', v_thread_product
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create if messages table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
    EXECUTE 'CREATE TRIGGER message_notification_trigger
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION trigger_message_notification()';
  END IF;
END $$;

-- ============================================================
-- 10. PROCESS EMAIL QUEUE FUNCTION (Called by cron or manually)
-- ============================================================

CREATE OR REPLACE FUNCTION process_email_queue(
  p_batch_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  processed_id UUID,
  status TEXT,
  error TEXT
) AS $$
DECLARE
  v_record RECORD;
  v_project_ref TEXT := 'ojaofgrbyzwgwyzbyqnp'; -- Your Supabase project ref
  v_edge_function_url TEXT;
  v_response JSONB;
BEGIN
  FOR v_record IN (
    SELECT id, template, recipient_email, payload
    FROM email_queue
    WHERE email_queue.status = 'pending'
    ORDER BY created_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  LOOP
    BEGIN
      -- Update status to processing
      UPDATE email_queue 
      SET status = 'processing', processed_at = NOW()
      WHERE id = v_record.id;
      
      -- Construct Edge Function URL
      v_edge_function_url := format(
        'https://%s.supabase.co/functions/v1/%s',
        v_project_ref,
        v_record.template
      );
      
      -- Call Edge Function using pg_net
      -- Note: This requires proper authentication. In production, use a service role key.
      SELECT net.http_post(
        url := v_edge_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', format('Bearer %s', current_setting('app.edge_function_key', true))
        ),
        body := jsonb_build_object(
          'to', v_record.recipient_email,
          'payload', v_record.payload
        )
      ) INTO v_response;
      
      -- Mark as sent
      UPDATE email_queue 
      SET status = 'sent', processed_at = NOW()
      WHERE id = v_record.id;
      
      RETURN QUERY SELECT v_record.id, 'sent'::TEXT, NULL::TEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed or retry
      UPDATE email_queue 
      SET 
        status = CASE WHEN retry_count >= 3 THEN 'failed' ELSE 'pending' END,
        retry_count = retry_count + 1,
        error_message = SQLERRM,
        processed_at = NOW()
      WHERE id = v_record.id;
      
      RETURN QUERY SELECT v_record.id, 'failed'::TEXT, SQLERRM::TEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. SCHEDULED JOB (Optional - runs every 5 minutes)
-- ============================================================

-- Uncomment to enable automatic processing every 5 minutes
-- SELECT cron.schedule('process-emails', '*/5 * * * *', 'SELECT process_email_queue(50)');

-- ============================================================
-- 12. MANUAL PROCESSING FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION send_queued_emails(
  p_count INTEGER DEFAULT 10
)
RETURNS TEXT AS $$
DECLARE
  v_sent INTEGER := 0;
  v_failed INTEGER := 0;
  v_result RECORD;
BEGIN
  FOR v_result IN SELECT * FROM process_email_queue(p_count)
  LOOP
    IF v_result.status = 'sent' THEN
      v_sent := v_sent + 1;
    ELSE
      v_failed := v_failed + 1;
    END IF;
  END LOOP;
  
  RETURN format('Processed %s emails: %s sent, %s failed', 
    v_sent + v_failed, v_sent, v_failed);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SETUP INSTRUCTIONS
-- ============================================================

/*

AFTER RUNNING THIS SCRIPT:

1. Set Environment Variables in Supabase Dashboard:
   - Go to Project Settings > API > Edge Functions
   - Add RESEND_API_KEY = your_resend_api_key
   - Add FROM_EMAIL = HOME AFRICA <regismuhakwa@gmail.com>
   - Add EDGE_FUNCTION_KEY = your_service_role_key (for internal calls)

2. Deploy Edge Functions:
   supabase functions deploy welcome-email
   supabase functions deploy new-lead-notification
   supabase functions deploy payment-confirmation
   supabase functions deploy new-message-notification
   supabase functions deploy role-upgrade
   supabase functions deploy engagement-notification
   supabase functions deploy password-reset-custom

3. Get Resend API Key:
   - Sign up at https://resend.com
   - Create an API key
   - Verify your domain (regismuhakwa@gmail.com or custom domain)
   - Add the API key to Supabase environment variables

4. Test the System:
   SELECT queue_email(
     'welcome-email',
     'test@example.com',
     '{"userEmail": "test@example.com", "userName": "Test User", "role": "user"}'::jsonb
   );
   
   SELECT send_queued_emails(1);

5. Monitor the Queue:
   SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 20;
   
   -- Check for failures
   SELECT * FROM email_queue WHERE status = 'failed' ORDER BY created_at DESC;

6. Optional: Enable Cron Job
   Uncomment the cron.schedule line above to auto-process every 5 minutes.
   Or manually call send_queued_emails() from your application.

*/

-- View current queue status
SELECT 
  status, 
  COUNT(*) as count,
  MAX(created_at) as last_activity
FROM email_queue 
GROUP BY status;
