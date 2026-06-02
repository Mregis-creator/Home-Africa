/**
 * Saved Searches Manager for HOME AFRICA
 * 
 * Allows users to save their search filters and receive alerts
 * when new listings match their criteria
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_saved_searches';

  /**
   * Get all saved searches from localStorage
   */
  function getSavedSearches() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading saved searches:', e);
      return [];
    }
  }

  /**
   * Save searches to localStorage
   */
  function saveSavedSearches(searches) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (e) {
      console.error('Error saving searches:', e);
    }
  }

  /**
   * Save a new search
   */
  function saveSearch(searchParams, searchName) {
    var searches = getSavedSearches();
    var searchId = 'search_' + Date.now();
    
    searches.push({
      id: searchId,
      name: searchName || 'Search ' + (searches.length + 1),
      params: searchParams,
      createdAt: new Date().toISOString(),
      alertEnabled: true
    });
    
    saveSavedSearches(searches);
    return { success: true, count: searches.length };
  }

  /**
   * Remove a saved search
   */
  function removeSearch(searchId) {
    var searches = getSavedSearches();
    var filtered = searches.filter(function (s) {
      return s.id !== searchId;
    });
    saveSavedSearches(filtered);
    return { count: filtered.length };
  }

  /**
   * Toggle alert for a saved search
   */
  function toggleAlert(searchId) {
    var searches = getSavedSearches();
    var search = searches.find(function (s) {
      return s.id === searchId;
    });
    if (search) {
      search.alertEnabled = !search.alertEnabled;
      saveSavedSearches(searches);
      return { alertEnabled: search.alertEnabled };
    }
    return { alertEnabled: false };
  }

  /**
   * Get saved searches count
   */
  function getSavedSearchesCount() {
    return getSavedSearches().length;
  }

  // Export to global scope
  window.HomeAfricaSavedSearches = {
    getSavedSearches: getSavedSearches,
    saveSearch: saveSearch,
    removeSearch: removeSearch,
    toggleAlert: toggleAlert,
    getSavedSearchesCount: getSavedSearchesCount
  };

  /**
   * Initialize save search button if exists
   */
  function initSaveSearchButton() {
    var saveSearchBtn = document.getElementById('save-search-btn');
    if (!saveSearchBtn) return;

    saveSearchBtn.addEventListener('click', function () {
      var searchName = prompt('Name this search (e.g., "Apartments in Kigali under 50M"):');
      if (!searchName) return;

      // Collect current search parameters
      var searchParams = {
        location: document.getElementById('carSearchInput')?.value ||
                    document.getElementById('landSearchInput')?.value ||
                    document.getElementById('apartmentSearchInput')?.value ||
                    document.getElementById('searchInput')?.value || '',
        maxPrice: document.getElementById('maxPrice')?.value ||
                   document.getElementById('maxPriceFilter')?.value || ''
      };

      var result = window.HomeAfricaSavedSearches.saveSearch(searchParams, searchName);
      showNotification('Search saved successfully!');
      updateSavedSearchesCount(result.count);
    });
  }

  /**
   * Show brief notification
   */
  function showNotification(message) {
    var existing = document.getElementById('saved-searches-notification');
    if (existing) existing.remove();

    var notification = document.createElement('div');
    notification.id = 'saved-searches-notification';
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(90deg,#0ff 0%,#8fff00 100%);color:#222;padding:0.75rem 1.5rem;border-radius:8px;font-weight:bold;z-index:10001;animation:slideIn 0.3s ease-out;box-shadow:0 4px 20px rgba(0,255,255,0.3);';

    var style = document.createElement('style');
    style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(function () {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(function () {
        notification.remove();
      }, 300);
    }, 2000);
  }

  /**
   * Update saved searches count
   */
  function updateSavedSearchesCount(count) {
    var countBadge = document.getElementById('saved-searches-count-badge');
    if (countBadge) {
      countBadge.textContent = count;
      countBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSaveSearchButton();
      updateSavedSearchesCount(window.HomeAfricaSavedSearches.getSavedSearchesCount());
    });
  } else {
    initSaveSearchButton();
    updateSavedSearchesCount(window.HomeAfricaSavedSearches.getSavedSearchesCount());
  }

})();
