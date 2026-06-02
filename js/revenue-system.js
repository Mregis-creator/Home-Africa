/**
 * HOME AFRICA Revenue Management System
 * Handles merchant subscriptions, lead tracking, billing, and analytics
 */

class RevenueSystem {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentMerchant = null;
    this.subscription = null;
    this.analytics = null;
  }

  // Initialize for current user
  async init() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session?.user) return false;

    // Check if user is merchant
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select('role, display_name')
      .eq('user_id', session.user.id)
      .single();

    if (profile?.role !== 'merchant') return false;

    this.currentMerchant = {
      id: session.user.id,
      ...profile
    };

    // Load subscription and analytics
    await this.loadSubscription();
    await this.loadAnalytics();

    return true;
  }

  // Load merchant subscription
  async loadSubscription() {
    const { data, error } = await this.supabase
      .from('merchant_subscriptions')
      .select('*')
      .eq('merchant_id', this.currentMerchant.id)
      .single();

    if (error) {
      console.error('Error loading subscription:', error);
      return;
    }

    this.subscription = data;
  }

  // Load revenue analytics
  async loadAnalytics() {
    const { data, error } = await this.supabase
      .from('merchant_revenue_analytics')
      .select('*')
      .eq('merchant_id', this.currentMerchant.id)
      .single();

    if (error) {
      console.error('Error loading analytics:', error);
      return;
    }

    this.analytics = data;
  }

  // Get pricing tiers
  getPricingTiers() {
    return {
      free: {
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        leadsPerMonth: 30,
        leadCostExcess: 0.50,
        maxListings: 5,
        maxFeaturedListings: 1,
        maxSponsoredPosts: 0,
        features: [
          '5 property listings',
          '1 featured listing',
          '30 free leads/month',
          '$0.50 per lead after 30',
          'Basic analytics'
        ]
      },
      professional: {
        name: 'Professional',
        monthlyPrice: 19,
        yearlyPrice: 190, // 2 months free
        leadsPerMonth: 30,
        leadCostExcess: 0.50,
        maxListings: 20,
        maxFeaturedListings: 5,
        maxSponsoredPosts: 2,
        features: [
          '20 property listings',
          '5 featured listings',
          '2 sponsored posts/month',
          '30 free leads/month',
          '$0.50 per lead after 30',
          'Advanced analytics dashboard',
          'Priority support',
          'API access'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        monthlyPrice: 49,
        yearlyPrice: 490, // 2 months free
        leadsPerMonth: 30,
        leadCostExcess: 0.50,
        maxListings: 999999, // Unlimited
        maxFeaturedListings: 10,
        maxSponsoredPosts: 999999, // Unlimited
        features: [
          'Unlimited property listings',
          '10 featured listings',
          'Unlimited sponsored posts',
          '30 free leads/month',
          '$0.50 per lead after 30',
          'Full analytics suite',
          'Virtual tours included',
          'Dedicated account manager',
          'White-label options'
        ]
      }
    };
  }

  // Upgrade subscription
  async upgradeSubscription(tier, billingCycle = 'monthly') {
    const tiers = this.getPricingTiers();
    const selectedTier = tiers[tier];

    if (!selectedTier) {
      return { success: false, error: 'Invalid tier' };
    }

    // In production, integrate with Stripe/PayPal here
    // For now, update the subscription directly
    const price = billingCycle === 'yearly' ? selectedTier.yearlyPrice : selectedTier.monthlyPrice;

    const { data, error } = await this.supabase
      .from('merchant_subscriptions')
      .upsert({
        merchant_id: this.currentMerchant.id,
        tier: tier,
        monthly_price: billingCycle === 'monthly' ? price : selectedTier.monthlyPrice,
        yearly_price: billingCycle === 'yearly' ? price : selectedTier.yearlyPrice,
        free_leads_per_month: selectedTier.leadsPerMonth,
        lead_cost_excess: selectedTier.leadCostExcess,
        max_listings: selectedTier.maxListings,
        max_featured_listings: selectedTier.maxFeaturedListings,
        max_sponsored_posts: selectedTier.maxSponsoredPosts,
        analytics_enabled: tier !== 'free',
        api_access: tier !== 'free',
        priority_support: tier === 'enterprise',
        virtual_tours_included: tier === 'enterprise',
        dedicated_account_manager: tier === 'enterprise',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) {
      return { success: false, error: error.message };
    }

    await this.loadSubscription();
    return { success: true, data };
  }

  // Record a lead (called when user contacts merchant)
  async recordLead(listingId, listingType, source = 'listing_contact', leadInfo = {}) {
    if (!this.currentMerchant) return { success: false, error: 'Not initialized' };

    try {
      // Call the database function to record lead
      const { data, error } = await this.supabase
        .rpc('record_merchant_lead', {
          p_merchant_id: this.currentMerchant.id,
          p_listing_id: listingId,
          p_listing_type: listingType,
          p_source: source,
          p_lead_user_id: leadInfo.userId || null,
          p_lead_email: leadInfo.email || null,
          p_lead_phone: leadInfo.phone || null
        });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error recording lead:', error);
      return { success: false, error: error.message };
    }
  }

  // Get remaining free leads
  getRemainingFreeLeads() {
    if (!this.analytics) return 30;
    return Math.max(0, this.analytics.free_leads_per_month - this.analytics.free_leads_used);
  }

  // Toggle featured listing
  async toggleFeaturedListing(listingId, listingType, isFeatured) {
    if (!this.subscription) return { success: false, error: 'No subscription' };

    // Check if they have available featured slots
    if (isFeatured) {
      // Count current featured listings
      const { count } = await this.supabase
        .from(listingType)
        .select('*', { count: 'exact' })
        .eq('user_id', this.currentMerchant.id)
        .eq('featured', true);

      if (count >= this.subscription.max_featured_listings) {
        return {
          success: false,
          error: `You've used all ${this.subscription.max_featured_listings} featured listings. Upgrade to Professional or Enterprise for more.`,
          needsUpgrade: true
        };
      }
    }

    // Update the listing
    const { error } = await this.supabase
      .from(listingType)
      .update({ featured: isFeatured })
      .eq('id', listingId)
      .eq('user_id', this.currentMerchant.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, isFeatured };
  }

  // Create sponsored post
  async createSponsoredPost(postData) {
    if (!this.subscription) return { success: false, error: 'No subscription' };

    // Check if they have available sponsored posts
    const { count } = await this.supabase
      .from('sponsored_posts')
      .select('*', { count: 'exact' })
      .eq('merchant_id', this.currentMerchant.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (count >= this.subscription.max_sponsored_posts && this.subscription.tier !== 'enterprise') {
      return {
        success: false,
        error: `You've used all ${this.subscription.max_sponsored_posts} sponsored posts this month. Upgrade for more.`,
        needsUpgrade: true
      };
    }

    // Create the sponsored post
    const { data, error } = await this.supabase
      .from('sponsored_posts')
      .insert([{
        merchant_id: this.currentMerchant.id,
        title: postData.title,
        content: postData.content,
        media_urls: postData.mediaUrls || [],
        property_type: postData.propertyType,
        location: postData.location,
        price: postData.price,
        target_locations: postData.targetLocations || [],
        target_property_types: postData.targetPropertyTypes || [],
        total_budget: postData.budget || 10,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  // Get invoices
  async getInvoices() {
    const { data, error } = await this.supabase
      .from('merchant_invoices')
      .select('*')
      .eq('merchant_id', this.currentMerchant.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, invoices: data };
  }

  // Get leads
  async getLeads(limit = 50) {
    const { data, error } = await this.supabase
      .from('merchant_leads')
      .select(`
        *,
        user:user_profiles!lead_user_id(display_name, profile_image_url)
      `)
      .eq('merchant_id', this.currentMerchant.id)
      .order('contacted_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, leads: data };
  }

  // Mark lead as converted to sale
  async markLeadConverted(leadId, saleValue) {
    const { error } = await this.supabase
      .from('merchant_leads')
      .update({
        converted_to_sale: true,
        sale_value: saleValue
      })
      .eq('id', leadId)
      .eq('merchant_id', this.currentMerchant.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  // Get partner services (for listing pages)
  async getPartnerServices(serviceType = null) {
    let query = this.supabase
      .from('partner_integrations')
      .select('*')
      .eq('is_active', true);

    if (serviceType) {
      query = query.eq('partner_type', serviceType);
    }

    const { data, error } = await query.order('priority', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, partners: data };
  }

  // Record partner referral click
  async recordPartnerClick(partnerId, listingId, listingType, userId = null) {
    const { error } = await this.supabase
      .from('partner_referrals')
      .insert([{
        partner_id: partnerId,
        user_id: userId,
        listing_id: listingId,
        listing_type: listingType
      }]);

    if (error) {
      console.error('Error recording partner click:', error);
      return { success: false };
    }

    return { success: true };
  }

  // Render pricing card
  renderPricingCard(tier, containerId) {
    const tiers = this.getPricingTiers();
    const tierData = tiers[tier];
    const currentTier = this.subscription?.tier || 'free';
    const isCurrent = currentTier === tier;

    const card = document.createElement('div');
    card.className = `pricing-card ${tier}`;
    card.innerHTML = `
      <div class="pricing-header">
        <h3>${tierData.name}</h3>
        <div class="pricing-price">
          <span class="currency">$</span>
          <span class="amount">${tierData.monthlyPrice}</span>
          <span class="period">/month</span>
        </div>
        ${tierData.yearlyPrice > 0 ? `<div class="yearly-price">$${Math.round(tierData.yearlyPrice / 12)}/mo billed yearly</div>` : ''}
      </div>
      <div class="pricing-features">
        ${tierData.features.map(f => `
          <div class="feature-item">
            <i class="bi bi-check2"></i>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>
      ${isCurrent ? `
        <button class="btn btn-success w-100" disabled>
          <i class="bi bi-check-circle"></i> Current Plan
        </button>
      ` : `
        <button class="btn btn-primary w-100" onclick="revenueSystem.upgradeSubscription('${tier}').then(r => alert(r.success ? 'Upgraded!' : r.error))">
          ${tier === 'free' ? 'Downgrade' : 'Upgrade'}
        </button>
      `}
    `;

    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(card);
    }

    return card;
  }

  // Render analytics dashboard
  renderAnalyticsDashboard(containerId) {
    if (!this.analytics) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const freeLeadsRemaining = this.getRemainingFreeLeads();
    const freeLeadsUsed = this.analytics.free_leads_used;
    const freeLeadsTotal = this.analytics.free_leads_per_month;
    const freeLeadsPercent = (freeLeadsUsed / freeLeadsTotal) * 100;

    container.innerHTML = `
      <div class="analytics-dashboard">
        <h4><i class="bi bi-graph-up"></i> Revenue Dashboard</h4>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${freeLeadsRemaining}</div>
            <div class="stat-label">Free Leads Left</div>
            <div class="progress mt-2">
              <div class="progress-bar ${freeLeadsPercent > 80 ? 'bg-warning' : 'bg-success'}" 
                   style="width: ${freeLeadsPercent}%"></div>
            </div>
            <small class="text-muted">${freeLeadsUsed}/${freeLeadsTotal} used this month</small>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">${this.analytics.paid_leads_this_month || 0}</div>
            <div class="stat-label">Paid Leads</div>
            <small class="text-muted">$${this.analytics.total_lead_cost_this_month || 0} this month</small>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">${this.analytics.active_sponsored_posts || 0}</div>
            <div class="stat-label">Active Sponsored Posts</div>
            <small class="text-muted">Spent: $${this.analytics.total_sponsored_spend || 0}</small>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">$${this.analytics.pending_invoice_amount || 0}</div>
            <div class="stat-label">Pending Invoice</div>
            <small class="text-muted">Due in 7 days</small>
          </div>
        </div>

        <div class="upgrade-banner mt-4 p-3 bg-light rounded">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>Current Plan:</strong> ${this.capitalize(this.subscription.tier)}
              <br>
              <small class="text-muted">
                ${this.subscription.max_listings} listings • ${this.subscription.max_featured_listings} featured • ${this.subscription.max_sponsored_posts} sponsored posts
              </small>
            </div>
            <button class="btn btn-outline-primary" onclick="showPricingModal()">
              Change Plan
            </button>
          </div>
        </div>
      </div>
    `;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Global instance
let revenueSystem = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
  if (supabaseClient) {
    revenueSystem = new RevenueSystem(supabaseClient);
    await revenueSystem.init();
  }
});

// Helper function for contact buttons to record leads
async function recordMerchantContact(merchantId, listingId, listingType, source = 'listing_contact') {
  if (!revenueSystem || revenueSystem.currentMerchant?.id === merchantId) {
    // Don't record if contacting yourself
    return;
  }

  // Record the lead
  const result = await revenueSystem.recordLead(listingId, listingType, source, {
    userId: revenueSystem.currentMerchant?.id
  });

  console.log('Lead recorded:', result);
  return result;
}
