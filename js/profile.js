/**
 * HOME AFRICA - Profile System
 * Unified profile management with Supabase integration
 */

class HomeAfricaProfile {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentUserId = null;
    this.currentUserData = null;
    this.init();
  }

  async init() {
    // Get current user ID
    if (window.homeAfricaAuth && window.homeAfricaAuth.isAuthenticated()) {
      this.currentUserId = window.homeAfricaAuth.getCurrentUserId();
    } else {
      // Check URL parameter for viewing other users
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get('userId');
      if (userIdParam) {
        this.currentUserId = userIdParam;
      } else {
        // Require auth for own profile
        if (window.homeAfricaAuth) {
          window.homeAfricaAuth.requireAuth('signin.html');
          return;
        }
      }
    }

    if (this.currentUserId) {
      await this.loadUserProfile();
      await this.loadUserListings();
      await this.loadUserPosts();
      await this.loadUserActivity();
    }
  }

  async loadUserProfile() {
    if (!this.supabase || !this.currentUserId) return;

    try {
      // Load user data from Supabase
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', this.currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return;
      }

      if (user) {
        this.currentUserData = user;
        this.displayUserProfile(user);
      } else {
        // User not found in Supabase - show guest view or redirect to login
        console.log('User not found in Supabase');
        // Could redirect to login or show guest profile view
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  displayUserProfile(user) {
    // Update profile header
    const userNameElements = document.querySelectorAll('.user-name, #userName');
    userNameElements.forEach(el => {
      el.textContent = user.full_name || user.email?.split('@')[0] || 'User';
    });

    const userEmailElements = document.querySelectorAll('.user-email, #userEmail');
    userEmailElements.forEach(el => {
      el.textContent = user.email || '';
    });

    // Update avatar
    const avatarElements = document.querySelectorAll('.profile-avatar');
    avatarElements.forEach(el => {
      const initial = (user.full_name || user.email || 'U')[0].toUpperCase();
      if (!el.querySelector('img')) {
        el.innerHTML = `<span style="font-size: 3rem; color: #222;">${initial}</span>`;
      }
    });

    // Update role badge
    const roleBadges = document.querySelectorAll('.user-role-badge');
    roleBadges.forEach(el => {
      if (user.role === 'merchant') {
        el.innerHTML = '<span class="badge bg-primary">Merchant</span>';
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  async loadUserListings() {
    if (!this.supabase || !this.currentUserId) return;

    try {
      const { data: listings, error } = await this.supabase
        .from('listings')
        .select('*')
        .eq('merchant_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading listings:', error);
        return;
      }

      this.displayUserListings(listings || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  }

  displayUserListings(listings) {
    const container = document.getElementById('userListings');
    if (!container) return;

    if (listings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox" style="font-size: 4rem; color: rgba(255,255,255,0.3);"></i>
          <h4 class="mt-3 text-white-50">No listings yet</h4>
          <p class="text-white-50">Start posting your properties!</p>
          <a href="post.html" class="btn btn-primary mt-3">Post a Listing</a>
        </div>
      `;
      return;
    }

    let html = '<div class="row g-3">';
    listings.forEach(listing => {
      const image = listing.images && listing.images.length > 0 
        ? listing.images[0] 
        : 'images/hero-bg.jpeg';
      const price = listing.price 
        ? `RWF ${parseInt(listing.price).toLocaleString()}` 
        : 'Price on request';
      const typeLabel = listing.type.charAt(0).toUpperCase() + listing.type.slice(1);

      html += `
        <div class="col-md-6 col-lg-4">
          <div class="listing-card" onclick="window.location.href='${this.getListingDetailUrl(listing.type)}?id=${listing.id}'">
            <img src="${image}" alt="${listing.title}" class="listing-image">
            <div class="listing-info">
              <span class="listing-type-badge">${typeLabel}</span>
              <h5>${listing.title}</h5>
              <p class="text-white-50">${(listing.description || '').substring(0, 100)}...</p>
              <div class="listing-meta">
                <span><i class="bi bi-currency-exchange"></i> ${price}</span>
                <span><i class="bi bi-eye"></i> ${listing.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  async loadUserPosts() {
    if (!this.supabase || !this.currentUserId) return;

    try {
      // Check if posts table exists
      const { data: posts, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('author_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Posts table might not exist yet
        console.warn('Posts table not found or error:', error);
        return;
      }

      this.displayUserPosts(posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  displayUserPosts(posts) {
    const container = document.getElementById('userPosts');
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-file-post" style="font-size: 4rem; color: rgba(255,255,255,0.3);"></i>
          <h4 class="mt-3 text-white-50">No posts yet</h4>
          <p class="text-white-50">Share your thoughts with the community!</p>
          <a href="create-post.html" class="btn btn-primary mt-3">Create a Post</a>
        </div>
      `;
      return;
    }

    let html = '';
    posts.forEach(post => {
      const createdAt = post.created_at 
        ? new Date(post.created_at).toLocaleDateString() 
        : '';
      
      html += `
        <div class="post-card">
          <h5>${post.title || 'Untitled Post'}</h5>
          <p class="text-white-50">${(post.content || '').substring(0, 200)}...</p>
          <div class="post-meta">
            <span><i class="bi bi-calendar"></i> ${createdAt}</span>
            ${post.comments_count ? `<span><i class="bi bi-chat"></i> ${post.comments_count} comments</span>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  async loadUserActivity() {
    if (!this.supabase || !this.currentUserId) return;

    try {
      // Load activity feed (if activity-feed.js is available)
      if (window.ActivityFeed) {
        const activityFeed = new window.ActivityFeed(this.currentUserId);
        await activityFeed.load();
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  }

  async updateProfile(profileData) {
    if (!this.supabase || !this.currentUserId) return;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          bio: profileData.bio,
          phone: profileData.phone,
          location: profileData.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUserId)
        .select()
        .single();

      if (error) throw error;

      this.currentUserData = data;
      this.displayUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  getListingDetailUrl(type) {
    const urlMap = {
      'car': 'car-detail.html',
      'apartment': 'apartment-detail.html',
      'land': 'land-detail.html',
      'driving_school': 'driving-school.html'
    };
    return urlMap[type] || 'index.html';
  }
}

// Initialize profile when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.homeAfricaProfile = new HomeAfricaProfile();
});

