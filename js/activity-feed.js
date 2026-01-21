/**
 * Activity Feed System
 * Shows user activity timeline (posts, comments, connections, etc.)
 */

class ActivityFeedSystem {
  constructor() {
    this.supabase = window.supabaseClient;
    this.userId = null;
    this.init();
  }

  /**
   * Initialize activity feed
   */
  async init() {
    this.userId = this.getCurrentUserId();

    if (!this.userId) {
      this.showLoginPrompt();
      return;
    }

    await this.loadActivity();
    
    // Refresh every 10 seconds
    setInterval(() => {
      this.loadActivity();
    }, 10000);
  }

  /**
   * Show login prompt
   */
  showLoginPrompt() {
    const container = document.getElementById('activityList');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-white-50 py-5">
          <i class="bi bi-lock" style="font-size: 3rem;"></i>
          <p class="mt-3">Please <a href="signin.html" class="text-cyan">log in</a> to view activity</p>
        </div>
      `;
    }
  }

  /**
   * Load activity feed
   */
  async loadActivity() {
    try {
      if (!this.supabase || !this.userId) return;

      // Load activities for current user
      const { data: activities, error } = await this.supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading activity:', error);
        return;
      }

      // Also load posts from connections
      await this.loadConnectionActivities();

      this.displayActivity(activities || []);

    } catch (error) {
      console.error('Error in loadActivity:', error);
    }
  }

  /**
   * Load activities from connections
   */
  async loadConnectionActivities() {
    try {
      if (!this.supabase || !this.userId) return;

      // Get user's connections
      const { data: connections } = await this.supabase
        .from('connections')
        .select('following_id, following_type')
        .eq('follower_id', this.userId)
        .eq('status', 'accepted');

      if (!connections || connections.length === 0) return;

      // Get posts from connections
      const connectionIds = connections.map(c => c.following_id);
      
      const { data: posts } = await this.supabase
        .from('posts')
        .select('*')
        .in('author_id', connectionIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      // Convert posts to activity format
      if (posts) {
        const postActivities = posts.map(post => ({
          activity_type: 'post_created',
          actor_id: post.author_id,
          actor_type: post.author_type,
          target_id: post.id,
          target_type: 'post',
          content: `${post.author_type === 'merchant' ? 'A merchant' : 'Someone'} posted: ${post.title}`,
          metadata: { post },
          created_at: post.created_at
        }));

        // Merge with existing activities
        const container = document.getElementById('activityList');
        if (container) {
          const existingActivities = Array.from(container.children);
          // Add post activities (simplified - in production, merge properly)
        }
      }

    } catch (error) {
      console.error('Error loading connection activities:', error);
    }
  }

  /**
   * Display activity feed
   */
  async displayActivity(activities) {
    const container = document.getElementById('activityList');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="text-center text-white-50 py-5">
          <i class="bi bi-activity" style="font-size: 3rem;"></i>
          <p class="mt-3">No activity yet. Start connecting and posting!</p>
        </div>
      `;
      return;
    }

    // Load actor info for each activity
    const activitiesWithInfo = await Promise.all(
      activities.map(async (activity) => {
        let actorInfo = { name: 'Someone', avatar: 'images/hero-bg.jpeg' };

        if (activity.actor_type === 'user') {
          const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('display_name, profile_image_url')
            .eq('user_id', activity.actor_id)
            .single();
          actorInfo = {
            name: profile?.display_name || 'User',
            avatar: profile?.profile_image_url || 'images/hero-bg.jpeg'
          };
        } else if (activity.actor_type === 'merchant') {
          const { data: profile } = await this.supabase
            .from('business_profiles')
            .select('business_name, logo_url')
            .eq('merchant_id', activity.actor_id)
            .single();
          actorInfo = {
            name: profile?.business_name || 'Business',
            avatar: profile?.logo_url || 'images/hero-bg.jpeg'
          };
        }

        return { ...activity, actorInfo };
      })
    );

    container.innerHTML = activitiesWithInfo.map(activity => {
      const icon = this.getActivityIcon(activity.activity_type);
      const color = this.getActivityColor(activity.activity_type);

      return `
        <div class="activity-item mb-3" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(0,255,255,0.2); border-radius: 12px; padding: 1.5rem; transition: all 0.3s;">
          <div class="d-flex gap-3">
            <img src="${activity.actorInfo.avatar}" 
                 alt="${activity.actorInfo.name}" 
                 style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #0ff; flex-shrink: 0;">
            <div class="flex-grow-1">
              <div class="d-flex align-items-start justify-content-between mb-2">
                <div>
                  <span class="badge" style="background: ${color}; color: #111; margin-right: 0.5rem;">
                    <i class="bi ${icon}"></i>
                  </span>
                  <strong class="text-white">${escapeHtml(activity.actorInfo.name)}</strong>
                  <span class="text-white-50">${escapeHtml(activity.content || activity.activity_type)}</span>
                </div>
                <small class="text-white-50">${formatTime(activity.created_at)}</small>
              </div>
              ${activity.metadata ? this.renderActivityMetadata(activity) : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Get activity icon
   */
  getActivityIcon(activityType) {
    const icons = {
      'post_created': 'bi-file-post',
      'comment_added': 'bi-chat',
      'connection_made': 'bi-person-plus',
      'listing_created': 'bi-house',
      'review_added': 'bi-star',
      'message_sent': 'bi-envelope'
    };
    return icons[activityType] || 'bi-activity';
  }

  /**
   * Get activity color
   */
  getActivityColor(activityType) {
    const colors = {
      'post_created': '#0ff',
      'comment_added': '#8fff00',
      'connection_made': '#ff0088',
      'listing_created': '#0ff',
      'review_added': '#ffc107',
      'message_sent': '#8fff00'
    };
    return colors[activityType] || '#0ff';
  }

  /**
   * Render activity metadata
   */
  renderActivityMetadata(activity) {
    if (activity.metadata?.post) {
      const post = activity.metadata.post;
      return `
        <div class="mt-2 p-2" style="background: rgba(0,255,255,0.1); border-radius: 8px; border-left: 3px solid #0ff;">
          <strong class="text-white">${escapeHtml(post.title || 'Untitled')}</strong>
          <p class="text-white-50 mb-0" style="font-size: 0.9rem;">
            ${escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}
          </p>
        </div>
      `;
    }
    return '';
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
}

// Global instance
let activityFeedSystem = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  activityFeedSystem = new ActivityFeedSystem();
  window.activityFeedSystem = activityFeedSystem;
});

// Helper functions
function formatTime(dateString) {
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

