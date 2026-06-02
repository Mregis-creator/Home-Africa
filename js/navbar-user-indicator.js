/**
 * Navbar User Indicator
 * Shows user profile picture/avatar in navbar when logged in
 */

class NavbarUserIndicator {
  constructor() {
    this.init();
  }

  async init() {
    // Wait for auth system to be ready
    if (window.homeAfricaAuth) {
      this.setupIndicator();
    } else {
      // Wait for auth system to load
      setTimeout(() => this.setupIndicator(), 1000);
    }
  }

  async setupIndicator() {
    // Check if user is authenticated
    if (!window.homeAfricaAuth || !window.homeAfricaAuth.isAuthenticated()) {
      return;
    }

    const userId = window.homeAfricaAuth.getCurrentUserId();
    if (!userId) return;

    // Load user profile data
    await this.loadUserProfile(userId);

    // Add indicator to navbar
    this.addIndicatorToNavbar();
  }

  async loadUserProfile(userId) {
    if (!window.supabaseClient) return;

    try {
      const { data: user, error } = await window.supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error loading user profile for navbar:', error);
        return;
      }

      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async addNotificationBadge(navList) {
    // Add notification bell with count
    if (navList.querySelector('.navbar-notif-indicator')) return;
    
    const notifLi = document.createElement('li');
    notifLi.className = 'nav-item navbar-notif-indicator';
    notifLi.style.marginLeft = '0.5rem';
    notifLi.style.display = 'flex';
    notifLi.style.alignItems = 'center';
    
    // Get unread count
    let unreadCount = 0;
    try {
      if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session?.user) {
          const { count } = await window.supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .is('read_at', null);
          unreadCount = count || 0;
        }
      }
    } catch (e) {}
    
    // Fallback to localStorage
    if (unreadCount === 0) {
      try {
        const local = JSON.parse(localStorage.getItem('ha_notifications') || '[]');
        unreadCount = local.filter(n => !n.read_at).length;
      } catch(e) {}
    }
    
    const badge = unreadCount > 0 
      ? `<span style="position:absolute;top:-2px;right:-2px;background:linear-gradient(90deg,#ff0088,#ff4444);color:#fff;font-size:0.65rem;padding:1px 5px;border-radius:10px;font-weight:bold;">${unreadCount}</span>` 
      : '';
    
    notifLi.innerHTML = `
      <a href="notifications.html" class="nav-link" style="position:relative;padding:0.5rem;">
        <i class="bi bi-bell-fill" style="font-size:1.1rem;color:#0ff;"></i>
        ${badge}
      </a>
    `;
    
    const lastItem = navList.lastElementChild;
    if (lastItem) {
      navList.insertBefore(notifLi, lastItem);
    } else {
      navList.appendChild(notifLi);
    }
  }

  addIndicatorToNavbar() {
    // Find navbar nav list
    const navbarNavs = document.querySelectorAll('.navbar-nav, #navbarNav .navbar-nav');
    
    navbarNavs.forEach(navList => {
      // Add notification badge
      this.addNotificationBadge(navList);
      
      // Check if indicator already exists
      if (navList.querySelector('.navbar-user-indicator')) {
        return;
      }

      // Create user indicator
      const indicatorLi = document.createElement('li');
      indicatorLi.className = 'nav-item navbar-user-indicator';
      indicatorLi.style.marginLeft = '1rem';
      indicatorLi.style.display = 'flex';
      indicatorLi.style.alignItems = 'center';

      const user = this.currentUser || window.currentUserProfile;
      
      if (user && user.profile_picture_url) {
        indicatorLi.innerHTML = `
          <div class="dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 0;">
              <img src="${user.profile_picture_url}" alt="${user.full_name || 'User'}" 
                   style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0ff; object-fit: cover; cursor: pointer;"
                   title="${user.full_name || user.email}">
            </a>
            <ul class="dropdown-menu dropdown-menu-end" style="background: rgba(0,0,0,0.95); border: 1px solid #0ff;">
              <li><h6 class="dropdown-header text-white">${user.full_name || user.email}</h6></li>
              <li><hr class="dropdown-divider" style="border-color: rgba(0,255,255,0.3);"></li>
              <li><a class="dropdown-item text-white" href="profile.html"><i class="bi bi-person"></i> My Profile</a></li>
              <li><a class="dropdown-item text-white" href="dashboard.html"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
              <li><hr class="dropdown-divider" style="border-color: rgba(0,255,255,0.3);"></li>
              <li><a class="dropdown-item text-white" href="#" onclick="window.homeAfricaAuth.signOut(); return false;"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
            </ul>
          </div>
        `;
      } else {
        const initial = (user?.full_name || user?.email || 'U')[0].toUpperCase();
        indicatorLi.innerHTML = `
          <div class="dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 0;">
              <div style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0ff; background: linear-gradient(90deg, #0ff 0%, #8fff00 100%); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #222; font-weight: bold; font-size: 1.2rem;"
                   title="${user?.full_name || user?.email || 'User'}">
                ${initial}
              </div>
            </a>
            <ul class="dropdown-menu dropdown-menu-end" style="background: rgba(0,0,0,0.95); border: 1px solid #0ff;">
              <li><h6 class="dropdown-header text-white">${user?.full_name || user?.email || 'User'}</h6></li>
              <li><hr class="dropdown-divider" style="border-color: rgba(0,255,255,0.3);"></li>
              <li><a class="dropdown-item text-white" href="profile.html"><i class="bi bi-person"></i> My Profile</a></li>
              <li><a class="dropdown-item text-white" href="dashboard.html"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
              <li><hr class="dropdown-divider" style="border-color: rgba(0,255,255,0.3);"></li>
              <li><a class="dropdown-item text-white" href="#" onclick="window.homeAfricaAuth.signOut(); return false;"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
            </ul>
          </div>
        `;
      }

      // Insert before last item or at end
      const lastItem = navList.lastElementChild;
      if (lastItem) {
        navList.insertBefore(indicatorLi, lastItem);
      } else {
        navList.appendChild(indicatorLi);
      }
    });
  }

  updateIndicator(user) {
    this.currentUser = user;
    this.addIndicatorToNavbar();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.navbarUserIndicator = new NavbarUserIndicator();
  
  // Also update when profile is loaded
  if (window.homeAfricaProfile) {
    setTimeout(() => {
      if (window.homeAfricaProfile.currentUserData) {
        window.navbarUserIndicator.updateIndicator(window.homeAfricaProfile.currentUserData);
      }
    }, 2000);
  }
});

// Listen for auth state changes
if (window.homeAfricaAuth) {
  const originalSignIn = window.homeAfricaAuth.signIn;
  if (originalSignIn) {
    window.homeAfricaAuth.signIn = async function(...args) {
      const result = await originalSignIn.apply(this, args);
      setTimeout(() => {
        if (window.navbarUserIndicator) {
          window.navbarUserIndicator.setupIndicator();
        }
      }, 1000);
      return result;
    };
  }
}

