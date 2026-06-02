/**
 * HOME AFRICA - Market Intelligence & Predictive Alerts System
 * 
 * Features:
 * - Supply/Demand Gap Analysis
 * - Price Trend Prediction
 * - Seasonal Demand Forecasting
 * - Opportunity Window Alerts
 * - Competitive Landscape Monitoring
 */

class MarketIntelligence {
  constructor() {
    this.supabase = null;
    this.alerts = [];
    this.marketData = {};
    this.init();
  }

  async init() {
    this.supabase = window.getSupabaseClient ? window.getSupabaseClient() : window.supabaseClient;
    if (!this.supabase) {
      console.warn('Supabase not available for Market Intelligence');
      return;
    }
  }

  /**
   * Market Gap Analysis
   * Identifies undersupplied property types in high-demand areas
   * 
   * Algorithm:
   * 1. Calculate search volume by district/property type
   * 2. Count active listings by district/property type
   * 3. Compute demand-to-supply ratio
   * 4. Flag ratios > 5:1 as "High Opportunity"
   * 5. Flag ratios 3-5:1 as "Moderate Opportunity"
   */
  async analyzeSupplyDemandGaps() {
    try {
      // Get search analytics (demand signal)
      const { data: searchData, error: searchError } = await this.supabase
        .from('user_activities')
        .select('search_filters, created_at')
        .eq('activity_type', 'search')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (searchError) throw searchError;

      // Get current listings (supply)
      const { data: listings, error: listingError } = await this.supabase
        .from('listings')
        .select('district, type, price, status, created_at')
        .eq('status', 'active');

      if (listingError) throw listingError;

      // Process demand data
      const demandByCategory = {};
      searchData?.forEach(search => {
        const filters = search.search_filters || {};
        const district = filters.district || filters.location || 'Unknown';
        const type = filters.type || filters.property_type || 'apartment';
        const key = `${district}_${type}`;
        
        demandByCategory[key] = (demandByCategory[key] || 0) + 1;
      });

      // Process supply data
      const supplyByCategory = {};
      listings?.forEach(listing => {
        const key = `${listing.district}_${listing.type}`;
        supplyByCategory[key] = (supplyByCategory[key] || 0) + 1;
      });

      // Calculate gaps
      const gaps = [];
      for (const [key, demand] of Object.entries(demandByCategory)) {
        const supply = supplyByCategory[key] || 0;
        const ratio = supply > 0 ? demand / supply : demand;
        
        if (ratio >= 3) { // Significant gap threshold
          const [district, type] = key.split('_');
          gaps.push({
            district,
            type,
            demand,
            supply,
            ratio: Math.round(ratio * 10) / 10,
            opportunity_score: Math.min(Math.round(ratio * 20), 100),
            severity: ratio >= 10 ? 'critical' : ratio >= 5 ? 'high' : 'moderate',
            recommendation: this.generateGapRecommendation(district, type, ratio, supply)
          });
        }
      }

      return gaps.sort((a, b) => b.opportunity_score - a.opportunity_score);
    } catch (err) {
      console.error('Error analyzing supply/demand gaps:', err);
      return this.getMockGaps();
    }
  }

  generateGapRecommendation(district, type, ratio, currentSupply) {
    if (ratio >= 10) {
      return `🚨 CRITICAL: ${district} has extreme undersupply of ${type}s. ${currentSupply} listings for ${Math.round(ratio * currentSupply)} searches. Immediate opportunity to list.`;
    } else if (ratio >= 5) {
      return `⚡ HIGH DEMAND: ${type}s in ${district} are in high demand. List now for fast sale.`;
    } else {
      return `📈 MODERATE: Good demand for ${type}s in ${district}. Consider listing.`;
    }
  }

  /**
   * Price Trend Analysis & Prediction
   * Predicts price movements based on historical data
   * 
   * @param {string} district - Area to analyze
   * @param {string} type - Property type
   * @returns {Object} Price prediction data
   */
  async analyzePriceTrends(district, type) {
    try {
      // Get historical price data
      const { data: priceHistory, error } = await this.supabase
        .from('listings')
        .select('price, created_at, status, sold_at, sold_price')
        .eq('district', district)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!priceHistory || priceHistory.length < 5) {
        return { insufficient_data: true };
      }

      // Calculate metrics
      const prices = priceHistory.map(l => l.sold_price || l.price).filter(p => p > 0);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];

      // Calculate trend (comparing recent vs older listings)
      const recent = priceHistory.slice(0, Math.floor(priceHistory.length / 3));
      const older = priceHistory.slice(-Math.floor(priceHistory.length / 3));
      
      const recentAvg = recent.reduce((sum, l) => sum + (l.sold_price || l.price || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, l) => sum + (l.sold_price || l.price || 0), 0) / older.length;
      
      const trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      const trend = trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable';

      // Days on market analysis
      const soldListings = priceHistory.filter(l => l.status === 'sold' && l.sold_at);
      const avgDaysOnMarket = soldListings.length > 0 
        ? soldListings.reduce((sum, l) => {
            const days = (new Date(l.sold_at) - new Date(l.created_at)) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / soldListings.length
        : null;

      return {
        district,
        type,
        current_avg: Math.round(avgPrice),
        current_median: medianPrice,
        price_range: { min: minPrice, max: maxPrice },
        trend,
        trend_percent: Math.round(trendPercent * 10) / 10,
        avg_days_on_market: avgDaysOnMarket ? Math.round(avgDaysOnMarket) : null,
        data_points: prices.length,
        confidence: prices.length > 20 ? 'high' : prices.length > 10 ? 'medium' : 'low'
      };
    } catch (err) {
      console.error('Error analyzing price trends:', err);
      return this.getMockPriceTrends(district, type);
    }
  }

  /**
   * Seasonal Demand Forecasting
   * Predicts demand based on historical seasonal patterns
   */
  async getSeasonalForecast() {
    const month = new Date().getMonth(); // 0-11
    const seasonalPatterns = {
      // December - January: High activity (holiday season, bonuses)
      11: { activity: 'very_high', factor: 1.4, reason: 'Holiday season + year-end bonuses' },
      0: { activity: 'very_high', factor: 1.3, reason: 'New year resolutions + bonus spending' },
      
      // February - March: Moderate
      1: { activity: 'moderate', factor: 1.0, reason: 'Post-holiday normalization' },
      2: { activity: 'moderate', factor: 1.1, reason: 'Q1 planning' },
      
      // April - May: High (post-rainy season)
      3: { activity: 'high', factor: 1.2, reason: 'Post-rainy season activity' },
      4: { activity: 'high', factor: 1.25, reason: 'Pre-budget positioning' },
      
      // June - August: Moderate-Low
      5: { activity: 'moderate', factor: 0.95, reason: 'Mid-year slowdown' },
      6: { activity: 'low', factor: 0.8, reason: 'Rainy season impact' },
      7: { activity: 'low', factor: 0.85, reason: 'Continued rainy season' },
      
      // September - November: Increasing
      8: { activity: 'moderate', factor: 1.0, reason: 'Post-rainy recovery' },
      9: { activity: 'high', factor: 1.15, reason: 'Q4 preparation' },
      10: { activity: 'high', factor: 1.2, reason: 'Pre-holiday positioning' }
    };

    const current = seasonalPatterns[month];
    const nextMonth = seasonalPatterns[(month + 1) % 12];

    return {
      current_month: current,
      next_month: nextMonth,
      recommendation: current.factor > 1.1 
        ? '📈 PEAK SEASON: List now for maximum exposure and faster sales.'
        : current.factor < 0.9
        ? '⏳ OFF-SEASON: Consider holding listings if not urgent, or price competitively.'
        : '📊 NORMAL PERIOD: Standard listing activity expected.'
    };
  }

  /**
   * Generate Market Alerts
   * Creates actionable alerts for VIP merchants and admin
   */
  async generateMarketAlerts() {
    const alerts = [];

    // 1. Supply/Demand Gap Alerts
    const gaps = await this.analyzeSupplyDemandGaps();
    gaps.slice(0, 5).forEach(gap => {
      alerts.push({
        type: 'supply_demand_gap',
        severity: gap.severity,
        title: `${gap.district}: ${gap.type} Undersupply`,
        message: gap.recommendation,
        data: gap,
        actionable: true,
        action_text: 'View Opportunity Details',
        created_at: new Date().toISOString()
      });
    });

    // 2. Price Movement Alerts
    const districts = ['Kacyiru', 'Nyarutarama', 'Remera', 'Kicukiro', 'Gisozi'];
    const types = ['apartment', 'house', 'land'];
    
    for (const district of districts.slice(0, 3)) {
      for (const type of types.slice(0, 2)) {
        const trend = await this.analyzePriceTrends(district, type);
        if (trend.trend && trend.trend !== 'stable' && Math.abs(trend.trend_percent) > 10) {
          alerts.push({
            type: 'price_trend',
            severity: trend.trend === 'up' ? 'positive' : 'warning',
            title: `${district} ${type} prices ${trend.trend === 'up' ? 'rising' : 'falling'}`,
            message: `${type}s in ${district} are ${trend.trend === 'up' ? 'appreciating' : 'depreciating'} by ${Math.abs(trend.trend_percent)}%. ${trend.trend === 'up' ? 'Good time to sell.' : 'Consider buying opportunity.'}`,
            data: trend,
            actionable: false,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // 3. Seasonal Alert
    const seasonal = await this.getSeasonalForecast();
    if (seasonal.current_month.factor > 1.2 || seasonal.current_month.factor < 0.9) {
      alerts.push({
        type: 'seasonal',
        severity: seasonal.current_month.factor > 1.2 ? 'positive' : 'info',
        title: `Seasonal Market Update: ${seasonal.current_month.activity.replace('_', ' ').toUpperCase()}`,
        message: seasonal.recommendation,
        data: seasonal,
        actionable: false,
        created_at: new Date().toISOString()
      });
    }

    // 4. Competition Alerts (for VIP)
    const competitionAlert = await this.analyzeCompetition();
    if (competitionAlert) {
      alerts.push(competitionAlert);
    }

    this.alerts = alerts;
    return alerts;
  }

  /**
   * Analyze competitive landscape
   */
  async analyzeCompetition() {
    try {
      // Get merchant's listings
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data: myListings } = await this.supabase
        .from('listings')
        .select('district, type, price')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!myListings || myListings.length === 0) return null;

      // For each of my listings, check competition
      const competitiveInsights = [];
      
      for (const myListing of myListings.slice(0, 3)) {
        const { data: competitors } = await this.supabase
          .from('listings')
          .select('price, featured, created_at')
          .eq('district', myListing.district)
          .eq('type', myListing.type)
          .eq('status', 'active')
          .neq('user_id', user.id)
          .order('price', { ascending: true });

        if (!competitors || competitors.length === 0) continue;

        const avgCompetitorPrice = competitors.reduce((sum, l) => sum + l.price, 0) / competitors.length;
        const priceDiff = ((myListing.price - avgCompetitorPrice) / avgCompetitorPrice) * 100;
        
        const featuredCount = competitors.filter(l => l.featured).length;

        if (priceDiff > 15) {
          competitiveInsights.push({
            listing: myListing,
            insight: `Your ${myListing.type} in ${myListing.district} is priced ${Math.round(priceDiff)}% above market average. Consider price adjustment for faster sale.`,
            severity: 'warning'
          });
        } else if (featuredCount > competitors.length * 0.3 && !myListing.featured) {
          competitiveInsights.push({
            listing: myListing,
            insight: `${featuredCount} competitors have featured listings in ${myListing.district}. Consider featuring your listing for visibility.`,
            severity: 'info'
          });
        }
      }

      if (competitiveInsights.length > 0) {
        return {
          type: 'competition',
          severity: competitiveInsights[0].severity,
          title: 'Competitive Landscape Alert',
          message: competitiveInsights[0].insight,
          data: { insights: competitiveInsights },
          actionable: true,
          action_text: 'View All Listings',
          created_at: new Date().toISOString()
        };
      }

      return null;
    } catch (err) {
      console.error('Error analyzing competition:', err);
      return null;
    }
  }

  /**
   * Get opportunity score for a specific listing idea
   * Helps merchants decide what to list
   */
  async getListingOpportunityScore(district, type, priceRange) {
    try {
      const [gaps, trends, seasonal] = await Promise.all([
        this.analyzeSupplyDemandGaps(),
        this.analyzePriceTrends(district, type),
        this.getSeasonalForecast()
      ]);

      // Find matching gap
      const matchingGap = gaps.find(g => 
        g.district.toLowerCase() === district.toLowerCase() && 
        g.type.toLowerCase() === type.toLowerCase()
      );

      let score = 50; // Base score
      let factors = [];

      // Supply/Demand factor (up to 30 points)
      if (matchingGap) {
        const gapPoints = Math.min(matchingGap.ratio * 3, 30);
        score += gapPoints;
        factors.push(`High demand/supply ratio: +${Math.round(gapPoints)} pts`);
      }

      // Price trend factor (up to 20 points)
      if (trends.trend === 'up') {
        const trendPoints = Math.min(trends.trend_percent * 2, 20);
        score += trendPoints;
        factors.push(`Rising prices: +${Math.round(trendPoints)} pts`);
      } else if (trends.trend === 'down') {
        score -= 15;
        factors.push('Falling prices: -15 pts');
      }

      // Seasonal factor (up to 15 points)
      if (seasonal.current_month.factor > 1) {
        const seasonalPoints = (seasonal.current_month.factor - 1) * 30;
        score += seasonalPoints;
        factors.push(`Peak season: +${Math.round(seasonalPoints)} pts`);
      } else {
        score -= 10;
        factors.push('Off-season: -10 pts');
      }

      // Price range validation
      if (trends.price_range && priceRange) {
        const [min, max] = priceRange;
        if (max < trends.price_range.min * 0.7) {
          score += 10;
          factors.push('Competitive pricing: +10 pts');
        } else if (min > trends.price_range.max * 1.3) {
          score -= 20;
          factors.push('Overpriced vs market: -20 pts');
        }
      }

      return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
        factors,
        recommendation: score >= 70 
          ? '🎯 STRONG OPPORTUNITY: List immediately for best results.'
          : score >= 50
          ? '✅ DECENT OPPORTUNITY: Consider listing with competitive pricing.'
          : '⚠️ CHALLENGING: May need aggressive pricing or wait for better market conditions.',
        supporting_data: {
          gap: matchingGap,
          trends,
          seasonal
        }
      };
    } catch (err) {
      console.error('Error calculating opportunity score:', err);
      return { score: 50, rating: 'Unknown', factors: [], error: true };
    }
  }

  /**
   * Render market intelligence widget
   */
  renderMarketWidget(containerId = 'market-intelligence-widget') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="market-intelligence-widget">
        <div class="widget-header">
          <h5><i class="bi bi-graph-up-arrow"></i> Market Intelligence</h5>
          <span class="badge bg-info">VIP</span>
        </div>
        
        <div id="marketAlerts" class="market-alerts">
          <div class="loading-state">
            <i class="bi bi-arrow-repeat spin"></i> Analyzing market data...
          </div>
        </div>
        
        <div class="widget-actions mt-3">
          <a href="market-alerts.html" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-box-arrow-up-right"></i> View All Alerts
          </a>
          <button class="btn btn-sm btn-primary" onclick="window.marketIntelligence.refreshAlerts()">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>
    `;

    this.refreshAlerts();
  }

  async refreshAlerts() {
    const alerts = await this.generateMarketAlerts();
    const container = document.getElementById('marketAlerts');
    if (!container) return;

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-3">
          <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
          <p class="mb-0 mt-2 text-muted">No urgent market alerts</p>
        </div>
      `;
      return;
    }

    container.innerHTML = alerts.slice(0, 3).map(alert => `
      <div class="alert-item ${alert.severity}">
        <div class="alert-icon">
          <i class="bi bi-${this.getAlertIcon(alert.type)}"></i>
        </div>
        <div class="alert-content">
          <h6>${alert.title}</h6>
          <p>${alert.message}</p>
          ${alert.actionable ? `
            <button class="btn btn-sm btn-primary" onclick="${alert.action_callback || ''}">
              ${alert.action_text}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  getAlertIcon(type) {
    const icons = {
      supply_demand_gap: 'exclamation-triangle',
      price_trend: 'currency-exchange',
      seasonal: 'calendar-event',
      competition: 'people'
    };
    return icons[type] || 'bell';
  }

  // Mock data for demo
  getMockGaps() {
    return [
      {
        district: 'Nyarutarama',
        type: 'apartment',
        demand: 145,
        supply: 12,
        ratio: 12.1,
        opportunity_score: 95,
        severity: 'critical',
        recommendation: '🚨 CRITICAL: Nyarutarama has extreme undersupply of apartments. 12 listings for 145 searches. Immediate opportunity to list.'
      },
      {
        district: 'Kacyiru',
        type: 'land',
        demand: 89,
        supply: 18,
        ratio: 4.9,
        opportunity_score: 75,
        severity: 'high',
        recommendation: '⚡ HIGH DEMAND: Land plots in Kacyiru are in high demand. List now for fast sale.'
      },
      {
        district: 'Remera',
        type: 'house',
        demand: 67,
        supply: 15,
        ratio: 4.5,
        opportunity_score: 70,
        severity: 'moderate',
        recommendation: '📈 MODERATE: Good demand for houses in Remera. Consider listing.'
      }
    ];
  }

  getMockPriceTrends(district, type) {
    return {
      district,
      type,
      current_avg: type === 'apartment' ? 45000000 : type === 'land' ? 25000000 : 80000000,
      current_median: type === 'apartment' ? 42000000 : type === 'land' ? 23000000 : 75000000,
      price_range: { 
        min: type === 'apartment' ? 25000000 : type === 'land' ? 15000000 : 50000000,
        max: type === 'apartment' ? 85000000 : type === 'land' ? 45000000 : 150000000
      },
      trend: 'up',
      trend_percent: 8.5,
      avg_days_on_market: type === 'apartment' ? 18 : type === 'land' ? 32 : 25,
      data_points: 45,
      confidence: 'medium'
    };
  }
}

// Create global instance
window.marketIntelligence = new MarketIntelligence();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketIntelligence;
}
