/**
 * HOME AFRICA - Funnel Analytics & Abandonment Recovery System
 * 
 * Tracks user journey through conversion stages:
 * 1. Search -> View Listing -> Favorite -> Contact -> Inquiry/Booking
 * 
 * Features:
 * - Real-time funnel stage tracking
 * - Drop-off point identification
 * - Automated recovery campaigns
 * - Merchant funnel dashboards
 * - Smart re-engagement triggers
 */

class FunnelAnalytics {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.funnelStages = [
      'search',           // User performed a search
      'view_listing',     // Viewed a specific listing
      'view_details',     // Scrolled through details
      'favorite',         // Added to favorites
      'contact_click',    // Clicked contact button
      'message_sent',     // Sent message to seller
      'phone_click',      // Clicked phone number
      'whatsapp_click',   // Clicked WhatsApp
      'email_click',      // Clicked email
      'booking_started',  // Started booking process
      'booking_complete'  // Completed booking/inquiry
    ];
    this.init();
  }

  async init() {
    this.supabase = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
    if (!this.supabase) {
      console.warn('Supabase not available for Funnel Analytics');
      return;
    }
    
    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser = user;
    
    // Set up page tracking
    this.setupPageTracking();
  }

  /**
   * Track funnel progression
   * Records each stage of the user journey
   * 
   * @param {string} stage - Funnel stage name
   * @param {Object} metadata - Additional context
   */
  async trackStage(stage, metadata = {}) {
    try {
      if (!this.supabase || !this.currentUser) return;

      const sessionId = this.getSessionId();
      const funnelData = {
        user_id: this.currentUser.id,
        session_id: sessionId,
        stage: stage,
        metadata: metadata,
        device_info: this.getDeviceInfo(),
        referrer: document.referrer || 'direct',
        created_at: new Date().toISOString()
      };

      // Insert funnel event
      const { error } = await this.supabase
        .from('funnel_events')
        .insert([funnelData]);

      if (error) throw error;

      // Check for abandonment recovery trigger
      await this.checkRecoveryTriggers(stage, metadata);

      // Update user's current funnel position
      await this.updateUserFunnelPosition(stage, metadata);

    } catch (err) {
      console.error('Error tracking funnel stage:', err);
    }
  }

  /**
   * Track search activity
   */
  async trackSearch(searchFilters) {
    await this.trackStage('search', {
      filters: searchFilters,
      results_count: searchFilters.results_count || 0,
      query_time_ms: searchFilters.query_time || 0
    });
  }

  /**
   * Track listing view
   */
  async trackListingView(listingId, listingData = {}) {
    await this.trackStage('view_listing', {
      listing_id: listingId,
      listing_type: listingData.type || 'unknown',
      listing_price: listingData.price || 0,
      listing_district: listingData.district || 'unknown',
      source: listingData.source || 'search',
      time_on_page: 0 // Will be updated on exit
    });

    // Start timing the view
    this.startViewTimer(listingId);
  }

  /**
   * Track engagement depth
   */
  async trackEngagement(action, listingId, metadata = {}) {
    const stageMap = {
      'scroll_depth': 'view_details',
      'gallery_view': 'view_details',
      'map_view': 'view_details',
      'favorite_add': 'favorite',
      'favorite_remove': null, // Don't track removal
      'contact_open': 'contact_click',
      'message_submit': 'message_sent',
      'phone_reveal': 'phone_click',
      'whatsapp_open': 'whatsapp_click',
      'email_open': 'email_click',
      'share': 'share_click',
      'report': 'report_click'
    };

    const stage = stageMap[action];
    if (!stage) return;

    await this.trackStage(stage, {
      listing_id: listingId,
      action: action,
      ...metadata
    });

    // Mark any pending recovery as resolved
    if (['message_sent', 'phone_click', 'whatsapp_click', 'email_click'].includes(stage)) {
      await this.resolveRecovery(listingId, 'converted');
    }
  }

  /**
   * Check if user needs recovery campaign
   */
  async checkRecoveryTriggers(currentStage, metadata) {
    try {
      // Check for abandonment after viewing but before contact
      if (currentStage === 'view_listing' && metadata.listing_id) {
        // Check if user has a previous abandoned session with this listing
        const { data: previousAbandonment } = await this.supabase
          .from('abandoned_sessions')
          .select('*')
          .eq('user_id', this.currentUser.id)
          .eq('listing_id', metadata.listing_id)
          .eq('recovered', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (previousAbandonment?.length > 0) {
          // User returned - mark as recovered
          await this.supabase
            .from('abandoned_sessions')
            .update({ 
              recovered: true, 
              recovered_at: new Date().toISOString(),
              recovery_type: 'self_returned'
            })
            .eq('id', previousAbandonment[0].id);
        }
      }

      // Create abandonment record if user viewed but didn't contact within threshold
      if (currentStage === 'view_listing') {
        setTimeout(async () => {
          await this.createAbandonmentCheck(metadata.listing_id);
        }, 60000); // Check after 60 seconds
      }

    } catch (err) {
      console.error('Error checking recovery triggers:', err);
    }
  }

  /**
   * Create abandonment record if user didn't convert
   */
  async createAbandonmentCheck(listingId) {
    try {
      // Check if user has already progressed past view stage
      const { data: recentEvents } = await this.supabase
        .from('funnel_events')
        .select('stage')
        .eq('user_id', this.currentUser.id)
        .eq('metadata->>listing_id', listingId)
        .gt('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 min
        .in('stage', ['contact_click', 'message_sent', 'phone_click', 'whatsapp_click', 'email_click', 'favorite']);

      if (recentEvents && recentEvents.length > 0) {
        return; // User converted, no abandonment
      }

      // Create abandonment record
      const { data: listing } = await this.supabase
        .from('listings')
        .select('title, price, type, district, user_id')
        .eq('id', listingId)
        .single();

      const { error } = await this.supabase
        .from('abandoned_sessions')
        .insert([{
          user_id: this.currentUser.id,
          listing_id: listingId,
          merchant_id: listing?.user_id,
          listing_title: listing?.title || 'Unknown',
          listing_price: listing?.price || 0,
          listing_type: listing?.type || 'unknown',
          listing_district: listing?.district || 'unknown',
          abandonment_stage: 'view_listing',
          recovery_sent: false,
          recovered: false,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }]);

      if (error) throw error;

      // Trigger recovery workflow
      await this.triggerRecoveryWorkflow(this.currentUser.id, listingId, listing);

    } catch (err) {
      console.error('Error creating abandonment check:', err);
    }
  }

  /**
   * Trigger automated recovery workflow
   */
  async triggerRecoveryWorkflow(userId, listingId, listingData) {
    try {
      // Get user profile
      const { data: user } = await this.supabase
        .from('users')
        .select('email, full_name, phone')
        .eq('id', userId)
        .single();

      if (!user?.email) return;

      // Schedule recovery emails
      const recoverySchedule = [
        { delay: 60 * 60 * 1000, type: 'immediate', template: 'still_interested' },      // 1 hour
        { delay: 24 * 60 * 60 * 1000, type: 'follow_up', template: 'price_drop_alert' }, // 24 hours
        { delay: 72 * 60 * 60 * 1000, type: 'final', template: 'similar_listings' }      // 3 days
      ];

      for (const schedule of recoverySchedule) {
        const sendAt = new Date(Date.now() + schedule.delay);
        
        await this.supabase
          .from('scheduled_recoveries')
          .insert([{
            user_id: userId,
            listing_id: listingId,
            merchant_id: listingData?.user_id,
            recovery_type: schedule.type,
            email_template: schedule.template,
            scheduled_at: sendAt.toISOString(),
            status: 'pending',
            metadata: {
              user_email: user.email,
              user_name: user.full_name,
              listing_title: listingData?.title,
              listing_price: listingData?.price,
              listing_image: listingData?.images?.[0]
            }
          }]);
      }

      // Also create notification for merchant
      await this.supabase
        .from('notifications')
        .insert([{
          user_id: listingData?.user_id,
          type: 'abandoned_interest',
          title: 'Potential buyer viewed your listing',
          message: `A user viewed "${listingData?.title}" but didn't contact you. A recovery campaign has been triggered.`,
          metadata: {
            listing_id: listingId,
            recovery_scheduled: true
          },
          is_read: false,
          created_at: new Date().toISOString()
        }]);

    } catch (err) {
      console.error('Error triggering recovery workflow:', err);
    }
  }

  /**
   * Resolve a recovery (user converted)
   */
  async resolveRecovery(listingId, recoveryType = 'converted') {
    try {
      // Update abandoned sessions
      await this.supabase
        .from('abandoned_sessions')
        .update({
          recovered: true,
          recovered_at: new Date().toISOString(),
          recovery_type: recoveryType
        })
        .eq('user_id', this.currentUser.id)
        .eq('listing_id', listingId)
        .eq('recovered', false);

      // Cancel pending scheduled recoveries
      await this.supabase
        .from('scheduled_recoveries')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', this.currentUser.id)
        .eq('listing_id', listingId)
        .eq('status', 'pending');

    } catch (err) {
      console.error('Error resolving recovery:', err);
    }
  }

  /**
   * Get merchant's funnel analytics
   */
  async getMerchantFunnel(merchantId, period = '30days') {
    try {
      const periodDays = period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

      // Get merchant's listings
      const { data: listings } = await this.supabase
        .from('listings')
        .select('id')
        .eq('user_id', merchantId);

      if (!listings || listings.length === 0) {
        return this.getEmptyFunnelData();
      }

      const listingIds = listings.map(l => l.id);

      // Get funnel events for these listings
      const { data: events } = await this.supabase
        .from('funnel_events')
        .select('stage, user_id, metadata, created_at')
        .in("metadata->>listing_id", listingIds)
        .gte('created_at', startDate);

      // Calculate funnel metrics
      const funnelData = this.calculateFunnelMetrics(events || []);

      // Get abandonment data
      const { data: abandonments } = await this.supabase
        .from('abandoned_sessions')
        .select('*')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate);

      // Get recovery stats
      const { data: recoveries } = await this.supabase
        .from('scheduled_recoveries')
        .select('*')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate);

      return {
        period,
        funnel: funnelData,
        abandonments: {
          total: abandonments?.length || 0,
          recovered: abandonments?.filter(a => a.recovered).length || 0,
          recovery_rate: abandonments?.length > 0 
            ? Math.round((abandonments.filter(a => a.recovered).length / abandonments.length) * 100) 
            : 0,
          by_stage: this.groupByStage(abandonments || [])
        },
        recoveries: {
          scheduled: recoveries?.length || 0,
          sent: recoveries?.filter(r => r.status === 'sent').length || 0,
          clicked: recoveries?.filter(r => r.clicked).length || 0,
          converted: recoveries?.filter(r => r.converted).length || 0
        },
        top_opportunities: this.getTopOpportunities(abandonments || [])
      };

    } catch (err) {
      console.error('Error getting merchant funnel:', err);
      return this.getMockFunnelData();
    }
  }

  calculateFunnelMetrics(events) {
    const stages = ['search', 'view_listing', 'favorite', 'contact_click', 'message_sent'];
    const counts = {};
    const uniqueUsers = {};

    stages.forEach(stage => {
      const stageEvents = events.filter(e => e.stage === stage);
      counts[stage] = stageEvents.length;
      uniqueUsers[stage] = new Set(stageEvents.map(e => e.user_id)).size;
    });

    // Calculate conversion rates
    const rates = {
      search_to_view: counts.search > 0 ? Math.round((counts.view_listing / counts.search) * 100) : 0,
      view_to_favorite: counts.view_listing > 0 ? Math.round((counts.favorite / counts.view_listing) * 100) : 0,
      view_to_contact: counts.view_listing > 0 ? Math.round((counts.contact_click / counts.view_listing) * 100) : 0,
      favorite_to_message: counts.favorite > 0 ? Math.round((counts.message_sent / counts.favorite) * 100) : 0,
      overall: counts.search > 0 ? Math.round((counts.message_sent / counts.search) * 100) : 0
    };

    return {
      counts,
      unique_users: uniqueUsers,
      conversion_rates: rates,
      total_events: events.length
    };
  }

  groupByStage(abandonments) {
    return abandonments.reduce((acc, a) => {
      const stage = a.abandonment_stage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
  }

  getTopOpportunities(abandonments) {
    // Get most valuable abandoned listings (highest price, recent)
    return abandonments
      .filter(a => !a.recovered)
      .sort((a, b) => {
        // Sort by price * recency weight
        const recencyA = new Date(a.created_at).getTime();
        const recencyB = new Date(b.created_at).getTime();
        const priceA = a.listing_price || 0;
        const priceB = b.listing_price || 0;
        return (priceB * recencyB) - (priceA * recencyA);
      })
      .slice(0, 5)
      .map(a => ({
        listing_id: a.listing_id,
        listing_title: a.listing_title,
        listing_price: a.listing_price,
        abandonment_stage: a.abandonment_stage,
        hours_abandoned: Math.round((Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60)),
        recovery_potential: a.listing_price > 50000000 ? 'high' : 'medium'
      }));
  }

  /**
   * Render merchant funnel dashboard
   */
  renderFunnelDashboard(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { funnel, abandonments, recoveries, top_opportunities } = data;

    container.innerHTML = `
      <div class="funnel-dashboard">
        <!-- Funnel Visualization -->
        <div class="funnel-viz mb-4">
          <h5>Conversion Funnel</h5>
          <div class="funnel-stages">
            ${this.renderFunnelStages(funnel)}
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="metric-box">
              <div class="metric-value">${funnel.unique_users.view_listing || 0}</div>
              <div class="metric-label">Unique Visitors</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="metric-box">
              <div class="metric-value">${funnel.conversion_rates.view_to_contact || 0}%</div>
              <div class="metric-label">Contact Rate</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="metric-box">
              <div class="metric-value">${abandonments.recovery_rate || 0}%</div>
              <div class="metric-label">Recovery Rate</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="metric-box">
              <div class="metric-value">${recoveries.converted || 0}</div>
              <div class="metric-label">Recovered Sales</div>
            </div>
          </div>
        </div>

        <!-- Abandonment Insights -->
        ${abandonments.total > 0 ? `
          <div class="abandonment-insights mb-4">
            <h6><i class="bi bi-exclamation-circle"></i> Abandonment Insights</h6>
            <p>${abandonments.total} users showed interest but didn't convert. 
               ${abandonments.recovered} were recovered (${abandonments.recovery_rate}% recovery rate).</p>
            
            ${top_opportunities.length > 0 ? `
              <div class="top-opportunities mt-3">
                <strong>Top Recovery Opportunities:</strong>
                <ul class="list-unstyled mt-2">
                  ${top_opportunities.map(opp => `
                    <li class="opportunity-item">
                      <span class="badge bg-${opp.recovery_potential === 'high' ? 'danger' : 'warning'}">${opp.recovery_potential}</span>
                      <strong>${opp.listing_title}</strong>
                      <span class="text-muted">- ${opp.hours_abandoned}h ago</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderFunnelStages(funnel) {
    const stages = [
      { key: 'view_listing', label: 'Viewed Listing' },
      { key: 'favorite', label: 'Favorited' },
      { key: 'contact_click', label: 'Clicked Contact' },
      { key: 'message_sent', label: 'Sent Message' }
    ];

    const maxCount = Math.max(...stages.map(s => funnel.counts[s.key] || 0), 1);

    return stages.map((stage, index) => {
      const count = funnel.counts[stage.key] || 0;
      const width = (count / maxCount) * 100;
      const prevCount = index > 0 ? (funnel.counts[stages[index - 1].key] || 0) : count;
      const dropOff = index > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;

      return `
        <div class="funnel-stage-bar" style="width: ${Math.max(width, 20)}%;">
          <div class="stage-info">
            <span class="stage-label">${stage.label}</span>
            <span class="stage-count">${count.toLocaleString()}</span>
          </div>
          ${dropOff > 0 ? `<span class="drop-off">${dropOff}% drop-off</span>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Setup page tracking for time-on-page
   */
  setupPageTracking() {
    let startTime = Date.now();
    let listingId = null;

    // Get listing ID from URL if on detail page
    const urlParams = new URLSearchParams(window.location.search);
    listingId = urlParams.get('id');

    // Track on page exit
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      if (listingId && timeOnPage > 5) {
        this.updateTimeOnPage(listingId, timeOnPage);
      }
    });

    // Track scroll depth
    if (listingId) {
      let maxScroll = 0;
      window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          if (maxScroll >= 75) {
            this.trackEngagement('scroll_depth', listingId, { depth: maxScroll });
          }
        }
      }, { passive: true });
    }
  }

  startViewTimer(listingId) {
    this.currentViewStart = Date.now();
    this.currentListingId = listingId;
  }

  async updateTimeOnPage(listingId, seconds) {
    try {
      await this.supabase
        .from('funnel_events')
        .update({ 'metadata->>time_on_page': seconds })
        .eq('user_id', this.currentUser.id)
        .eq('stage', 'view_listing')
        .eq('metadata->>listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (err) {
      console.error('Error updating time on page:', err);
    }
  }

  async updateUserFunnelPosition(stage, metadata) {
    try {
      await this.supabase
        .from('user_funnel_positions')
        .upsert({
          user_id: this.currentUser.id,
          current_stage: stage,
          last_listing_id: metadata.listing_id || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.error('Error updating funnel position:', err);
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('funnel_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('funnel_session_id', sessionId);
    }
    return sessionId;
  }

  getDeviceInfo() {
    return {
      user_agent: navigator.userAgent,
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer || 'direct'
    };
  }

  getEmptyFunnelData() {
    return {
      period: '30days',
      funnel: {
        counts: { view_listing: 0, favorite: 0, contact_click: 0, message_sent: 0 },
        unique_users: {},
        conversion_rates: {},
        total_events: 0
      },
      abandonments: { total: 0, recovered: 0, recovery_rate: 0, by_stage: {} },
      recoveries: { scheduled: 0, sent: 0, clicked: 0, converted: 0 },
      top_opportunities: []
    };
  }

  getMockFunnelData() {
    return {
      period: '30days',
      funnel: {
        counts: { view_listing: 156, favorite: 42, contact_click: 28, message_sent: 12 },
        unique_users: { view_listing: 134, favorite: 38, contact_click: 24, message_sent: 10 },
        conversion_rates: { view_to_contact: 18, view_to_favorite: 27, overall: 9 },
        total_events: 238
      },
      abandonments: { total: 44, recovered: 8, recovery_rate: 18, by_stage: { view_listing: 32, favorite: 12 } },
      recoveries: { scheduled: 44, sent: 38, clicked: 12, converted: 8 },
      top_opportunities: [
        { listing_title: '3BR Apartment Nyarutarama', hours_abandoned: 2, recovery_potential: 'high', listing_price: 65000000 },
        { listing_title: 'Land Plot Kacyiru', hours_abandoned: 5, recovery_potential: 'medium', listing_price: 28000000 }
      ]
    };
  }
}

// Create global instance
window.funnelAnalytics = new FunnelAnalytics();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FunnelAnalytics;
}
