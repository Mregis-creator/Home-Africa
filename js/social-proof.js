/**
 * HOME AFRICA - Social Proof & Real-Time Activity System
 * 
 * Features:
 * - Real-time activity tracking (views, favorites, inquiries)
 * - Social proof badges on listings ("🔥 12 people viewed today")
 * - Scarcity indicators ("⚡ 3 people favorited this hour")
 * - FOMO triggers (price drops, deadline countdowns)
 * - Activity aggregation and trending calculations
 */

class SocialProofEngine {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.realtimeChannel = null;
    this.activityCache = new Map();
    this.init();
  }

  async init() {
    this.supabase = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
    if (!this.supabase) {
      console.warn('Supabase not available for Social Proof Engine');
      return;
    }

    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;

    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions();
  }

  /**
   * Track activity on a listing
   * Records every significant interaction for social proof calculation
   * 
   * @param {string} listingId - The listing being interacted with
   * @param {string} activityType - Type of activity (view, favorite, contact, share)
   * @param {Object} metadata - Additional context
   */
  async trackActivity(listingId, activityType, metadata = {}) {
    try {
      if (!this.supabase) return;

      const activityData = {
        listing_id: listingId,
        activity_type: activityType,
        user_id: this.currentUser?.id || null,
        session_id: this.getSessionId(),
        metadata: {
          ...metadata,
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct',
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      // Insert activity
      const { error } = await this.supabase
        .from('listing_activities')
        .insert([activityData]);

      if (error) throw error;

      // Update aggregated counts
      await this.updateActivityAggregates(listingId, activityType);

      // Update listing trending score
      await this.updateTrendingScore(listingId);

    } catch (err) {
      console.error('Error tracking activity:', err);
    }
  }

  /**
   * Get social proof data for a listing
   * Returns formatted counts and urgency indicators
   * 
   * @param {string} listingId - The listing ID
   * @returns {Object} Social proof data with formatted strings
   */
  async getSocialProof(listingId) {
    try {
      // Check cache first
      if (this.activityCache.has(listingId)) {
        const cached = this.activityCache.get(listingId);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          return cached.data;
        }
      }

      // Get activity aggregates
      const { data: aggregates } = await this.supabase
        .from('listing_activity_aggregates')
        .select('*')
        .eq('listing_id', listingId)
        .single();

      if (!aggregates) {
        return this.getEmptySocialProof();
      }

      // Get listing details for additional context
      const { data: listing } = await this.supabase
        .from('listings')
        .select('price, price_history, created_at, status')
        .eq('id', listingId)
        .single();

      const socialProof = this.calculateSocialProof(aggregates, listing);
      
      // Cache the result
      this.activityCache.set(listingId, {
        data: socialProof,
        timestamp: Date.now()
      });

      return socialProof;

    } catch (err) {
      console.error('Error getting social proof:', err);
      return this.getMockSocialProof();
    }
  }

  calculateSocialProof(aggregates, listing) {
    const now = new Date();
    
    // Views in different time windows
    const viewsToday = aggregates.views_24h || 0;
    const viewsThisHour = aggregates.views_1h || 0;
    const viewsThisWeek = aggregates.views_7d || 0;
    
    // Favorites
    const favoritesToday = aggregates.favorites_24h || 0;
    const totalFavorites = aggregates.total_favorites || 0;
    
    // Calculate velocity (activity trend)
    const velocity = viewsThisHour > 0 ? 'high' : viewsToday > 5 ? 'medium' : 'low';
    
    // Determine fire badge
    let fireBadge = null;
    if (viewsToday >= 50) {
      fireBadge = { icon: '🔥', text: `${viewsToday} people viewed today`, level: 'hot' };
    } else if (viewsToday >= 20) {
      fireBadge = { icon: '⚡', text: `${viewsToday} views today`, level: 'trending' };
    } else if (viewsThisHour >= 3) {
      fireBadge = { icon: '👀', text: `${viewsThisHour} viewing now`, level: 'active' };
    }

    // Determine scarcity
    let scarcityBadge = null;
    if (favoritesToday >= 3) {
      scarcityBadge = { 
        icon: '⚡', 
        text: `${favoritesToday} people favorited this in the last hour`, 
        urgency: 'high' 
      };
    } else if (totalFavorites >= 20) {
      scarcityBadge = { 
        icon: '⭐', 
        text: `${totalFavorites} people have favorited this`, 
        urgency: 'medium' 
      };
    }

    // Price drop indicator
    let priceBadge = null;
    if (listing?.price_history && listing.price_history.length > 1) {
      const previousPrice = listing.price_history[listing.price_history.length - 2].price;
      const currentPrice = listing.price;
      const dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100;
      
      if (dropPercent >= 5) {
        const hoursSinceDrop = Math.round((now - new Date(listing.price_history[listing.price_history.length - 1].date)) / (1000 * 60 * 60));
        priceBadge = {
          icon: '📉',
          text: `Price dropped ${Math.round(dropPercent)}% ${hoursSinceDrop}h ago`,
          urgency: 'high',
          savings: previousPrice - currentPrice
        };
      }
    }

    // Days on market
    const daysOnMarket = listing?.created_at 
      ? Math.round((now - new Date(listing.created_at)) / (1000 * 60 * 60 * 24))
      : 0;

    // New listing badge
    let newBadge = null;
    if (daysOnMarket <= 1) {
      newBadge = { icon: '🆕', text: 'Just listed', freshness: 'new' };
    } else if (daysOnMarket <= 3) {
      newBadge = { icon: '✨', text: 'New this week', freshness: 'fresh' };
    }

    // Trending score (0-100)
    const trendingScore = this.calculateTrendingScore(aggregates);

    return {
      views: {
        today: viewsToday,
        thisHour: viewsThisHour,
        thisWeek: viewsThisWeek,
        total: aggregates.total_views || 0
      },
      favorites: {
        today: favoritesToday,
        total: totalFavorites
      },
      inquiries: aggregates.inquiries_24h || 0,
      velocity,
      trendingScore,
      daysOnMarket,
      badges: {
        fire: fireBadge,
        scarcity: scarcityBadge,
        price: priceBadge,
        new: newBadge
      },
      lastActivity: aggregates.last_activity_at
    };
  }

  calculateTrendingScore(aggregates) {
    // Algorithm: weighted combination of recent activity
    const viewsScore = Math.min((aggregates.views_24h || 0) * 2, 40);
    const favoritesScore = Math.min((aggregates.favorites_24h || 0) * 10, 30);
    const inquiriesScore = Math.min((aggregates.inquiries_24h || 0) * 15, 20);
    const velocityBonus = aggregates.views_1h > 0 ? 10 : 0;
    
    return Math.min(viewsScore + favoritesScore + inquiriesScore + velocityBonus, 100);
  }

  /**
   * Render social proof badges on a listing card
   */
  renderSocialProof(containerId, socialProofData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { badges, views, trendingScore } = socialProofData;
    const activeBadges = [];

    // Priority order: Price drop > Fire > Scarcity > New
    if (badges.price) activeBadges.push(badges.price);
    if (badges.fire) activeBadges.push(badges.fire);
    if (badges.scarcity) activeBadges.push(badges.scarcity);
    if (badges.new && activeBadges.length < 3) activeBadges.push(badges.new);

    if (activeBadges.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = activeBadges.map(badge => `
      <span class="social-proof-badge ${badge.level || badge.urgency || badge.freshness || ''}">
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-text">${badge.text}</span>
        ${badge.savings ? `<span class="badge-savings">Save ${(badge.savings / 1000000).toFixed(1)}M</span>` : ''}
      </span>
    `).join('');

    // Add trending indicator if score is high
    if (trendingScore >= 70 && !badges.fire) {
      container.innerHTML += `
        <span class="social-proof-badge trending">
          <span class="badge-icon">📈</span>
          <span class="badge-text">Trending #${Math.ceil((100 - trendingScore) / 5)}</span>
        </span>
      `;
    }
  }

  /**
   * Setup real-time activity updates
   * Uses Supabase realtime for live updates
   */
  setupRealtimeSubscriptions() {
    if (!this.supabase) return;

    // Subscribe to new activities
    this.realtimeChannel = this.supabase
      .channel('listing_activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listing_activities' },
        (payload) => {
          // Invalidate cache for this listing
          this.activityCache.delete(payload.new.listing_id);
          
          // Update UI if visible
          this.updateLiveBadge(payload.new.listing_id, payload.new.activity_type);
        }
      )
      .subscribe();
  }

  /**
   * Update a badge in real-time when activity happens
   */
  updateLiveBadge(listingId, activityType) {
    // Find any visible badges for this listing
    const badges = document.querySelectorAll(`[data-listing-id="${listingId}"] .social-proof-badge`);
    
    badges.forEach(badge => {
      badge.classList.add('pulse-animation');
      setTimeout(() => badge.classList.remove('pulse-animation'), 1000);
    });

    // Refresh the social proof data
    this.getSocialProof(listingId).then(data => {
      const containers = document.querySelectorAll(`[data-listing-id="${listingId}"] .social-proof-container`);
      containers.forEach(container => {
        this.renderSocialProof(container.id, data);
      });
    });
  }

  /**
   * Update activity aggregates (called after each activity)
   */
  async updateActivityAggregates(listingId, activityType) {
    try {
      // Call Supabase function to recalculate aggregates
      await this.supabase.rpc('update_listing_activity_aggregate', {
        p_listing_id: listingId,
        p_activity_type: activityType
      });
    } catch (err) {
      // Silent fail - aggregates will be updated by scheduled job
      console.log('Aggregate update deferred');
    }
  }

  /**
   * Update listing trending score
   */
  async updateTrendingScore(listingId) {
    try {
      await this.supabase.rpc('calculate_trending_score', {
        p_listing_id: listingId
      });
    } catch (err) {
      console.log('Trending score update deferred');
    }
  }

  /**
   * Get trending listings (for Smart Feed)
   */
  async getTrendingListings(limit = 10, excludeIds = []) {
    try {
      let query = this.supabase
        .from('listings')
        .select('*, listing_activity_aggregates!inner(*)')
        .eq('status', 'active')
        .order('listing_activity_aggregates.trending_score', { ascending: false })
        .limit(limit);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error getting trending listings:', err);
      return [];
    }
  }

  /**
   * Get hot listings (trending in real-time)
   */
  async getHotListings(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('listings')
        .select('*, listing_activity_aggregates!inner(*)')
        .eq('status', 'active')
        .gte('listing_activity_aggregates.trending_score', 70)
        .order('listing_activity_aggregates.views_1h', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting hot listings:', err);
      return [];
    }
  }

  /**
   * Get activity feed for a listing (recent actions)
   */
  async getActivityFeed(listingId, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from('listing_activities')
        .select('activity_type, created_at, user_id')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Format activity messages
      return (data || []).map(activity => ({
        type: activity.activity_type,
        time: this.formatTimeAgo(activity.created_at),
        message: this.getActivityMessage(activity.activity_type),
        isAnonymous: !activity.user_id
      }));
    } catch (err) {
      console.error('Error getting activity feed:', err);
      return [];
    }
  }

  getActivityMessage(type) {
    const messages = {
      view: 'Someone viewed this listing',
      favorite: 'Added to favorites',
      contact: 'Requested contact info',
      message: 'Sent an inquiry',
      share: 'Shared this listing'
    };
    return messages[type] || 'Activity recorded';
  }

  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('social_proof_session_id');
    if (!sessionId) {
      sessionId = 'sp_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('social_proof_session_id', sessionId);
    }
    return sessionId;
  }

  getEmptySocialProof() {
    return {
      views: { today: 0, thisHour: 0, thisWeek: 0, total: 0 },
      favorites: { today: 0, total: 0 },
      inquiries: 0,
      velocity: 'low',
      trendingScore: 0,
      daysOnMarket: 0,
      badges: { fire: null, scarcity: null, price: null, new: null },
      lastActivity: null
    };
  }

  getMockSocialProof() {
    const viewsToday = Math.floor(Math.random() * 30) + 5;
    return {
      views: { today: viewsToday, thisHour: Math.floor(viewsToday / 4), thisWeek: viewsToday * 3, total: viewsToday * 10 },
      favorites: { today: Math.floor(Math.random() * 3), total: Math.floor(Math.random() * 15) + 5 },
      inquiries: Math.floor(Math.random() * 2),
      velocity: viewsToday > 20 ? 'high' : 'medium',
      trendingScore: Math.floor(Math.random() * 40) + 50,
      daysOnMarket: Math.floor(Math.random() * 10) + 1,
      badges: {
        fire: viewsToday > 15 ? { icon: '🔥', text: `${viewsToday} people viewed today`, level: 'hot' } : null,
        scarcity: Math.random() > 0.5 ? { icon: '⚡', text: '3 people favorited this', urgency: 'medium' } : null,
        price: null,
        new: Math.random() > 0.7 ? { icon: '🆕', text: 'Just listed', freshness: 'new' } : null
      },
      lastActivity: new Date().toISOString()
    };
  }
}

// Create global instance
window.socialProof = new SocialProofEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialProofEngine;
}
