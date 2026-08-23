/**
 * Navbar Auth Status
 * Simple, reliable user login status indicator for all pages
 * Shows: "Hi, Name [ROLE]" when logged in, or "Not logged in / Log in here" when not
 */

class NavbarAuthStatus {
  constructor() {
    this.init();
  }

  async init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  async setup() {
    // Find or create the auth status container in navbar
    let container = document.getElementById('navbarAuthStatus');
    
    if (!container) {
      // Find the navbar nav list
      const navList = document.querySelector('.navbar-nav.ms-auto, #navbarNav .navbar-nav, .navbar-nav');
      if (!navList) return;
      
      // Create container li
      container = document.createElement('li');
      container.id = 'navbarAuthStatus';
      container.className = 'nav-item';
      container.style.marginLeft = '1rem';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      
      // Insert at the end of nav list
      navList.appendChild(container);
    }

    // Check auth state
    await this.updateStatus(container);
  }

  async updateStatus(container) {
    try {
      // Try Supabase auth first
      let user = null;
      let role = null;
      let name = null;

      // Check if Supabase is available
      if (typeof supabase !== 'undefined' && supabase.auth) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user || null;
        
        if (user) {
          name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          role = user.user_metadata?.role || 'user';
        }
      }

      // Fallback: check localStorage
      if (!user) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser) {
          name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
          role = currentUser.user_metadata?.role || 'user';
          user = currentUser;
        }
      }

      if (user) {
        // User is logged in - show name and role
        const roleBadge = role ? `<span style="background: linear-gradient(90deg, #00e6d8, #00c853); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; text-transform: uppercase; margin-left: 6px;">${role}</span>` : '';
        
        container.innerHTML = `
          <div class="dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 0.3rem 0.5rem; display: flex; align-items: center; gap: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(90deg, #00e6d8, #00c853); display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 0.9rem;">
                ${(name || 'U')[0].toUpperCase()}
              </div>
              <span style="color: #fff;">Hi, ${name}</span>
              ${roleBadge}
            </a>
            <ul class="dropdown-menu dropdown-menu-end" style="background: rgba(10,25,41,0.98); border: 1px solid #00e6d8; min-width: 200px;">
              <li><h6 class="dropdown-header" style="color: #00e6d8;">${name}</h6></li>
              <li><hr class="dropdown-divider" style="border-color: rgba(0,230,216,0.3);"></li>
              <li><a class="dropdown-item" href="profile.html" style="color: #e2e8f0;"><i class="bi bi-person"></i> My Profile</a></li>
              <li><a class="dropdown-item" href="profile-complete.html" style="color: #e2e8f0;"><i class="bi bi-person-badge"></i> Complete profile</a></li>
              <li><a class="dropdown-item" href="dashboard.html" style="color: #e2e8f0;"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
              <li><hr class="dropdown-divider" style="border-color: rgba(0,230,216,0.3);"></li>
              <li><a class="dropdown-item" href="#" onclick="NavbarAuthStatus.logout(); return false;" style="color: #ff6b6b;"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
            </ul>
          </div>
        `;
        
        // Hide login/signup links if they exist
        this.toggleAuthLinks(true);
      } else {
        // User is NOT logged in
        container.innerHTML = `
          <div style="text-align: right; line-height: 1.3;">
            <span style="color: #888; font-size: 0.8rem; display: block;">Not logged in</span>
            <a href="signin.html" style="color: #00e6d8; font-size: 0.85rem; text-decoration: none;">Log in here</a>
          </div>
        `;
        
        // Show login/signup links
        this.toggleAuthLinks(false);
      }
    } catch (error) {
      console.error('Error updating navbar auth status:', error);
      container.innerHTML = `
        <div style="text-align: right; line-height: 1.3;">
          <span style="color: #888; font-size: 0.8rem; display: block;">Not logged in</span>
          <a href="signin.html" style="color: #00e6d8; font-size: 0.85rem; text-decoration: none;">Log in here</a>
        </div>
      `;
    }
  }

  toggleAuthLinks(isLoggedIn) {
    // Hide/show login and signup nav items based on auth state
    const loginNav = document.getElementById('loginNavItem');
    const signupNav = document.getElementById('signupNavItem');
    const logoutNav = document.getElementById('logoutNavItem');
    const profileNav = document.getElementById('profileNavItem');

    if (loginNav) loginNav.style.display = isLoggedIn ? 'none' : 'block';
    if (signupNav) signupNav.style.display = isLoggedIn ? 'none' : 'block';
    if (logoutNav) logoutNav.style.display = isLoggedIn ? 'block' : 'none';
    if (profileNav) profileNav.style.display = isLoggedIn ? 'block' : 'none';
  }

  static async logout() {
    try {
      if (typeof supabase !== 'undefined' && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch (e) {}
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('merchantRegistered');
    localStorage.removeItem('isMerchant');
    localStorage.removeItem('merchantName');
    localStorage.removeItem('merchantEmail');
    localStorage.removeItem('merchantId');
    
    // Reload page
    window.location.reload();
  }

  // Public method to refresh status
  refresh() {
    const container = document.getElementById('navbarAuthStatus');
    if (container) {
      this.updateStatus(container);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.navbarAuthStatus = new NavbarAuthStatus();
});

// Also refresh on auth state changes (if Supabase is available)
if (typeof supabase !== 'undefined' && supabase.auth) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (window.navbarAuthStatus) {
      window.navbarAuthStatus.refresh();
    }
  });
}
