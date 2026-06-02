/**
 * Dark Mode Module for HOME AFRICA
 * 
 * Allows users to toggle between light and dark themes
 * Persists preference in localStorage
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'home_africa_dark_mode';
  var DARK_MODE_CLASS = 'dark-mode';

  /**
   * Check if dark mode is enabled
   */
  function isDarkMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Set dark mode
   */
  function setDarkMode(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
      applyDarkMode(enabled);
    } catch (e) {
      console.error('Error saving dark mode preference:', e);
    }
  }

  /**
   * Toggle dark mode
   */
  function toggleDarkMode() {
    var current = isDarkMode();
    setDarkMode(!current);
    return !current;
  }

  /**
   * Apply dark mode to page
   */
  function applyDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add(DARK_MODE_CLASS);
      var toggleBtn = document.getElementById('darkModeToggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="bi bi-sun"></i>';
        toggleBtn.title = 'Switch to Light Mode';
      }
    } else {
      document.body.classList.remove(DARK_MODE_CLASS);
      var toggleBtn = document.getElementById('darkModeToggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="bi bi-moon"></i>';
        toggleBtn.title = 'Switch to Dark Mode';
      }
    }
  }

  /**
   * Initialize dark mode toggle button
   */
  function initDarkModeToggle() {
    // Create toggle button if it doesn't exist
    if (!document.getElementById('darkModeToggle')) {
      var toggleBtn = document.createElement('button');
      toggleBtn.id = 'darkModeToggle';
      toggleBtn.className = 'btn btn-outline-light ms-2';
      toggleBtn.style.cssText = 'border: 2px solid #0ff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;';
      toggleBtn.innerHTML = '<i class="bi bi-moon"></i>';
      toggleBtn.title = 'Switch to Dark Mode';
      toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
      
      // Add to navbar
      var navbarNav = document.querySelector('.navbar-nav');
      if (navbarNav) {
        navbarNav.appendChild(toggleBtn);
      }
      
      // Add click handler
      toggleBtn.addEventListener('click', function () {
        toggleDarkMode();
      });
    }
    
    // Apply saved preference
    applyDarkMode(isDarkMode());
  }

  // Export to global scope
  window.HomeAfricaDarkMode = {
    isDarkMode: isDarkMode,
    setDarkMode: setDarkMode,
    toggleDarkMode: toggleDarkMode,
    initDarkModeToggle: initDarkModeToggle
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkModeToggle);
  } else {
    initDarkModeToggle();
  }

  // Add CSS for dark mode
  var style = document.createElement('style');
  style.textContent = `
    body.dark-mode {
      background: linear-gradient(120deg, rgba(10,10,30,0.95) 0%, rgba(20,20,50,0.95) 50%, rgba(30,10,40,0.95) 100%) !important;
    }
    body.dark-mode .navbar {
      background: linear-gradient(90deg, rgba(20,20,50,0.95) 0%, rgba(30,30,60,0.95) 100%) !important;
    }
    body.dark-mode .compare-card,
    body.dark-mode .stat-card,
    body.dark-mode .listing-item,
    body.dark-mode .dashboard-card,
    body.dark-mode .card {
      background: rgba(30,30,60,0.95) !important;
      border-color: rgba(0,255,255,0.3) !important;
    }
    body.dark-mode .modal-content {
      background: rgba(30,30,60,0.98) !important;
    }
    body.dark-mode .text-white {
      color: #e0e0e0 !important;
    }
    body.dark-mode .footer-link {
      color: #b0b0b0 !important;
    }
    body.dark-mode .form-control,
    body.dark-mode .form-select {
      background: rgba(40,40,70,0.9) !important;
      border-color: rgba(0,255,255,0.3) !important;
      color: #e0e0e0 !important;
    }
    body.dark-mode .btn-primary,
    body.dark-mode .btn-success {
      background: linear-gradient(90deg, #0ff 0%, #8fff00 100%) !important;
      color: #222 !important;
    }
    #darkModeToggle:hover {
      background: rgba(0,255,255,0.2) !important;
      transform: scale(1.1);
    }
    #darkModeToggle i {
      font-size: 1.2rem;
      color: #0ff;
    }
  `;
  document.head.appendChild(style);

})();
