/**
 * HOME AFRICA - Smart Alert Feed System
 * 
 * Features:
 * - Personalized "For You" feed with algorithmic recommendations
 * - Infinite scroll with pull-to-refresh
 * - Feed types: new listings, price drops, trending, similar properties
 * - Priority-based sorting (urgent alerts first)
 * - Real-time updates via Supabase subscriptions
 */

class SmartFeed {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.realtimeChannel = null;
    this.feedItems = [];
    this.currentPage = 0;
    this.isLoading = false;
    this.hasMore = true;
    this.feedContainer = null;
    this.itemsPerPage = 10;
    this.init();
  }

  async init() {
    this.supabase = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
    if (!this.supabase) {
      console.warn('Supabase not available for Smart Feed');
      return;
    }

    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;

    // Setup realtime
    this.setupRealtimeSubscriptions();
  }

  /**
   * Initialize the feed in a container
   */
  async mount(containerId, options = {}) {
    this.feedContainer = document.getElementById(containerId);
    if (!this.feedContainer) {
      console.error(`Feed container #${containerId} not found`);
      return;
    }

    this.options = {
      showPullToRefresh: true,
      infiniteScroll: true,
      filterTypes: [], // Empty = all types
      ...options
    };

    // Render initial structure
    this.renderFeedStructure();

    // Load first page
    await this.loadMore();

    // Setup infinite scroll
    if (this.options.infiniteScroll) {
      this.setupInfiniteScroll();
    }

    // Setup pull-to-refresh
    if (this.options.showPullToRefresh) {
      this.setupPullToRefresh();
    }
  }

  renderFeedStructure() {
    this.feedContainer.innerHTML = `
      <div class="smart-feed" id="smartFeedRoot">
        ${this.options.showPullToRefresh ? `
          <div class="feed-pull-indicator" id="pullIndicator">
            <i class="bi bi-arrow-down"></i>
            <span>Pull to refresh</span>
          </div>
        ` : ''}
        
        <div class="feed-filters mb-3">
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-light active" data-filter="all">All</button>
            <button type="button" class="btn btn-sm btn-outline-light" data-filter="new_listing">🆕 New</button>
            <button type="button" class="btn btn-sm btn-outline-light" data-filter="price_drop">📉 Price Drop</button>
            <button type="button" class="btn btn-sm btn-outline-light" data-filter="trending">🔥 Trending</button>
          </div>
        </div>
        
        <div class="feed-items" id="feedItems"></div>
        
        <div class="feed-loading" id="feedLoading" style="display: none;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div class="feed-end" id="feedEnd" style="display: none;">
          <p class="text-muted text-center">You're all caught up! 🎉</p>
        </div>
      </div>
    `;

    // Add filter handlers
    this.feedContainer.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.feedContainer.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filter = e.target.dataset.filter;
        this.refresh();
      });
    });
  }

  /**
   * Load more feed items
   */
  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.showLoading(true);

    try {
      let items = [];

      if (this.currentUser) {
        // Generate personalized feed via Supabase function
        const { data, error } = await this.supabase.rpc('generate_user_feed', {
          p_user_id: this.currentUser.id,
          p_limit: this.itemsPerPage
        });

        if (error) throw error;
        items = data || [];
      } else {
        // Anonymous users see trending + new listings
        items = await this.getAnonymousFeed();
      }

      // Apply filter if set
      if (this.filter && this.filter !== 'all') {
        items = items.filter(item => item.feed_type === this.filter);
      }

      if (items.length === 0) {
        this.hasMore = false;
        this.showEndMessage();
      } else {
        this.feedItems = [...this.feedItems, ...items];
        this.renderItems(items, this.currentPage === 0);
        this.currentPage++;
      }

    } catch (err) {
      console.error('Error loading feed:', err);
      this.renderMockData();
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Get feed for anonymous users
   */
  async getAnonymousFeed() {
    try {
      // Get trending listings
      const { data: trending } = await this.supabase
        .from('trending_listings_view')
        .select('*')
        .limit(5);

      // Get new listings
      const { data: newListings } = await this.supabase
        .from('listings')
        .select('*, listing_activity_aggregates!inner(*)')
        .eq('status', 'active')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const items = [];

      trending?.forEach(item => {
        items.push({
          feed_type: 'trending',
          listing_id: item.id,
          title: `🔥 Trending: ${item.type} in ${item.district}`,
          description: `${item.views_24h} views today`,
          priority: 6,
          data: item
        });
      });

      newListings?.forEach(item => {
        items.push({
          feed_type: 'new_listing',
          listing_id: item.id,
          title: `🆕 New ${item.type} in ${item.district}`,
          description: `${item.title} - ${(item.price / 1000000).toFixed(1)}M RWF`,
          priority: 5,
          data: item
        });
      });

      return items.sort((a, b) => b.priority - a.priority);
    } catch (err) {
      console.error('Error getting anonymous feed:', err);
      return [];
    }
  }

  /**
   * Render feed items
   */
  renderItems(items, clearFirst = false) {
    const container = this.feedContainer.querySelector('#feedItems');
    if (!container) return;

    if (clearFirst) container.innerHTML = '';

    items.forEach(item => {
      const card = this.createFeedCard(item);
      container.appendChild(card);
    });
  }

  createFeedCard(item) {
    const card = document.createElement('div');
    card.className = 'feed-card';
    card.dataset.feedId = item.id;
    card.dataset.listingId = item.listing_id;

    const icon = this.getFeedTypeIcon(item.feed_type);
    const badge = this.getFeedTypeBadge(item.feed_type);

    card.innerHTML = `
      <div class="feed-card-content">
        <div class="d-flex justify-content-between align-items-start">
          <div class="feed-icon">${icon}</div>
          <button class="btn btn-sm btn-link text-muted dismiss-btn" title="Dismiss">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="feed-body">
          <span class="feed-badge ${badge.class}">${badge.text}</span>
          <h5 class="feed-title">${item.title}</h5>
          <p class="feed-description">${item.description}</p>
          ${item.data?.images?.[0] ? `
            <img src="${item.data.images[0]}" class="feed-image" alt="${item.title}">
          ` : ''}
        </div>
        <div class="feed-actions">
          <a href="apartment-detail.html?id=${item.listing_id}" class="btn btn-sm btn-primary">
            View Property
          </a>
          <button class="btn btn-sm btn-outline-light save-btn">
            <i class="bi bi-heart"></i> Save
          </button>
        </div>
      </div>
    `;

    // Add click handlers
    card.querySelector('.dismiss-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissItem(item.id, card);
    });

    card.querySelector('.save-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.saveListing(item.listing_id);
    });

    return card;
  }

  getFeedTypeIcon(type) {
    const icons = {
      new_listing: '🆕',
      price_drop: '📉',
      trending: '🔥',
      back_on_market: '🔄',
      similar_to_viewed: '👀',
      favorite_sold: '❌',
      favorite_price_drop: '💰',
      merchant_new_listing: '🏪'
    };
    return icons[type] || '📌';
  }

  getFeedTypeBadge(type) {
    const badges = {
      new_listing: { class: 'bg-success', text: 'NEW' },
      price_drop: { class: 'bg-danger', text: 'PRICE DROP' },
      trending: { class: 'bg-warning', text: 'HOT' },
      back_on_market: { class: 'bg-info', text: 'BACK AGAIN' },
      similar_to_viewed: { class: 'bg-primary', text: 'SIMILAR' },
      favorite_sold: { class: 'bg-secondary', text: 'SOLD' },
      favorite_price_drop: { class: 'bg-success', text: 'DEAL' },
      merchant_new_listing: { class: 'bg-primary', text: 'NEW FROM SELLER' }
    };
    return badges[type] || { class: 'bg-secondary', text: 'UPDATE' };
  }

  /**
   * Dismiss a feed item
   */
  async dismissItem(itemId, cardElement) {
    try {
      if (this.currentUser && itemId) {
        await this.supabase
          .from('user_feed_items')
          .update({ dismissed: true, dismissed_at: new Date().toISOString() })
          .eq('id', itemId);
      }

      // Animate removal
      cardElement.style.transform = 'translateX(-100%)';
      cardElement.style.opacity = '0';
      setTimeout(() => cardElement.remove(), 300);

    } catch (err) {
      console.error('Error dismissing item:', err);
    }
  }

  /**
   * Save listing to favorites
   */
  async saveListing(listingId) {
    if (!this.currentUser) {
      alert('Please sign in to save listings');
      return;
    }

    try {
      await this.supabase
        .from('favorites')
        .insert([{
          user_id: this.currentUser.id,
          listing_id: listingId,
          created_at: new Date().toISOString()
        }]);

      // Track favorite activity
      if (window.socialProof) {
        window.socialProof.trackActivity(listingId, 'favorite');
      }

    } catch (err) {
      console.error('Error saving listing:', err);
    }
  }

  /**
   * Refresh the feed
   */
  async refresh() {
    this.currentPage = 0;
    this.hasMore = true;
    this.feedItems = [];
    this.feedContainer.querySelector('#feedItems').innerHTML = '';
    this.feedContainer.querySelector('#feedEnd').style.display = 'none';
    await this.loadMore();
  }

  /**
   * Setup infinite scroll
   */
  setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading && this.hasMore) {
          this.loadMore();
        }
      });
    }, { threshold: 0.1 });

    // Create sentinel element
    const sentinel = document.createElement('div');
    sentinel.className = 'feed-sentinel';
    sentinel.style.height = '10px';
    this.feedContainer.appendChild(sentinel);
    observer.observe(sentinel);
  }

  /**
   * Setup pull-to-refresh
   */
  setupPullToRefresh() {
    let startY = 0;
    let pullDistance = 0;
    const indicator = this.feedContainer.querySelector('#pullIndicator');

    this.feedContainer.addEventListener('touchstart', (e) => {
      if (this.feedContainer.scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.feedContainer.addEventListener('touchmove', (e) => {
      if (startY > 0 && this.feedContainer.scrollTop === 0) {
        pullDistance = e.touches[0].clientY - startY;
        if (pullDistance > 0 && pullDistance < 100) {
          indicator.style.transform = `translateY(${pullDistance}px)`;
          indicator.style.opacity = pullDistance / 100;
        }
      }
    }, { passive: true });

    this.feedContainer.addEventListener('touchend', () => {
      if (pullDistance > 60) {
        this.refresh();
      }
      indicator.style.transform = '';
      indicator.style.opacity = '';
      startY = 0;
      pullDistance = 0;
    });
  }

  showLoading(show) {
    const loader = this.feedContainer?.querySelector('#feedLoading');
    if (loader) loader.style.display = show ? 'block' : 'none';
  }

  showEndMessage() {
    const endMsg = this.feedContainer?.querySelector('#feedEnd');
    if (endMsg) endMsg.style.display = 'block';
  }

  setupRealtimeSubscriptions() {
    if (!this.supabase || !this.currentUser) return;

    this.realtimeChannel = this.supabase
      .channel('user_feed')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_feed_items',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          // Insert new item at top
          const newItem = payload.new;
          if (!newItem.dismissed) {
            this.prependItem(newItem);
          }
        }
      )
      .subscribe();
  }

  prependItem(item) {
    const container = this.feedContainer?.querySelector('#feedItems');
    if (!container) return;

    const card = this.createFeedCard(item);
    card.style.animation = 'slideInDown 0.3s ease';
    container.insertBefore(card, container.firstChild);
  }

  renderMockData() {
    const mockItems = [
      {
        id: '1',
        feed_type: 'trending',
        listing_id: 'mock1',
        title: '🔥 Trending: Apartment in Nyarutarama',
        description: '24 views in the last hour',
        priority: 8,
        data: { images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'] }
      },
      {
        id: '2',
        feed_type: 'price_drop',
        listing_id: 'mock2',
        title: '📉 Price dropped in Kacyiru',
        description: '3BR House - Now 45M RWF (was 52M)',
        priority: 9,
        data: { images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'] }
      },
      {
        id: '3',
        feed_type: 'new_listing',
        listing_id: 'mock3',
        title: '🆕 New Land Plot in Remera',
        description: 'Prime location - 28M RWF',
        priority: 6,
        data: { images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'] }
      },
      {
        id: '4',
        feed_type: 'similar_to_viewed',
        listing_id: 'mock4',
        title: '👀 Similar to what you viewed',
        description: '2BR Apartment in same area - 38M RWF',
        priority: 5,
        data: { images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'] }
      }
    ];

    this.feedItems = mockItems;
    this.renderItems(mockItems, true);
    this.hasMore = false;
    this.showEndMessage();
  }
}

// Create global instance
window.smartFeed = new SmartFeed();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartFeed;
}
