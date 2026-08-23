-- ============================================================================
-- Home Africa — User Backbone Migration
-- ----------------------------------------------------------------------------
-- Makes public.users the single, reliable backbone for every registered user.
--   * public.users.id == auth.users.id (1:1), so all business tables join to it
--   * auto-created for EVERY signup via a trigger on auth.users (no dependence
--     on client code -> no missing rows)
--   * rich, user-centric columns (identity, profile, location, preferences)
--   * RLS protects PII (email/phone); a public-safe VIEW exposes display fields
--   * is_admin() bridged to read BOTH users and user_profiles during transition
--
-- Idempotent. Safe to run repeatedly. Run AFTER supabase/security-hardening.sql.
-- ============================================================================


-- ============================================================
-- 1. Table shape. CREATE for fresh installs; ALTER ADD COLUMN IF NOT EXISTS
--    to enrich the existing (ad-hoc) table without touching current data.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- Identity ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name        TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone               TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio                 TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth       DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender              TEXT;

-- --- Role & account status ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status      TEXT    DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN DEFAULT false; -- identity/KYC
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified      BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified      BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_vip              BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS merchant_tier       TEXT;

-- --- Location & preferences (aligns with js/config.js APP_CONFIG) ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country             TEXT    DEFAULT 'Rwanda';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city                TEXT    DEFAULT 'Kigali';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district            TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sector              TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_language  TEXT    DEFAULT 'en';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_currency  TEXT    DEFAULT 'RWF';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS marketing_opt_in    BOOLEAN DEFAULT false;

-- --- Attribution & audit ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_source       TEXT    DEFAULT 'web';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by         UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login          TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen_at        TIMESTAMPTZ;

-- --- Real-estate intent (segmentation / matching / lead scoring) ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS persona             TEXT[]  DEFAULT '{}';   -- buyer/seller/renter/landlord/investor/agent/developer
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS primary_intent      TEXT;                    -- buy/rent/sell/invest/browse
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS property_interests  TEXT[]  DEFAULT '{}';   -- apartment/house/land/commercial/car/driving_school
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS budget_min          NUMERIC;                 -- RWF
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS budget_max          NUMERIC;                 -- RWF
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS purchase_timeline   TEXT;                    -- immediate/1_3_months/3_6_months/6_12_months/browsing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_districts TEXT[]  DEFAULT '{}';

-- --- KYC / trust (role-gated; heavier for merchants & agents) ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status          TEXT    DEFAULT 'unverified'; -- unverified/pending/verified/rejected
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_document_type    TEXT;                    -- national_id/passport/driving_license
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_document_number  TEXT;                    -- PII (RLS-protected)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality         TEXT    DEFAULT 'Rwandan';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name        TEXT;                    -- merchants
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_reg_number  TEXT;                    -- merchants
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tin_number          TEXT;                    -- Rwanda business tax id
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agent_license_number TEXT;                   -- agents

-- --- Contact preferences (Rwanda-specific) ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp_number         TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp'; -- whatsapp/call/sms/email

-- --- Demographics & acquisition analytics ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS occupation          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS income_bracket      TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utm_source          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utm_medium          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utm_campaign        TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_platform     TEXT    DEFAULT 'web';   -- web/android/ios

-- --- Lifecycle & scoring (analytics backbone) ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lifecycle_stage     TEXT    DEFAULT 'lead';  -- lead/active/dormant/churned
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lead_score          INT     DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_completion  INT     DEFAULT 0;       -- 0-100 %

-- --- Flexible attributes (evolve without re-migrating) ---
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences         JSONB   DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc                 JSONB   DEFAULT '{}'::jsonb; -- doc urls, verification meta

-- --- Constraints (drop+add so re-runs don't error) ---
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD  CONSTRAINT users_role_check
  CHECK (role IN ('user','merchant','agent','support','dev','admin'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE public.users ADD  CONSTRAINT users_account_status_check
  CHECK (account_status IN ('active','suspended','banned','deleted'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE public.users ADD  CONSTRAINT users_gender_check
  CHECK (gender IS NULL OR gender IN ('male','female','other','prefer_not_to_say'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_kyc_status_check;
ALTER TABLE public.users ADD  CONSTRAINT users_kyc_status_check
  CHECK (kyc_status IN ('unverified','pending','verified','rejected'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_primary_intent_check;
ALTER TABLE public.users ADD  CONSTRAINT users_primary_intent_check
  CHECK (primary_intent IS NULL OR primary_intent IN ('buy','rent','sell','invest','browse'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_purchase_timeline_check;
ALTER TABLE public.users ADD  CONSTRAINT users_purchase_timeline_check
  CHECK (purchase_timeline IS NULL OR purchase_timeline IN ('immediate','1_3_months','3_6_months','6_12_months','browsing'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_contact_method_check;
ALTER TABLE public.users ADD  CONSTRAINT users_contact_method_check
  CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('whatsapp','call','sms','email'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_lifecycle_stage_check;
ALTER TABLE public.users ADD  CONSTRAINT users_lifecycle_stage_check
  CHECK (lifecycle_stage IN ('lead','active','dormant','churned'));

-- FK id -> auth.users(id). Guarded: skip silently if it already exists or if
-- legacy orphan rows would block it (the trigger keeps ids valid going forward).
DO $$ BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

-- Helpful lookup indexes.
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_role  ON public.users (role);


-- ============================================================
-- 2. updated_at auto-touch
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- 3. Auto-create a backbone row for EVERY signup (server-side, unskippable)
-- ============================================================
-- Helper: pull a text[] out of a jsonb array field in the signup metadata.
CREATE OR REPLACE FUNCTION public.meta_text_array(p_meta JSONB, p_key TEXT)
RETURNS TEXT[] AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_meta->p_key) = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_meta->p_key))
    ELSE '{}'::text[]
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  m JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.users (
    id, email, full_name, role, created_at, email_verified,
    phone, whatsapp_number, persona, primary_intent, property_interests,
    preferred_districts, budget_min, budget_max, purchase_timeline,
    preferred_contact_method, nationality, occupation,
    company_name, company_reg_number, tin_number, agent_license_number,
    utm_source, utm_medium, utm_campaign, signup_platform
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(m->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(m->>'role', 'user'),
    COALESCE(NEW.created_at, NOW()),
    (NEW.email_confirmed_at IS NOT NULL),
    m->>'phone',
    m->>'whatsapp_number',
    public.meta_text_array(m, 'persona'),
    m->>'primary_intent',
    public.meta_text_array(m, 'property_interests'),
    public.meta_text_array(m, 'preferred_districts'),
    NULLIF(m->>'budget_min','')::numeric,
    NULLIF(m->>'budget_max','')::numeric,
    m->>'purchase_timeline',
    COALESCE(m->>'preferred_contact_method','whatsapp'),
    COALESCE(m->>'nationality','Rwandan'),
    m->>'occupation',
    m->>'company_name',
    m->>'company_reg_number',
    m->>'tin_number',
    m->>'agent_license_number',
    m->>'utm_source',
    m->>'utm_medium',
    m->>'utm_campaign',
    COALESCE(m->>'signup_platform','web')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 4. Backfill: give every existing auth.users a backbone row
-- ============================================================
INSERT INTO public.users (id, email, full_name, role, created_at, email_verified)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'role', 'user'),
  COALESCE(au.created_at, NOW()),
  (au.email_confirmed_at IS NOT NULL)
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Promote existing admins recorded in user_profiles into the backbone.
UPDATE public.users u
SET role = 'admin'
FROM public.user_profiles up
WHERE up.user_id = u.id AND up.role = 'admin' AND u.role <> 'admin';


-- ============================================================
-- 5. Privilege guard: users may self-serve non-privileged roles
--    (user/merchant/agent) but NOT grant themselves admin/support/dev.
--    Service role / SQL editor (auth.uid() IS NULL) is exempt so you can still
--    promote admins manually.
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_users_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('admin','support','dev')
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'Not authorized: cannot assign role %', NEW.role USING ERRCODE = '42501';
    END IF;
    NEW.role := 'user';  -- silently downgrade a self-signup attempt
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_users_role ON public.users;
CREATE TRIGGER trg_guard_users_role
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_users_role();


-- ============================================================
-- 5b. Auto-compute profile_completion (0-100%) on every insert/update.
--     Drives the "complete your profile" progress bar and lead scoring.
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  filled INT := 0;
  total  INT := 12;
BEGIN
  IF NEW.full_name        IS NOT NULL AND NEW.full_name        <> '' THEN filled := filled + 1; END IF;
  IF NEW.phone            IS NOT NULL AND NEW.phone            <> '' THEN filled := filled + 1; END IF;
  IF NEW.whatsapp_number  IS NOT NULL AND NEW.whatsapp_number  <> '' THEN filled := filled + 1; END IF;
  IF NEW.avatar_url       IS NOT NULL AND NEW.avatar_url       <> '' THEN filled := filled + 1; END IF;
  IF NEW.city             IS NOT NULL AND NEW.city             <> '' THEN filled := filled + 1; END IF;
  IF NEW.occupation       IS NOT NULL AND NEW.occupation       <> '' THEN filled := filled + 1; END IF;
  IF NEW.primary_intent   IS NOT NULL                                THEN filled := filled + 1; END IF;
  IF NEW.budget_max       IS NOT NULL                                THEN filled := filled + 1; END IF;
  IF COALESCE(array_length(NEW.persona, 1), 0)             > 0       THEN filled := filled + 1; END IF;
  IF COALESCE(array_length(NEW.property_interests, 1), 0)  > 0       THEN filled := filled + 1; END IF;
  IF COALESCE(array_length(NEW.preferred_districts, 1), 0) > 0       THEN filled := filled + 1; END IF;
  IF NEW.kyc_status = 'verified'                                     THEN filled := filled + 1; END IF;

  NEW.profile_completion := ROUND((filled::numeric / total) * 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_profile_completion ON public.users;
CREATE TRIGGER trg_users_profile_completion
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.compute_profile_completion();

-- Recompute for existing rows (fires the BEFORE UPDATE trigger above).
UPDATE public.users SET lifecycle_stage = lifecycle_stage;


-- ============================================================
-- 6. RLS: protect PII. Users see/edit their own row; admins see all.
--    (The triggers above are SECURITY DEFINER and bypass RLS, so auto-create
--     and backfill still work.)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own row"        ON public.users;
CREATE POLICY "Users read own row" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users insert own row"      ON public.users;
CREATE POLICY "Users insert own row" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own row"      ON public.users;
CREATE POLICY "Users update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));


-- ============================================================
-- 7. Public-safe view for social displays (names/avatars) — NO email/phone.
--    Runs with the view owner's rights, so it can read past the users RLS
--    while only ever exposing these non-PII columns.
-- ============================================================
CREATE OR REPLACE VIEW public.public_user_cards AS
SELECT id, full_name, display_name, avatar_url, role, is_verified, is_vip,
       city, district, created_at
FROM public.users
WHERE account_status = 'active';

GRANT SELECT ON public.public_user_cards TO anon, authenticated;


-- ============================================================
-- 8. is_admin bridge — admin if flagged in EITHER users or user_profiles,
--    so nothing breaks while role-truth consolidates into public.users.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin(p_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users         WHERE id = p_uid      AND role = 'admin'
    UNION
    SELECT 1 FROM public.user_profiles WHERE user_id = p_uid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated;

-- ============================================================
-- 9. Pin privileged columns against self-service writes.
--
--    The "Users update own row" policy lets a user write ANY column on their own
--    row. guard_users_role only blocks admin/support/dev, so a non-admin could
--    grant themselves is_vip, merchant_tier, is_verified, kyc_status, etc. with
--    nothing more than the anon key and curl. This trigger pins those columns to
--    their previous values for non-admins.
--
--    Service role (auth.uid() IS NULL) stays exempt, so admins can still be
--    promoted from the SQL editor.
--
--    `role` is deliberately NOT pinned: choosing user/merchant/agent at signup is
--    self-service by product decision, and guard_users_role already blocks the
--    privileged role values.
--
--    Trigger order: same-timing row triggers fire in alphabetical name order, so
--    trg_guard_users_privileged runs BEFORE trg_users_profile_completion — which
--    is what we want, since profile_completion is derived, not user-set.
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_users_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    NEW.is_vip         := OLD.is_vip;
    NEW.merchant_tier  := OLD.merchant_tier;
    NEW.is_verified    := OLD.is_verified;
    NEW.kyc_status     := OLD.kyc_status;
    NEW.account_status := OLD.account_status;
    NEW.lead_score     := OLD.lead_score;
    NEW.email_verified := OLD.email_verified;
    NEW.phone_verified := OLD.phone_verified;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_users_privileged ON public.users;
CREATE TRIGGER trg_guard_users_privileged
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_users_privileged_columns();

-- Make the UPDATE policy's check explicit. Postgres already reuses the USING
-- expression as the check when WITH CHECK is omitted, so this closes no live
-- hole — it states the intent so it cannot decay in a later edit.
DROP POLICY IF EXISTS "Users update own row" ON public.users;
CREATE POLICY "Users update own row" ON public.users
  FOR UPDATE
  USING      (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- NOTE: there is deliberately NO DELETE policy. With RLS enabled and no policy,
-- every delete through PostgREST is denied — which is correct. Account removal
-- is a soft delete via account_status = 'deleted'.


-- ============================================================
-- 10. Purge phantom auth columns.
--
--     These were written by a homegrown password-reset flow that could never
--     work (only Supabase Auth can change an auth password) and by a dead admin
--     module. `pending_password` held the user's chosen password in PLAINTEXT;
--     `temp_password` held it base64-encoded, which is not encryption.
--
--     Password reset now uses Supabase's built-in recovery flow, so nothing
--     writes these any more.
--
--     ORDER MATTERS: run this only AFTER the client fix (reset-password.html +
--     the signin.html rewrite) is deployed. Dropping first turns a silent no-op
--     into a visible error for anyone mid-reset.
--
--     If any of these held data, null them out and notify those users BEFORE
--     dropping — see docs/USER-BACKBONE-VERIFICATION.md step 7.
-- ============================================================
ALTER TABLE public.users DROP COLUMN IF EXISTS pending_password;
ALTER TABLE public.users DROP COLUMN IF EXISTS password_reset_requested;
ALTER TABLE public.users DROP COLUMN IF EXISTS reset_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS reset_token_expires;
ALTER TABLE public.users DROP COLUMN IF EXISTS temp_password;
ALTER TABLE public.users DROP COLUMN IF EXISTS temp_password_expires;

-- Legacy `verified` column: the canonical name is is_verified. Copy anything the
-- old column holds, then drop it. Both guarded so this is safe either way.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='users' AND column_name='verified') THEN
    EXECUTE 'UPDATE public.users SET is_verified = verified
             WHERE is_verified IS NULL AND verified IS NOT NULL';
    EXECUTE 'ALTER TABLE public.users DROP COLUMN verified';
  END IF;
END $$;


-- ============================================================
-- Done.
-- Verify: see docs/USER-BACKBONE-VERIFICATION.md for the full check set.
--   select count(*) from auth.users;                         -- total registered
--   select count(*) from public.users;                      -- should now match
--   select id,email,full_name,role,account_status,created_at from public.users
--     order by created_at desc limit 10;
--   select public.is_admin('<your-user_id>'::uuid);          -- expect true
-- ============================================================
