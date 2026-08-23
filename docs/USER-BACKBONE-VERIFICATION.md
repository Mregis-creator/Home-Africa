# User Backbone — Verification

> **`supabase/user-backbone.sql` must be run in the Supabase SQL editor to take effect.**
> The client code alone does NOT create the trigger, the RLS policies, or the
> privileged-column guard. Until it is applied, `public.users` rows may be missing
> and privileged columns are self-writable.

This mirrors `docs/SECURITY-VERIFICATION.md`. The repo has no migration ledger, so
these queries **are** the ledger — run them to find out what state the live
database is actually in.

All queries in steps 1–6 are **read-only**. Steps 7–8 write.

---

## Step 1 — Column inventory

```sql
select ordinal_position, column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'users'
order by ordinal_position;
```

Expect ~60 columns after the backbone is applied. If you see only 5
(`id, email, full_name, role, created_at`), it has not run.

## Step 2 — The disputed columns

```sql
select
  bool_or(column_name = 'verified')                 as has_verified_LEGACY,
  bool_or(column_name = 'is_verified')              as has_is_verified,
  bool_or(column_name = 'is_vip')                   as has_is_vip,
  bool_or(column_name = 'merchant_tier')            as has_merchant_tier,
  bool_or(column_name = 'kyc_status')               as has_kyc_status,
  bool_or(column_name = 'profile_completion')       as has_profile_completion,
  bool_or(column_name = 'account_status')           as has_account_status,
  bool_or(column_name = 'reset_token')              as HAS_reset_token,
  bool_or(column_name = 'reset_token_expires')      as HAS_reset_token_expires,
  bool_or(column_name = 'pending_password')         as HAS_PENDING_PASSWORD,
  bool_or(column_name = 'password_reset_requested') as HAS_password_reset_requested,
  bool_or(column_name = 'temp_password')            as HAS_TEMP_PASSWORD,
  bool_or(column_name = 'temp_password_expires')    as HAS_temp_password_expires,
  bool_or(column_name = 'deleted')                  as HAS_deleted,
  bool_or(column_name = 'deleted_at')               as HAS_deleted_at
from information_schema.columns
where table_schema = 'public' and table_name = 'users';
```

**Target state:** the first seven `true`, every `HAS_*` `false`.

- `has_verified_LEGACY = true` → section 10 of `user-backbone.sql` will copy it to
  `is_verified` and drop it.
- `HAS_PENDING_PASSWORD` or `HAS_TEMP_PASSWORD` `= true` → **go to step 7 before
  anything else.** Those columns may hold real users' passwords.

## Step 3 — Did the backbone actually run?

```sql
select tgname, tgrelid::regclass as on_table, tgenabled
from pg_trigger
where not tgisinternal and tgname in (
  'on_auth_user_created', 'trg_users_updated_at',
  'trg_guard_users_role', 'trg_users_profile_completion',
  'trg_guard_users_privileged'
)
order by tgname;
```

Expect **4 rows** before section 9 is applied, **5 rows** after.

```sql
select p.proname, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in (
  'handle_new_user', 'meta_text_array', 'guard_users_role',
  'compute_profile_completion', 'touch_updated_at', 'is_admin',
  'guard_users_privileged_columns'
)
order by p.proname;

-- Confirm handle_new_user is the full version, not an older 5-column one:
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'handle_new_user';
```

The definition should map ~26 metadata keys (`persona`, `primary_intent`,
`company_name`, `utm_source`, …). If it maps only 5, the file is stale — re-run it.

## Step 4 — RLS and policies

```sql
select relrowsecurity as rls_enabled from pg_class where oid = 'public.users'::regclass;

select policyname, cmd, qual as using_expr, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by cmd, policyname;
```

Expect `rls_enabled = true` and **exactly three** policies: SELECT, INSERT, UPDATE.

- `with_check` on the UPDATE policy should be populated after section 9.
- **A DELETE policy should NOT exist.** No policy means deletes are denied, which
  is intended — removal is a soft delete via `account_status = 'deleted'`.

## Step 5 — The public view

```sql
select table_name from information_schema.views
where table_schema = 'public' and table_name = 'public_user_cards';

select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'public_user_cards';
```

Expect the view to exist with SELECT granted to `anon` and `authenticated`.
`js/search.js` depends on this — without it, user search returns nothing.

## Step 6 — Backbone coverage

```sql
select (select count(*) from auth.users)   as auth_users,
       (select count(*) from public.users) as public_users,
       (select count(*) from auth.users au
          left join public.users u on u.id = au.id
        where u.id is null)                as missing_backbone_rows;
```

`missing_backbone_rows` should be **0**. If not, the backfill (section 4) has not
run or the trigger is disabled — re-run `user-backbone.sql`.

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid = 'public.users'::regclass
order by conname;
```

Look for `users_id_fkey`. Its **absence** means orphan `public.users` rows exist
whose ids are not in `auth.users` — the FK creation at lines 135-139 swallows its
own failure. Find them with:

```sql
select u.id, u.email, u.created_at
from public.users u left join auth.users au on au.id = u.id
where au.id is null;
```

---

## Step 7 — CONDITIONAL: plaintext password remediation

> **RESOLVED for this project (checked 2026-08-23): no exposure, no action needed.**
>
> After `user-backbone.sql` was applied, `select count(*) from pg_attribute where
> attrelid = 'public.users'::regclass and attisdropped` returned **0** — meaning no
> column has ever been dropped from the table, so `pending_password`, `reset_token`
> and `temp_password` never existed here. The section 10 `DROP COLUMN IF EXISTS`
> statements were all no-ops. No plaintext passwords were ever stored and no users
> need notifying.
>
> This matches the code: the old reset flow looked the user up by email while
> anonymous, which RLS blocks, so it failed with "No account found" before reaching
> the password-storing branch. Keep the rest of this section for reference — it is
> the procedure to follow if a similar column ever reappears.

**Only if step 2 reported `HAS_PENDING_PASSWORD` or `HAS_TEMP_PASSWORD` as `true`.**

A homegrown reset flow wrote users' chosen passwords into `pending_password` in
plaintext, then told them "Password reset successful!" though the auth password
never changed. `temp_password` held `btoa()` base64, which is reversible — treat
it identically.

**Never `select` the password value.** SQL editor results render in the browser
and may be cached or logged.

```sql
-- How many, and when?
select count(*) filter (where pending_password is not null) as rows_with_plaintext,
       min(updated_at) as first_seen, max(updated_at) as last_seen
from public.users;

-- Who? (emails only — never the password column)
select id, email, updated_at from public.users
where pending_password is not null order by updated_at;
```

If `rows_with_plaintext = 0`, there is no exposure — skip to step 8.

If it is greater than 0:

1. **Record the affected id/email list offline.** Do not commit it to the repo.
2. Null the data now — exposure duration dominates:
   ```sql
   update public.users set pending_password = null where pending_password is not null;
   -- and, if present:
   update public.users set temp_password = null where temp_password is not null;
   ```
3. **Do not drop the columns yet.** Dropping before the client fix is deployed
   turns a silent no-op into a visible error for anyone mid-reset. Section 10 of
   `user-backbone.sql` drops them; run it after deploy.
4. **Notify the affected users out of band.** They chose that password believing
   the reset succeeded, so they likely reused it elsewhere. Tell them: the reset
   never applied, their old password still works, the password they chose was
   stored insecurely and has been erased, and they should treat it as compromised
   anywhere they reused it.
5. **State the limit honestly.** Supabase PITR/WAL and daily backups still contain
   the values, and rotating past that window is not possible. The notification is
   the only real mitigation.

---

## Step 8 — Confirm the privileged-column guard works

After running section 9, verify from a real browser session as a **non-admin** user:

```js
// In the browser console on any page that loads the Supabase client:
await supabaseClient.from('users')
  .update({ is_vip: true, kyc_status: 'verified' })
  .eq('id', '<your-uid>');
```

This returns **no error** — the trigger silently pins the values rather than
raising. Confirm in the SQL editor that nothing changed:

```sql
select id, role, is_vip, kyc_status, is_verified, account_status
from public.users where id = '<your-uid>';
```

Both should be unchanged. Then confirm role escalation is still blocked outright:

```js
await supabaseClient.from('users').update({ role: 'admin' }).eq('id', '<your-uid>');
// expect error 42501 "Not authorized" from guard_users_role
```

And confirm the localStorage escalation is closed:

```js
localStorage.setItem('isMerchant', 'true');
location.reload();
// then in SQL editor: select role from public.users where id = '<your-uid>';
// expect 'user' — before the js/auth.js fix this returned 'merchant'
```

---

## Step 9 — Post-run confirmation

> **The Supabase SQL editor only displays the result of the LAST statement** when you run
> several at once. The query below is deliberately a single statement returning one row,
> so nothing gets silently discarded. Elsewhere in this doc, run multi-statement blocks
> one statement at a time.

Paste this after running `supabase/user-backbone.sql` to confirm the end state in one go.

```sql
select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='users')                  as total_columns,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='users'
       and column_name='is_verified')                                     as has_is_verified,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='users'
       and column_name='profile_completion')                              as has_profile_completion,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='users'
       and column_name='verified')                                        as still_has_verified_LEGACY,
  (select count(*) from pg_trigger where not tgisinternal and tgname in
     ('on_auth_user_created','trg_users_updated_at','trg_guard_users_role',
      'trg_users_profile_completion','trg_guard_users_privileged'))       as trigger_count,
  (select string_agg(tgname, ', ' order by tgname) from pg_trigger
     where not tgisinternal and tgname in
     ('on_auth_user_created','trg_users_updated_at','trg_guard_users_role',
      'trg_users_profile_completion','trg_guard_users_privileged'))       as triggers_found,
  (select count(*) from pg_policies where schemaname='public'
     and tablename='users' and cmd='UPDATE' and with_check is not null)    as update_policy_has_check,
  (select count(*) from auth.users)                                       as auth_users,
  (select count(*) from public.users)                                     as public_users,
  (select count(*) from auth.users au
     left join public.users u on u.id = au.id where u.id is null)         as missing_rows;
```

**Expected:** `total_columns` ~60; `has_is_verified`, `has_profile_completion` and
`update_policy_has_check` all `1`; `still_has_verified_LEGACY` `0`; `trigger_count` **5**;
`missing_rows` `0`.

<details>
<summary>Same checks as separate statements (run one at a time)</summary>

```sql
-- 1. Phantom columns gone? (every still_has_* should be false)
select
  bool_or(column_name = 'pending_password')    as still_has_pending_password,
  bool_or(column_name = 'reset_token')         as still_has_reset_token,
  bool_or(column_name = 'temp_password')       as still_has_temp_password,
  bool_or(column_name = 'verified')            as still_has_verified_LEGACY,
  bool_or(column_name = 'is_verified')         as has_is_verified,
  bool_or(column_name = 'profile_completion')  as has_profile_completion,
  count(*)                                     as total_columns
from information_schema.columns
where table_schema = 'public' and table_name = 'users';

-- 2. All five triggers present?
--    Expect: on_auth_user_created (on auth.users) plus four on public.users.
select tgname, tgrelid::regclass as on_table
from pg_trigger
where not tgisinternal
  and tgname in ('on_auth_user_created','trg_users_updated_at','trg_guard_users_role',
                 'trg_users_profile_completion','trg_guard_users_privileged')
order by tgname;

-- 3. UPDATE policy now has an explicit WITH CHECK?
select policyname, cmd, with_check
from pg_policies where schemaname='public' and tablename='users' order by cmd;

-- 4. Every auth user has a backbone row? (missing_rows should be 0)
select (select count(*) from auth.users)   as auth_users,
       (select count(*) from public.users) as public_users,
       (select count(*) from auth.users au
          left join public.users u on u.id = au.id where u.id is null) as missing_rows;

-- 5. The view js/search.js depends on
select table_name from information_schema.views
where table_schema='public' and table_name='public_user_cards';
```

</details>

**Expected:** all `still_has_*` false, `has_is_verified` and `has_profile_completion` true,
`total_columns` around 60, five triggers, `with_check` populated on the UPDATE policy,
`missing_rows` = 0, and `public_user_cards` present.

> **If you ran the file before doing Step 7**, the phantom columns are now dropped — which
> erases any plaintext passwords, but also erases the list of users who need notifying.
> That list is only recoverable from a PITR snapshot taken before the drop. Check whether
> notification is owed before the PITR window closes.

## Recommended run order

1. All of steps 1–6 (read-only) — record the results.
2. Step 7 if step 2 flagged a password column.
3. `supabase/user-backbone.sql` in full, if step 3 showed it had not run.
   It is idempotent; running it twice is safe.
4. Deploy the client changes.
5. `supabase/user-backbone.sql` again for sections 9–10 (the guard + column purge).
6. Steps 3, 4 and 8 again to confirm the end state.

## Supabase dashboard settings this depends on

Password reset does not work without these:

| Setting | Value |
|---|---|
| Auth → URL Configuration → Site URL | `https://homeafrica.it.com` |
| Auth → Redirect URLs | `https://homeafrica.it.com/reset-password.html`, `http://localhost:3000/reset-password.html`, plus any preview-deploy variant. Keep the existing `signup.html*` entry for magic link. |
| Auth → Email Templates → Reset Password | Branded; keep `{{ .ConfirmationURL }}` as the link target |
| Auth → Providers → Email → link expiry | 900s (a recovery link grants a full session) |
| Auth → SMTP Settings | Custom SMTP — the built-in sender is rate-limited to a few emails/hour and is not for production. See `docs/GMAIL_SMTP_SETUP.md`. |

> If `redirectTo` is not on the redirect allow-list, Supabase silently falls back
> to Site URL and the reset link lands on the homepage with tokens in the hash.
> This is the most common cause of "the reset link does nothing."
