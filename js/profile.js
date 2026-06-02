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
    // Get current user from Supabase auth session (authoritative)
    try {
      if (this.supabase) {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) this.currentUserId = session.user.id;
      }
    } catch (e) { /* ignore */ }

    // Fallback: URL param for viewing other profiles
    if (!this.currentUserId) {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get('userId');
      if (userIdParam) {
        this.currentUserId = userIdParam;
      } else {
        window.location.href = 'signin.html';
        return;
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
      // Load from user_profiles table
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', this.currentUserId)
        .maybeSingle();

      // Get auth user for email fallback
      const { data: { session } } = await this.supabase.auth.getSession();
      const authUser = session?.user;

      const user = profile
        ? { ...profile, email: authUser?.email || profile.email }
        : { user_id: this.currentUserId, email: authUser?.email || '', full_name: authUser?.email?.split('@')[0] || 'User' };

      this.currentUserData = user;
      this.displayUserProfile(user);
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

    // Update avatar with profile picture
    const avatarElements = document.querySelectorAll('.profile-avatar');
    avatarElements.forEach(el => {
      if (user.profile_picture_url) {
        el.innerHTML = `<img src="${user.profile_picture_url}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        const initial = (user.full_name || user.email || 'U')[0].toUpperCase();
        el.innerHTML = `<span style="font-size: 3rem; color: #222;">${initial}</span>`;
      }
    });

    // Update role badge + verified badge
    const roleBadges = document.querySelectorAll('.user-role-badge');
    roleBadges.forEach(el => {
      let badges = '';
      if (user.role === 'merchant') badges += '<span class="badge bg-primary me-1">Merchant</span>';
      if (user.verified) badges += '<span class="badge me-1" style="background:linear-gradient(90deg,#00b4d8,#0077b6);"><i class="bi bi-patch-check-fill"></i> Verified Seller</span>';
      if (badges) { el.innerHTML = badges; el.style.display = 'block'; }
      else el.style.display = 'none';
    });

    // Show bio / phone / location under the email
    const emailEl = document.getElementById('userEmail');
    if (emailEl) {
      let extra = '';
      if (user.bio) extra += `<p class="text-white-50 mt-1 mb-0" style="font-size:0.9rem;">${user.bio}</p>`;
      if (user.phone) extra += `<p class="text-white-50 mb-0" style="font-size:0.85rem;"><i class="bi bi-telephone"></i> ${user.phone}</p>`;
      if (user.location) extra += `<p class="text-white-50 mb-0" style="font-size:0.85rem;"><i class="bi bi-geo-alt"></i> ${user.location}</p>`;
      if (extra) {
        const infoDiv = document.getElementById('profileExtraInfo');
        if (infoDiv) infoDiv.innerHTML = extra;
      }
    }

    // Store user data globally for navbar indicator
    window.currentUserProfile = user;
    this.updateNavbarUserIndicator(user);
  }

  async uploadProfilePicture(file) {
    if (!this.supabase || !this.currentUserId) {
      throw new Error('Supabase client or user ID not available');
    }

    if (!window.supabaseStorage) {
      throw new Error('Supabase Storage helper not loaded');
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    try {
      // Upload to Supabase Storage in profiles folder
      const folder = `profiles/${this.currentUserId}`;
      const urls = await window.supabaseStorage.uploadImages(
        [file],
        'listings', // Using listings bucket (or create a profiles bucket)
        folder
      );

      if (!urls || urls.length === 0) {
        throw new Error('Failed to upload profile picture');
      }

      return urls[0]; // Return the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  updateNavbarUserIndicator(user) {
    // Update navbar user indicator across all pages
    const navbarIndicators = document.querySelectorAll('.navbar-user-indicator, .user-profile-indicator');
    navbarIndicators.forEach(indicator => {
      if (user.profile_picture_url) {
        indicator.innerHTML = `
          <img src="${user.profile_picture_url}" alt="${user.full_name || 'User'}" 
               style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0ff; object-fit: cover; cursor: pointer;"
               onclick="window.location.href='profile.html'"
               title="${user.full_name || user.email}">
        `;
      } else {
        const initial = (user.full_name || user.email || 'U')[0].toUpperCase();
        indicator.innerHTML = `
          <div style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0ff; background: linear-gradient(90deg, #0ff 0%, #8fff00 100%); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #222; font-weight: bold;"
               onclick="window.location.href='profile.html'"
               title="${user.full_name || user.email}">
            ${initial}
          </div>
        `;
      }
      indicator.style.display = 'block';
    });
  }

  async loadUserListings() {
    if (!this.supabase || !this.currentUserId) return;

    try {
      const { data: listings, error } = await this.supabase
        .from('listings')
        .select('*')
        .eq('user_id', this.currentUserId)
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
      const updateData = {
        full_name: profileData.full_name,
        bio: profileData.bio,
        phone: profileData.phone,
        location: profileData.location,
        updated_at: new Date().toISOString()
      };

      // Add profile picture URL if provided
      if (profileData.profile_picture_url) {
        updateData.profile_picture_url = profileData.profile_picture_url;
      }

      updateData.user_id = this.currentUserId;
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(updateData, { onConflict: 'user_id' })
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

