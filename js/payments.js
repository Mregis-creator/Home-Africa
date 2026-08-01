/**
 * ============================================================================
 * DEPRECATED — STRIPE PAYMENTS (RETIRED). DO NOT USE FOR NEW WORK.
 * ============================================================================
 *
 * This file used to hold the Stripe Checkout integration for merchant
 * subscriptions. Stripe was never taken live and has been RETIRED.
 *
 * The LIVE payment rail for HOME AFRICA is:
 *   - js/payment-system.js  — MTN MoMo / Bank of Kigali. Creates transactions
 *     via the `create_payment_transaction` Supabase RPC; an admin then
 *     confirms each payment via `verify_payment` (manual verification).
 *   - js/billing-gate.js    — window.HABilling gates whether billing is
 *     enforced at all (getState() / checkAccess(userId)). Check the gate
 *     before requiring payment anywhere.
 *
 * Pricing (RWF only) comes from window.APP_CONFIG.PRICING in js/config.js.
 *
 * This file is kept ONLY as a safe no-op shim because older pages may still
 * include it and reference `window.paymentSystem`. Every method is a no-op
 * that returns null (or a harmless permissive value) so nothing breaks.
 * There are NO Stripe keys and NO active payment code paths in this file.
 * Do not add any. Do not load this file on new pages.
 * ============================================================================
 */

(function () {
  'use strict';

  function deprecated(method) {
    console.warn(
      '[payments.js] Stripe is retired — "' + method + '" is a no-op. ' +
      'Use the MoMo/Bank of Kigali rail in js/payment-system.js (gated by js/billing-gate.js).'
    );
  }

  var stripeShim = {
    /** @deprecated Stripe retired — no-op. */
    init: function () {
      return null;
    },

    /** @deprecated Stripe retired — no-op, returns null. */
    createCheckoutSession: function () {
      deprecated('createCheckoutSession');
      return Promise.resolve(null);
    },

    /** @deprecated Stripe retired — no-op. */
    showManualPaymentInstructions: function () {
      deprecated('showManualPaymentInstructions');
      return null;
    },

    /** @deprecated Stripe retired — no-op, returns null.
     *  MoMo/BoK payments are verified by an admin via the `verify_payment`
     *  RPC; there is no client-side session verification anymore. */
    verifyPayment: function () {
      deprecated('verifyPayment');
      return Promise.resolve(null);
    },

    /** @deprecated Stripe retired — always true so legacy checks never block.
     *  Real gating lives in js/billing-gate.js (window.HABilling.checkAccess). */
    hasActiveSubscription: function () {
      return Promise.resolve(true);
    }
  };

  // Only claim the global if the real payment system (or another shim) hasn't.
  // Note: intentionally NOT a top-level `class PaymentSystem` — that would
  // collide with the live class of the same name in js/payment-system.js if
  // both files are ever loaded on the same page.
  if (!window.paymentSystem) {
    window.paymentSystem = stripeShim;
  }
})();
