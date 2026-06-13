/**
 * HOME AFRICA — Controlled location vocabulary + helpers
 *
 * WHY: free-text location ("Kigali" / "kigali" / "KGL") silently breaks search,
 * filtering and per-city scaling. This module is the single controlled source
 * of location data and the only place listings should get their location from.
 *
 * Phase 1 covers Kigali. The tree is country -> city -> district -> [sectors],
 * so adding Nairobi/Kampala later is just data, not code.
 *
 * Canonical stored shape (JSONB on listings.location):
 *   { country, city, district, sector, address, label }
 *   - label is a human-readable string for display, e.g.
 *     "KG 9 Ave, Kacyiru, Gasabo, Kigali"
 *
 * Always render a listing's location with HALocations.format(listing.location)
 * — it accepts both the new object shape AND legacy free-text strings.
 */
(function () {
  // Official administrative sectors of the City of Kigali (3 districts).
  const TREE = {
    Rwanda: {
      Kigali: {
        Gasabo: [
          'Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali',
          'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba',
          'Remera', 'Rusororo', 'Rutunga'
        ],
        Kicukiro: [
          'Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro',
          'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'
        ],
        Nyarugenge: [
          'Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima',
          'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'
        ]
      }
    }
  };

  function cfg(key, fallback) {
    return (window.APP_CONFIG && window.APP_CONFIG[key]) || fallback;
  }

  const HALocations = {
    data: TREE,

    country() { return cfg('defaultCountry', 'Rwanda'); },
    city() { return cfg('defaultCity', 'Kigali'); },

    /** Districts for the active city. */
    districts(city, country) {
      const c = (TREE[country || this.country()] || {})[city || this.city()] || {};
      return Object.keys(c);
    },

    /** Sectors for a district in the active city. */
    sectors(district, city, country) {
      const c = (TREE[country || this.country()] || {})[city || this.city()] || {};
      return (c[district] || []).slice();
    },

    /**
     * Turn any stored location (object OR legacy string) into a display string.
     * Safe to call anywhere — never returns "[object Object]".
     */
    format(location) {
      if (!location) return '';
      if (typeof location === 'string') return location;
      if (typeof location === 'object') {
        if (location.label) return location.label;
        const parts = [location.address, location.sector, location.district, location.city]
          .filter(Boolean);
        return parts.join(', ') || location.city || location.district || '';
      }
      return String(location);
    },

    /**
     * Build the canonical structured location object from form field ids.
     * @param {{districtId:string, sectorId:string, detailId?:string}} ids
     */
    build(ids) {
      const get = (id) => {
        const el = id && document.getElementById(id);
        return el ? (el.value || '').trim() : '';
      };
      const district = get(ids.districtId);
      const sector = get(ids.sectorId);
      const address = get(ids.detailId);
      const city = this.city();
      const country = this.country();
      const label = [address, sector, district, city].filter(Boolean).join(', ');
      return { country, city, district, sector, address, label };
    },

    /** Fill a <select> with options. */
    _fillSelect(select, values, placeholder) {
      if (!select) return;
      const current = select.value;
      select.innerHTML = '';
      const ph = document.createElement('option');
      ph.value = '';
      ph.disabled = true;
      ph.selected = true;
      ph.textContent = placeholder;
      select.appendChild(ph);
      values.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        if (v === current) opt.selected = true;
        select.appendChild(opt);
      });
    },

    /**
     * Initialise a district select (class "location-district"):
     *  - fills it with the active city's districts
     *  - on change, fills the paired sector select named in data-sector-target
     */
    initDistrict(districtSelect) {
      if (!districtSelect || districtSelect.dataset.haInit === '1') return;
      districtSelect.dataset.haInit = '1';

      this._fillSelect(districtSelect, this.districts(), 'Select district');

      const sectorSelect = document.getElementById(districtSelect.dataset.sectorTarget || '');
      const refreshSectors = () => {
        if (!sectorSelect) return;
        this._fillSelect(sectorSelect, this.sectors(districtSelect.value), 'Select sector');
      };
      districtSelect.addEventListener('change', refreshSectors);
      refreshSectors();
    },

    /** Initialise any uninitialised district selects within a root element. */
    initWithin(root) {
      (root || document).querySelectorAll('select.location-district')
        .forEach((el) => this.initDistrict(el));
    }
  };

  window.HALocations = HALocations;

  // Auto-initialise on load, and again whenever forms are injected dynamically
  // (post.html builds its forms after a listing type is chosen).
  function boot() {
    HALocations.initWithin(document);
    if (window.MutationObserver) {
      const observer = new MutationObserver(() => HALocations.initWithin(document));
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
