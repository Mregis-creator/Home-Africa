/**
 * Network & Connections System
 * Handles Partners (followers), Following, Connection Requests, and Suggestions
 */

class NetworkSystem {
  constructor() {
    this.supabase = window.supabaseClient;
    this.userId = null;
    this.userType = null;
    this.init();
  }

  /**
   * Initialize network system
   */
  async init() {
    this.userId = this.getCurrentUserId();
    this.userType = this.getAuthorType();

    if (!this.userId) {
      this.showLoginPrompt();
      return;
    }

    await this.loadStats();
    await this.loadPartners();
    await this.loadFollowing();
    await this.loadConnectionRequests();
    await this.loadSuggestions();
  }

  /**
   * Show login prompt
   */
  showLoginPrompt() {
    const partnersList = document.getElementById('partnersList');
    if (partnersList) {
      partnersList.innerHTML = `
        <div class="text-center text-white-50 py-5">
          <i class="bi bi-lock" style="font-size: 3rem;"></i>
          <p class="mt-3">Please <a href="signin.html" class="text-cyan">log in</a> to view your network</p>
        </div>
      `;
    }
  }

  /**
   * Load network stats
   */
  async loadStats() {
    try {
      if (!this.supabase || !this.userId) return;

      // Get user profile stats
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('partners_count, following_count')
        .eq('user_id', this.userId)
        .single();

      if (profile) {
        document.getElementById('partnersCount').textContent = profile.partners_count || 0;
        document.getElementById('followingCount').textContent = profile.following_count || 0;
      }

      // Get connection requests count
      const { data: requests } = await supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('following_id', this.userId)
        .eq('status', 'pending');

      document.getElementById('connectionRequests').textContent = requests?.length || 0;

      // Get suggestions count (simplified)
      document.getElementById('suggestionsCount').textContent = '10+';

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Load Partners (people who follow/connect with you)
   */
  async loadPartners() {
    try {
      if (!this.supabase || !this.userId) return;

      const { data: connections, error } = await this.supabase
        .from('connections')
        .select('*, user_profiles!connections_follower_id_fkey(*), business_profiles!connections_follower_id_fkey(*)')
        .eq('following_id', this.userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading partners:', error);
        return;
      }

      this.displayConnections(connections || [], 'partnersList', 'follower');

    } catch (error) {
      console.error('Error in loadPartners:', error);
    }
  }

  /**
   * Load Following (people you follow)
   */
  async loadFollowing() {
    try {
      if (!this.supabase || !this.userId) return;

      const { data: connections, error } = await this.supabase
        .from('connections')
        .select('*, user_profiles!connections_following_id_fkey(*), business_profiles!connections_following_id_fkey(*)')
        .eq('follower_id', this.userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading following:', error);
        return;
      }

      this.displayConnections(connections || [], 'followingList', 'following');

    } catch (error) {
      console.error('Error in loadFollowing:', error);
    }
  }

  /**
   * Load connection requests
   */
  async loadConnectionRequests() {
    try {
      if (!this.supabase || !this.userId) return;

      const { data: requests, error } = await this.supabase
        .from('connections')
        .select('*, user_profiles!connections_follower_id_fkey(*), business_profiles!connections_follower_id_fkey(*)')
        .eq('following_id', this.userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        return;
      }

      this.displayRequests(requests || []);

    } catch (error) {
      console.error('Error in loadConnectionRequests:', error);
    }
  }

  /**
   * Load suggestions
   */
  async loadSuggestions() {
    try {
      if (!this.supabase || !this.userId) return;

      // Get users/businesses not yet connected
      // Simplified: Get random users/businesses
      const { data: users } = await this.supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_image_url, job_title, location')
        .neq('user_id', this.userId)
        .limit(20);

      const { data: businesses } = await this.supabase
        .from('business_profiles')
        .select('merchant_id, business_name, logo_url, business_type, location')
        .limit(20);

      this.displaySuggestions(users || [], businesses || []);

    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }

  /**
   * Display connections
   */
  async displayConnections(connections, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (connections.length === 0) {
      const emptyText = type === 'follower' 
        ? 'No Partners yet. Start connecting!'
        : 'You\'re not following anyone yet.';
      container.innerHTML = `
        <div class="text-center text-white-50 py-5">
          <i class="bi bi-people" style="font-size: 3rem;"></i>
          <p class="mt-3">${emptyText}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = await Promise.all(
      connections.map(async (conn) => {
        const profile = conn.user_profiles || conn.business_profiles || {};
        const name = profile.display_name || profile.business_name || 'User';
        const avatar = profile.profile_image_url || profile.logo_url || 'images/hero-bg.jpeg';
        const title = profile.job_title || profile.business_type || '';
        const userId = conn.follower_id === this.userId ? conn.following_id : conn.follower_id;
        const userType = conn.following_type;

        return `
          <div class="user-card d-flex align-items-center">
            <img src="${avatar}" alt="${name}" class="user-avatar">
            <div class="flex-grow-1">
              <h5 class="text-white mb-1 user-name">${escapeHtml(name)}</h5>
              <p class="text-white-50 mb-1 user-title">${escapeHtml(title)}</p>
              <small class="text-white-50">${escapeHtml(profile.location || '')}</small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm" onclick="networkSystem.viewProfile('${userId}', '${userType}')">
                <i class="bi bi-eye"></i> View
              </button>
              <button class="btn btn-primary btn-sm" onclick="networkSystem.sendMessage('${userId}', '${userType}')">
                <i class="bi bi-chat"></i> Message
              </button>
            </div>
          </div>
        `;
      })
    ).then(html => html.join(''));
  }

  /**
   * Display connection requests
   */
  async displayRequests(requests) {
    const container = document.getElementById('requestsList');
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="text-center text-white-50 py-5">
          <i class="bi bi-person-plus" style="font-size: 3rem;"></i>
          <p class="mt-3">No pending connection requests.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = await Promise.all(
      requests.map(async (request) => {
        const profile = request.user_profiles || request.business_profiles || {};
        const name = profile.display_name || profile.business_name || 'User';
        const avatar = profile.profile_image_url || profile.logo_url || 'images/hero-bg.jpeg';
        const title = profile.job_title || profile.business_type || '';
        const followerId = request.follower_id;
        const followerType = request.following_type;

        return `
          <div class="user-card d-flex align-items-center">
            <img src="${avatar}" alt="${name}" class="user-avatar">
            <div class="flex-grow-1">
              <h5 class="text-white mb-1">${escapeHtml(name)}</h5>
              <p class="text-white-50 mb-1">${escapeHtml(title)}</p>
              <small class="text-white-50">Wants to connect with you</small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-sm" onclick="networkSystem.acceptRequest('${request.id}', '${followerId}', '${followerType}')">
                <i class="bi bi-check"></i> Accept
              </button>
              <button class="btn btn-outline-primary btn-sm" onclick="networkSystem.rejectRequest('${request.id}')">
                <i class="bi bi-x"></i> Decline
              </button>
            </div>
          </div>
        `;
      })
    ).then(html => html.join(''));
  }

  /**
   * Display suggestions
   */
  async displaySuggestions(users, businesses) {
    const container = document.getElementById('suggestionsList');
    if (!container) return;

    const allSuggestions = [
      ...users.map(u => ({ ...u, type: 'user', id: u.user_id })),
      ...businesses.map(b => ({ ...b, type: 'merchant', id: b.merchant_id, name: b.business_name, avatar: b.logo_url }))
    ];

    if (allSuggestions.length === 0) {
      container.innerHTML = `
        <div class="text-center text-white-50 py-5">
          <i class="bi bi-compass" style="font-size: 3rem;"></i>
          <p class="mt-3">No suggestions available.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = allSuggestions.map(suggestion => {
      const name = suggestion.display_name || suggestion.name || 'User';
      const avatar = suggestion.profile_image_url || suggestion.avatar || 'images/hero-bg.jpeg';
      const title = suggestion.job_title || suggestion.business_type || '';

      return `
        <div class="user-card d-flex align-items-center">
          <img src="${avatar}" alt="${name}" class="user-avatar">
          <div class="flex-grow-1">
            <h5 class="text-white mb-1">${escapeHtml(name)}</h5>
            <p class="text-white-50 mb-1">${escapeHtml(title)}</p>
            <small class="text-white-50">${escapeHtml(suggestion.location || '')}</small>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="networkSystem.sendConnectionRequest('${suggestion.id}', '${suggestion.type}')">
              <i class="bi bi-person-plus"></i> Connect
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(followingId, followingType) {
    try {
      if (!this.supabase || !this.userId) return;

      const { error } = await this.supabase
        .from('connections')
        .insert([{
          follower_id: this.userId,
          following_id: followingId,
          following_type: followingType,
          status: 'pending'
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('Connection request already sent');
        } else {
          throw error;
        }
        return;
      }

      alert('Connection request sent!');
      await this.loadSuggestions();
      await this.loadStats();

    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Error sending request: ' + error.message);
    }
  }

  /**
   * Accept connection request
   */
  async acceptRequest(connectionId, followerId, followerType) {
    try {
      if (!this.supabase) return;

      const { error } = await this.supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      alert('Connection accepted!');
      await this.loadConnectionRequests();
      await this.loadPartners();
      await this.loadStats();

    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Error accepting request: ' + error.message);
    }
  }

  /**
   * Reject connection request
   */
  async rejectRequest(connectionId) {
    try {
      if (!this.supabase) return;

      const { error } = await this.supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      await this.loadConnectionRequests();
      await this.loadStats();

    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request: ' + error.message);
    }
  }

  /**
   * View profile
   */
  viewProfile(userId, userType) {
    if (userType === 'merchant') {
      window.location.href = `profile-business.html?id=${userId}`;
    } else {
      window.location.href = `profile-personal.html?id=${userId}`;
    }
  }

  /**
   * Send message
   */
  async sendMessage(userId, userType) {
    // Redirect to messages page and start conversation
    window.location.href = `messages.html?start=${userId}&type=${userType}`;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    // Try Supabase session first
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
    
    // Try localStorage
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
   * Get author type
   */
  getAuthorType() {
    return localStorage.getItem('isMerchant') === 'true' ? 'merchant' : 'user';
  }
}

// Global instance
let networkSystem = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  networkSystem = new NetworkSystem();
  window.networkSystem = networkSystem;
});

// Helper function
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

