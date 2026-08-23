/**
 * HOME AFRICA — Shared UI components (zero-build injector)
 *
 * Kills the copy-paste tax: header/nav and footer markup lived duplicated
 * across 30+ pages, forcing a regex batch-patcher (update_all_pages.js) for
 * any cross-cutting change. This module injects the canonical markup instead,
 * following the same insertAdjacentHTML pattern already used by ai-chatbot.js.
 *
 * Usage (per page):
 *   1. Put a mount point where the nav/footer should go:
 *        <div data-ha-nav data-active="explore"></div>
 *        <div data-ha-footer></div>
 *   2. Include this script (after Bootstrap, before your auth script so the
 *      nav's role-toggle IDs exist when auth.js runs):
 *        <script src="js/components.js"></script>
 *
 * The injected nav preserves EVERY element id used by the existing auth/role
 * scripts (loginNavItem, logoutNavItem, merchantDashboardNavItem,
 * adminPaymentsNavItem, messagesNavItem, *-count-badge, etc.) so no page logic
 * needs to change.
 */
(function () {
  var YEAR_SPAN = '<span class="footer-year"></span>';

  function navHTML(active) {
    function cls(key) { return 'nav-link active' + (active === key ? ' current' : ''); }
    return '' +
    '<nav class="navbar navbar-expand-lg navbar-dark">' +
      '<div class="container">' +
        '<a class="navbar-brand" href="index.html">' +
          '<img src="homeafricabanneralternative_III.png" alt="HOME AFRICA logo" /> HOME AFRICA' +
        '</a>' +
        '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">' +
          '<span class="navbar-toggler-icon"></span>' +
        '</button>' +
        '<div class="collapse navbar-collapse" id="navbarNav">' +
          '<ul class="navbar-nav ms-auto">' +
            '<li class="nav-item"><a class="' + cls('home') + '" href="index.html">Home</a></li>' +
            '<li class="nav-item"><a class="' + cls('explore') + '" href="explore.html">Explore</a></li>' +
            '<li class="nav-item"><a class="' + cls('apartments') + '" href="apartment.html">Apartments</a></li>' +
            '<li class="nav-item"><a class="' + cls('cars') + '" href="cars.html">Cars</a></li>' +
            '<li class="nav-item"><a class="' + cls('land') + '" href="land.html">Land Plots</a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="rejo-reward.html" style="color:#0ff;font-weight:700;">🎮 Rejo Reward</a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="idle-landlord.html" style="color:#ffd700;font-weight:700;">🏘️ Idle Landlord</a></li>' +
            '<li class="nav-item" id="messagesNavItem" style="display:none;"><a class="nav-link active" href="messages.html"><i class="bi bi-chat-dots"></i> Messages <span class="badge bg-danger rounded-pill ms-1" id="messages-count-badge" style="display:none;">0</span></a></li>' +
            '<li class="nav-item" id="feedNavItem"><a class="nav-link active" href="property-feed.html" style="color:#0a66c2;font-weight:700;"><i class="bi bi-rss"></i> Property Feed</a></li>' +
            '<li class="nav-item" id="merchantDashboardNavItem" style="display:none;"><a class="nav-link active" href="merchant-dashboard.html" style="color:#00c853;font-weight:700;"><i class="bi bi-shop"></i> Merchant Dashboard</a></li>' +
            '<li class="nav-item"><a class="' + cls('post') + '" href="post.html">Post your property</a></li>' +
            '<li class="nav-item" id="loginNavItem"><a class="nav-link active" href="signin.html">Log In</a></li>' +
            '<li class="nav-item" id="signupNavItem"><a class="nav-link active" href="signup.html">Buy a Merchant Account</a></li>' +
            '<li class="nav-item" id="profileNavItem" style="display:none;"><a class="nav-link active" href="profile-complete.html"><i class="bi bi-person-badge"></i> My Profile</a></li>' +
            '<li class="nav-item" id="logoutNavItem" style="display:none;"><a class="nav-link active" href="#" onclick="handleLogout(); return false;">Log Out</a></li>' +
            '<li class="nav-item" id="adminPaymentsNavItem" style="display:none;"><a class="nav-link active" href="admin-payments.html" style="color:#dc3545;font-weight:700;"><i class="bi bi-shield-lock"></i> Payments <span class="badge bg-danger rounded-pill ms-1" id="pending-payments-badge" style="display:none;">0</span></a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="favorites.html"><i class="bi bi-heart"></i> Favorites <span class="badge bg-danger rounded-pill ms-1" id="favorites-count-badge" style="display:none;">0</span></a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="compare.html"><i class="bi bi-columns"></i> Compare <span class="badge bg-danger rounded-pill ms-1" id="compare-count-badge" style="display:none;">0</span></a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="about.html">About Us</a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="partnerships.html" style="color:#8fff00;font-weight:700;">💎 Partnerships</a></li>' +
            '<li class="nav-item"><a class="nav-link active" href="search.html" title="Search HOME AFRICA"><i class="bi bi-search"></i> Search</a></li>' +
            '<li class="nav-item"><a class="nav-link active nav-link-chatbot" href="#" data-chatbot-trigger="true" title="Chat with REJO AI"><i class="bi bi-robot"></i> Ask Rejo</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</nav>';
  }

  function footerHTML() {
    return '' +
    '<footer class="bg-dark text-light pt-4 pb-3 mt-5">' +
      '<div class="container">' +
        '<div class="row">' +
          '<div class="col-md-3 mb-3"><h5>🏠 HOME AFRICA</h5><p>Your trusted real estate &amp; lifestyle platform for Rwanda and beyond. Find verified listings, connect instantly, and discover life made easier.</p></div>' +
          '<div class="col-md-3 mb-3"><h6>Quick Links</h6><ul class="list-unstyled">' +
            '<li><a href="index.html" class="footer-link">Home</a></li>' +
            '<li><a href="driving-school.html" class="footer-link">Driving School</a></li>' +
            '<li><a href="apartment.html" class="footer-link">Apartments</a></li>' +
            '<li><a href="land.html" class="footer-link">Land</a></li>' +
            '<li><a href="cars.html" class="footer-link">Cars</a></li>' +
          '</ul></div>' +
          '<div class="col-md-3 mb-3"><h6>Contact Us</h6><ul class="list-unstyled">' +
            '<li>Phone: +788 123 456</li><li>Email: info@home.africa</li><li>Address: Kigali, Rwanda</li>' +
          '</ul></div>' +
          '<div class="col-md-3 mb-3"><h6>Follow Us</h6>' +
            '<a href="https://facebook.com/homeafrica" target="_blank" rel="noopener" aria-label="Facebook" class="me-2"><i class="bi bi-facebook"></i></a>' +
            '<a href="https://twitter.com/homeafrica" target="_blank" rel="noopener" aria-label="Twitter" class="me-2"><i class="bi bi-twitter"></i></a>' +
            '<a href="https://www.instagram.com/home_africa_" target="_blank" rel="noopener" aria-label="Instagram" class="me-2"><i class="bi bi-instagram"></i></a>' +
            '<a href="https://linkedin.com/company/homeafrica" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>' +
          '</div>' +
        '</div>' +
        '<hr style="border-color:rgba(255,255,255,0.1)" />' +
        '<div class="text-center small">&copy; ' + YEAR_SPAN + ' HOME AFRICA. All rights reserved. | ' +
          '<a href="privacy-policy.html" class="footer-link">Privacy Policy</a> | ' +
          '<a href="terms-of-service.html" class="footer-link">Terms of Service</a>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  // Compact single-row footer used by most content pages (explore, apartment,
  // land, cars, about, driving-school, search ...). Visually identical to the
  // hand-written "Minimal Footer" those pages carried.
  function minimalFooterHTML() {
    return '' +
    '<footer class="bg-dark text-light py-2 mt-5" style="border-top:2px solid #0ff; position:relative; z-index:1;">' +
      '<div class="container">' +
        '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2">' +
          '<div class="small">&copy; ' + YEAR_SPAN + ' HOME AFRICA · ' +
            '<a href="privacy-policy.html" class="footer-link text-white">Privacy</a> · ' +
            '<a href="terms-of-service.html" class="footer-link text-white">Terms</a>' +
          '</div>' +
          '<div>' +
            '<a href="https://facebook.com/homeafrica" target="_blank" rel="noopener" aria-label="Facebook" class="text-white me-2"><i class="bi bi-facebook"></i></a>' +
            '<a href="https://twitter.com/homeafrica" target="_blank" rel="noopener" aria-label="Twitter" class="text-white me-2"><i class="bi bi-twitter"></i></a>' +
            '<a href="https://www.instagram.com/home_africa_" target="_blank" rel="noopener" aria-label="Instagram" class="text-white me-2"><i class="bi bi-instagram"></i></a>' +
            '<a href="https://linkedin.com/company/homeafrica" target="_blank" rel="noopener" aria-label="LinkedIn" class="text-white"><i class="bi bi-linkedin"></i></a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  var HAComponents = {
    renderNav: function (mount, active) {
      var el = typeof mount === 'string' ? document.querySelector(mount) : mount;
      if (!el) return;
      el.innerHTML = navHTML(active || el.getAttribute('data-active') || '');
    },
    // variant: '' (default full 4-column) or 'minimal' (compact single row)
    renderFooter: function (mount, variant) {
      var el = typeof mount === 'string' ? document.querySelector(mount) : mount;
      if (!el) return;
      var v = variant || el.getAttribute('data-ha-footer') || '';
      el.innerHTML = v === 'minimal' ? minimalFooterHTML() : footerHTML();
      el.querySelectorAll('.footer-year').forEach(function (s) { s.textContent = new Date().getFullYear(); });
    },
    // Auto-inject any mount points found on the page.
    init: function () {
      var self = this;
      document.querySelectorAll('[data-ha-nav]').forEach(function (m) { self.renderNav(m); });
      document.querySelectorAll('[data-ha-footer]').forEach(function (m) { self.renderFooter(m); });
      // Also stamp any bare .footer-year spans left in hand-written footers.
      document.querySelectorAll('.footer-year').forEach(function (s) {
        if (!s.textContent) s.textContent = new Date().getFullYear();
      });
    }
  };

  window.HAComponents = HAComponents;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { HAComponents.init(); });
  } else {
    HAComponents.init();
  }
})();
