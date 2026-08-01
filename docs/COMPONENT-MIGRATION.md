# Shared Component Migration (kill the copy-paste tax)

The nav and footer used to be copy-pasted into every page, so any change meant
editing 30+ files (or running the `update_all_pages.js` regex batch-patcher).
They are now injected from **`js/components.js`** using canonical markup, and
shared styling lives in **`css/theme.css`**. Change the footer once → every
migrated page updates. `index.html` is the reference implementation.

## Recipe to migrate a page

1. **Add the theme stylesheet** in `<head>` (once):
   ```html
   <link rel="stylesheet" href="css/theme.css" />
   ```
2. **Add the components script** (before your auth script, so the nav's
   role-toggle IDs exist when auth.js runs):
   ```html
   <script src="js/components.js"></script>
   ```
3. **Replace the hand-written `<footer>…</footer>`** with a mount point:
   ```html
   <div data-ha-footer></div>
   ```
4. **(Optional) Replace the hand-written `<nav>…</nav>`** with:
   ```html
   <div data-ha-nav data-active="explore"></div>
   ```
   `data-active` highlights the current section (home/explore/apartments/cars/
   land/post). The injected nav preserves every id the auth/role scripts use
   (`loginNavItem`, `logoutNavItem`, `merchantDashboardNavItem`,
   `adminPaymentsNavItem`, `messagesNavItem`, `*-count-badge`, …).

## Rollout status
- ✅ `index.html` — footer migrated (reference).
- ⏳ Remaining pages — migrate incrementally and eyeball each in the browser
  (footer is visually identical; nav migration should be spot-checked for
  role-based show/hide and the mobile toggle).

## Notes
- `js/components.js` follows the same `insertAdjacentHTML` injection pattern as
  `js/ai-chatbot.js`.
- `update_all_pages.js` is **deprecated** — do not use it for new cross-cutting
  changes; edit `js/components.js` / `css/theme.css` instead.
- Nav migration is intentionally opt-in per page because a few pages have
  bespoke navs; don't force `data-ha-nav` where a page's nav differs.
