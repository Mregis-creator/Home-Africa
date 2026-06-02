/**
 * Footer Fix - Sticky-footer via flexbox
 *
 * The body uses `display:flex; flex-direction:column; min-height:100vh`,
 * so the footer naturally sits at the bottom of the viewport on short pages
 * and scrolls below the content on long pages.
 *
 * This script's only job is to UNDO any leftover inline styles from a
 * previous "fixed footer" implementation, so older cached pages don't
 * keep overlapping the content.
 */

(function() {
  'use strict';

  function clearLegacyFixedFooter() {
    const footer = document.querySelector('footer.bg-dark');
    if (!footer) return;

    // Strip any inline positioning that would make the footer overlap content
    ['position', 'bottom', 'left', 'width', 'zIndex', 'marginTop'].forEach(function(prop) {
      footer.style[prop] = '';
    });

    // Remove any padding-bottom that older code added to compensate
    document.body.style.paddingBottom = '';
    document.documentElement.style.paddingBottom = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearLegacyFixedFooter);
  } else {
    clearLegacyFixedFooter();
  }
})();
