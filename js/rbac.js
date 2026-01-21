/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles, permissions, and access control
 */

class RBACSystem {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentUser = null;
    this.currentRole = null;
    this.permissions = null;
    
    // Define roles and their permissions
    this.rolePermissions = {
      'guest': [
        // Guest (not logged in) permissions
        'view_listings',
        'search_listings',
        'use_ai_chatbot',
        'view_public_profiles'
      ],
      'user': [
        'view_listings',
        'search_listings',
        'create_post',
        'view_profile',
        'edit_own_profile',
        'send_messages',
        'create_booking',
        'view_own_bookings',
        'favorite_listings',
        'view_own_posts',
        'use_ai_chatbot' // AI chatbot available to all users
      ],
      'merchant': [
        // All user permissions plus:
        'create_listings',
        'edit_own_listings',
        'delete_own_listings',
        'view_own_listings',
        'manage_own_listings',
        'view_merchant_bookings',
        'manage_merchant_bookings',
        'view_merchant_dashboard',
        'create_merchant_posts',
        'edit_merchant_profile',
        'verify_merchant_account',
        'view_merchant_analytics',
        'use_ai_chatbot' // AI chatbot available to merchants
      ],
      'admin': [
        // All merchant permissions plus:
        'view_all_listings',
        'edit_all_listings',
        'delete_all_listings',
        'verify_listings',
        'verify_merchants',
        'view_all_users',
        'edit_all_users',
        'delete_users',
        'view_all_bookings',
        'manage_all_bookings',
        'view_admin_panel',
        'manage_verification_requests',
        'view_analytics',
        'manage_settings',
        'view_email_notifications',
        'manage_subscriptions',
        'use_ai_chatbot' // AI chatbot available to admins
      ],
      'ai_bot': [
        'view_listings',
        'search_listings',
        'respond_to_queries'
      ]
    };
    
    // Universal permissions (available to everyone, including guests)
    this.universalPermissions = [
      'use_ai_chatbot', // AI chatbot is available to everyone
      'view_listings',
      'search_listings'
    ];
    };
    
    this.init();
  }

  /**
   * Initialize RBAC system
   */
  async init() {
    await this.loadCurrentUser();
    this.setupRoleBasedUI();
  }

  /**
   * Load current user and role
   */
  async loadCurrentUser() {
    try {
      // Try Supabase Auth
      if (this.supabase && this.supabase.auth) {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
          this.currentUser = session.user;
          await this.loadUserRole(session.user.id);
          return;
        }
      }

      // Fallback: Check localStorage
      const userId = localStorage.getItem('userId');
      if (userId) {
        await this.loadUserRole(userId);
      }

    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  /**
   * Load user role from database
   */
  async loadUserRole(userId) {
    try {
      if (!this.supabase || !userId) {
        // No user ID means guest
        this.currentRole = 'guest';
        this.permissions = this.rolePermissions['guest'] || this.universalPermissions;
        return;
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('id, role, verified')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Check if user is merchant via localStorage
        const isMerchant = localStorage.getItem('isMerchant') === 'true';
        this.currentRole = isMerchant ? 'merchant' : 'user';
      } else {
        this.currentRole = data.role || 'user';
      }

      // Load permissions for role (merge with universal permissions)
      const rolePerms = this.rolePermissions[this.currentRole] || this.rolePermissions['user'];
      this.permissions = [...new Set([...this.universalPermissions, ...rolePerms])];

      // Store in localStorage for quick access
      localStorage.setItem('userRole', this.currentRole);

    } catch (error) {
      console.error('Error loading user role:', error);
      this.currentRole = 'user';
      this.permissions = this.rolePermissions['user'];
    }
  }

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    // Universal permissions are available to everyone
    if (this.universalPermissions.includes(permission)) {
      return true;
    }
    
    // For logged-in users, check role permissions
    if (!this.permissions) {
      // If no role loaded, check if user is logged in
      const isLoggedIn = this.getCurrentUserId() !== null;
      if (!isLoggedIn) {
        // Guest permissions
        this.permissions = this.rolePermissions['guest'] || [];
      } else {
        // User permissions (default)
        this.permissions = this.rolePermissions[this.currentRole] || this.rolePermissions['user'];
      }
    }
    return this.permissions.includes(permission);
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    return this.currentRole === role;
  }

  /**
   * Check if user has any of the specified roles
   * @param {array} roles - Array of roles to check
   * @returns {boolean} True if user has any of the roles
   */
  hasAnyRole(roles) {
    return roles.includes(this.currentRole);
  }

  /**
   * Require a specific permission (throws error if not authorized)
   * @param {string} permission - Required permission
   * @throws {Error} If user doesn't have permission
   */
  requirePermission(permission) {
    if (!this.hasPermission(permission)) {
      throw new Error(`Access denied: Permission '${permission}' required`);
    }
  }

  /**
   * Require a specific role (throws error if not authorized)
   * @param {string} role - Required role
   * @throws {Error} If user doesn't have role
   */
  requireRole(role) {
    if (!this.hasRole(role)) {
      throw new Error(`Access denied: Role '${role}' required`);
    }
  }

  /**
   * Check if user can access a page
   * @param {string} page - Page identifier
   * @returns {boolean} True if user can access
   */
  canAccessPage(page) {
    const pagePermissions = {
      'admin.html': ['admin'],
      'dashboard.html': ['merchant', 'admin'],
      'post.html': ['merchant', 'admin'],
      'create-post.html': ['user', 'merchant', 'admin'],
      'messages.html': ['user', 'merchant', 'admin'],
      'profile.html': ['user', 'merchant', 'admin'],
      'network.html': ['user', 'merchant', 'admin']
    };

    const requiredRoles = pagePermissions[page] || ['user', 'merchant', 'admin'];
    return this.hasAnyRole(requiredRoles);
  }

  /**
   * Protect a page based on role
   * @param {string} page - Page identifier
   * @param {string|array} requiredRole - Required role(s)
   */
  protectPage(page, requiredRole) {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === page) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!this.hasAnyRole(roles)) {
        this.redirectToUnauthorized();
        return false;
      }
    }
    
    return true;
  }

  /**
   * Redirect to unauthorized page
   */
  redirectToUnauthorized() {
    alert('Access denied. You do not have permission to access this page.');
    window.location.href = 'index.html';
  }

  /**
   * Setup role-based UI elements
   */
  setupRoleBasedUI() {
    // Hide/show elements based on role
    document.addEventListener('DOMContentLoaded', () => {
      // Hide admin links for non-admins
      if (!this.hasRole('admin')) {
        document.querySelectorAll('[data-role="admin"]').forEach(el => {
          el.style.display = 'none';
        });
      }

      // Hide merchant links for non-merchants
      if (!this.hasAnyRole(['merchant', 'admin'])) {
        document.querySelectorAll('[data-role="merchant"]').forEach(el => {
          el.style.display = 'none';
        });
      }

      // Show role-specific content
      document.querySelectorAll(`[data-show-role="${this.currentRole}"]`).forEach(el => {
        el.style.display = '';
      });
    });
  }

  /**
   * Get current user role
   * @returns {string} Current role
   */
  getCurrentRole() {
    return this.currentRole || localStorage.getItem('userRole') || 'user';
  }

  /**
   * Get current user permissions
   * @returns {array} Array of permissions
   */
  getCurrentPermissions() {
    return this.permissions || this.rolePermissions[this.getCurrentRole()] || [];
  }

  /**
   * Check if user can perform action on resource
   * @param {string} action - Action to perform (create, read, update, delete)
   * @param {string} resource - Resource type (listing, user, booking, etc.)
   * @param {object} resourceData - Resource data (for ownership checks)
   * @returns {boolean} True if allowed
   */
  canPerformAction(action, resource, resourceData = null) {
    // Admin can do everything
    if (this.hasRole('admin')) {
      return true;
    }

    // Check ownership for update/delete
    if (['update', 'delete'].includes(action)) {
      if (resourceData && resourceData.user_id) {
        const userId = this.getCurrentUserId();
        if (resourceData.user_id === userId) {
          return this.hasPermission(`${action}_own_${resource}`);
        }
      }
      return this.hasPermission(`${action}_all_${resource}`);
    }

    // Check create/read permissions
    return this.hasPermission(`${action}_${resource}`);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    if (this.currentUser) {
      return this.currentUser.uid || this.currentUser.id;
    }
    
    // Try Supabase auth
    if (this.supabase && this.supabase.auth) {
      try {
        const session = this.supabase.auth.getSession();
        if (session?.data?.session?.user) {
          return session.data.session.user.id;
        }
      } catch (e) {
        // Session check failed
      }
    }
    
    // Fallback to localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        return user.id;
      } catch (e) {
        // Invalid JSON
      }
    }
    
    return localStorage.getItem('userId');
  }

  /**
   * Update user role (admin only)
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   */
  async updateUserRole(userId, newRole) {
    this.requireRole('admin');
    
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get role badge HTML
   * @param {string} role - Role name
   * @returns {string} HTML badge
   */
  getRoleBadge(role) {
    const badges = {
      'admin': '<span class="badge bg-danger"><i class="bi bi-shield-check"></i> Admin</span>',
      'merchant': '<span class="badge bg-primary"><i class="bi bi-shop"></i> Merchant</span>',
      'user': '<span class="badge bg-secondary"><i class="bi bi-person"></i> User</span>',
      'ai_bot': '<span class="badge bg-info"><i class="bi bi-robot"></i> AI Bot</span>'
    };
    return badges[role] || '';
  }
}

// Create global instance
window.rbac = new RBACSystem();

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await window.rbac.init();
});

