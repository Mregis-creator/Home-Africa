# Applying & verifying the security hardening

`supabase/security-hardening.sql` must be run in the Supabase SQL editor for the
security fixes to take effect. The client code alone does NOT secure the DB.

## ⚠️ Prerequisite — make sure YOUR account is an admin
`verify_payment` and the billing toggle are now gated on
`user_profiles.role = 'admin'` (via the new `is_admin()` function). If your own
account is not marked admin there, you will lock yourself out of verifying
payments. Check and fix first:

```sql
-- Find your user id (by email)
select id, email from auth.users where email = 'YOUR_ADMIN_EMAIL';

-- Confirm the profile row + role
select id, role from public.user_profiles where id = '<your-id>';

-- If not admin, set it
update public.user_profiles set role = 'admin' where id = '<your-id>';
```

> Note: `rbac.js` historically reads role from the `users` table while admin
> gating reads `user_profiles`. Keep `role` consistent across both until they
> are reconciled (see docs/DATA-MODEL.md).

## Step 1 — apply the migration
Supabase Dashboard → SQL Editor → paste the full contents of
`supabase/security-hardening.sql` → Run. It is idempotent (safe to re-run).
If any statement errors (e.g. a column name differs from this project), copy the
error back and we'll adjust.

## Step 2 — verify the objects exist
```sql
-- Functions present
select proname, prosecdef from pg_proc
where proname in ('is_admin','verify_payment','create_payment_transaction','prevent_role_self_escalation');

-- verify_payment is no longer executable by anon
select has_function_privilege('anon', 'verify_payment(uuid,uuid,text,text,boolean)', 'execute');
-- expect: false

-- billing toggle column exists
select billing_enabled, free_access_message from payment_platform_config limit 1;

-- payments bucket is private
select id, public from storage.buckets where id = 'payments';   -- expect public = false

-- listings anonymous-insert policy is gone
select policyname from pg_policies where tablename = 'listings';
-- expect "Authenticated users create own listings", NOT "Anyone can create listings"
```

## Step 3 — prove the self-verification hole is closed
The important behaviour: a NON-admin cannot verify a payment. Because the SQL
editor runs as the service role (`auth.uid()` is NULL, so `is_admin()` is
false), calling it there should now be REJECTED:

```sql
select verify_payment('00000000-0000-0000-0000-000000000000'::uuid);
-- expect ERROR: "Not authorized: only admins may verify payments"
```

Real admins verify through the app (`admin-payments.html`) where their
authenticated session carries their admin `auth.uid()`.

## Step 4 — test the billing toggle (in the app)
1. Sign in as your admin account → open `business-settings.html`.
2. The **Billing Mode** card should be visible (admins only).
3. Toggle **Billing ON** → Save. A merchant/agent trying to use a paid feature
   should now be required to pay (MoMo/BoK flow).
4. Toggle back to **Free-access mode** → Save. Paid features are granted free.
   Confirm a non-admin cannot see or change this card.

## Step 5 — CI
`npm test` runs the smoke test locally; GitHub Actions runs it on push/PR.
