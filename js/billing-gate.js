/**
 * HOME AFRICA — Billing Gate
 *
 * Single helper that decides whether paid features are gated by payment or
 * handed out free. The switch is an ADMIN-CONTROLLED flag stored server-side in
 * payment_platform_config.billing_enabled (see supabase/security-hardening.sql),
 * so admins can flip free-pass <-> paid per campaign without a deploy.
 *
 *   billing_enabled = false  -> free-access mode (grant paid features free)
 *   billing_enabled = true   -> require a completed payment / active subscription
 *
 * Usage:
 *   const state = await HABilling.getState();
 *   if (!state.billingEnabled) { grant free }
 *   else if (await HABilling.hasActiveSubscription(userId)) { grant }
 *   else { send to payment flow }
 */
(function () {
  function client() {
    return (window.getSupabaseClient && window.getSupabaseClient()) || window.supabaseClient || null;
  }

  const HABilling = {
    _state: null,

    /**
     * Fetch (and cache) the platform billing config.
     * Fails OPEN to free-access mode if config can't be read, so a transient
     * error never wrongly blocks a paying customer's access.
     * @returns {Promise<{billingEnabled:boolean, freeAccessMessage:string}>}
     */
    async getState(force) {
      if (this._state && !force) return this._state;
      const sb = client();
      let billingEnabled = false;
      let freeAccessMessage = 'All features are free during our launch campaign.';
      try {
        if (sb) {
          const { data } = await sb
            .from('payment_platform_config')
            .select('billing_enabled, free_access_message')
            .limit(1)
            .single();
          if (data) {
            billingEnabled = data.billing_enabled === true;
            if (data.free_access_message) freeAccessMessage = data.free_access_message;
          }
        }
      } catch (_) {
        // fail open to free-access
      }
      this._state = { billingEnabled, freeAccessMessage };
      return this._state;
    },

    async isBillingEnabled() {
      return (await this.getState()).billingEnabled;
    },

    /**
     * Does this user have an active, non-expired merchant subscription?
     */
    async hasActiveSubscription(userId) {
      const sb = client();
      if (!sb || !userId) return false;
      try {
        const { data } = await sb
          .from('merchant_subscriptions')
          .select('id, status, current_period_end')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        if (!data) return false;
        if (data.current_period_end && new Date(data.current_period_end) < new Date()) return false;
        return true;
      } catch (_) {
        return false;
      }
    },

    /**
     * Resolve access for a paid feature.
     * @param {string} userId
     * @returns {Promise<{allowed:boolean, requiresPayment:boolean, reason:string}>}
     */
    async checkAccess(userId) {
      const { billingEnabled, freeAccessMessage } = await this.getState();
      if (!billingEnabled) {
        return { allowed: true, requiresPayment: false, reason: freeAccessMessage };
      }
      const active = await this.hasActiveSubscription(userId);
      return active
        ? { allowed: true, requiresPayment: false, reason: 'Active subscription' }
        : { allowed: false, requiresPayment: true, reason: 'Payment required to unlock this feature' };
    }
  };

  window.HABilling = HABilling;
})();
