/**
 * Analytics Dashboard Router
 * Intelligently routes users to the appropriate dashboard based on their role
 * 
 * Role Hierarchy:
 * 1. admin        → admin-business-dashboard.html (Full platform consolidation)
 * 2. vip_merchant → vip-analytics.html (Industry-wide + personal business)
 * 3. merchant     → analytics.html (Personal business performance)
 * 4. user         → user-dashboard.html (Personal activity analytics)
 * 5. guest        → public-analytics.html (Platform overview only)
 */

class AnalyticsRouter {
  constructor() {
    this.roleDashboardMap = {
      'admin': 'admin-business-dashboard.html',
      'vip_merchant': 'vip-analytics.html',
      'merchant': 'analytics.html',
      'user': 'user-dashboard.html',
      'guest': 'public-analytics.html'
    };
    
    this.dashboardPermissions = {
      'admin-business-dashboard.html': ['admin'],
      'vip-analytics.html': ['vip_merchant', 'admin'],
      'analytics.html': ['merchant', 'vip_merchant', 'admin'],
      'user-dashboard.html': ['user', 'merchant', 'vip_merchant', 'admin'],
      'public-analytics.html': ['guest', 'user', 'merchant', 'vip_merchant', 'admin']
    };
    
    this.dashboardMetadata = {
      'admin-business-dashboard.html': {
        name: 'Business Intelligence',
        description: 'Full platform consolidation for strategic alignment',
        icon: 'bi-shield-lock',
        level: 5,
        features: [
          'Platform-wide KPIs',
          'Revenue analytics',
          'User acquisition metrics',
          'Merchant performance',
          'Market trends',
          'System health monitoring',
          'Growth & retention analysis'
        ]
      },
      'vip-analytics.html': {
        name: 'VIP Market Intelligence',
        description: 'Industry-wide insights + personal business performance',
        icon: 'bi-gem',
        level: 4,
        features: [
          'Industry-wide market data',
          'Competitor analysis',
          'Price benchmarks',
          'Demand indicators',
          'Trending districts',
          'Personal performance metrics',
          'Supply vs demand analysis'
        ]
      },
      'analytics.html': {
        name: 'Merchant Analytics',
        description: 'Personal business performance tracking',
        icon: 'bi-bar-chart',
        level: 3,
        features: [
          'Listing views & favorites',
          'Inquiry tracking',
          'Performance over time',
          'Top performing listings',
          'Traffic sources',
          'Location-based views'
        ]
      },
      'user-dashboard.html': {
        name: 'Personal Dashboard',
        description: 'Your activity and property journey',
        icon: 'bi-person-workspace',
        level: 2,
        features: [
          'Properties viewed',
          'Favorites saved',
          'Search history',
          'Messages sent',
          'Saved searches',
          'Activity timeline'
        ]
      },
      'public-analytics.html': {
        name: 'Platform Overview',
        description: 'Public marketplace statistics',
        icon: 'bi-globe',
        level: 1,
        features: [
          'Total listings count',
          'Platform views',
          'Active users',
          'Market insights',
          'Trending areas',
          'Average prices'
        ]
      }
    };
  }

  /**
   * Get the appropriate dashboard URL for a given role
   * @param {string} role - User role
   * @returns {string} Dashboard URL
   */
  getDashboardForRole(role) {
    return this.roleDashboardMap[role] || 'public-analytics.html';
  }

  /**
   * Get user role from auth system or localStorage
   * @returns {Promise<string>} User role
   */
  async getCurrentRole() {
    try {
      const client = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
      
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        
        if (user) {
          // Check user profile for role
          const { data: profile } = await client
            .from('users')
            .select('role, is_vip, merchant_tier')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            // Check for VIP merchant
            if (profile.role === 'merchant' && (profile.is_vip || profile.merchant_tier === 'vip')) {
              return 'vip_merchant';
            }
            return profile.role || 'user';
          }
          
          // Fallback to localStorage
          return this.getRoleFromStorage();
        }
      }
      
      // Check if guest or has stored role
      return this.getRoleFromStorage();
      
    } catch (err) {
      console.error('Error getting current role:', err);
      return this.getRoleFromStorage();
    }
  }

  /**
   * Get role from localStorage fallback
   * @returns {string} User role
   */
  getRoleFromStorage() {
    const storedRole = localStorage.getItem('userRole');
    const isMerchant = localStorage.getItem('isMerchant') === 'true' || 
                      localStorage.getItem('merchantRegistered') === 'true';
    const isVIP = localStorage.getItem('isVIP') === 'true';
    
    if (storedRole === 'admin') return 'admin';
    if (isMerchant && isVIP) return 'vip_merchant';
    if (isMerchant) return 'merchant';
    if (storedRole === 'user') return 'user';
    
    return 'guest';
  }

  /**
   * Route user to their appropriate dashboard
   * @param {boolean} redirect - Whether to redirect immediately
   * @returns {Promise<string>} Dashboard URL
   */
  async routeToDashboard(redirect = false) {
    const role = await this.getCurrentRole();
    const dashboard = this.getDashboardForRole(role);
    
    if (redirect) {
      window.location.href = dashboard;
    }
    
    return dashboard;
  }

  /**
   * Check if user can access a specific dashboard
   * @param {string} dashboard - Dashboard URL or name
   * @param {string} role - User role
   * @returns {boolean} Can access
   */
  canAccessDashboard(dashboard, role) {
    const allowedRoles = this.dashboardPermissions[dashboard];
    if (!allowedRoles) return false;
    
    return allowedRoles.includes(role);
  }

  /**
   * Get available dashboards for a role
   * @param {string} role - User role
   * @returns {Array} Available dashboards with metadata
   */
  getAvailableDashboards(role) {
    const available = [];
    
    for (const [dashboard, roles] of Object.entries(this.dashboardPermissions)) {
      if (roles.includes(role)) {
        available.push({
          url: dashboard,
          ...this.dashboardMetadata[dashboard]
        });
      }
    }
    
    return available.sort((a, b) => b.level - a.level);
  }

  /**
   * Get dashboard metadata
   * @param {string} dashboard - Dashboard URL
   * @returns {Object} Dashboard metadata
   */
  getDashboardMetadata(dashboard) {
    return this.dashboardMetadata[dashboard] || null;
  }

  /**
   * Generate navigation HTML for available dashboards
   * @param {string} currentDashboard - Current dashboard URL
   * @returns {string} HTML string
   */
  async generateDashboardNav(currentDashboard = null) {
    const role = await this.getCurrentRole();
    const dashboards = this.getAvailableDashboards(role);
    
    if (dashboards.length <= 1) return '';
    
    const current = currentDashboard || window.location.pathname.split('/').pop();
    
    return `
      <div class="dashboard-nav dropdown">
        <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-grid-3x3-gap"></i> Switch Dashboard
        </button>
        <ul class="dropdown-menu dropdown-menu-dark">
          ${dashboards.map(d => `
            <li>
              <a class="dropdown-item ${d.url === current ? 'active' : ''}" href="${d.url}">
                <i class="bi ${d.icon}"></i> ${d.name}
                ${d.url === current ? '<i class="bi bi-check float-end"></i>' : ''}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  /**
   * Protect a dashboard page - redirect if user doesn't have access
   * @param {string} dashboard - Dashboard URL to protect
   */
  async protectDashboard(dashboard) {
    const role = await this.getCurrentRole();
    
    if (!this.canAccessDashboard(dashboard, role)) {
      // Redirect to appropriate dashboard
      const appropriateDashboard = this.getDashboardForRole(role);
      
      console.warn(`Access denied to ${dashboard} for role ${role}. Redirecting to ${appropriateDashboard}`);
      
      // Show message if not already redirecting
      if (dashboard !== window.location.pathname.split('/').pop()) {
        alert(`You don't have access to this dashboard. Redirecting to your appropriate dashboard.`);
      }
      
      window.location.href = appropriateDashboard;
      return false;
    }
    
    return true;
  }

  /**
   * Initialize dashboard navigation in the DOM
   * @param {string} containerSelector - CSS selector for container
   * @param {string} currentDashboard - Current dashboard URL
   */
  async initDashboardNav(containerSelector = '#dashboard-nav-container', currentDashboard = null) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const navHTML = await this.generateDashboardNav(currentDashboard);
    container.innerHTML = navHTML;
  }

  /**
   * Get role badge HTML
   * @param {string} role - Role name
   * @returns {string} HTML badge
   */
  getRoleBadge(role) {
    const badges = {
      'admin': '<span class="badge bg-danger"><i class="bi bi-shield-lock"></i> Admin</span>',
      'vip_merchant': '<span class="badge bg-warning text-dark"><i class="bi bi-gem"></i> VIP Merchant</span>',
      'merchant': '<span class="badge bg-primary"><i class="bi bi-shop"></i> Merchant</span>',
      'user': '<span class="badge bg-info"><i class="bi bi-person"></i> User</span>',
      'guest': '<span class="badge bg-secondary"><i class="bi bi-person-x"></i> Guest</span>'
    };
    
    return badges[role] || badges['guest'];
  }

  /**
   * Get feature matrix for comparison
   * @returns {Object} Feature matrix by role
   */
  getFeatureMatrix() {
    return {
      'guest': {
        canViewPublicStats: true,
        canViewPersonalStats: false,
        canViewBusinessStats: false,
        canViewMarketIntelligence: false,
        canViewAdminStats: false,
        canExportData: false,
        canSetAlerts: false
      },
      'user': {
        canViewPublicStats: true,
        canViewPersonalStats: true,
        canViewBusinessStats: false,
        canViewMarketIntelligence: false,
        canViewAdminStats: false,
        canExportData: false,
        canSetAlerts: false
      },
      'merchant': {
        canViewPublicStats: true,
        canViewPersonalStats: true,
        canViewBusinessStats: true,
        canViewMarketIntelligence: false,
        canViewAdminStats: false,
        canExportData: true,
        canSetAlerts: true
      },
      'vip_merchant': {
        canViewPublicStats: true,
        canViewPersonalStats: true,
        canViewBusinessStats: true,
        canViewMarketIntelligence: true,
        canViewAdminStats: false,
        canExportData: true,
        canSetAlerts: true
      },
      'admin': {
        canViewPublicStats: true,
        canViewPersonalStats: true,
        canViewBusinessStats: true,
        canViewMarketIntelligence: true,
        canViewAdminStats: true,
        canExportData: true,
        canSetAlerts: true
      }
    };
  }

  /**
   * Check if a feature is available for current role
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>} Feature availability
   */
  async hasFeature(feature) {
    const role = await this.getCurrentRole();
    const matrix = this.getFeatureMatrix();
    const roleFeatures = matrix[role] || matrix['guest'];
    
    return roleFeatures[feature] || false;
  }
}

// Create global instance
window.analyticsRouter = new AnalyticsRouter();

// Auto-redirect if on a protected dashboard page
document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop();
  const protectedPages = [
    'admin-business-dashboard.html',
    'vip-analytics.html',
    'analytics.html',
    'user-dashboard.html'
  ];
  
  if (protectedPages.includes(currentPage)) {
    const hasAccess = await window.analyticsRouter.protectDashboard(currentPage);
    
    if (hasAccess) {
      // Initialize dashboard navigation if container exists
      await window.analyticsRouter.initDashboardNav('#dashboard-nav-container', currentPage);
    }
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsRouter;
}
