/**
 * Compare Listings Module for HOME AFRICA
 * 
 * Allows users to compare listings side-by-side
 * Stores compare list in localStorage
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_compare';
  var MAX_COMPARE = 3; // Maximum 3 listings to compare

  /**
   * Get compare list
   */
  function getCompareList() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading compare list:', e);
      return [];
    }
  }

  /**
   * Save compare list
   */
  function saveCompareList(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving compare list:', e);
    }
  }

  /**
   * Add listing to compare
   */
  function addToCompare(listing) {
    var list = getCompareList();
    
    // Check if already in list
    var existingIndex = list.findIndex(function (item) {
      return item.id === listing.id && item.type === listing.type;
    });
    
    if (existingIndex !== -1) {
      return { success: false, message: 'Already in compare list', count: list.length };
    }
    
    // Check max limit
    if (list.length >= MAX_COMPARE) {
      return { success: false, message: 'Maximum ' + MAX_COMPARE + ' listings can be compared', count: list.length };
    }
    
    list.push(listing);
    saveCompareList(list);
    return { success: true, message: 'Added to compare', count: list.length };
  }

  /**
   * Remove listing from compare
   */
  function removeFromCompare(listingId, listingType) {
    var list = getCompareList();
    var index = list.findIndex(function (item) {
      return item.id === listingId && item.type === listingType;
    });
    
    if (index !== -1) {
      list.splice(index, 1);
      saveCompareList(list);
      return { success: true, count: list.length };
    }
    
    return { success: false, count: list.length };
  }

  /**
   * Clear compare list
   */
  function clearCompare() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if listing is in compare list
   */
  function isInCompare(listingId, listingType) {
    var list = getCompareList();
    return list.some(function (item) {
      return item.id === listingId && item.type === listingType;
    });
  }

  /**
   * Get compare count
   */
  function getCompareCount() {
    return getCompareList().length;
  }

  /**
   * Initialize compare buttons on page
   */
  function initCompareButtons() {
    var buttons = document.querySelectorAll('.compare-btn');
    
    buttons.forEach(function (btn) {
      var listingId = btn.dataset.listingId;
      var listingType = btn.dataset.listingType;
      
      if (!listingId || !listingType) return;
      
      // Set initial state
      if (isInCompare(listingId, listingType)) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="bi bi-check"></i> Compared';
      }
      
      // Add click handler
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Collect listing data
        var card = btn.closest('.card, .property-card');
        var listingData = {
          id: listingId,
          type: listingType,
          title: card.querySelector('.card-title')?.textContent || '',
          price: card.querySelector('.price-gradient, .text-primary')?.textContent || '',
          image: card.querySelector('img')?.src || '',
          location: card.querySelector('.card-text')?.textContent || '',
          rooms: card.querySelector('[data-rooms]')?.dataset.rooms || '',
          area: card.querySelector('[data-area]')?.dataset.area || '',
          status: card.querySelector('.property-status-label')?.textContent || ''
        };
        
        var result;
        if (isInCompare(listingId, listingType)) {
          result = removeFromCompare(listingId, listingType);
          btn.classList.remove('active');
          btn.innerHTML = '<i class="bi bi-columns"></i> Compare';
          showNotification('Removed from compare');
        } else {
          result = addToCompare(listingData);
          if (result.success) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="bi bi-check"></i> Compared';
            showNotification('Added to compare');
          } else {
            showNotification(result.message);
          }
        }
        
        updateCompareCount();
      });
    });
  }

  /**
   * Update compare count in navbar
   */
  function updateCompareCount() {
    var countBadge = document.getElementById('compare-count-badge');
    if (countBadge) {
      var count = getCompareCount();
      if (count > 0) {
        countBadge.textContent = count;
        countBadge.style.display = 'inline-block';
      } else {
        countBadge.style.display = 'none';
      }
    }
  }

  /**
   * Show notification
   */
  function showNotification(message) {
    var notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(90deg, #0ff 0%, #8fff00 100%);
      color: #222;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(function () {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(function () {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  // Export to global scope
  window.HomeAfricaCompare = {
    addToCompare: addToCompare,
    removeFromCompare: removeFromCompare,
    isInCompare: isInCompare,
    getCompareList: getCompareList,
    clearCompare: clearCompare,
    getCompareCount: getCompareCount,
    initCompareButtons: initCompareButtons,
    updateCompareCount: updateCompareCount
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initCompareButtons();
      updateCompareCount();
    });
  } else {
    initCompareButtons();
    updateCompareCount();
  }

  // Add CSS for notifications
  var style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .compare-btn {
      position: absolute;
      top: 12px;
      left: 12px;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid rgba(0, 255, 255, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .compare-btn:hover {
      background: rgba(0, 255, 255, 0.9);
      border-color: #0ff;
      transform: scale(1.1);
    }
    .compare-btn.active {
      background: rgba(0, 255, 136, 0.9);
      border-color: #0ff;
    }
    .compare-btn i {
      font-size: 1.1rem;
      color: #0ff;
    }
    .compare-btn.active i {
      color: #fff;
    }
  `;
  document.head.appendChild(style);

})();
