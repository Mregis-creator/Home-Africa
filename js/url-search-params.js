/**
 * URL Search Params Handler
 *
 * Reads ?location=...&maxPrice=... from the URL (typically forwarded from
 * index.html search) and:
 *  1. Displays a dismissible filter banner near the top of the page.
 *  2. Pre-fills any matching filter inputs and triggers their events so
 *     existing per-page filter logic picks them up.
 */
(function () {
  'use strict';

  function formatPrice(n) {
    return Number(n).toLocaleString('en-US');
  }

  function readParams() {
    var p = new URLSearchParams(window.location.search);
    var location = (p.get('location') || '').trim();
    var maxPriceRaw = (p.get('maxPrice') || '').replace(/[^\d]/g, '');
    var maxPrice = maxPriceRaw ? parseInt(maxPriceRaw, 10) : null;
    return { location: location, maxPrice: maxPrice };
  }

  function buildBanner(params) {
    var pills = [];
    if (params.location) {
      pills.push('<span class="badge bg-info text-dark me-2"><i class="bi bi-geo-alt-fill"></i> ' +
        escapeHtml(params.location) + '</span>');
    }
    if (params.maxPrice) {
      pills.push('<span class="badge bg-warning text-dark me-2"><i class="bi bi-currency-exchange"></i> Max ' +
        formatPrice(params.maxPrice) + ' RWF</span>');
    }
    if (pills.length === 0) return null;

    var banner = document.createElement('div');
    banner.id = 'url-filter-banner';
    banner.className = 'alert alert-dark d-flex flex-wrap align-items-center gap-2 mb-3';
    banner.style.cssText = 'border:1px solid #0ff; background:rgba(0,255,255,0.08); color:#fff;';
    banner.innerHTML =
      '<span class="me-2"><i class="bi bi-funnel-fill"></i> <strong>Filtering by:</strong></span>' +
      pills.join('') +
      '<a href="' + window.location.pathname + '" class="btn btn-sm btn-outline-light ms-auto">' +
      '<i class="bi bi-x-circle"></i> Clear filters</a>';
    return banner;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function insertBanner(banner) {
    if (!banner) return;
    // Prefer a `.container` inside <main> or first `.container.py-*`, fall back to first .container
    var target =
      document.querySelector('main .container') ||
      document.querySelector('.container.py-5') ||
      document.querySelector('.container.py-4') ||
      document.querySelector('.container');
    if (target) {
      target.insertBefore(banner, target.firstChild);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  function prefillInputs(params) {
    // Map of possible input IDs per page; first match wins.
    var locationInputs = ['carSearchInput', 'landSearchInput', 'apartmentSearchInput', 'searchInput'];
    var maxPriceInputs = ['maxPrice', 'maxPriceFilter'];

    function fireInput(el) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (params.location) {
      for (var i = 0; i < locationInputs.length; i++) {
        var el = document.getElementById(locationInputs[i]);
        if (el) {
          el.value = params.location;
          fireInput(el);
          break;
        }
      }
    }

    if (params.maxPrice) {
      for (var j = 0; j < maxPriceInputs.length; j++) {
        var elp = document.getElementById(maxPriceInputs[j]);
        if (elp) {
          elp.value = params.maxPrice;
          fireInput(elp);
          break;
        }
      }
    }

    // If there is an Apply Filters button, click it so the page re-filters.
    var applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn && (params.location || params.maxPrice)) {
      setTimeout(function () { applyBtn.click(); }, 100);
    }
  }

  function init() {
    var params = readParams();
    if (!params.location && !params.maxPrice) return;

    var banner = buildBanner(params);
    insertBanner(banner);
    prefillInputs(params);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
