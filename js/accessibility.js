/**
 * Accessibility Module for HOME AFRICA
 * 
 * Improves ARIA labels, keyboard navigation, and screen reader support
 */

(function () {
  'use strict';

  /**
   * Add skip links for keyboard users
   */
  function addSkipLinks() {
    if (document.getElementById('skipLinks')) return;

    var skipLinks = document.createElement('div');
    skipLinks.id = 'skipLinks';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navbar" class="skip-link">Skip to navigation</a>
    `;
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Add ARIA labels to buttons without text
   */
  function addAriaLabels() {
    // Favorite buttons
    var favoriteBtns = document.querySelectorAll('.favorite-btn:not([aria-label])');
    favoriteBtns.forEach(function (btn) {
      var isFavorited = btn.classList.contains('favorited');
      btn.setAttribute('aria-label', isFavorited ? 'Remove from favorites' : 'Add to favorites');
      btn.setAttribute('aria-pressed', isFavorited ? 'true' : 'false');
    });

    // Compare buttons
    var compareBtns = document.querySelectorAll('.compare-btn:not([aria-label])');
    compareBtns.forEach(function (btn) {
      var isCompared = btn.classList.contains('active');
      btn.setAttribute('aria-label', isCompared ? 'Remove from compare' : 'Add to compare');
      btn.setAttribute('aria-pressed', isCompared ? 'true' : 'false');
    });

    // Contact buttons
    var contactBtns = document.querySelectorAll('.contact-btn:not([aria-label])');
    contactBtns.forEach(function (btn) {
      var type = btn.textContent.trim();
      btn.setAttribute('aria-label', 'Contact seller via ' + type);
    });

    // Modal close buttons
    var closeBtns = document.querySelectorAll('.btn-close:not([aria-label])');
    closeBtns.forEach(function (btn) {
      btn.setAttribute('aria-label', 'Close dialog');
    });

    // Social share buttons
    var shareBtns = document.querySelectorAll('.share-btn:not([aria-label])');
    shareBtns.forEach(function (btn) {
      var platform = btn.getAttribute('title') || 'social media';
      btn.setAttribute('aria-label', 'Share on ' + platform);
    });

    // Star rating inputs
    var starInputs = document.querySelectorAll('input[type="radio"][name="rating"]');
    starInputs.forEach(function (input, index) {
      input.setAttribute('aria-label', 'Rating ' + (index + 1) + ' out of 5');
    });
  }

  /**
   * Improve keyboard navigation
   */
  function improveKeyboardNav() {
    // Make all interactive elements focusable
    var interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(function (el) {
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
    });

    // Add keyboard support for favorite buttons
    var favoriteBtns = document.querySelectorAll('.favorite-btn');
    favoriteBtns.forEach(function (btn) {
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // Add keyboard support for compare buttons
    var compareBtns = document.querySelectorAll('.compare-btn');
    compareBtns.forEach(function (btn) {
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // Ensure modals trap focus
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function (modal) {
      modal.addEventListener('shown.bs.modal', function () {
        var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      });
    });
  }

  /**
   * Ensure visible focus states
   */
  function improveFocusStates() {
    var style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 3px solid #0ff !important;
        outline-offset: 2px !important;
      }
      *:focus:not(:focus-visible) {
        outline: none !important;
      }
      *:focus-visible {
        outline: 3px solid #0ff !important;
        outline-offset: 2px !important;
      }
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #0ff;
        color: #222;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 10000;
        transition: top 0.3s;
        font-weight: bold;
      }
      .skip-link:focus {
        top: 0;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add landmark roles for screen readers
   */
  function addLandmarks() {
    // Add main landmark
    var mainContent = document.querySelector('main, .container');
    if (mainContent && !mainContent.hasAttribute('role')) {
      mainContent.setAttribute('role', 'main');
      mainContent.id = 'main-content';
    }

    // Add navigation landmark
    var navbar = document.querySelector('.navbar');
    if (navbar && !navbar.hasAttribute('role')) {
      navbar.setAttribute('role', 'navigation');
      navbar.id = 'navbar';
    }

    // Add banner landmark to header
    var header = document.querySelector('header');
    if (header && !header.hasAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    // Add contentinfo landmark to footer
    var footer = document.querySelector('footer');
    if (footer && !footer.hasAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
  }

  /**
   * Add live regions for dynamic content
   */
  function addLiveRegions() {
    if (document.getElementById('aria-live-region')) return;

    var liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  /**
   * Announce changes to screen readers
   */
  function announce(message) {
    var liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(function () {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Initialize accessibility features
   */
  function initAccessibility() {
    addSkipLinks();
    addAriaLabels();
    improveKeyboardNav();
    improveFocusStates();
    addLandmarks();
    addLiveRegions();
  }

  // Export to global scope
  window.HomeAfricaAccessibility = {
    initAccessibility: initAccessibility,
    announce: announce,
    addAriaLabels: addAriaLabels
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibility);
  } else {
    initAccessibility();
  }

  // Re-run ARIA labels when DOM changes
  var observer = new MutationObserver(function () {
    addAriaLabels();
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
