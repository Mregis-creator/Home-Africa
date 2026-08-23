/**
 * HOME AFRICA — Profile Completion Nudge
 *
 * Shows a dismissible banner inviting signed-in users with a thin profile to
 * finish it on profile-complete.html.
 *
 * Deliberately a BANNER, never a redirect. Gating navigation on a completion
 * check is how onboarding loops get created, and signin.html's login path
 * performs zero database queries by design — bolting an async check into it
 * would fight that. Checking on the destination page, and only ever rendering
 * a link, is structurally incapable of trapping anyone.
 *
 * Fails silently in every direction: no client, no session, query error, or
 * missing row all result in no banner. A nudge must never block a page.
 *
 * Usage: <script src="js/profile-nudge.js"></script> on post-login landing pages.
 * Also exposes window.HAProfile.dashboardFor(role) — the single source of truth
 * for role -> dashboard routing, shared with signin.html and profile-complete.html.
 */
(function () {
  const COMPLETION_THRESHOLD = 60;
  const DISMISS_KEY = 'ha_profile_nudge_dismissed';
  const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  function client() {
    return (window.getSupabaseClient && window.getSupabaseClient()) || window.supabaseClient || null;
  }

  async function waitForClient(tries = 30) {
    while (tries-- > 0) {
      const c = client();
      if (c) return c;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  const HAProfile = {
    /**
     * Map a user role to its landing page. Kept here so signin.html's post-login
     * routing and profile-complete.html's post-save routing cannot drift apart.
     */
    dashboardFor(role) {
      switch (role) {
        case 'admin':    return 'admin-payments.html';
        case 'merchant': return 'merchant-dashboard.html';
        case 'agent':    return 'agent-dashboard.html';
        case 'support':  return 'support-dashboard.html';
        case 'dev':      return 'dev-dashboard.html';
        default:         return 'profile.html';
      }
    },

    isDismissed() {
      try {
        const stamp = Number(localStorage.getItem(DISMISS_KEY));
        return Boolean(stamp) && (Date.now() - stamp) < DISMISS_WINDOW_MS;
      } catch (e) {
        return false;
      }
    },

    dismiss() {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* private mode */ }
      const el = document.getElementById('haProfileNudge');
      if (el) el.remove();
    },

    render(pct) {
      if (document.getElementById('haProfileNudge')) return;

      const host = document.querySelector('main') || document.querySelector('.container') || document.body;
      const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);

      const html = `
        <div id="haProfileNudge" class="alert alert-info d-flex flex-wrap align-items-center gap-3 mt-3"
             style="background: rgba(0,255,255,0.08); border: 1px solid rgba(0,255,255,0.35); color: inherit;">
          <i class="bi bi-person-badge" style="font-size:1.4rem; color:#0ff;"></i>
          <div class="flex-grow-1">
            <strong>Your profile is ${pct}% complete.</strong>
            <span class="d-block small">Add your budget and preferred districts so we can match you with the right listings.</span>
          </div>
          <a class="btn btn-sm btn-info" href="profile-complete.html?next=${next}">Complete profile</a>
          <button type="button" class="btn-close" aria-label="Dismiss"
                  onclick="window.HAProfile.dismiss()"></button>
        </div>
      `;
      host.insertAdjacentHTML('afterbegin', html);
    },

    async check() {
      try {
        // Never nudge on the page we'd be sending them to.
        if (/profile-complete\.html$/.test(location.pathname)) return;
        if (this.isDismissed()) return;

        const sb = await waitForClient();
        if (!sb) return;

        const { data: { session } } = await sb.auth.getSession();
        if (!session || !session.user) return;

        const { data, error } = await sb
          .from('users')
          .select('profile_completion, role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error || !data) return;

        const pct = data.profile_completion || 0;
        if (pct < COMPLETION_THRESHOLD) this.render(pct);
      } catch (e) {
        // A nudge is never worth surfacing an error for.
        console.debug('[profile-nudge] skipped:', e && e.message);
      }
    }
  };

  window.HAProfile = HAProfile;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HAProfile.check());
  } else {
    HAProfile.check();
  }
})();
