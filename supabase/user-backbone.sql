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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.created_at, NOW()),
    (NEW.email_confirmed_at IS NOT NULL)
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
-- Done.
-- Verify:
--   select count(*) from auth.users;                         -- total registered
--   select count(*) from public.users;                      -- should now match
--   select id,email,full_name,role,account_status,created_at from public.users
--     order by created_at desc limit 10;
--   select public.is_admin('<your-user_id>'::uuid);          -- expect true
-- ============================================================
