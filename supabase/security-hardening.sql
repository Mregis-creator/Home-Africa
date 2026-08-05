-- ============================================================================
-- Home Africa — Security Hardening Migration
-- ----------------------------------------------------------------------------
-- Idempotent. Safe to run repeatedly in the Supabase SQL editor.
-- Closes the P0 security holes found in the SWOT recon:
--   A1  verify_payment self-verification hole (CRITICAL)
--   A2  money/role-mutating SECURITY DEFINER functions callable by anyone
--   A3  anonymous listing INSERT + role self-escalation
--   A4  payment-proof bucket privacy + storage RLS
--   B2  admin billing toggle column (billing_enabled)
--
-- Run this AFTER supabase-tables.sql and supabase/listings-schema.sql.
-- ============================================================================


-- ============================================================
-- 0. Admin helper — single source of truth for "is caller an admin?"
--    SECURITY DEFINER so it can read user_profiles regardless of the
--    caller's own RLS view. STABLE, no side effects.
-- ============================================================
-- NOTE: user_profiles keys the auth user by the `user_id` column
-- (`id` is the profile row's own PK). Match every other admin policy in the
-- schema, which checks `user_id = auth.uid()`.
CREATE OR REPLACE FUNCTION public.is_admin(p_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = p_uid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- is_admin must remain executable by BOTH anon and authenticated: RLS policies
-- (e.g. on payment_platform_config, which anon reads) call is_admin(auth.uid())
-- during policy evaluation, and that runs with the querying role's privileges.
-- It returns false for anon, so leaving it callable is harmless.
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;


-- ============================================================
-- A1. Secure verify_payment
--   - Only admins may verify. Caller identity comes from auth.uid(),
--     NOT the caller-supplied p_verified_by (which is now ignored/overridden).
--   - Auto-verify path (p_auto_verify) is admin-only too.
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
  v_caller UUID := auth.uid();
BEGIN
  -- HARD GATE: only admins may verify a payment.
  IF NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'Not authorized: only admins may verify payments'
      USING ERRCODE = '42501';
  END IF;

  -- Get transaction
  SELECT * INTO v_transaction FROM payment_transactions WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  IF v_transaction.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already verified');
  END IF;

  -- Update transaction. verified_by is the authenticated admin, not caller input.
  UPDATE payment_transactions
  SET
    status = 'completed',
    verified_by = v_caller,
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

-- Lock down who can even call it. The in-function admin check is the real gate;
-- these grants prevent anon from probing it at all.
REVOKE ALL ON FUNCTION verify_payment(UUID, UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION verify_payment(UUID, UUID, TEXT, TEXT, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION verify_payment(UUID, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- A1b. Drop the LEGACY 4-arg overload verify_payment(uuid, uuid, text, boolean).
-- It predates the 5-arg version, was still SECURITY DEFINER *and executable by
-- anon*, and had no admin check — i.e. the self-verification hole was still open
-- through this overload. No application code calls it (the app always passes
-- p_verification_source -> resolves to the 5-arg version), so it is dead + unsafe.
DROP FUNCTION IF EXISTS verify_payment(UUID, UUID, TEXT, BOOLEAN);


-- ============================================================
-- A2. Harden create_payment_transaction
--   - A user may only create a transaction for themselves (p_user_id must be
--     the authenticated caller), unless the caller is an admin.
--   - Must be authenticated (blocks anon from minting transactions).
--   Body is unchanged from supabase-tables.sql except the guard block at the top.
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
  v_caller UUID := auth.uid();
BEGIN
  -- GUARD: must be authenticated, and may only transact as self (unless admin).
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authorized: authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_user_id <> v_caller AND NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'Not authorized: cannot create a transaction for another user'
      USING ERRCODE = '42501';
  END IF;

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

  -- Insert transaction (force user_id to the authenticated caller)
  INSERT INTO payment_transactions (
    user_id, payment_type, internal_reference, payment_method, amount,
    currency, payment_instructions, invoice_id, subscription_id, description, status
  ) VALUES (
    p_user_id, p_payment_type, v_reference, p_payment_method, p_amount,
    'RWF', v_instructions, p_invoice_id, p_subscription_id, p_description, 'pending'
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

REVOKE ALL ON FUNCTION create_payment_transaction(UUID, TEXT, DECIMAL, TEXT, TEXT, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_payment_transaction(UUID, TEXT, DECIMAL, TEXT, TEXT, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION create_payment_transaction(UUID, TEXT, DECIMAL, TEXT, TEXT, UUID, UUID) TO authenticated;


-- ============================================================
-- A2c. Lock down other SECURITY DEFINER functions that were executable by anon.
--   A live audit (pg_proc.prosecdef + has_function_privilege) found ~16
--   SECURITY DEFINER functions callable by the anon (unauthenticated) role that
--   move money, send email, or expose other users' data. None of the internal
--   ones are called from client code (verified by grep); the two that are
--   (record_merchant_lead, generate_user_feed) keep `authenticated` access.
--   NOTE: Supabase grants EXECUTE to anon/authenticated via default privileges,
--   so you must REVOKE FROM anon explicitly (REVOKE FROM PUBLIC is not enough).
-- ============================================================
-- IMPORTANT: EXECUTE is granted to PUBLIC by default, and anon/authenticated
-- inherit it through PUBLIC. So we must REVOKE ... FROM PUBLIC (not just anon).
-- Where we want to keep authenticated access, we re-GRANT it explicitly after.

-- Internal-only (triggers / edge functions): no end-user access at all.
REVOKE EXECUTE ON FUNCTION public.queue_email(character varying, text, jsonb)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_email_queue(integer)                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid)                                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_invoice(uuid)                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_market_alert(text, text, text, text, uuid, jsonb, boolean, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_supply_demand_gaps()                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_activity_aggregates()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_recovery_sent(uuid, text)                      FROM PUBLIC, anon, authenticated;

-- Business/PII reads: these are SECURITY DEFINER, take a merchant uuid, and have
-- NO in-body owner check -> an authenticated user could pass another merchant's
-- id and read their stats/leads/funnel (cross-tenant leak). None are called by
-- the app (verified by grep), so the safest fix is to fully lock them: revoke
-- from authenticated too. When a dashboard later needs one, re-grant it AFTER
-- adding an internal `auth.uid()`/is_admin() guard.
-- (calculate_lead_cost / get_free_leads_used are still callable internally by
--  record_merchant_lead, which is SECURITY DEFINER and runs as the owner.)
REVOKE EXECUTE ON FUNCTION public.get_merchant_stats(uuid, integer)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_merchant_funnel(uuid, integer)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_leads_needing_follow_up(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_abandoned_opportunities(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_free_leads_used(uuid)                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_lead_cost(uuid, text)           FROM PUBLIC, anon, authenticated;

-- Client-called (keep authenticated, block anonymous).
REVOKE EXECUTE ON FUNCTION public.record_merchant_lead(uuid, text, text, text, uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_merchant_lead(uuid, text, text, text, uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_user_feed(uuid, integer)          FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.generate_user_feed(uuid, integer)          TO authenticated;


-- ============================================================
-- A2d. In-body cross-tenant guards for the two client-called functions.
--   These keep `authenticated` access (the app needs them) but add an owner
--   check so a logged-in user cannot act on another user's data. Bodies are
--   reproduced verbatim from supabase-tables.sql with ONLY the guard added.
-- ============================================================

-- generate_user_feed: a user may only (re)generate their OWN feed.
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
  -- GUARD
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized: you may only generate your own feed' USING ERRCODE = '42501';
  END IF;

  -- Delete old feed items
  DELETE FROM user_feed_items
  WHERE user_id = p_user_id
    AND created_at < NOW() - INTERVAL '7 days';

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
REVOKE EXECUTE ON FUNCTION public.generate_user_feed(uuid, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.generate_user_feed(uuid, integer) TO authenticated;

-- record_merchant_lead: the caller is the buyer contacting the merchant, so
-- caller <> p_merchant_id is expected. The guard prevents forging a lead as
-- some OTHER user (identity attribution). Billing-spam (many leads from one
-- caller) is a separate rate-limiting follow-up.
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
  -- GUARD: cannot attribute a lead to a different user.
  IF p_lead_user_id IS NOT NULL
     AND p_lead_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized: lead must be attributed to the calling user' USING ERRCODE = '42501';
  END IF;

  -- Calculate if free and cost
  SELECT * INTO v_is_free, v_cost FROM calculate_lead_cost(p_merchant_id, p_source);

  -- Insert lead
  INSERT INTO merchant_leads (
    merchant_id, listing_id, listing_type, source, lead_user_id,
    lead_email, lead_phone, is_free_lead, lead_cost
  ) VALUES (
    p_merchant_id, p_listing_id, p_listing_type, p_source, p_lead_user_id,
    p_lead_email, p_lead_phone, v_is_free, v_cost
  )
  RETURNING id INTO v_lead_id;

  v_result := jsonb_build_object(
    'lead_id', v_lead_id,
    'is_free', v_is_free,
    'cost', v_cost,
    'message', CASE
      WHEN v_is_free THEN 'Free lead! (' || (get_free_leads_used(p_merchant_id) + 1) || '/30 used this month)'
      ELSE 'Paid lead: ' || v_cost || ' RWF (Free limit reached)'
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.record_merchant_lead(uuid, text, text, text, uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_merchant_lead(uuid, text, text, text, uuid, text, text) TO authenticated;


-- ============================================================
-- A2b. Neutralize the auto-confirm path in production.
--   The auto_confirm_payment() trigger is a dev/testing shortcut that marks
--   payments completed with no human check. Ensure it is OFF and cannot fire.
-- ============================================================
DROP TRIGGER IF EXISTS auto_confirm_payment_trigger ON payment_transactions;
UPDATE payment_platform_config SET auto_confirm_enabled = false;


-- ============================================================
-- A3. Tighten Row Level Security
-- ============================================================

-- Listings: replace anonymous "WITH CHECK (true)" INSERT with owner-scoped,
-- authenticated-only insert.
DROP POLICY IF EXISTS "Anyone can create listings" ON listings;
DROP POLICY IF EXISTS "Authenticated users create own listings" ON listings;
CREATE POLICY "Authenticated users create own listings" ON listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_profiles: prevent role self-escalation. A user may update their own
-- profile, but may never change their own role. Admins can change any role.
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized: you cannot change your own role'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON user_profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Defense-in-depth owner-scoped policies on money tables (idempotent).
-- These assume the columns exist per supabase-tables.sql. Admins get full read.
DO $$
BEGIN
  -- payment_transactions
  IF to_regclass('public.payment_transactions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Owner or admin can view transactions" ON payment_transactions';
    EXECUTE 'CREATE POLICY "Owner or admin can view transactions" ON payment_transactions
               FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()))';
  END IF;

  -- withdrawals (payout requests) — owner or admin only
  IF to_regclass('public.withdrawals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Owner or admin can view withdrawals" ON withdrawals';
    EXECUTE 'CREATE POLICY "Owner or admin can view withdrawals" ON withdrawals
               FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()))';
  END IF;
END $$;


-- ============================================================
-- A4. Payment-proof storage privacy
--   Make the "payments" bucket private and restrict object access to the
--   uploading owner + admins. "listings" bucket stays public (listing images).
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'payments';

-- storage.objects policies for the payments bucket.
DROP POLICY IF EXISTS "Payment proofs: owner upload" ON storage.objects;
CREATE POLICY "Payment proofs: owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payments' AND owner = auth.uid());

DROP POLICY IF EXISTS "Payment proofs: owner or admin read" ON storage.objects;
CREATE POLICY "Payment proofs: owner or admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payments' AND (owner = auth.uid() OR public.is_admin(auth.uid())));


-- ============================================================
-- B2. Admin billing toggle
--   billing_enabled = false  → free-access mode (grant paid features free)
--   billing_enabled = true   → require a completed payment_transaction
--   Only admins may change it (enforced in the UI + this policy).
-- ============================================================
ALTER TABLE payment_platform_config
  ADD COLUMN IF NOT EXISTS billing_enabled BOOLEAN DEFAULT false;
ALTER TABLE payment_platform_config
  ADD COLUMN IF NOT EXISTS free_access_message TEXT
    DEFAULT 'All features are free during our launch campaign.';

-- Everyone may READ the config (the app needs to know the billing state),
-- but only admins may WRITE it.
ALTER TABLE payment_platform_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read platform config" ON payment_platform_config;
CREATE POLICY "Anyone can read platform config" ON payment_platform_config
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can change platform config" ON payment_platform_config;
CREATE POLICY "Only admins can change platform config" ON payment_platform_config
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- Done. Verify with the queries in docs/SECURITY-VERIFICATION.md
-- ============================================================
