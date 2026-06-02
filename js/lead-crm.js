/**
 * HOME AFRICA - Lead Scoring & CRM System
 * Intelligent lead management for merchants
 * 
 * Features:
 * - Automated lead scoring based on user behavior
 * - Lead pipeline management (Hot/Warm/Cold)
 * - Follow-up reminders
 * - Conversion tracking
 * - Lead source attribution
 */

class LeadCRM {
  constructor() {
    this.supabase = null;
    this.currentMerchant = null;
    this.leads = [];
    this.init();
  }

  async init() {
    this.supabase = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
    if (!this.supabase) {
      console.warn('Supabase not available for CRM');
      return;
    }

    // Get current merchant
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      this.currentMerchant = user.id;
      await this.loadLeads();
    }
  }

  /**
   * Calculate lead score based on engagement metrics
   * Scoring Algorithm:
   * - Profile views: 2 points each
   * - Listing favorites: 5 points each
   * - Messages sent: 10 points each
   * - Time on page (minutes): 1 point per minute
   * - Return visits: 3 points each
   * - Saved search matching merchant listings: 8 points
   * 
   * @param {Object} engagementData - User engagement metrics
   * @returns {number} Lead score (0-100+)
   */
  calculateLeadScore(engagementData) {
    const {
      profileViews = 0,
      favorites = 0,
      messages = 0,
      timeOnPage = 0, // in seconds
      returnVisits = 0,
      savedSearches = 0,
      inquiries = 0,
      priceInquiries = 0, // asked about price
      availabilityChecks = 0, // checked availability
      phoneClicks = 0,
      whatsappClicks = 0,
      emailClicks = 0,
      lastActivityDays = 999 // days since last activity
    } = engagementData;

    // Base engagement score
    let score = 0;
    score += profileViews * 2;
    score += favorites * 5;
    score += messages * 10;
    score += Math.floor(timeOnPage / 60) * 1; // per minute
    score += returnVisits * 3;
    score += savedSearches * 8;
    score += inquiries * 15;
    score += priceInquiries * 20; // High intent
    score += availabilityChecks * 18; // High intent
    score += phoneClicks * 12;
    score += whatsappClicks * 12;
    score += emailClicks * 8;

    // Recency decay (leads go cold over time)
    if (lastActivityDays <= 1) score *= 1.3; // Hot - active today
    else if (lastActivityDays <= 3) score *= 1.1; // Warm - active this week
    else if (lastActivityDays <= 7) score *= 1.0; // Neutral
    else if (lastActivityDays <= 14) score *= 0.8; // Cooling
    else if (lastActivityDays <= 30) score *= 0.6; // Cold
    else score *= 0.3; // Ice cold

    return Math.round(score);
  }

  /**
   * Get lead temperature based on score and recency
   * @param {number} score - Lead score
   * @param {number} lastActivityDays - Days since last activity
   * @returns {string} Temperature: 'hot', 'warm', 'cold', 'ice'
   */
  getLeadTemperature(score, lastActivityDays) {
    if (score >= 50 && lastActivityDays <= 3) return 'hot';
    if (score >= 30 && lastActivityDays <= 7) return 'warm';
    if (score >= 15 && lastActivityDays <= 14) return 'cold';
    return 'ice';
  }

  /**
   * Load leads for current merchant from Supabase
   */
  async loadLeads() {
    if (!this.supabase || !this.currentMerchant) return [];

    try {
      // Get leads with their engagement data
      const { data, error } = await this.supabase
        .from('merchant_leads')
        .select(`
          *,
          lead_engagement(*),
          messages:messages!lead_id(*)
        `)
        .eq('merchant_id', this.currentMerchant)
        .order('lead_score', { ascending: false });

      if (error) throw error;

      this.leads = data || [];
      return this.leads;
    } catch (err) {
      console.error('Error loading leads:', err);
      return [];
    }
  }

  /**
   * Track a new lead interaction
   * @param {string} userId - The potential buyer user ID
   * @param {string} interactionType - Type of interaction
   * @param {Object} metadata - Additional data
   */
  async trackInteraction(userId, interactionType, metadata = {}) {
    if (!this.supabase || !this.currentMerchant) return;

    try {
      // Check if lead exists
      const { data: existingLead } = await this.supabase
        .from('merchant_leads')
        .select('id, lead_score')
        .eq('merchant_id', this.currentMerchant)
        .eq('user_id', userId)
        .single();

      if (existingLead) {
        // Update existing lead
        await this.updateLeadScore(existingLead.id, interactionType, metadata);
      } else {
        // Create new lead
        await this.createLead(userId, interactionType, metadata);
      }
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  }

  /**
   * Create a new lead record
   */
  async createLead(userId, interactionType, metadata = {}) {
    const leadScore = this.calculateLeadScore({
      [interactionType]: 1,
      ...metadata
    });

    const { data, error } = await this.supabase
      .from('merchant_leads')
      .insert({
        merchant_id: this.currentMerchant,
        user_id: userId,
        lead_score: leadScore,
        temperature: this.getLeadTemperature(leadScore, 0),
        source: metadata.source || 'organic',
        first_contact_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        status: 'new',
        pipeline_stage: 'inquiry'
      })
      .select()
      .single();

    if (error) throw error;

    // Log the engagement
    await this.logEngagement(data.id, interactionType, metadata);
    return data;
  }

  /**
   * Update lead score with new interaction
   */
  async updateLeadScore(leadId, interactionType, metadata = {}) {
    // Get current engagement data
    const { data: engagement } = await this.supabase
      .from('lead_engagement')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    // Calculate cumulative score
    const currentData = engagement || {};
    const newData = {
      ...currentData,
      [interactionType]: (currentData[interactionType] || 0) + 1,
      ...metadata
    };

    const newScore = this.calculateLeadScore(newData);
    const lastActivity = new Date().toISOString();

    // Update lead
    await this.supabase
      .from('merchant_leads')
      .update({
        lead_score: newScore,
        temperature: this.getLeadTemperature(newScore, 0),
        last_activity_at: lastActivity,
        updated_at: lastActivity
      })
      .eq('id', leadId);

    // Log engagement
    await this.logEngagement(leadId, interactionType, metadata);
  }

  /**
   * Log engagement activity
   */
  async logEngagement(leadId, activityType, metadata = {}) {
    await this.supabase
      .from('lead_engagement_log')
      .insert({
        lead_id: leadId,
        activity_type: activityType,
        metadata: metadata,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Update lead pipeline stage
   * @param {string} leadId - Lead ID
   * @param {string} stage - Pipeline stage
   */
  async updatePipelineStage(leadId, stage) {
    const stages = ['inquiry', 'contacted', 'viewing_scheduled', 'negotiating', 'closed_won', 'closed_lost'];
    if (!stages.includes(stage)) return;

    await this.supabase
      .from('merchant_leads')
      .update({
        pipeline_stage: stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
  }

  /**
   * Set follow-up reminder
   */
  async setFollowUpReminder(leadId, reminderDate, note = '') {
    await this.supabase
      .from('lead_follow_ups')
      .insert({
        lead_id: leadId,
        merchant_id: this.currentMerchant,
        reminder_date: reminderDate,
        note: note,
        status: 'pending'
      });
  }

  /**
   * Get leads by temperature
   */
  getLeadsByTemperature(temperature) {
    return this.leads.filter(lead => lead.temperature === temperature);
  }

  /**
   * Get leads by pipeline stage
   */
  getLeadsByStage(stage) {
    return this.leads.filter(lead => lead.pipeline_stage === stage);
  }

  /**
   * Get conversion funnel statistics
   */
  getConversionFunnel() {
    const stages = ['inquiry', 'contacted', 'viewing_scheduled', 'negotiating', 'closed_won'];
    const funnel = {};
    
    stages.forEach(stage => {
      funnel[stage] = this.leads.filter(l => l.pipeline_stage === stage).length;
    });

    // Calculate conversion rates
    const total = this.leads.length || 1;
    return {
      counts: funnel,
      rates: {
        inquiry: 100,
        contacted: Math.round((funnel.contacted / total) * 100),
        viewing_scheduled: Math.round((funnel.viewing_scheduled / total) * 100),
        negotiating: Math.round((funnel.negotiating / total) * 100),
        closed_won: Math.round((funnel.closed_won / total) * 100)
      }
    };
  }

  /**
   * Generate lead insights and recommendations
   */
  getLeadInsights() {
    const hotLeads = this.getLeadsByTemperature('hot');
    const warmLeads = this.getLeadsByTemperature('warm');
    const coldLeads = this.getLeadsByTemperature('cold');
    
    const insights = [];

    // Urgent follow-ups
    const urgent = hotLeads.filter(l => {
      const lastContact = new Date(l.last_contact_at);
      const hoursSince = (Date.now() - lastContact) / (1000 * 60 * 60);
      return hoursSince > 24 && l.pipeline_stage === 'inquiry';
    });

    if (urgent.length > 0) {
      insights.push({
        type: 'urgent',
        message: `${urgent.length} hot lead${urgent.length > 1 ? 's' : ''} need${urgent.length === 1 ? 's' : ''} follow-up within 2 hours`,
        action: 'contact_now',
        leads: urgent
      });
    }

    // At-risk leads
    const atRisk = this.leads.filter(l => {
      const lastActivity = new Date(l.last_activity_at);
      const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
      return daysSince > 7 && l.temperature === 'warm' && l.pipeline_stage !== 'closed_won';
    });

    if (atRisk.length > 0) {
      insights.push({
        type: 'warning',
        message: `${atRisk.length} warm lead${atRisk.length > 1 ? 's are' : ' is'} going cold`,
        action: 're_engage',
        leads: atRisk
      });
    }

    // Success patterns
    const recentClosed = this.leads.filter(l => 
      l.pipeline_stage === 'closed_won' && 
      new Date(l.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentClosed.length > 0) {
      const avgScore = recentClosed.reduce((sum, l) => sum + l.lead_score, 0) / recentClosed.length;
      insights.push({
        type: 'success',
        message: `Closed ${recentClosed.length} deals this month. Avg lead score: ${Math.round(avgScore)}`,
        action: 'review_patterns'
      });
    }

    return insights;
  }

  /**
   * Auto-categorize and tag leads
   */
  async autoTagLead(leadId) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    const tags = [];

    // Score-based tags
    if (lead.lead_score >= 50) tags.push('high-value');
    if (lead.lead_score >= 30 && lead.lead_score < 50) tags.push('medium-value');
    
    // Activity-based tags
    if (lead.return_visits > 3) tags.push('highly-engaged');
    if (lead.messages > 0) tags.push('responded');
    if (lead.phone_clicks > 0 || lead.whatsapp_clicks > 0) tags.push('intent-to-call');
    
    // Time-based tags
    const daysSince = (Date.now() - new Date(lead.first_contact_at)) / (1000 * 60 * 60 * 24);
    if (daysSince <= 1) tags.push('fresh');
    if (daysSince > 30 && lead.pipeline_stage !== 'closed_won') tags.push('stale');

    await this.supabase
      .from('merchant_leads')
      .update({ tags: tags })
      .eq('id', leadId);
  }

  /**
   * Render CRM dashboard widget
   */
  renderCRMWidget(containerId = 'crm-widget') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const hotCount = this.getLeadsByTemperature('hot').length;
    const warmCount = this.getLeadsByTemperature('warm').length;
    const coldCount = this.getLeadsByTemperature('cold').length;
    const funnel = this.getConversionFunnel();
    const insights = this.getLeadInsights();

    container.innerHTML = `
      <div class="crm-widget">
        <div class="crm-header">
          <h4><i class="bi bi-funnel"></i> Lead Pipeline</h4>
          <span class="badge bg-primary">${this.leads.length} Total Leads</span>
        </div>
        
        <div class="lead-temperature-cards">
          <div class="temp-card hot">
            <div class="temp-count">${hotCount}</div>
            <div class="temp-label">Hot Leads</div>
            <small>Contact within 2hrs</small>
          </div>
          <div class="temp-card warm">
            <div class="temp-count">${warmCount}</div>
            <div class="temp-label">Warm Leads</div>
            <small>Follow up today</small>
          </div>
          <div class="temp-card cold">
            <div class="temp-count">${coldCount}</div>
            <div class="temp-label">Cold Leads</div>
            <small>Nurture campaign</small>
          </div>
        </div>

        ${insights.length > 0 ? `
          <div class="crm-insights">
            ${insights.map(i => `
              <div class="insight-alert ${i.type}">
                <i class="bi bi-${i.type === 'urgent' ? 'exclamation-circle' : i.type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
                ${i.message}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="conversion-funnel">
          <h6>Conversion Funnel</h6>
          <div class="funnel-bar">
            <div class="funnel-stage" style="width: 100%">Inquiry ${funnel.counts.inquiry}</div>
            <div class="funnel-stage" style="width: ${funnel.rates.contacted}%">Contacted ${funnel.counts.contacted}</div>
            <div class="funnel-stage" style="width: ${funnel.rates.viewing_scheduled}%">Viewing ${funnel.counts.viewing_scheduled}</div>
            <div class="funnel-stage" style="width: ${funnel.rates.negotiating}%">Negotiating ${funnel.counts.negotiating}</div>
            <div class="funnel-stage" style="width: ${funnel.rates.closed_won}%">Closed ${funnel.counts.closed_won}</div>
          </div>
        </div>

        <div class="crm-actions">
          <button class="btn btn-sm btn-primary" onclick="window.leadCRM.viewHotLeads()">
            <i class="bi bi-fire"></i> View Hot Leads
          </button>
          <button class="btn btn-sm btn-outline-light" onclick="window.leadCRM.viewAllLeads()">
            <i class="bi bi-list"></i> All Leads
          </button>
        </div>
      </div>
    `;
  }

  viewHotLeads() {
    const hotLeads = this.getLeadsByTemperature('hot');
    this.renderLeadsTable('hot-leads-table', hotLeads);
  }

  viewAllLeads() {
    this.renderLeadsTable('all-leads-table', this.leads);
  }

  renderLeadsTable(containerId, leads) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <table class="table table-dark table-hover">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Score</th>
            <th>Temp</th>
            <th>Stage</th>
            <th>Last Activity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(lead => `
            <tr>
              <td>
                <div class="lead-info">
                  <strong>${lead.user_name || 'Anonymous'}</strong>
                  <small class="d-block text-muted">${lead.source || 'Organic'}</small>
                </div>
              </td>
              <td>
                <span class="lead-score">${lead.lead_score}</span>
              </td>
              <td>
                <span class="badge bg-${lead.temperature === 'hot' ? 'danger' : lead.temperature === 'warm' ? 'warning' : 'secondary'}">
                  ${lead.temperature}
                </span>
              </td>
              <td>${lead.pipeline_stage.replace('_', ' ')}</td>
              <td>${this.timeAgo(lead.last_activity_at)}</td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="window.leadCRM.contactLead('${lead.id}')">
                  <i class="bi bi-chat"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  async contactLead(leadId) {
    // Open messaging modal or redirect to messages
    window.location.href = `messages.html?lead=${leadId}`;
  }
}

// Create global instance
window.leadCRM = new LeadCRM();

// Auto-track interactions on page load
document.addEventListener('DOMContentLoaded', () => {
  // Track listing views
  document.querySelectorAll('[data-listing-id]').forEach(el => {
    el.addEventListener('click', () => {
      const listingId = el.dataset.listingId;
      const merchantId = el.dataset.merchantId;
      if (merchantId && window.leadCRM) {
        window.leadCRM.trackInteraction('view', {
          listing_id: listingId,
          source: 'listing_card'
        });
      }
    });
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeadCRM;
}
