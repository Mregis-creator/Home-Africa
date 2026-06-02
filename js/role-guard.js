/**
 * Role Guard - Protects pages and features based on user roles
 * Use this to protect admin pages, merchant features, etc.
 */

class RoleGuard {
  constructor() {
    this.rbac = window.rbac;
    this.init();
  }

  init() {
    // Wait for RBAC to initialize
    setTimeout(() => {
      this.protectPages();
    }, 500);
  }

  /**
   * Protect pages based on roles
   */
  protectPages() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Skip admin.html - it handles its own authentication
    if (currentPage === 'admin.html') {
      return;
    }
    
    // Check if RBAC is available
    if (!this.rbac || typeof this.rbac.hasRole !== 'function') {
      console.warn('RBAC not initialized, skipping role guard');
      return;
    }
    
    // Admin-only pages (excluding admin.html which handles its own auth)
    // This is for other admin pages if any

    // Merchant-only pages (post.html removed - now public)
    const merchantPages = ['dashboard.html']; // post.html removed - public posting enabled
    if (merchantPages.includes(currentPage)) {
      if (!this.rbac.hasAnyRole(['merchant', 'admin'])) {
        alert('Access denied. Merchant account required.');
        window.location.href = 'signup.html';
        return;
      }
    }

    // ============================================
    // PAYMENT/SUBSCRIPTION CHECKS - COMMENTED OUT
    // All features are FREE during initial launch
    // ============================================
    
    // Check if user has active subscription (for merchants)
    // DISABLED: All features are free for now
    /*
    if (this.rbac.hasAnyRole(['merchant', 'admin']) && currentPage === 'post.html') {
      this.checkMerchantSubscription();
    }
    */
  }

  /**
   * Check if merchant has active subscription
   * DISABLED: All features are free during initial launch
   * TODO: Uncomment when ready to monetize
   */
  async checkMerchantSubscription() {
    // DISABLED: All features are free
    return true; // Always allow access
    
    /* COMMENTED OUT - Payment check code (keep for future use)
    try {
      const userId = this.rbac.getCurrentUserId();
      
      // Admins don't need subscription
      if (this.rbac.hasRole('admin')) {
        return true;
      }

      // Check subscription
      if (window.paymentSystem) {
        const hasSubscription = await window.paymentSystem.hasActiveSubscription(userId);
        
        if (!hasSubscription) {
          const proceed = confirm('Your merchant subscription has expired. Would you like to renew?');
          if (proceed) {
            window.location.href = 'signup.html?renew=true';
          } else {
            window.location.href = 'index.html';
          }
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Error checking subscription:', error);
      return true; // Allow access if check fails
    }
    */
  }

  /**
   * Protect a function/feature
   * @param {string} permission - Required permission
   * @param {function} callback - Function to execute if authorized
   * @param {function} onDenied - Callback if denied (optional)
   */
  protect(permission, callback, onDenied = null) {
    if (this.rbac.hasPermission(permission)) {
      return callback();
    } else {
      if (onDenied) {
        return onDenied();
      } else {
        alert(`Access denied. You don't have permission to perform this action.`);
        return false;
      }
    }
  }

  /**
   * Protect async function/feature
   */
  async protectAsync(permission, callback, onDenied = null) {
    if (this.rbac.hasPermission(permission)) {
      return await callback();
    } else {
      if (onDenied) {
        return await onDenied();
      } else {
        alert(`Access denied. You don't have permission to perform this action.`);
        return false;
      }
    }
  }
}

// Create global instance
window.roleGuard = new RoleGuard();

