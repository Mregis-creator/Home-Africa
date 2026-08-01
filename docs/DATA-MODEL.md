# Home Africa — Data Model (quick reference)

The authoritative schema is split across large SQL files (`supabase-tables.sql`
~117 KB, `supabase/listings-schema.sql`, `supabase/security-hardening.sql`).
This doc is the human-readable map. When they disagree, the SQL wins.

## Canonical tables

### `listings` — the ONE listings table
Defined in `supabase/listings-schema.sql`. Supersedes the legacy `posts`,
`post_listings`, and `apartments` tables (see "Legacy" below).

| column | notes |
|---|---|
| id | uuid pk |
| user_id | owner (auth.uid) |
| merchant_id | nullable |
| type | `apartment` \| `car` \| `land` \| `driving_school` |
| title, description, price | price is numeric |
| currency | default `RWF` |
| status | `active` \| others; public can only read `active` (RLS) |
| location | JSONB `{country, city, district, sector, address, label}` (indexed) |
| images | JSONB array |
| metadata | JSONB (merchant info, mileage, size, …) |
| featured / featured_until | boost state (set by feature-listing flow) |

RLS: public reads `active` (or own); INSERT is authenticated + `auth.uid() = user_id`
(tightened in security-hardening.sql — previously anonymous).

### Users / social
`users`, `user_profiles` (holds `role`: user/merchant/agent/admin; `is_vip`,
`merchant_tier`), `connections`, `favorites`, `messages`/`message_threads`,
`comments`, `notifications`, `activity_feed`,
`property_status_updates` / `_likes` / `_comments`.

> Note: `rbac.js` reads role from **`users`**, while admin gating / `is_admin()`
> read from **`user_profiles`**. These should be reconciled to a single source;
> until then keep `role` consistent across both.

### Monetization / payments
`merchants`, `merchant_leads`, `merchant_subscriptions`, `merchant_invoices`,
`seller_subscriptions`, `sponsored_posts`, `payment_transactions`,
`payment_platform_config` (receiving accounts, fees, **`billing_enabled`** +
`free_access_message` — the admin campaign switch), `transactions`,
`withdrawals`, `partner_referrals`, `bookings` (driving-school lesson bookings).

Key RPCs (all `SECURITY DEFINER`, locked down in security-hardening.sql):
- `create_payment_transaction(...)` — caller must be self or admin; authenticated only.
- `verify_payment(...)` — **admin only** (in-DB `is_admin()` check); ignores
  caller-supplied verifier and uses `auth.uid()`.
- `is_admin(uid)` — role lookup helper.

### Analytics / growth
`funnel_events`, `abandoned_sessions`, `scheduled_recoveries`, `listing_views`,
`listing_activities`, `area_stats`, `market_price_history`, `ai_knowledge_base`.

## Storage buckets
- `listings` — **public** (listing images).
- `payments` — **private** (payment-proof screenshots; PII). Access only via
  short-lived signed URLs for the owner + admins (security-hardening.sql).

## Legacy (do not build new features on these)
`posts`, `post_listings`, `apartments` predate the unified `listings` table.
New reads/writes should target `listings`. A future migration should move any
remaining data off the legacy tables and drop them.

## Config source of truth
- `js/config.js` → `window.APP_CONFIG` (market, currency, **`PRICING`** in RWF,
  `PAYMENTS`). All pricing reads from here — never hardcode prices.
- `payment_platform_config` (DB) → receiving accounts + billing toggle.
