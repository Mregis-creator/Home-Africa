/**
 * HOME AFRICA — Global configuration (single source of truth)
 *
 * Region, currency and brand defaults live here so they are NEVER hardcoded
 * across the codebase. Scale-ready: launching a new market (e.g. Nairobi)
 * is a config change, not a code change.
 *
 * Part of the Rejo Group family of brands.
 */
(function () {
  const APP_CONFIG = {
    brand: 'HOME AFRICA',
    parentBrand: 'Rejo Group',

    // --- Active market (Phase 1: Kigali, Rwanda) ---
    defaultCountry: 'Rwanda',
    defaultCity: 'Kigali',
    defaultCurrency: 'RWF',
    defaultDialCode: '+250',
    defaultLocale: 'en',

    // --- Supported currencies (future East African Community expansion) ---
    currencies: {
      RWF: { symbol: 'RWF', name: 'Rwandan Franc' },
      KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
      UGX: { symbol: 'USh', name: 'Ugandan Shilling' },
      TZS: { symbol: 'TSh', name: 'Tanzanian Shilling' },
      USD: { symbol: '$',   name: 'US Dollar' }
    },

    // --- Payments ---
    // The platform's receiving MoMo number lives in the DB
    // (payment_platform_config), NOT here. Leave momoNumber blank; it is only a
    // last-resort client fallback and must never be a personal number.
    PAYMENTS: {
      momoNumber: '',
      methods: ['momo_mtn', 'bank_bok']
    },

    // --- PRICING (single source of truth, all amounts in RWF) ---
    // Consolidates the previously conflicting USD/RWF schemes. Every pricing
    // surface (partnerships, merchant-dashboard, premium, feature-listing,
    // driving-school) must read from here via APP_CONFIG.PRICING.
    PRICING: {
      currency: 'RWF',

      // Listing boosts (feature-listing.html) — already live values.
      boosts: [
        { id: 'boost_3d',  label: '3 Days',  days: 3,  amount: 5000 },
        { id: 'boost_7d',  label: '7 Days',  days: 7,  amount: 10000, popular: true },
        { id: 'boost_30d', label: '30 Days', days: 30, amount: 35000 }
      ],

      // Merchant subscription tiers (merchant-dashboard.html, premium.html).
      merchantTiers: [
        { id: 'free',         name: 'Free',         monthly: 0,      yearly: 0,
          limits: { listings: 5,  featured: 1,  leadsPerMonth: 30, sponsoredPosts: 0 } },
        { id: 'professional', name: 'Professional', monthly: 50000,  yearly: 500000,
          limits: { listings: 20, featured: 5,  leadsPerMonth: 200, sponsoredPosts: 2 } },
        { id: 'enterprise',   name: 'Enterprise',   monthly: 150000, yearly: 1500000,
          limits: { listings: -1, featured: 10, leadsPerMonth: -1,  sponsoredPosts: -1 } }
      ],

      // Agent plan (partnerships.html / agent-dashboard.html).
      agentTiers: [
        { id: 'agent_free', name: 'Agent',     monthly: 0 },
        { id: 'agent_pro',  name: 'Agent Pro', monthly: 50000 }
      ],

      // Pay-per-lead after the free monthly allowance.
      leads: { freePerMonth: 30, pricePerLead: 500 },

      // Driving school packages (basic/standard/premium pages).
      drivingSchool: [
        { id: 'ds_basic',    name: 'Basic',    amount: 100000 },
        { id: 'ds_standard', name: 'Standard', amount: 150000 },
        { id: 'ds_premium',  name: 'Premium',  amount: 250000 }
      ]
    }
  };

  /**
   * Format a money amount for display.
   * @param {number|string} amount
   * @param {string} [currency] - defaults to the active market currency
   * @returns {string} e.g. "15,000,000 RWF"
   */
  APP_CONFIG.formatPrice = function (amount, currency) {
    const cur = currency || APP_CONFIG.defaultCurrency;
    const n = Number(amount) || 0;
    return n.toLocaleString() + ' ' + cur;
  };

  window.APP_CONFIG = APP_CONFIG;
})();
