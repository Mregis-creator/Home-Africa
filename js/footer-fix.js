/**
 * Dynamic Footer Fix - Fixed Footer
 * Footer stays fixed at bottom of viewport (always visible)
 * Content has padding to prevent overlap
 * On mobile, footer scrolls naturally with content
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  function initFooterFix() {
    const footer = document.querySelector('footer.bg-dark');
    if (!footer) return;

    // Function to update body padding based on footer height
    function updateBodyPadding() {
      const isMobile = window.innerWidth <= 768;
      const footerHeight = footer.offsetHeight;
      
if (isMobile) {
        // On mobile: Remove padding, footer scrolls naturally
        document.body.style.paddingBottom = '0';
        document.documentElement.style.paddingBottom = '0';
      } else {
        // On desktop: Add padding equal to footer height
        document.body.style.paddingBottom = footerHeight + 'px';
        document.documentElement.style.paddingBottom = footerHeight + 'px';
      }
    }
     
    // Function to set footer position
    function setFooterPosition() {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // On mobile: Footer scrolls with content
        footer.style.position = 'relative';
        footer.style.bottom = 'auto';
        footer.style.left = 'auto';
        footer.style.width = 'auto';
        footer.style.zIndex = 'auto';
        footer.style.marginTop = 'auto';
      } else {
        // On desktop: Footer fixed at bottom of viewport
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.left = '0';
        footer.style.width = '100%';
        footer.style.zIndex = '1000';
        footer.style.marginTop = '0';
      }
      
      updateBodyPadding();
    }

    // Initial setup
    setFooterPosition();

    // Update on window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        setFooterPosition();
      }, 100);
    });

    // Update when footer content changes (height might change)
    const footerObserver = new MutationObserver(function() {
      updateBodyPadding();
    });

    footerObserver.observe(footer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Update after images load (footer might contain images that change height)
    window.addEventListener('load', function() {
      setTimeout(function() {
        updateBodyPadding();
      }, 200);
    });

    // Update when content is dynamically loaded
    const bodyObserver = new MutationObserver(function() {
      // Small delay to ensure footer height is calculated correctly
      setTimeout(function() {
        updateBodyPadding();
      }, 50);
    });

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: false
    });

    // Also listen for scroll to ensure footer stays fixed
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
      const isMobile = window.innerWidth <= 768;
      if (!isMobile && footer.style.position !== 'fixed') {
        // Ensure footer stays fixed on desktop
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
      }
    }, { passive: true });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterFix);
  } else {
    initFooterFix();
  }

  // Re-initialize if footer is dynamically added
  if (typeof MutationObserver !== 'undefined') {
    const bodyObserver = new MutationObserver(function() {
      const footer = document.querySelector('footer.bg-dark');
      if (footer && !footer.dataset.footerFixApplied) {
        footer.dataset.footerFixApplied = 'true';
        initFooterFix();
      }
    });

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
