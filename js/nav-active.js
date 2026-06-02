/**
 * Navbar active-link normalizer.
 *
 * Several pages were authored with `class="nav-link active"` on EVERY
 * link, which highlights the entire navbar. This script:
 *   1. Strips the `active` class from every top-level navbar link
 *      (links inside `.nav.nav-tabs` are left alone — those are real tabs).
 *   2. Adds `active` to the single link whose href matches the current
 *      page's filename, so users can see where they are.
 */
(function () {
  'use strict';

  function getCurrentFile() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
    if (!file) return 'index.html';
    return file;
  }

  function init() {
    var current = getCurrentFile();

    // Only target real navbar links, not Bootstrap tab buttons.
    var navbars = document.querySelectorAll('.navbar, nav.navbar');
    navbars.forEach(function (navbar) {
      var links = navbar.querySelectorAll('a.nav-link');
      links.forEach(function (link) {
        link.classList.remove('active');
        link.removeAttribute('aria-current');

        var href = (link.getAttribute('href') || '').trim().toLowerCase();
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

        // Compare just the filename to avoid path/origin differences.
        var linkFile = href.split('/').pop().split('?')[0].split('#')[0];
        if (linkFile === current) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
