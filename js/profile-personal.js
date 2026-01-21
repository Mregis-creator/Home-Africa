/**
 * Personal Profile Management
 * Handles loading and displaying user profile data
 */

// Wait for Supabase to be ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.supabaseClient) {
    loadProfile();
  } else {
    // Wait for Supabase to initialize
    setTimeout(loadProfile, 500);
  }
});

/**
 * Load user profile data
 */
async function loadProfile() {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    // Get current user ID (from localStorage or Supabase Auth)
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user logged in');
      // Show guest view or redirect to login
      return;
    }

    // Load user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading profile:', error);
      return;
    }

    // Load user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error loading user:', userError);
      return;
    }

    // Display profile data
    displayProfile(profile || {}, user || {});

    // Load posts
    loadUserPosts(userId);

    // Load partners
    loadPartners(userId);

    // Load activity
    loadActivity(userId);

  } catch (error) {
    console.error('Error in loadProfile:', error);
  }
}

/**
 * Display profile data in UI
 */
function displayProfile(profile, user) {
  // Profile name
  const profileName = document.getElementById('profileName');
  if (profileName) {
    profileName.textContent = profile.display_name || user.full_name || 'Your Name';
  }

  // Profile title
  const profileTitle = document.getElementById('profileTitle');
  if (profileTitle) {
    profileTitle.textContent = profile.job_title || 'Your Title';
  }

  // Profile location
  const profileLocation = document.getElementById('profileLocation');
  if (profileLocation) {
    profileLocation.innerHTML = `<i class="bi bi-geo-alt"></i> ${profile.location || 'Location not set'}`;
  }

  // Profile avatar
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar && profile.profile_image_url) {
    profileAvatar.src = profile.profile_image_url;
  }

  // Profile cover
  const profileCover = document.getElementById('profileCover');
  if (profileCover && profile.cover_image_url) {
    profileCover.style.backgroundImage = `url(${profile.cover_image_url})`;
    profileCover.style.backgroundSize = 'cover';
    profileCover.style.backgroundPosition = 'center';
  }

  // Stats
  const partnersCount = document.getElementById('partnersCount');
  if (partnersCount) {
    partnersCount.textContent = profile.partners_count || 0;
  }

  const followingCount = document.getElementById('followingCount');
  if (followingCount) {
    followingCount.textContent = profile.following_count || 0;
  }

  const postsCount = document.getElementById('postsCount');
  if (postsCount) {
    postsCount.textContent = profile.posts_count || 0;
  }

  // Bio
  const profileBio = document.getElementById('profileBio');
  if (profileBio) {
    profileBio.textContent = profile.bio || 'No bio added yet.';
  }

  // Contact info
  const profileEmail = document.getElementById('profileEmail');
  if (profileEmail) {
    profileEmail.textContent = user.email || 'Not provided';
  }

  const profilePhone = document.getElementById('profilePhone');
  if (profilePhone) {
    profilePhone.textContent = profile.phone || user.phone || 'Not provided';
  }

  const profileWebsite = document.getElementById('profileWebsite');
  if (profileWebsite) {
    profileWebsite.innerHTML = profile.website_url 
      ? `<a href="${profile.website_url}" target="_blank" class="text-cyan">${profile.website_url}</a>`
      : 'Not provided';
  }

  // Specialties
  const specialtiesList = document.getElementById('specialtiesList');
  if (specialtiesList && profile.specialties && profile.specialties.length > 0) {
    specialtiesList.innerHTML = profile.specialties.map(spec => 
      `<span class="badge bg-cyan text-dark px-3 py-2">${spec}</span>`
    ).join('');
  }
}

/**
 * Load user posts
 */
async function loadUserPosts(userId) {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .eq('author_type', 'user')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading posts:', error);
      return;
    }

    displayPosts(posts || []);

  } catch (error) {
    console.error('Error in loadUserPosts:', error);
  }
}

/**
 * Display posts
 */
function displayPosts(posts) {
  const postsList = document.getElementById('postsList');
  if (!postsList) return;

  if (posts.length === 0) {
    postsList.innerHTML = `
      <div class="text-center text-white-50 py-5">
        <i class="bi bi-file-post" style="font-size: 3rem;"></i>
        <p class="mt-3">No posts yet. <a href="create-post.html" class="text-cyan">Create your first post!</a></p>
      </div>
    `;
    return;
  }

  postsList.innerHTML = posts.map(post => `
    <div class="post-card">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h5 class="text-white mb-1">${escapeHtml(post.title || 'Untitled')}</h5>
          <small class="text-white-50">
            <i class="bi bi-calendar"></i> ${formatDate(post.created_at)}
          </small>
        </div>
        <span class="badge bg-cyan text-dark">${post.post_type}</span>
      </div>
      <p class="text-white-50 mt-2">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
      <div class="d-flex gap-3 mt-3">
        <button class="btn btn-sm btn-outline-primary">
          <i class="bi bi-heart"></i> ${post.likes_count || 0}
        </button>
        <button class="btn btn-sm btn-outline-primary">
          <i class="bi bi-chat"></i> ${post.comments_count || 0}
        </button>
        <button class="btn btn-sm btn-outline-primary">
          <i class="bi bi-share"></i> Share
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Load partners
 */
async function loadPartners(userId) {
  try {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    const { data: connections, error } = await supabase
      .from('connections')
      .select('*, user_profiles!connections_following_id_fkey(*)')
      .eq('following_id', userId)
      .eq('status', 'accepted')
      .limit(50);

    if (error) {
      console.error('Error loading partners:', error);
      return;
    }

    displayPartners(connections || []);

  } catch (error) {
    console.error('Error in loadPartners:', error);
  }
}

/**
 * Display partners
 */
function displayPartners(connections) {
  const partnersList = document.getElementById('partnersList');
  if (!partnersList) return;

  if (connections.length === 0) {
    partnersList.innerHTML = `
      <div class="text-center text-white-50 py-5">
        <i class="bi bi-people" style="font-size: 3rem;"></i>
        <p class="mt-3">No Partners yet. Start connecting!</p>
      </div>
    `;
    return;
  }

  partnersList.innerHTML = connections.map(conn => {
    const profile = conn.user_profiles || {};
    return `
      <div class="post-card">
        <div class="d-flex align-items-center gap-3">
          <img src="${profile.profile_image_url || 'images/hero-bg.jpeg'}" 
               alt="${profile.display_name}" 
               style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #0ff;">
          <div class="flex-grow-1">
            <h6 class="text-white mb-0">${escapeHtml(profile.display_name || 'User')}</h6>
            <small class="text-white-50">${escapeHtml(profile.job_title || '')}</small>
          </div>
          <button class="btn btn-sm btn-outline-primary">View Profile</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Load activity feed
 */
async function loadActivity(userId) {
  try {
    // Use ActivityFeedSystem if available
    if (window.activityFeedSystem) {
      await window.activityFeedSystem.loadActivity();
      return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) return;

    const { data: activities, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading activity:', error);
      return;
    }

    displayActivity(activities || []);

  } catch (error) {
    console.error('Error in loadActivity:', error);
  }
}

/**
 * Display activity feed
 */
function displayActivity(activities) {
  const activityList = document.getElementById('activityList');
  if (!activityList) return;

  if (activities.length === 0) {
    activityList.innerHTML = `
      <div class="text-center text-white-50 py-5">
        <i class="bi bi-activity" style="font-size: 3rem;"></i>
        <p class="mt-3">No activity yet.</p>
      </div>
    `;
    return;
  }

  activityList.innerHTML = activities.map(activity => `
    <div class="post-card">
      <div class="d-flex align-items-start gap-3">
        <div class="flex-grow-1">
          <p class="text-white mb-1">${escapeHtml(activity.content || activity.activity_type)}</p>
          <small class="text-white-50">
            <i class="bi bi-clock"></i> ${formatDate(activity.created_at)}
          </small>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
  // Try Supabase session first
  if (window.supabaseClient) {
    try {
      const session = window.supabaseClient.auth.getSession();
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
  
  const userId = localStorage.getItem('userId');
  if (userId) return userId;

  return null;
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

