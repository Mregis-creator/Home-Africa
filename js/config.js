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
