/**
 * HOME AFRICA - Protected Pages Auth Check
 * Ensures users are authenticated before accessing protected pages
 */

class ProtectedPagesAuth {
  constructor() {
    this.protectedPages = [
      // 'post.html', // REMOVED: Public posting enabled - anyone can post
      'admin.html',
      'dashboard.html',
      'messages.html',
      'network.html',
      'create-post.html',
      'profile.html'
    ];
    this.init();
  }

  async waitForSupabase(maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.supabaseClient && window.supabaseClient.auth) {
        return window.supabaseClient;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  init() {
    // Wait for auth system to initialize
    setTimeout(() => {
      this.checkAuth();
    }, 1000); // Increased wait time
  }

  async checkAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Check if current page requires auth
    if (this.protectedPages.includes(currentPage)) {
      // Wait for RBAC to initialize
      if (window.rbac) {
        await window.rbac.init();
      }
      
      // Admin page - use RBAC
      if (currentPage === 'admin.html') {
        if (!window.rbac || !window.rbac.hasRole('admin')) {
          alert('Access denied. Admin privileges required.');
          window.location.href = 'index.html';
          return;
        }
        return; // Admin access granted
      }
      
      // Merchant-only pages (post.html removed - now public)
      const merchantPages = ['dashboard.html']; // post.html removed - public posting enabled
      if (merchantPages.includes(currentPage)) {
        // Wait for Supabase to be available
        const supabase = await this.waitForSupabase();
        
        if (supabase) {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Session check error:', error);
            }
            
            if (!session) {
              console.log('No session found, redirecting to login...');
              alert('Please log in to access the dashboard.');
              window.location.href = 'signin.html?redirect=dashboard.html';
              return;
            }
            
            // Check role from multiple sources
            let userRole = session.user?.user_metadata?.role || 
                          localStorage.getItem('userRole');
            
            // If no role found, check merchant flags
            if (!userRole) {
              if (localStorage.getItem('merchantRegistered') === 'true' || 
                  localStorage.getItem('isMerchant') === 'true') {
                userRole = 'merchant';
              } else {
                userRole = 'user';
              }
            }
            
            console.log('User role check:', {
              metadataRole: session.user?.user_metadata?.role,
              localStorageRole: localStorage.getItem('userRole'),
              merchantRegistered: localStorage.getItem('merchantRegistered'),
              finalRole: userRole
            });
            
            if (userRole !== 'merchant' && userRole !== 'admin') {
              console.log('Access denied - user role:', userRole);
              alert('Access denied. Merchant account required.');
              window.location.href = 'signup.html';
              return;
            }
            
            console.log('✅ Access granted - user role:', userRole);
            // Access granted - continue
            return;
          } catch (err) {
            console.error('Auth check error:', err);
            // Fallback to RBAC if available
            if (window.rbac && window.rbac.hasAnyRole(['merchant', 'admin'])) {
              console.log('✅ Access granted via RBAC fallback');
              return; // Access granted
            }
            // Fallback to localStorage check
            const storedRole = localStorage.getItem('userRole');
            if (storedRole === 'merchant' || storedRole === 'admin') {
              console.log('✅ Access granted via localStorage:', storedRole);
              return;
            }
            console.log('Access denied - no valid role found');
            alert('Access denied. Merchant account required.');
            window.location.href = 'signup.html';
            return;
          }
        } else {
          // Supabase not available - fallback to RBAC or localStorage
          console.log('Supabase not available, checking localStorage...');
          const storedRole = localStorage.getItem('userRole');
          const isMerchant = localStorage.getItem('merchantRegistered') === 'true' || 
                           localStorage.getItem('isMerchant') === 'true';
          
          if (storedRole === 'merchant' || storedRole === 'admin' || isMerchant) {
            console.log('✅ Access granted via localStorage fallback');
            return;
          }
          
          if (window.rbac && window.rbac.hasAnyRole(['merchant', 'admin'])) {
            console.log('✅ Access granted via RBAC fallback');
            return;
          }
          
          console.log('Access denied - no valid credentials found');
          alert('Access denied. Merchant account required.');
          window.location.href = 'signup.html';
          return;
        }
      }
      
      // Special handling for profile.html (can view others' profiles)
      if (currentPage === 'profile.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const viewingOtherUser = urlParams.get('userId');
        
        // If viewing own profile, require auth
        if (!viewingOtherUser) {
          if (!window.homeAfricaAuth || !window.homeAfricaAuth.isAuthenticated()) {
            this.redirectToSignIn();
          }
        }
        return;
      }
      
      // For all other protected pages, require auth
      if (!window.homeAfricaAuth || !window.homeAfricaAuth.isAuthenticated()) {
        this.redirectToSignIn();
      }
    }
  }

  redirectToSignIn() {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `signin.html?redirect=${encodeURIComponent(currentPath)}`;
  }
}

// Initialize protected pages auth check
document.addEventListener('DOMContentLoaded', () => {
  window.protectedPagesAuth = new ProtectedPagesAuth();
});

